import type { FastifyRequest, FastifyReply } from 'fastify';
import * as service from './ministries.service.js';
import {
  createMinistrySchema,
  updateMinistrySchema,
} from './ministries.schemas.js';

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

function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request, reply);
  if (!user) return null;
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    reply.status(403).send({
      statusCode: 403,
      error: 'Forbidden',
      message: 'Solo administradores pueden gestionar ministerios',
    });
    return null;
  }
  return user;
}

export async function listHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request, reply);
  if (!user) return;
  const ministries = await service.listMinistries(user.churchId, true);
  return reply.send({ ministries });
}

export async function listMineHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request, reply);
  if (!user) return;
  const ministries = await service.listMyMinistries(user.id, user.churchId);
  return reply.send({ ministries });
}

export async function createHandler(request: FastifyRequest, reply: FastifyReply) {
  const admin = requireAdmin(request, reply);
  if (!admin) return;
  const input = createMinistrySchema.parse(request.body);
  const ministry = await service.createMinistry(admin.churchId, input);
  return reply.status(201).send({ ministry });
}

export async function updateHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const user = requireUser(request, reply);
  if (!user) return;

  const canManage = await service.canManageMinistry(
    user.id,
    user.role,
    request.params.id
  );
  if (!canManage) {
    return reply.status(403).send({
      statusCode: 403,
      error: 'Forbidden',
      message: 'No tienes permiso para editar este ministerio',
    });
  }

  const input = updateMinistrySchema.parse(request.body);
  const ministry = await service.updateMinistry(
    user.churchId,
    request.params.id,
    input
  );
  return reply.send({ ministry });
}

export async function deleteHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const admin = requireAdmin(request, reply);
  if (!admin) return;
  await service.deleteMinistry(admin.churchId, request.params.id);
  return reply.status(204).send();
}