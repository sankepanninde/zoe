import { prisma } from '../../lib/prisma.js';
import { hashPassword } from '../../lib/password.js';
import type {
  CreateUserInput,
  UpdateUserInput,
  ChangePasswordInput,
} from './users.schemas.js';

const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  phone: true,
  position: true,
  active: true,
  lastLoginAt: true,
  createdAt: true,
} as const;

export async function listUsers(churchId: string, onlyActive = false) {
  return prisma.user.findMany({
    where: {
      churchId,
      ...(onlyActive && { active: true }),
    },
    select: publicUserSelect,
    orderBy: [{ active: 'desc' }, { name: 'asc' }],
  });
}

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

export async function createUser(churchId: string, input: CreateUserInput) {
  // Verificar que el email no exista ya en esta iglesia
  const exists = await prisma.user.findFirst({
    where: { churchId, email: input.email },
  });
  if (exists) {
    const err = new Error('Ya existe un usuario con ese email en esta iglesia');
    (err as Error & { statusCode: number }).statusCode = 409;
    throw err;
  }

  const passwordHash = await hashPassword(input.password);

  return prisma.user.create({
    data: {
      churchId,
      email: input.email,
      passwordHash,
      name: input.name,
      phone: input.phone ?? null,
      role: input.role,
      position: input.position ?? null,
    },
    select: publicUserSelect,
  });
}

export async function updateUser(
  churchId: string,
  id: string,
  input: UpdateUserInput
) {
  await getUser(churchId, id);

  return prisma.user.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.role !== undefined && { role: input.role }),
      ...(input.position !== undefined && { position: input.position }),
      ...(input.active !== undefined && { active: input.active }),
    },
    select: publicUserSelect,
  });
}

export async function changePassword(
  churchId: string,
  id: string,
  input: ChangePasswordInput
) {
  await getUser(churchId, id);
  const passwordHash = await hashPassword(input.password);

  await prisma.user.update({
    where: { id },
    data: { passwordHash },
  });

  // Revocar todos los refresh tokens del usuario por seguridad
  await prisma.refreshToken.updateMany({
    where: { userId: id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function deleteUser(churchId: string, id: string, requestingUserId: string) {
  if (id === requestingUserId) {
    const err = new Error('No puedes eliminarte a ti mismo');
    (err as Error & { statusCode: number }).statusCode = 400;
    throw err;
  }

  await getUser(churchId, id);

  // Verificar que no sea el último admin
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

  // Soft delete: marcar como inactivo (no eliminamos para preservar historial)
  return prisma.user.update({
    where: { id },
    data: { active: false },
    select: publicUserSelect,
  });
}