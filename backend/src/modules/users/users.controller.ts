import type { FastifyRequest, FastifyReply } from 'fastify';
import * as service from './users.service.js';
import {
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
} from './users.schemas.js';

function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) {
    reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'No autenticado' });
    return null;
  }
  if (request.user.role !== 'ADMIN' && request.user.role !== 'SUPER_ADMIN') {
    reply.status(403).send({
      statusCode: 403,
      error: 'Forbidden',
      message: 'Solo administradores pueden gestionar usuarios',
    });
    return null;
  }
  return request.user;
}

function requireUser(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) {
    reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'No autenticado' });
    return null;
  }
  return request.user;
}

export async function listHandler(
  request: FastifyRequest<{ Querystring: { active?: string } }>,
  reply: FastifyReply
) {
  const user = requireUser(request, reply);
  if (!user) return;

  const onlyActive = request.query.active === 'true';
  const users = await service.listUsers(user.churchId, onlyActive);
  return reply.send({ users });
}

export async function getHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const user = requireUser(request, reply);
  if (!user) return;

  const found = await service.getUser(user.churchId, request.params.id);
  return reply.send({ user: found });
}

export async function createHandler(request: FastifyRequest, reply: FastifyReply) {
  const admin = requireAdmin(request, reply);
  if (!admin) return;

  const input = createUserSchema.parse(request.body);
  const user = await service.createUser(admin.churchId, input);
  return reply.status(201).send({ user });
}

export async function updateHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const admin = requireAdmin(request, reply);
  if (!admin) return;

  const input = updateUserSchema.parse(request.body);
  const user = await service.updateUser(admin.churchId, request.params.id, input);
  return reply.send({ user });
}

export async function changePasswordHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const admin = requireAdmin(request, reply);
  if (!admin) return;

  const input = changePasswordSchema.parse(request.body);
  await service.changePassword(admin.churchId, request.params.id, input);
  return reply.status(204).send();
}

export async function deleteHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const admin = requireAdmin(request, reply);
  if (!admin) return;

  await service.deleteUser(admin.churchId, request.params.id, admin.id);
  return reply.status(204).send();
}