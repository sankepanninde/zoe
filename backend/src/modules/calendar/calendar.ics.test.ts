import { describe, it, expect, beforeAll } from 'vitest';
import { buildApp } from '../../app.js';
import { prisma } from '../../lib/prisma.js';
import { crearUsuarioDeTest } from '../../../tests/helpers.js';
import crypto from 'node:crypto';

let app: Awaited<ReturnType<typeof buildApp>>;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});

async function crearServicioYAsignacion(userId: string, churchId: string, opts?: {
  title?: string;
  location?: string;
  status?: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  serviceStatus?: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
}) {
  const st = await prisma.serviceType.create({
    data: { churchId, name: `Tipo ${crypto.randomUUID()}` },
  });
  const service = await prisma.service.create({
    data: {
      churchId,
      serviceTypeId: st.id,
      title: opts?.title ?? 'Culto Dominical',
      date: new Date('2026-12-25T12:00:00.000Z'),
      startTime: '10:00',
      endTime: '12:00',
      location: opts?.location ?? 'Templo Principal',
      status: opts?.serviceStatus ?? 'CONFIRMED',
    },
  });
  const assignment = await prisma.assignment.create({
    data: {
      serviceId: service.id,
      userId,
      position: 'FOH',
      status: opts?.status ?? 'CONFIRMED',
    },
  });
  return { service, assignment };
}

async function getToken(userId: string) {
  const token = crypto.randomBytes(32).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  await prisma.calendarToken.upsert({
    where: { userId },
    update: { tokenHash },
    create: { userId, tokenHash },
  });
  return token;
}

describe('Calendario .ics', () => {
  it('token válido devuelve archivo con el VEVENT esperado', async () => {
    const { user, church } = await crearUsuarioDeTest();
    await crearServicioYAsignacion(user.id, church.id, { title: 'Ensayo General' });
    const token = await getToken(user.id);

    const res = await app.inject({
      method: 'GET',
      url: `/api/calendar/${token}.ics`,
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/calendar');
    expect(res.body).toContain('BEGIN:VCALENDAR');
    expect(res.body).toContain('SUMMARY:Ensayo General');
    expect(res.body).toContain('DTSTART;TZID=America/Bogota:20261225T100000');
    expect(res.body).toContain('DTEND;TZID=America/Bogota:20261225T120000');
    expect(res.body).toContain('LOCATION:Templo Principal');
  });

  it('token inválido devuelve 404', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/calendar/no-existe.ics' });
    expect(res.statusCode).toBe(404);
  });

  it('token regenerado invalida el anterior', async () => {
    const { user, church, accessToken } = await crearUsuarioDeTest();
    await crearServicioYAsignacion(user.id, church.id);
    const token1 = await getToken(user.id);

    // Regenerar vía endpoint
    await app.inject({
      method: 'POST',
      url: '/api/calendar/me/link/regenerate',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    const res = await app.inject({ method: 'GET', url: `/api/calendar/${token1}.ics` });
    expect(res.statusCode).toBe(404);
  });

  it('el archivo no contiene datos de otras personas', async () => {
    const { user: userA, church, accessToken } = await crearUsuarioDeTest();
    const { user: userB } = await crearUsuarioDeTest({ email: 'otro@test.com' });
    await crearServicioYAsignacion(userA.id, church.id, { title: 'Mi Turno' });
    const tokenA = await getToken(userA.id);

    const res = await app.inject({ method: 'GET', url: `/api/calendar/${tokenA}.ics` });
    expect(res.body).not.toContain(userB.email);
    expect(res.body).not.toContain('otro@test.com');
  });

  it('cancelar una asignación produce STATUS:CANCELLED', async () => {
    const { user, church } = await crearUsuarioDeTest();
    const { assignment } = await crearServicioYAsignacion(user.id, church.id, { status: 'REJECTED' });
    const token = await getToken(user.id);

    const res = await app.inject({ method: 'GET', url: `/api/calendar/${token}.ics` });
    expect(res.body).toContain(`UID:${assignment.id}@zoe`);
    expect(res.body).toContain('STATUS:CANCELLED');
  });

  it('escapa comas, punto y coma y saltos de línea en el título', async () => {
    const { user, church } = await crearUsuarioDeTest();
    await crearServicioYAsignacion(user.id, church.id, {
      title: 'Culto; Especial, Con\nSalto',
    });
    const token = await getToken(user.id);

    const res = await app.inject({ method: 'GET', url: `/api/calendar/${token}.ics` });
    expect(res.body).toContain('SUMMARY:Culto\\; Especial\\, Con\\nSalto');
  });

  it('eventos en cambio de año y zona horaria Bogotá', async () => {
    const { user, church } = await crearUsuarioDeTest();
    await crearServicioYAsignacion(user.id, church.id, { title: 'Fin de Año' });
    // La fecha ya es 2026-12-25 (cerca del cambio de año)
    const token = await getToken(user.id);

    const res = await app.inject({ method: 'GET', url: `/api/calendar/${token}.ics` });
    expect(res.body).toContain('DTSTART;TZID=America/Bogota:20261225T100000');
    expect(res.body).toContain('BEGIN:VTIMEZONE');
    expect(res.body).toContain('TZID:America/Bogota');
  });
});