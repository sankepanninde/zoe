import { prisma } from '../../lib/prisma.js';

// ===========================================
// LIST MY AVAILABILITY
// ===========================================

export async function listMyAvailability(
  userId: string,
  year: number,
  month: number
) {
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59));

  return prisma.availability.findMany({
    where: {
      userId,
      date: { gte: start, lte: end },
    },
    select: {
      id: true,
      date: true,
      available: true,
      reason: true,
    },
    orderBy: { date: 'asc' },
  });
}

// ===========================================
// TOGGLE SINGLE DAY
// ===========================================

export async function toggleDay(
  userId: string,
  dateStr: string,
  available: boolean,
  reason?: string | null
) {
  const date = new Date(`${dateStr}T00:00:00.000Z`);

  return prisma.availability.upsert({
    where: {
      userId_date: { userId, date },
    },
    create: {
      userId,
      date,
      available,
      reason: reason ?? null,
    },
    update: {
      available,
      reason: reason ?? null,
    },
    select: {
      id: true,
      date: true,
      available: true,
      reason: true,
    },
  });
}

// ===========================================
// BULK TOGGLE (múltiples días de una vez)
// ===========================================

export async function bulkToggle(
  userId: string,
  dates: string[],
  available: boolean,
  reason?: string | null
) {
  if (dates.length === 0) return [];

  return prisma.$transaction(
    dates.map((dateStr) => {
      const date = new Date(`${dateStr}T00:00:00.000Z`);
      return prisma.availability.upsert({
        where: { userId_date: { userId, date } },
        create: {
          userId,
          date,
          available,
          reason: reason ?? null,
        },
        update: {
          available,
          reason: reason ?? null,
        },
        select: {
          id: true,
          date: true,
          available: true,
          reason: true,
        },
      });
    })
  );
}

// ===========================================
// CLEAR MY AVAILABILITY FOR MONTH
// ===========================================

export async function clearMonth(userId: string, year: number, month: number) {
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59));

  await prisma.availability.deleteMany({
    where: {
      userId,
      date: { gte: start, lte: end },
    },
  });
}

// ===========================================
// LIST USER AVAILABILITY (para líderes)
// ===========================================

export async function listUserAvailability(
  userId: string,
  year: number,
  month: number
) {
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59));

  return prisma.availability.findMany({
    where: {
      userId,
      date: { gte: start, lte: end },
    },
    select: {
      id: true,
      date: true,
      available: true,
      reason: true,
    },
    orderBy: { date: 'asc' },
  });
}
// ===========================================
// ESTADO EFECTIVO + LISTA DE SERVICIOS
// ===========================================

export type EffectiveState = 'DISPONIBLE' | 'NO_DISPONIBLE' | 'PENDIENTE';
export type EffectiveSource = 'servicio' | 'bloqueo' | 'pendiente';

interface EffectiveResult {
  estado: EffectiveState;
  fuente: EffectiveSource;
}

/**
 * Calcula el estado efectivo de (userId, serviceId, fecha), respetando prioridad:
 *   a) bloqueo → NO_DISPONIBLE (fuente "bloqueo")
 *   b) AvailabilityService → su estado (fuente "servicio")
 *   c) sin datos → PENDIENTE (fuente "pendiente")
 */
export async function getEffectiveState(
  userId: string,
  serviceId: string,
  fecha: Date
): Promise<EffectiveResult> {
  const dayKey = fecha.toISOString().slice(0, 10);
  const dayStart = new Date(`${dayKey}T00:00:00.000Z`);
  const dayEnd = new Date(`${dayKey}T23:59:59.999Z`);

  // a) ¿Está dentro de un bloqueo?
  const block = await prisma.availabilityBlock.findFirst({
    where: {
      userId,
      desde: { lte: dayEnd },
      hasta: { gte: dayStart },
    },
  });
  if (block) {
    return { estado: 'NO_DISPONIBLE', fuente: 'bloqueo' };
  }

  // b) ¿Hay fila explícita?
  const row = await prisma.availabilityService.findUnique({
    where: { userId_serviceId: { userId, serviceId } },
    select: { estado: true },
  });
  if (row) {
    return { estado: row.estado, fuente: 'servicio' };
  }

  // c) Pendiente
  return { estado: 'PENDIENTE', fuente: 'pendiente' };
}

