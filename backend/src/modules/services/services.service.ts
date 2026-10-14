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
            select: { id: true, name: true, email: true, position: true, avatarUrl: true },
          },
          ministry: {
            select: { id: true, name: true, color: true, icon: true },
          },
        },
      },
    },   // ← ESTA LLAVE FALTABA
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
            select: { id: true, name: true, email: true, position: true, avatarUrl: true },
          },
          ministry: {
            select: { id: true, name: true, color: true, icon: true },
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
            select: { id: true, name: true, email: true, position: true, avatarUrl: true },
          },
          ministry: {
            select: { id: true, name: true, color: true, icon: true },
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
            select: { id: true, name: true, email: true, position: true, avatarUrl: true },
          },
          ministry: {
            select: { id: true, name: true, color: true, icon: true },
          },
        },
      },
    },   // ← ESTA LLAVE FALTABA
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
// ===========================================
// AUTO-ASIGNACIÓN
// ===========================================

interface AssignmentProposal {
  position: string;
  userId: string;
  userName: string;
  ministryId: string;
  ministryName: string;
}

interface UnassignedSlot {
  position: string;
  reason: string;
}

interface ServiceProposal {
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string | null;
  serviceTypeName: string;
  shift: 'MORNING' | 'AFTERNOON';
  assignments: AssignmentProposal[];
  unassigned: UnassignedSlot[];
  existingAssignments: number;
}

interface AutoAssignResult {
  year: number;
  month: number;
  dryRun: boolean;
  preview: ServiceProposal[];
  summary: {
    servicesProcessed: number;
    assignmentsCreated: number;
    positionsSkipped: number;
    positionsUnassigned: number;
  };
}

// Helper: determina el turno según startTime
function getShift(startTime: string): 'MORNING' | 'AFTERNOON' {
  const hour = parseInt(startTime.split(':')[0] ?? '0', 10);
  return hour < 14 ? 'MORNING' : 'AFTERNOON';
}

// Helper: normaliza strings de posición para matching
function normalizePosition(p: string): string {
  return p
    .toLowerCase()
    .split('(')[0]!
    .trim()
    .replace(/\s+/g, ' ');
}

// Helper: verifica si dos posiciones hacen match
function positionMatches(required: string, userPosition: string | null): boolean {
  if (!userPosition) return false;
  const req = normalizePosition(required);
  const user = normalizePosition(userPosition);
  return user === req || user.includes(req) || req.includes(user);
}

