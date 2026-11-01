export type AssignmentStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED';

export interface MyAssignment {
  id: string;
  position: string;
  status: AssignmentStatus;
}

/** Turno del usuario autenticado, tal como lo entrega GET /me/services. */
export interface MyService {
  serviceId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  soundCheckTime: string | null;
  serviceType: string;
  ministry: string;
  assignment: MyAssignment;
}

export interface MonthSummary {
  month: number; // 0 = enero
  total: number;
  confirmed: number;
  pending: number;
  rejected: number;
}

export const BOGOTA_TZ = 'America/Bogota';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Valida que sea una fecha real en formato YYYY-MM-DD (rechaza 2026-02-30). */
export function isDateKey(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const [y = 0, m = 0, d = 0] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

/** Día de la semana de una fecha YYYY-MM-DD: 0 = domingo. Independiente de la zona horaria. */
export function dayOfWeek(dateKey: string): number {
  const [y = 0, m = 1, d = 1] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function yearOf(dateKey: string): number {
  return Number(dateKey.slice(0, 4));
}

/** Índice de mes 0-11 de una fecha YYYY-MM-DD. */
export function monthIndexOf(dateKey: string): number {
  return Number(dateKey.slice(5, 7)) - 1;
}

/** Fecha y hora actuales en la zona de Bogotá. */
export function bogotaNow(now: Date = new Date()): { dateKey: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BOGOTA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);

  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? '';

  return {
    dateKey: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
  };
}

const slotKey = (s: Pick<MyService, 'date' | 'startTime'>): string =>
  `${s.date}T${s.startTime}`;

export function compareServices(a: MyService, b: MyService): number {
  return slotKey(a).localeCompare(slotKey(b));
}

/** Un turno es próximo si aún no empieza, en hora de Bogotá. */
export function isUpcoming(service: MyService, now: Date = new Date()): boolean {
  const current = bogotaNow(now);
  return slotKey(service) > `${current.dateKey}T${current.time}`;
}

/**
 * Próximo turno del usuario. Ignora los turnos rechazados,
 * porque un turno rechazado no es un compromiso activo.
 */
export function nextShift(services: MyService[], now: Date = new Date()): MyService | null {
  const upcoming = services
    .filter((s) => s.assignment.status !== 'REJECTED' && isUpcoming(s, now))
    .sort(compareServices);
  return upcoming[0] ?? null;
}

/** Agrupa los turnos por fecha, con cada grupo ordenado por hora. */
export function groupByDate(services: MyService[]): Map<string, MyService[]> {
  const grouped = new Map<string, MyService[]>();
  for (const s of [...services].sort(compareServices)) {
    const list = grouped.get(s.date);
    if (list) list.push(s);
    else grouped.set(s.date, [s]);
  }
  return grouped;
}

/** Cuenta los turnos de cada mes del año indicado. */
export function summarizeByMonth(services: MyService[], year: number): MonthSummary[] {
  const months: MonthSummary[] = Array.from({ length: 12 }, (_, month) => ({
    month,
    total: 0,
    confirmed: 0,
    pending: 0,
    rejected: 0,
  }));

  for (const s of services) {
    if (yearOf(s.date) !== year) continue;
    const bucket = months[monthIndexOf(s.date)];
    if (!bucket) continue;
    bucket.total += 1;
    if (s.assignment.status === 'CONFIRMED') bucket.confirmed += 1;
    else if (s.assignment.status === 'PENDING') bucket.pending += 1;
    else bucket.rejected += 1;
  }

  return months;
}
export const ETIQUETA_ESTADO: Record<AssignmentStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  REJECTED: 'Rechazado',
};

/** "Jueves, 29 de octubre" a partir de YYYY-MM-DD, sin desfase por zona horaria. */
export function formatFechaLarga(dateKey: string): string {
  const texto = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${dateKey}T00:00:00Z`));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}