// ===========================================
// GET /availability/me/services
// ===========================================

interface ServiceDayItem {
  serviceId: string;
  nombre: string;
  ministerio: string | null;
  horaInicio: string;
  horaFin: string;
  estado: EffectiveState;
  fuente: EffectiveSource;
}

interface DayGroup {
  fecha: string;
  bloqueado: boolean;
  servicios: ServiceDayItem[];
}

export async function listServicesWithAvailability(
  userId: string,
  desde: string,
  hasta: string
) {
  const start = new Date(`${desde}T00:00:00.000Z`);
  const end = new Date(`${hasta}T23:59:59.999Z`);

  // 1. Datos del usuario (para saber churchId y ministerios)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { churchId: true },
  });
  if (!user) {
    const err = new Error('Usuario no encontrado');
    (err as Error & { statusCode: number }).statusCode = 404;
    throw err;
  }

  // 2. Servicios en el rango (todos los de la iglesia)
  const services = await prisma.service.findMany({
    where: {
      churchId: user.churchId,
      date: { gte: start, lte: end },
    },
    select: {
      id: true,
      title: true,
      date: true,
      startTime: true,
      endTime: true,
      serviceType: { select: { name: true } },
    },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });

  // 3. Filas explícitas del usuario
  const explicit = await prisma.availabilityService.findMany({
    where: {
      userId,
      serviceId: { in: services.map((s) => s.id) },
    },
    select: { serviceId: true, estado: true },
  });
  const explicitMap = new Map(explicit.map((e) => [e.serviceId, e.estado]));

  // 4. Bloqueos que intersectan el rango
  const blocks = await prisma.availabilityBlock.findMany({
    where: {
      userId,
      desde: { lte: end },
      hasta: { gte: start },
    },
    orderBy: { desde: 'asc' },
    select: { id: true, desde: true, hasta: true, motivo: true },
  });

  // Helper: ¿una fecha cae en algún bloqueo?
  const isBlocked = (date: Date) =>
    blocks.some((b) => b.desde <= date && b.hasta >= date);

  // 5. Agrupar por día (incluyendo días sin servicios)
  const dayMap = new Map<string, DayGroup>();

  // 5.a Rellenar todos los días del rango
  const cursor = new Date(start);
  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
    dayMap.set(key, {
      fecha: key,
      bloqueado: isBlocked(cursor),
      servicios: [],
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  // 5.b Añadir servicios
  for (const s of services) {
    const key = s.date.toISOString().slice(0, 10);
    const day = dayMap.get(key);
    if (!day) continue;

    const effective = getEffectiveFromMaps(s.id, s.date, explicitMap, day.bloqueado);

    day.servicios.push({
      serviceId: s.id,
      nombre: s.title ?? s.serviceType.name,
      ministerio: null,
      horaInicio: s.startTime,
      horaFin: s.endTime,
      estado: effective.estado,
      fuente: effective.fuente,
    });
  }

  return {
    dias: Array.from(dayMap.values()),
    bloqueos: blocks.map((b) => ({
      id: b.id,
      desde: b.desde.toISOString().slice(0, 10),
      hasta: b.hasta.toISOString().slice(0, 10),
      motivo: b.motivo,
    })),
  };
}

// Helper sincrónico para calcular el estado desde los maps ya cargados
function getEffectiveFromMaps(
  serviceId: string,
  date: Date,
  explicitMap: Map<string, 'DISPONIBLE' | 'NO_DISPONIBLE'>,
  blocked: boolean
): EffectiveResult {
  if (blocked) return { estado: 'NO_DISPONIBLE', fuente: 'bloqueo' };
  const explicit = explicitMap.get(serviceId);
  if (explicit) return { estado: explicit, fuente: 'servicio' };
  return { estado: 'PENDIENTE', fuente: 'pendiente' };
}

// ===========================================
// PUT /availability/me/services/:serviceId
// ===========================================

export async function setServiceState(
  userId: string,
  serviceId: string,
  estado: 'DISPONIBLE' | 'NO_DISPONIBLE' | null
) {
  // Verificar que el servicio existe y es de la iglesia del usuario
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { churchId: true },
  });
  if (!user) {
    const err = new Error('Usuario no encontrado');
    (err as Error & { statusCode: number }).statusCode = 404;
    throw err;
  }

  const svc = await prisma.service.findFirst({
    where: { id: serviceId, churchId: user.churchId },
  });
  if (!svc) {
    const err = new Error('Servicio no encontrado');
    (err as Error & { statusCode: number }).statusCode = 404;
    throw err;
  }

  // estado === null → borrar fila
  if (estado === null) {
    await prisma.availabilityService.deleteMany({
      where: { userId, serviceId },
    });
    return { serviceId, estado: null };
  }

  const row = await prisma.availabilityService.upsert({
    where: { userId_serviceId: { userId, serviceId } },
    create: { userId, serviceId, estado },
    update: { estado },
    select: { serviceId: true, estado: true, updatedAt: true },
  });
  return row;
}

