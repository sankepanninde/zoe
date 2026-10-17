import type { FastifyRequest, FastifyReply } from 'fastify';
import * as service from './availability.service.js';
import {
  toggleDaySchema,
  bulkToggleSchema,
  listServicesQuerySchema,
  setServiceStateSchema,
  setDayStateSchema,
  createBlockSchema,
} from './availability.schemas.js';

function requireUser(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) {
    reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'No autenticado',
    });
    return null;
  }
  return request.user;
}

// ===========================================
// MI DISPONIBILIDAD
// ===========================================

export async function listMineHandler(
  request: FastifyRequest<{ Querystring: { year?: string; month?: string } }>,
  reply: FastifyReply
) {
  const user = requireUser(request, reply);
  if (!user) return;

  const now = new Date();
  const year = request.query.year
    ? parseInt(request.query.year, 10)
    : now.getUTCFullYear();
  const month = request.query.month
    ? parseInt(request.query.month, 10)
    : now.getUTCMonth();

  const availability = await service.listMyAvailability(user.id, year, month);
  return reply.send({ availability });
}

export async function toggleDayHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const user = requireUser(request, reply);
  if (!user) return;

  const input = toggleDaySchema.parse(request.body);
  const result = await service.toggleDay(
    user.id,
    input.date,
    input.available,
    input.reason
  );
  return reply.send({ availability: result });
}

export async function bulkToggleHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const user = requireUser(request, reply);
  if (!user) return;

  const input = bulkToggleSchema.parse(request.body);
  const results = await service.bulkToggle(
    user.id,
    input.dates,
    input.available,
    input.reason
  );
  return reply.send({ availability: results });
}

export async function clearMonthHandler(
  request: FastifyRequest<{ Querystring: { year: string; month: string } }>,
  reply: FastifyReply
) {
  const user = requireUser(request, reply);
  if (!user) return;

  const year = parseInt(request.query.year, 10);
  const month = parseInt(request.query.month, 10);

  await service.clearMonth(user.id, year, month);
  return reply.status(204).send();
}

// ===========================================
// VER DISPONIBILIDAD DE OTRO USUARIO (líder)
// ===========================================

export async function listUserHandler(
  request: FastifyRequest<{
    Params: { userId: string };
    Querystring: { year?: string; month?: string };
  }>,
  reply: FastifyReply
) {
  const user = requireUser(request, reply);
  if (!user) return;

  // Solo ADMIN/LEADER pueden ver disponibilidad de otros
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'LEADER') {
    return reply.status(403).send({
      statusCode: 403,
      error: 'Forbidden',
      message: 'No tienes permiso',
    });
  }

  const now = new Date();
  const year = request.query.year
    ? parseInt(request.query.year, 10)
    : now.getUTCFullYear();
  const month = request.query.month
    ? parseInt(request.query.month, 10)
    : now.getUTCMonth();

  const availability = await service.listUserAvailability(
    request.params.userId,
    year,
    month
  );
  return reply.send({ availability });
}

// ===========================================
// NUEVOS ENDPOINTS
// ===========================================

export async function listServicesHandler(
  request: FastifyRequest<{ Querystring: { desde: string; hasta: string } }>,
  reply: FastifyReply
) {
  const user = requireUser(request, reply);
  if (!user) return;

  const input = listServicesQuerySchema.parse(request.query);
  const result = await service.listServicesWithAvailability(
    user.id,
    input.desde,
    input.hasta
  );
  return reply.send(result);
}

export async function setServiceStateHandler(
  request: FastifyRequest<{
    Params: { serviceId: string };
    Body: { estado: 'DISPONIBLE' | 'NO_DISPONIBLE' | null };
  }>,
  reply: FastifyReply
) {
  const user = requireUser(request, reply);
  if (!user) return;

  const input = setServiceStateSchema.parse(request.body);
  const result = await service.setServiceState(
    user.id,
    request.params.serviceId,
    input.estado
  );
  return reply.send(result);
}

export async function setDayStateHandler(
  request: FastifyRequest<{
    Params: { fecha: string };
    Body: { estado: 'DISPONIBLE' | 'NO_DISPONIBLE' };
  }>,
  reply: FastifyReply
) {
  const user = requireUser(request, reply);
  if (!user) return;

  const input = setDayStateSchema.parse(request.body);
  const result = await service.setDayState(
    user.id,
    request.params.fecha,
    input.estado
  );
  return reply.send(result);
}

export async function createBlockHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const user = requireUser(request, reply);
  if (!user) return;

  const input = createBlockSchema.parse(request.body);
  const block = await service.createBlock(
    user.id,
    input.desde,
    input.hasta,
    input.motivo
  );
  return reply.status(201).send({ block });
}

export async function deleteBlockHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const user = requireUser(request, reply);
  if (!user) return;

  await service.deleteBlock(user.id, request.params.id);
  return reply.status(204).send();
}