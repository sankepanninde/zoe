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
      soundCheckTime: input.soundCheckTime ?? null,
      sceneName: input.sceneName ?? null,
      patchName: input.patchName ?? null,
      inputListCount: input.inputListCount ?? null,
      setlistUrl: input.setlistUrl ?? null,
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
      ...(input.soundCheckTime !== undefined && { soundCheckTime: input.soundCheckTime }),
      ...(input.sceneName !== undefined && { sceneName: input.sceneName }),
      ...(input.patchName !== undefined && { patchName: input.patchName }),
      ...(input.inputListCount !== undefined && { inputListCount: input.inputListCount }),
      ...(input.setlistUrl !== undefined && { setlistUrl: input.setlistUrl }),
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
export async function listMyServices(churchId: string, userId: string) {
  return prisma.service.findMany({
    where: {
      churchId,
      assignments: {
        some: { userId },
      },
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
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });
}
// ===========================================
// SEED: Generar domingos del año
// ===========================================

const SUNDAY_SLOTS = [
  { title: 'Servicio Dominical — 1er Turno', startTime: '07:00', endTime: '09:45' },
  { title: 'Servicio Dominical — 2do Turno', startTime: '10:00', endTime: '12:45' },
];

export async function seedYearSundays(churchId: string, year: number) {
  // 1. Buscar (o crear) el tipo de servicio "Culto Dominical"
  let dominicalType = await prisma.serviceType.findFirst({
    where: { churchId, name: 'Culto Dominical' },
  });

  if (!dominicalType) {
    dominicalType = await prisma.serviceType.create({
      data: {
        churchId,
        name: 'Culto Dominical',
        description: 'Cultos regulares del domingo',
        color: '#3B82F6',
        icon: 'church',
        active: true,
      },
    });
  }

  // 2. Calcular todos los domingos del año
  const sundays: Date[] = [];
  const d = new Date(Date.UTC(year, 0, 1));
  while (d.getUTCDay() !== 0) d.setUTCDate(d.getUTCDate() + 1);

  while (d.getUTCFullYear() === year) {
    sundays.push(new Date(d));
    d.setUTCDate(d.getUTCDate() + 7);
  }

  // 3. Ver cuáles ya existen (idempotente)
  const existing = await prisma.service.findMany({
    where: {
      churchId,
      isGenerated: true,
      date: {
        gte: new Date(Date.UTC(year, 0, 1)),
        lt: new Date(Date.UTC(year + 1, 0, 1)),
      },
    },
    select: { date: true, startTime: true },
  });

  const existingKeys = new Set(
    existing.map((s) => `${s.date.toISOString().slice(0, 10)}|${s.startTime}`)
  );

  // 4. Crear los que falten
  const toCreate = sundays.flatMap((sunday) => {
    const dateKey = sunday.toISOString().slice(0, 10);
    return SUNDAY_SLOTS
      .filter((slot) => !existingKeys.has(`${dateKey}|${slot.startTime}`))
      .map((slot) => ({
        churchId,
        serviceTypeId: dominicalType!.id,
        title: slot.title,
        date: new Date(`${dateKey}T00:00:00.000Z`),
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: 'PENDING' as const,
        isGenerated: true,
      }));
  });

  if (toCreate.length > 0) {
    await prisma.service.createMany({ data: toCreate });
  }

  return {
    year,
    sundaysCount: sundays.length,
    servicesCreated: toCreate.length,
    servicesSkipped: sundays.length * 2 - toCreate.length,
    serviceTypeId: dominicalType.id,
  };
}