// ===========================================
// PUT /availability/me/days/:fecha
// ===========================================

export async function setDayState(
  userId: string,
  fecha: string,
  estado: 'DISPONIBLE' | 'NO_DISPONIBLE'
) {
  const dayStart = new Date(`${fecha}T00:00:00.000Z`);
  const dayEnd = new Date(`${fecha}T23:59:59.999Z`);

  // ¿El día cae en un bloqueo?
  const block = await prisma.availabilityBlock.findFirst({
    where: {
      userId,
      desde: { lte: dayEnd },
      hasta: { gte: dayStart },
    },
  });
  if (block) {
    const err = new Error(
      'El día está dentro de un bloqueo. Elimina el bloqueo antes de marcarlo.'
    );
    (err as Error & { statusCode: number }).statusCode = 409;
    throw err;
  }

  // Servicios de ese día del usuario
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { churchId: true },
  });
  if (!user) {
    const err = new Error('Usuario no encontrado');
    (err as Error & { statusCode: number }).statusCode = 404;
    throw err;
  }

  const services = await prisma.service.findMany({
    where: {
      churchId: user.churchId,
      date: { gte: dayStart, lte: dayEnd },
    },
    select: { id: true },
  });

  if (services.length === 0) {
    return { fecha, estado, updated: 0 };
  }

  // Upsert en transacción
  await prisma.$transaction(
    services.map((s) =>
      prisma.availabilityService.upsert({
        where: { userId_serviceId: { userId, serviceId: s.id } },
        create: { userId, serviceId: s.id, estado },
        update: { estado },
      })
    )
  );

  return { fecha, estado, updated: services.length };
}

// ===========================================
// BLOCKS
// ===========================================

export async function createBlock(
  userId: string,
  desde: string,
  hasta: string,
  motivo?: string | null
) {
  const desdeDate = new Date(`${desde}T00:00:00.000Z`);
  const hastaDate = new Date(`${hasta}T23:59:59.999Z`);

  return prisma.availabilityBlock.create({
    data: {
      userId,
      desde: desdeDate,
      hasta: hastaDate,
      motivo: motivo ?? null,
    },
    select: {
      id: true,
      desde: true,
      hasta: true,
      motivo: true,
      createdAt: true,
    },
  });
}

export async function deleteBlock(userId: string, blockId: string) {
  const block = await prisma.availabilityBlock.findFirst({
    where: { id: blockId, userId },
  });
  if (!block) {
    const err = new Error('Bloqueo no encontrado');
    (err as Error & { statusCode: number }).statusCode = 404;
    throw err;
  }
  await prisma.availabilityBlock.delete({ where: { id: blockId } });
}