export async function autoAssignMonth(
  churchId: string,
  year: number,
  month: number,
  dryRun = true
): Promise<AutoAssignResult> {
  // 1. Rango del mes
  const monthStart = new Date(Date.UTC(year, month, 1));
  const monthEnd = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59));

  // 2. Servicios del mes
  const services = await prisma.service.findMany({
    where: {
      churchId,
      date: { gte: monthStart, lte: monthEnd },
      status: { not: 'CANCELLED' },
    },
    include: {
      serviceType: { select: { id: true, name: true } },
      assignments: {
        include: {
          user: { select: { id: true, name: true } },
          ministry: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });

  if (services.length === 0) {
    return {
      year,
      month,
      dryRun,
      preview: [],
      summary: {
        servicesProcessed: 0,
        assignmentsCreated: 0,
        positionsSkipped: 0,
        positionsUnassigned: 0,
      },
    };
  }

  // 3. Requisitos por serviceType + shift
  const requirements = await prisma.positionRequirement.findMany({
    where: { churchId },
  });

  const requirementsMap = new Map<string, { position: string; count: number }[]>();
  for (const req of requirements) {
    const key = `${req.serviceTypeId}|${req.shift}`;
    if (!requirementsMap.has(key)) requirementsMap.set(key, []);
    requirementsMap.get(key)!.push({ position: req.position, count: req.count });
  }

  // 4. Técnicos con sus ministerios y posiciones
  const users = await prisma.user.findMany({
    where: { churchId, active: true },
    select: {
      id: true,
      name: true,
      ministries: {
        select: {
          ministryId: true,
          isLeader: true,
          position: true,
          ministry: { select: { id: true, name: true } },
        },
      },
    },
  });

  // 5. Asignaciones del mes (para saber rotación)
  const existingMonthAssignments = await prisma.assignment.findMany({
    where: {
      service: {
        churchId,
        date: { gte: monthStart, lte: monthEnd },
      },
    },
    select: { userId: true },
  });

  const monthlyCount = new Map<string, number>();
  for (const a of existingMonthAssignments) {
    monthlyCount.set(a.userId, (monthlyCount.get(a.userId) ?? 0) + 1);
  }

  // 6. Asignaciones históricas totales (para desempate)
  const historicalCounts = await prisma.assignment.groupBy({
    by: ['userId'],
    where: { user: { churchId } },
    _count: { userId: true },
  });
  const historicalMap = new Map(
    historicalCounts.map((h) => [h.userId, h._count.userId])
  );
    // 6.b Disponibilidad del mes (días marcados como NO disponibles)
  const availabilities = await prisma.availability.findMany({
    where: {
      user: { churchId },
      date: { gte: monthStart, lte: monthEnd },
      available: false,
    },
    select: { userId: true, date: true },
  });
  const unavailableMap = new Map<string, boolean>();
  for (const a of availabilities) {
    const dayKey = a.date.toISOString().slice(0, 10);
    unavailableMap.set(`${a.userId}|${dayKey}`, true);
  }

  // 7. Detectar ministerio de sonido u otro (aquí elegimos el ministerio por defecto)
  const defaultMinistry = await prisma.ministry.findFirst({
    where: { churchId, name: 'Sonido', active: true },
    select: { id: true, name: true },
  });

  // 8. Simulación
  const preview: ServiceProposal[] = [];
  let totalCreated = 0;
  let totalSkipped = 0;
  let totalUnassigned = 0;

  // Copia mutable de los contadores (para ir sumando asignaciones en el mismo run)
  const mutableMonthly = new Map(monthlyCount);

  for (const service of services) {
    const shift = getShift(service.startTime);
    const reqsForService = requirementsMap.get(`${service.serviceTypeId}|${shift}`) ?? [];

    const assignments: AssignmentProposal[] = [];
    const unassigned: UnassignedSlot[] = [];
    let existingCount = service.assignments.length;

    // Si no hay requisitos para este tipo/turno → skip silencioso
    if (reqsForService.length === 0) {
      preview.push({
        serviceId: service.id,
        date: service.date.toISOString().slice(0, 10),
        startTime: service.startTime,
        endTime: service.endTime,
        title: service.title,
        serviceTypeName: service.serviceType.name,
        shift,
        assignments: [],
        unassigned: [],
        existingAssignments: existingCount,
      });
      continue;
    }

    // Set de usuarios ya asignados a este servicio (para no duplicar)
    const alreadyAssignedUserIds = new Set(
      service.assignments.map((a) => a.userId)
    );

    // Set de posiciones ya cubiertas
    const coveredPositions = new Set(
      service.assignments.map((a) => normalizePosition(a.position))
    );

    // Para cada requisito
    for (const req of reqsForService) {
      // Cuántos slots ya están cubiertos de esta posición
      const normalizedReq = normalizePosition(req.position);
      const alreadyCovered = service.assignments.filter((a) =>
        positionMatches(req.position, a.position)
      ).length;

      const slotsNeeded = Math.max(0, req.count - alreadyCovered);

      if (slotsNeeded === 0) {
        totalSkipped++;
        continue;
      }

      // Encontrar candidatos para esta posición
      for (let slot = 0; slot < slotsNeeded; slot++) {
        const candidates = users
          .filter((u) => {
            // No está ya en este servicio
            if (alreadyAssignedUserIds.has(u.id)) return false;

            // NO está marcado como "no disponible" ese día
            const dayKey = service.date.toISOString().slice(0, 10);
            const isUnavailable = unavailableMap.get(`${u.id}|${dayKey}`);
            if (isUnavailable) return false;

            // Tiene alguna pertenencia al ministerio por defecto Y la posición matching
            if (defaultMinistry) {
              const belongs = u.ministries.some(
                (um) =>
                  um.ministryId === defaultMinistry.id &&
                  positionMatches(req.position, um.position)
              );
              if (!belongs) return false;
            }

            return true;
          })
          .sort((a, b) => {
            // 1) Menos asignaciones este mes
            const mA = mutableMonthly.get(a.id) ?? 0;
            const mB = mutableMonthly.get(b.id) ?? 0;
            if (mA !== mB) return mA - mB;

            // 2) Menos asignaciones históricas
            const hA = historicalMap.get(a.id) ?? 0;
            const hB = historicalMap.get(b.id) ?? 0;
            if (hA !== hB) return hA - hB;

            // 3) Alfabético
            return a.name.localeCompare(b.name);
          });

        const chosen = candidates[0];
        if (!chosen) {
          unassigned.push({
            position: req.position,
            reason: 'Sin candidatos disponibles',
          });
          totalUnassigned++;
          continue;
        }

        const ministry = defaultMinistry ?? chosen.ministries[0]?.ministry;

        assignments.push({
          position: req.position,
          userId: chosen.id,
          userName: chosen.name,
          ministryId: ministry?.id ?? '',
          ministryName: ministry?.name ?? '',
        });

        // Actualizar sets para no asignar 2 veces a la misma persona
        alreadyAssignedUserIds.add(chosen.id);
        mutableMonthly.set(chosen.id, (mutableMonthly.get(chosen.id) ?? 0) + 1);
        totalCreated++;
      }
    }

    preview.push({
      serviceId: service.id,
      date: service.date.toISOString().slice(0, 10),
      startTime: service.startTime,
      endTime: service.endTime,
      title: service.title,
      serviceTypeName: service.serviceType.name,
      shift,
      assignments,
      unassigned,
      existingAssignments: existingCount,
    });
  }

  // 9. Si no es dryRun, aplicar en DB
  if (!dryRun) {
    await prisma.$transaction(async (tx) => {
      for (const svc of preview) {
        for (const a of svc.assignments) {
          // Ignorar si ya existe (por seguridad)
          const exists = await tx.assignment.findFirst({
            where: { serviceId: svc.serviceId, userId: a.userId },
          });
          if (exists) continue;

          await tx.assignment.create({
            data: {
              serviceId: svc.serviceId,
              userId: a.userId,
              position: a.position,
              ministryId: a.ministryId || null,
              status: 'PENDING',
            },
          });
        }
      }
    });
  }

  return {
    year,
    month,
    dryRun,
    preview,
    summary: {
      servicesProcessed: services.length,
      assignmentsCreated: totalCreated,
      positionsSkipped: totalSkipped,
      positionsUnassigned: totalUnassigned,
    },
  };
}