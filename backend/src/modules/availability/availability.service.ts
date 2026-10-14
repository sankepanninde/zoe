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