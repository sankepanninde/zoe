import type { FastifyRequest, FastifyReply } from 'fastify';
import * as service from './service-types.service.js';
import {
  createServiceTypeSchema,
  updateServiceTypeSchema,
} from './service-types.schemas.js';

function requireUser(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) {
    reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'No autenticado' });
    return null;
  }
  return request.user;
}

function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request, reply);
  if (!user) return null;
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    reply.status(403).send({
      statusCode: 403,
      error: 'Forbidden',
      message: 'Solo administradores pueden realizar esta acción',
    });
    return null;
  }
  return user;
}

export async function listHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request, reply);
  if (!user) return;
  const types = await service.listServiceTypes(user.churchId);
  return reply.send({ serviceTypes: types });
}

export async function getHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const user = requireUser(request, reply);
  if (!user) return;
  const type = await service.getServiceType(user.churchId, request.params.id);
  return reply.send({ serviceType: type });
}

export async function createHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireAdmin(request, reply);
  if (!user) return;
  const input = createServiceTypeSchema.parse(request.body);
  const type = await service.createServiceType(user.churchId, input);
  return reply.status(201).send({ serviceType: type });
}

export async function updateHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const user = requireAdmin(request, reply);
  if (!user) return;
  const input = updateServiceTypeSchema.parse(request.body);
  const type = await service.updateServiceType(user.churchId, request.params.id, input);
  return reply.send({ serviceType: type });
}

export async function deleteHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const user = requireAdmin(request, reply);
  if (!user) return;
  await service.deleteServiceType(user.churchId, request.params.id);
  return reply.status(204).send();
}

export async function seedDefaultsHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireAdmin(request, reply);
  if (!user) return;
  const created = await service.seedDefaults(user.churchId);
  return reply.status(201).send({ serviceTypes: created, count: created.length });
}