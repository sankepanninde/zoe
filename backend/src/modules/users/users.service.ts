import { prisma } from '../../lib/prisma.js';
import { hashPassword } from '../../lib/password.js';
import type {
  CreateUserInput,
  UpdateUserInput,
  ChangePasswordInput,
} from './users.schemas.js';

// ===========================================
// SELECTS REUTILIZABLES
// ===========================================

const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  phone: true,
  active: true,
  lastLoginAt: true,
  createdAt: true,
  ministries: {
    select: {
      id: true,
      isLeader: true,
      position: true,
      ministry: {
        select: { id: true, name: true, color: true, icon: true },
      },
    },
  },
} as const;

// ===========================================
// HELPERS DE PERMISOS
// ===========================================

/**
 * ¿El usuario actual puede gestionar a este target?
 * - ADMIN puede con cualquiera de su iglesia
 * - LEADER solo con usuarios que compartan algún ministerio que lidera
 */
export async function canManageUser(
  currentUserId: string,
  currentRole: string,
  churchId: string,
  targetUserId: string
): Promise<boolean> {
  if (currentRole === 'ADMIN' || currentRole === 'SUPER_ADMIN') return true;

  // Obtener ministerios que el current user lidera
  const ledMinistries = await prisma.userMinistry.findMany({
    where: { userId: currentUserId, isLeader: true },
    select: { ministryId: true },
  });
  const ledIds = ledMinistries.map((m) => m.ministryId);
  if (ledIds.length === 0) return false;

  // ¿El target comparte alguno de esos ministerios?
  const shared = await prisma.userMinistry.findFirst({
    where: {
      userId: targetUserId,
      ministryId: { in: ledIds },
    },
  });
  return !!shared;
}

// ===========================================
// LIST
// ===========================================

export async function listUsers(
  churchId: string,
  currentUserId: string,
  currentRole: string,
  onlyActive = false
) {
  // ADMIN ve toda la iglesia
  if (currentRole === 'ADMIN' || currentRole === 'SUPER_ADMIN') {
    return prisma.user.findMany({
      where: {
        churchId,
        ...(onlyActive && { active: true }),
      },
      select: publicUserSelect,
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
    });
  }

  // LEADER solo ve usuarios de sus ministerios
  const ledMinistries = await prisma.userMinistry.findMany({
    where: { userId: currentUserId, isLeader: true },
    select: { ministryId: true },
  });
  const ledIds = ledMinistries.map((m) => m.ministryId);

  return prisma.user.findMany({
    where: {
      churchId,
      ...(onlyActive && { active: true }),
      OR: [
        { id: currentUserId }, // siempre verse a sí mismo
        { ministries: { some: { ministryId: { in: ledIds } } } },
      ],
    },
    select: publicUserSelect,
    orderBy: [{ active: 'desc' }, { name: 'asc' }],
  });
}

// ===========================================
// GET
// ===========================================

export async function getUser(churchId: string, id: string) {
  const user = await prisma.user.findFirst({
    where: { id, churchId },
    select: publicUserSelect,
  });
  if (!user) {
    const err = new Error('Usuario no encontrado');
    (err as Error & { statusCode: number }).statusCode = 404;
    throw err;
  }
  return user;
}

// ===========================================
// CREATE
// ===========================================

