import type { FastifyRequest, FastifyReply } from 'fastify';
import * as service from './assignments.service.js';
import {
  createAssignmentSchema,
  updateAssignmentSchema,
} from './assignments.schemas.js';

function requireUser(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) {
    reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'No autenticado' });
    return null;
  }
  return request.user;
}

export async function listHandler(
  request: FastifyRequest<{ Params: { serviceId: string } }>,
  reply: FastifyReply
) {
  const user = requireUser(request, reply);
  if (!user) return;
  const assignments = await service.listAssignments(user.churchId, request.params.serviceId);
  return reply.send({ assignments });
}

export async function createHandler(
  request: FastifyRequest<{ Params: { serviceId: string } }>,
  reply: FastifyReply
) {
  const user = requireUser(request, reply);
  if (!user) return;
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'LEADER') {
    return reply.status(403).send({
      statusCode: 403,
      error: 'Forbidden',
      message: 'No tienes permiso para asignar',
    });
  }
  const input = createAssignmentSchema.parse(request.body);
  const assignment = await service.createAssignment(
    user.churchId,
    request.params.serviceId,
    input
  );
  return reply.status(201).send({ assignment });
}

export async function updateHandler(
  request: FastifyRequest<{
    Params: { serviceId: string; assignmentId: string };
  }>,
  reply: FastifyReply
) {
  const user = requireUser(request, reply);
  if (!user) return;
  const input = updateAssignmentSchema.parse(request.body);
  const assignment = await service.updateAssignment(
    user.churchId,
    request.params.serviceId,
    request.params.assignmentId,
    input
  );
  return reply.send({ assignment });
}

export async function deleteHandler(
  request: FastifyRequest<{
    Params: { serviceId: string; assignmentId: string };
  }>,
  reply: FastifyReply
) {
  const user = requireUser(request, reply);
  if (!user) return;
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'LEADER') {
    return reply.status(403).send({
      statusCode: 403,
      error: 'Forbidden',
      message: 'No tienes permiso para eliminar asignaciones',
    });
  }
  await service.deleteAssignment(
    user.churchId,
    request.params.serviceId,
    request.params.assignmentId
  );
  return reply.status(204).send();
}