import type { FastifyRequest, FastifyReply } from 'fastify';
import * as service from './availability.service.js';
import {
  getAvailabilityQuerySchema,
  putDayStateSchema,
  putServiceStateSchema,
  createBlockSchema,
  updateBlockSchema,
} from './availability.schemas.js';

function requireUser(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) {
    reply.status(401).send({ code: 'UNAUTHORIZED', message: 'No autenticado' });
    return null;
  }
  return request.user;
}

// ===========================================
// GET /availability/me/services
// ===========================================
// GET /availability/me/services
export async function listMineHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request, reply);
  if (!user) return;

  const query = getAvailabilityQuerySchema.parse(request.query);
  const data = await service.getMyAvailability(user.id, query);
  return reply.send(data); // Ahora data = { dias, bloqueos }
}

// GET /availability/me/blocks
export async function listBlocksHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request, reply);
  if (!user) return;

  const query = getAvailabilityQuerySchema.parse(request.query);
  const data = await service.listBlocks(user.id, query);
  return reply.send(data);
}

// ===========================================
// PUT /availability/me/days/:fecha
// ===========================================
export async function putDayHandler(
  request: FastifyRequest<{ Params: { fecha: string } }>,
  reply: FastifyReply
) {
  const user = requireUser(request, reply);
  if (!user) return;

  const input = putDayStateSchema.parse(request.body);
  await service.setDayState(user.id, request.params.fecha, input.estado);
  return reply.status(204).send();
}

// ===========================================
// PUT /availability/me/services/:serviceId
// ===========================================
export async function putServiceHandler(
  request: FastifyRequest<{ Params: { serviceId: string } }>,
  reply: FastifyReply
) {
  const user = requireUser(request, reply);
  if (!user) return;

  const input = putServiceStateSchema.parse(request.body);
  await service.setServiceState(user.id, request.params.serviceId, input.estado);
  return reply.status(204).send();
}

// ===========================================
// POST /availability/me/blocks
// ===========================================
export async function createBlockHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request, reply);
  if (!user) return;

  const input = createBlockSchema.parse(request.body);
  const block = await service.createBlock(user.id, input);
  return reply.status(201).send(block);
}

// ===========================================
// PATCH /availability/me/blocks/:id
// ===========================================
export async function updateBlockHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const user = requireUser(request, reply);
  if (!user) return;

  const input = updateBlockSchema.parse(request.body);
  const block = await service.updateBlock(user.id, request.params.id, input);
  return reply.send(block);
}

// ===========================================
// DELETE /availability/me/blocks/:id
// ===========================================
export async function deleteBlockHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const user = requireUser(request, reply);
  if (!user) return;

  await service.deleteBlock(user.id, request.params.id);
  return reply.status(204).send();
}