import crypto from 'node:crypto';
import { prisma } from '../../lib/prisma.js';
import { AuthError } from '../auth/auth.service.js';
import { env } from '../../lib/env.js';

// ===========================================
// Helpers
// ===========================================
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function escapeIcs(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function toBogotaDateString(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const y = parts.find((p) => p.type === 'year')!.value;
  const m = parts.find((p) => p.type === 'month')!.value;
  const d = parts.find((p) => p.type === 'day')!.value;
  return `${y}${m}${d}`;
}

function toBogotaDateTime(date: Date, time: string): string {
  const dateStr = toBogotaDateString(date);
  const [hh, mm] = time.split(':');
  return `${dateStr}T${hh}${mm}00`;
}

function dtstampUtc(): string {
  return new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

// ===========================================
// GET /api/calendar/me/link
// ===========================================
export async function generateLink(userId: string) {
  const token = crypto.randomBytes(32).toString('base64url');
  const tokenHash = hashToken(token);

  const created = await prisma.calendarToken.upsert({
    where: { userId },
    update: { tokenHash },
    create: { userId, tokenHash },
    select: { createdAt: true },
  });

  const url = `${env.API_URL}/api/calendar/${token}.ics`;
  return { url, createdAt: created.createdAt };
}

// ===========================================
// POST /api/calendar/me/link/regenerate
// ===========================================
export async function regenerateLink(
  userId: string,
  churchId: string,
  ctx: { ipAddress?: string; userAgent?: string }
) {
  const token = crypto.randomBytes(32).toString('base64url');
  const tokenHash = hashToken(token);

  const created = await prisma.calendarToken.upsert({
    where: { userId },
    update: { tokenHash },
    create: { userId, tokenHash },
    select: { id: true, createdAt: true },
  });

  // Auditoría
  await prisma.auditLog.create({
    data: {
      churchId,
      userId,
      action: 'CALENDAR_TOKEN_REGENERATED',
      entity: 'CalendarToken',
      entityId: created.id,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });

  const url = `${env.API_URL}/api/calendar/${token}.ics`;
  return { url, createdAt: created.createdAt };
}

// ===========================================
// GET /api/calendar/:token.ics
// ===========================================
export async function getIcsForToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const record = await prisma.calendarToken.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: { id: true, churchId: true },
      },
    },
  });

  if (!record) throw new AuthError('Calendario no encontrado', 404);

  const now = new Date();
  const in12Months = new Date(now);
  in12Months.setFullYear(in12Months.getFullYear() + 1);

  const assignments = await prisma.assignment.findMany({
    where: {
      userId: record.user.id,
      deletedAt: null,
      service: {
        deletedAt: null,
        date: { gte: now, lte: in12Months },
      },
    },
    include: {
      service: { include: { serviceType: true } },
      ministry: true,
    },
    orderBy: { service: { date: 'asc' } },
  });

  const lines: string[] = [];
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//Zoe//Church Management//ES');
  lines.push('CALSCALE:GREGORIAN');
  lines.push('METHOD:PUBLISH');
  lines.push('X-WR-CALNAME:Zoe - Mis Turnos');
  lines.push('X-WR-TIMEZONE:America/Bogota');
  lines.push('BEGIN:VTIMEZONE');
  lines.push('TZID:America/Bogota');
  lines.push('BEGIN:STANDARD');
  lines.push('DTSTART:19700101T000000');
  lines.push('TZOFFSETFROM:-0500');
  lines.push('TZOFFSETTO:-0500');
  lines.push('TZNAME:-05');
  lines.push('END:STANDARD');
  lines.push('END:VTIMEZONE');

  const stamp = dtstampUtc();

  for (const a of assignments) {
    const title = a.service.title ?? a.service.serviceType.name;
    const ministry = a.ministry?.name ?? 'Iglesia';
    const isCancelled = a.status === 'REJECTED' || a.service.status === 'CANCELLED';

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${a.id}@zoe`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`DTSTART;TZID=America/Bogota:${toBogotaDateTime(a.service.date, a.service.startTime)}`);
    lines.push(`DTEND;TZID=America/Bogota:${toBogotaDateTime(a.service.date, a.service.endTime)}`);
    lines.push(`SUMMARY:${escapeIcs(title)}`);
    lines.push(`DESCRIPTION:${escapeIcs(`Ministerio: ${ministry}\nPosición: ${a.position}`)}`);
    if (a.service.location) {
      lines.push(`LOCATION:${escapeIcs(a.service.location)}`);
    }
    lines.push(`STATUS:${isCancelled ? 'CANCELLED' : 'CONFIRMED'}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  return { ics: lines.join('\r\n') + '\r\n' };
}