import { prisma } from '../../lib/prisma.js';
import type {
  CreateServiceInput,
  UpdateServiceInput,
  ListServicesQuery,
} from './services.schemas.js';

export async function listServices(churchId: string, query: ListServicesQuery) {
  const where: {
    churchId: string;
    serviceTypeId?: string;
    date?: { gte?: Date; lte?: Date };
  } = { churchId };

  if (query.serviceTypeId) where.serviceTypeId = query.serviceTypeId;
  if (query.from || query.to) {
    where.date = {};
    if (query.from) where.date.gte = new Date(`${query.from}T00:00:00.000Z`);
    if (query.to) where.date.lte = new Date(`${query.to}T23:59:59.999Z`);
  }

  return prisma.service.findMany({
    where,
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    include: {
      serviceType: {
        select: { id: true, name: true, color: true, icon: true },
      },
      assignments: {
        include: {
          user: {
            select: { id: true, name: true, email: true, position: true },
          },
        },
      },
    },
  });
}

export async function getService(churchId: string, id: string) {
  const service = await prisma.service.findFirst({
    where: { id, churchId },
    include: {
      serviceType: true,
      assignments: {
        include: {
          user: {
            select: { id: true, name: true, email: true, position: true },
          },
        },
      },
    },
  });
  if (!service) {
    const err = new Error('Servicio no encontrado');
    (err as Error & { statusCode: number }).statusCode = 404;
    throw err;
  }
  return service;
}

export async function createService(churchId: string, input: CreateServiceInput) {
  // Verificar que el serviceType exista y sea de la misma iglesia
  const typeExists = await prisma.serviceType.findFirst({
    where: { id: input.serviceTypeId, churchId, active: true },
  });
  if (!typeExists) {
    const err = new Error('Tipo de servicio no válido');
    (err as Error & { statusCode: number }).statusCode = 400;
    throw err;
  }

  return prisma.service.create({
    data: {
      churchId,
      serviceTypeId: input.serviceTypeId,
      title: input.title ?? null,
      date: new Date(`${input.date}T00:00:00.000Z`),
      startTime: input.startTime,
      endTime: input.endTime,
      location: input.location ?? null,
      notes: input.notes ?? null,
    },
    include: {
      serviceType: {
        select: { id: true, name: true, color: true, icon: true },
      },
    },
  });
}

export async function updateService(
  churchId: string,
  id: string,
  input: UpdateServiceInput
) {
  await getService(churchId, id);

  // Si cambia el serviceTypeId, verificar que exista
  if (input.serviceTypeId) {
    const typeExists = await prisma.serviceType.findFirst({
      where: { id: input.serviceTypeId, churchId, active: true },
    });
    if (!typeExists) {
      const err = new Error('Tipo de servicio no válido');
      (err as Error & { statusCode: number }).statusCode = 400;
      throw err;
    }
  }

  return prisma.service.update({
    where: { id },
    data: {
      ...(input.serviceTypeId !== undefined && { serviceTypeId: input.serviceTypeId }),
      ...(input.title !== undefined && { title: input.title }),
      ...(input.date !== undefined && { date: new Date(`${input.date}T00:00:00.000Z`) }),
      ...(input.startTime !== undefined && { startTime: input.startTime }),
      ...(input.endTime !== undefined && { endTime: input.endTime }),
      ...(input.location !== undefined && { location: input.location }),
      ...(input.notes !== undefined && { notes: input.notes }),
    },
    include: {
      serviceType: {
        select: { id: true, name: true, color: true, icon: true },
      },
      assignments: {
        include: {
          user: {
            select: { id: true, name: true, email: true, position: true },
          },
        },
      },
    },
  });
}

export async function deleteService(churchId: string, id: string) {
  await getService(churchId, id);
  // onDelete: Cascade en Assignment se encarga de borrar las asignaciones
  await prisma.service.delete({ where: { id } });
}

export async function updateServiceStatus(
  churchId: string,
  id: string,
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
) {
  await getService(churchId, id);
  return prisma.service.update({
    where: { id },
    data: { status },
  });
}