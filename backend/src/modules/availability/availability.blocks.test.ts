import { describe, it, expect, beforeAll } from 'vitest';
import { buildApp } from '../../app.js'; // <-- Necesitas extraer la creación de la app a un archivo
import { prisma } from '../../lib/prisma.js';
import { crearUsuarioDeTest } from '../../../tests/helpers.js';

let app: Awaited<ReturnType<typeof buildApp>>;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});

// Helper para crear un bloqueo directo en DB
async function crearBloqueo(userId: string, desde: string, hasta: string, repite: 'NINGUNA' | 'ANUAL' | 'MENSUAL' = 'NINGUNA', motivo?: string) {
  return prisma.availabilityBlock.create({
    data: {
      userId,
      desde: new Date(`${desde}T12:00:00.000Z`),
      hasta: new Date(`${hasta}T12:00:00.000Z`),
      repite,
      motivo,
    },
  });
}

describe('GET /api/availability/me/blocks', () => {
  it('sin token → 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/availability/me/blocks?desde=2026-11-01&hasta=2026-11-30',
    });
    expect(res.statusCode).toBe(401);
  });

  it('devuelve bloqueos que se solapan por el borde izquierdo', async () => {
    const { user, accessToken } = await crearUsuarioDeTest();
    await crearBloqueo(user.id, '2026-10-25', '2026-11-05', 'NINGUNA', 'Solapa borde izq');

    const res = await app.inject({
      method: 'GET',
      url: '/api/availability/me/blocks?desde=2026-11-01&hasta=2026-11-30',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveLength(1);
    expect(body[0].desde).toBe('2026-10-25');
    expect(body[0].hasta).toBe('2026-11-05');
  });

  it('devuelve bloqueos que se solapan por el borde derecho', async () => {
    const { user, accessToken } = await crearUsuarioDeTest();
    await crearBloqueo(user.id, '2026-11-28', '2026-12-05', 'NINGUNA', 'Solapa borde der');

    const res = await app.inject({
      method: 'GET',
      url: '/api/availability/me/blocks?desde=2026-11-01&hasta=2026-11-30',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveLength(1);
  });

  it('NO devuelve bloqueos que están completamente fuera del rango', async () => {
    const { user, accessToken } = await crearUsuarioDeTest();
    await crearBloqueo(user.id, '2026-10-01', '2026-10-15'); // Antes
    await crearBloqueo(user.id, '2026-12-01', '2026-12-15'); // Después

    const res = await app.inject({
      method: 'GET',
      url: '/api/availability/me/blocks?desde=2026-11-01&hasta=2026-11-30',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveLength(0);
  });

  it('devuelve bloqueos repetidos UNA sola vez con sus fechas originales', async () => {
    const { user, accessToken } = await crearUsuarioDeTest();
    await crearBloqueo(user.id, '2026-11-15', '2026-11-20', 'ANUAL', 'Vacaciones anuales');
    await crearBloqueo(user.id, '2026-11-10', '2026-11-12', 'MENSUAL', 'Reunión mensual');

    const res = await app.inject({
      method: 'GET',
      url: '/api/availability/me/blocks?desde=2026-11-01&hasta=2026-12-31',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveLength(2); // No expandidos a 2+2 = 4
    expect(body.find((b: any) => b.repite === 'anual')).toBeDefined();
    expect(body.find((b: any) => b.repite === 'mensual')).toBeDefined();
  });

  it('un usuario no ve los bloqueos de otro', async () => {
    const { user: userA, accessToken: tokenA } = await crearUsuarioDeTest();
    const { user: userB } = await crearUsuarioDeTest();

    await crearBloqueo(userA.id, '2026-11-10', '2026-11-15', 'NINGUNA', 'De A');
    await crearBloqueo(userB.id, '2026-11-10', '2026-11-15', 'NINGUNA', 'De B');

    const res = await app.inject({
      method: 'GET',
      url: '/api/availability/me/blocks?desde=2026-11-01&hasta=2026-11-30',
      headers: { authorization: `Bearer ${tokenA}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveLength(1);
    expect(body[0].motivo).toBe('De A'); // Solo el suyo
  });
});