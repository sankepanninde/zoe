import { prisma } from '../../lib/prisma.js';
import type {
  CreateMinistryInput,
  UpdateMinistryInput,
} from './ministries.schemas.js';

const publicMinistrySelect = {
  id: true,
  name: true,
  color: true,
  icon: true,
  active: true,
  isDefault: true,
  createdAt: true,
} as const;

export async function listMinistries(churchId: string, onlyActive = true) {
  return prisma.ministry.findMany({
    where: {
      churchId,
      ...(onlyActive && { active: true }),
    },
    select: {
      ...publicMinistrySelect,
      _count: { select: { users: true } },
    },
    orderBy: { name: 'asc' },
  });
}

export async function listMyMinistries(userId: string, churchId: string) {
  const userMinistries = await prisma.userMinistry.findMany({
    where: {
      userId,
      ministry: { churchId, active: true },
    },
    include: {
      ministry: { select: publicMinistrySelect },
    },
  });

  return userMinistries.map((um) => ({
    ...um.ministry,
    isLeader: um.isLeader,
    position: um.position,
  }));
}

export async function getMinistry(churchId: string, id: string) {
  const ministry = await prisma.ministry.findFirst({
    where: { id, churchId },
    select: publicMinistrySelect,
  });
  if (!ministry) {
    const err = new Error('Ministerio no encontrado');
    (err as Error & { statusCode: number }).statusCode = 404;
    throw err;
  }
  return ministry;
}

export async function createMinistry(churchId: string, input: CreateMinistryInput) {
  const exists = await prisma.ministry.findFirst({
    where: { churchId, name: input.name },
  });
  if (exists) {
    const err = new Error('Ya existe un ministerio con ese nombre');
    (err as Error & { statusCode: number }).statusCode = 409;
    throw err;
  }

  return prisma.ministry.create({
    data: {
      churchId,
      name: input.name,
      color: input.color ?? '#6366f1',
      icon: input.icon ?? null,
    },
    select: publicMinistrySelect,
  });
}

export async function updateMinistry(
  churchId: string,
  id: string,
  input: UpdateMinistryInput
) {
  await getMinistry(churchId, id);

  if (input.name) {
    const exists = await prisma.ministry.findFirst({
      where: { churchId, name: input.name, NOT: { id } },
    });
    if (exists) {
      const err = new Error('Ya existe un ministerio con ese nombre');
      (err as Error & { statusCode: number }).statusCode = 409;
      throw err;
    }
  }

  return prisma.ministry.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.color !== undefined && { color: input.color }),
      ...(input.icon !== undefined && { icon: input.icon }),
      ...(input.active !== undefined && { active: input.active }),
    },
    select: publicMinistrySelect,
  });
}

export async function deleteMinistry(churchId: string, id: string) {
  await getMinistry(churchId, id);
  // Soft delete: solo desactivar
  return prisma.ministry.update({
    where: { id },
    data: { active: false },
    select: publicMinistrySelect,
  });
}

// ===========================================
// PERMISSION HELPERS
// ===========================================

export async function isLeaderOf(
  userId: string,
  ministryId: string
): Promise<boolean> {
  const um = await prisma.userMinistry.findFirst({
    where: { userId, ministryId, isLeader: true },
  });
  return !!um;
}

export async function getMinistriesUserLeads(userId: string): Promise<string[]> {
  const ums = await prisma.userMinistry.findMany({
    where: { userId, isLeader: true },
    select: { ministryId: true },
  });
  return ums.map((um) => um.ministryId);
}

export async function getUserMinistryIds(userId: string): Promise<string[]> {
  const ums = await prisma.userMinistry.findMany({
    where: { userId },
    select: { ministryId: true },
  });
  return ums.map((um) => um.ministryId);
}

export async function canManageMinistry(
  currentUserId: string,
  currentRole: string,
  ministryId: string
): Promise<boolean> {
  if (currentRole === 'SUPER_ADMIN' || currentRole === 'ADMIN') return true;
  return isLeaderOf(currentUserId, ministryId);
}