export async function createUser(churchId: string, input: CreateUserInput) {
  // Verificar email único
  const exists = await prisma.user.findFirst({
    where: { churchId, email: input.email },
  });
  if (exists) {
    const err = new Error('Ya existe un usuario con ese email en esta iglesia');
    (err as Error & { statusCode: number }).statusCode = 409;
    throw err;
  }

  // Validar que los ministerios existan en la iglesia
  if (input.ministries.length > 0) {
    const ids = input.ministries.map((m) => m.ministryId);
    const found = await prisma.ministry.findMany({
      where: { id: { in: ids }, churchId, active: true },
      select: { id: true },
    });
    if (found.length !== ids.length) {
      const err = new Error('Uno o más ministerios no son válidos');
      (err as Error & { statusCode: number }).statusCode = 400;
      throw err;
    }
  }

  const passwordHash = await hashPassword(input.password);

  // Transacción: crear user + sus ministerios
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        churchId,
        email: input.email,
        passwordHash,
        name: input.name,
        phone: input.phone ?? null,
        role: input.role,
        mustChangePassword: true,  // ← NUEVA LÍNEA
      },
      select: { id: true },
    });

    if (input.ministries.length > 0) {
      await tx.userMinistry.createMany({
        data: input.ministries.map((m) => ({
          userId: user.id,
          ministryId: m.ministryId,
          isLeader: m.isLeader,
          position: m.position ?? null,
        })),
      });
    }

    return tx.user.findUnique({
      where: { id: user.id },
      select: publicUserSelect,
    });
  });
}

// ===========================================
// UPDATE
// ===========================================

export async function updateUser(
  churchId: string,
  id: string,
  input: UpdateUserInput
) {
  await getUser(churchId, id);

  // Validar ministerios si vienen
  if (input.ministries) {
    const ids = input.ministries.map((m) => m.ministryId);
    if (ids.length > 0) {
      const found = await prisma.ministry.findMany({
        where: { id: { in: ids }, churchId, active: true },
        select: { id: true },
      });
      if (found.length !== ids.length) {
        const err = new Error('Uno o más ministerios no son válidos');
        (err as Error & { statusCode: number }).statusCode = 400;
        throw err;
      }
    }
  }

  return prisma.$transaction(async (tx) => {
    // Actualizar campos del user
    await tx.user.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.role !== undefined && { role: input.role }),
        ...(input.active !== undefined && { active: input.active }),
      },
    });

    // Si vienen ministerios, reemplazar los existentes (delete + create)
    if (input.ministries) {
      await tx.userMinistry.deleteMany({ where: { userId: id } });

      if (input.ministries.length > 0) {
        await tx.userMinistry.createMany({
          data: input.ministries.map((m) => ({
            userId: id,
            ministryId: m.ministryId,
            isLeader: m.isLeader,
            position: m.position ?? null,
          })),
        });
      }
    }

    return tx.user.findUnique({
      where: { id },
      select: publicUserSelect,
    });
  });
}

// ===========================================
// CHANGE PASSWORD
// ===========================================

export async function changePassword(
  churchId: string,
  id: string,
  input: ChangePasswordInput
) {
  await getUser(churchId, id);
  const passwordHash = await hashPassword(input.password);

  await prisma.user.update({
    where: { id },
    data: {
      passwordHash,
      mustChangePassword: true,  // ← forzar cambio la próxima vez
    },
  });

  // Revocar tokens
  await prisma.refreshToken.updateMany({
    where: { userId: id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

// ===========================================
// DELETE (soft)
// ===========================================

export async function deleteUser(
  churchId: string,
  id: string,
  requestingUserId: string
) {
  if (id === requestingUserId) {
    const err = new Error('No puedes eliminarte a ti mismo');
    (err as Error & { statusCode: number }).statusCode = 400;
    throw err;
  }

  await getUser(churchId, id);

  const user = await prisma.user.findUnique({ where: { id } });
  if (user?.role === 'ADMIN') {
    const adminCount = await prisma.user.count({
      where: { churchId, role: 'ADMIN', active: true },
    });
    if (adminCount <= 1) {
      const err = new Error('No puedes eliminar al último administrador');
      (err as Error & { statusCode: number }).statusCode = 409;
      throw err;
    }
  }

  return prisma.user.update({
    where: { id },
    data: { active: false },
    select: publicUserSelect,
  });
}
// ===========================================
// HELPER PÚBLICO
// ===========================================

export async function getLedMinistryIds(userId: string): Promise<string[]> {
  const led = await prisma.userMinistry.findMany({
    where: { userId, isLeader: true },
    select: { ministryId: true },
  });
  return led.map((m) => m.ministryId);
}