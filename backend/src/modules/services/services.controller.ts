import type { FastifyRequest, FastifyReply } from 'fastify';
import * as service from './services.service.js';
import {
  createServiceSchema,
  updateServiceSchema,
  listServicesQuerySchema,
} from './services.schemas.js';

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
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'LEADER') {
    reply.status(403).send({
      statusCode: 403,
      error: 'Forbidden',
      message: 'No tienes permiso para esta acción',
    });
    return null;
  }
  return user;
}

export async function listHandler(
  request: FastifyRequest<{ Querystring: Record<string, string> }>,
  reply: FastifyReply
) {
  const user = requireUser(request, reply);
  if (!user) return;
  const query = listServicesQuerySchema.parse(request.query);
  const services = await service.listServices(user.churchId, query);
  return reply.send({ services });
}

export async function getHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const user = requireUser(request, reply);
  if (!user) return;
  const svc = await service.getService(user.churchId, request.params.id);
  return reply.send({ service: svc });
}

export async function createHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireAdmin(request, reply);
  if (!user) return;
  const input = createServiceSchema.parse(request.body);
  const svc = await service.createService(user.churchId, input);
  return reply.status(201).send({ service: svc });
}

export async function updateHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const user = requireAdmin(request, reply);
  if (!user) return;
  const input = updateServiceSchema.parse(request.body);
  const svc = await service.updateService(user.churchId, request.params.id, input);
  return reply.send({ service: svc });
}

export async function deleteHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const user = requireAdmin(request, reply);
  if (!user) return;
  await service.deleteService(user.churchId, request.params.id);
  return reply.status(204).send();
}

export async function updateStatusHandler(
  request: FastifyRequest<{ Params: { id: string }; Body: { status: string } }>,
  reply: FastifyReply
) {
  const user = requireAdmin(request, reply);
  if (!user) return;

  const status = request.body.status;
  if (!['PENDING', 'CONFIRMED', 'CANCELLED'].includes(status)) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Estado inválido',
    });
  }

  const svc = await service.updateServiceStatus(
    user.churchId,
    request.params.id,
    status as 'PENDING' | 'CONFIRMED' | 'CANCELLED'
  );
  return reply.send({ service: svc });
}