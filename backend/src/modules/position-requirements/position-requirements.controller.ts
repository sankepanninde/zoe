import type { FastifyRequest, FastifyReply } from 'fastify';
import * as service from './position-requirements.service.js';
import {
  createPositionRequirementSchema,
  updatePositionRequirementSchema,
  bulkUpsertRequirementsSchema,
} from './position-requirements.schemas.js';

// ===========================================
// MIDDLEWARES LOCALES
// ===========================================

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
      message: 'Solo administradores pueden gestionar requisitos',
    });
    return null;
  }
  return user;
}

// ===========================================
// HANDLERS
// ===========================================

export async function listHandler(
  request: FastifyRequest<{ Querystring: { serviceTypeId?: string } }>,
  reply: FastifyReply
) {
  const user = requireUser(request, reply);
  if (!user) return;

  const requirements = await service.listRequirements(
    user.churchId,
    request.query.serviceTypeId
  );
  return reply.send({ requirements });
}

export async function createHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const admin = requireAdmin(request, reply);
  if (!admin) return;

  const input = createPositionRequirementSchema.parse(request.body);
  const requirement = await service.createRequirement(admin.churchId, input);
  return reply.status(201).send({ requirement });
}

export async function updateHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const admin = requireAdmin(request, reply);
  if (!admin) return;

  const input = updatePositionRequirementSchema.parse(request.body);
  const requirement = await service.updateRequirement(
    admin.churchId,
    request.params.id,
    input
  );
  return reply.send({ requirement });
}

export async function deleteHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const admin = requireAdmin(request, reply);
  if (!admin) return;

  await service.deleteRequirement(admin.churchId, request.params.id);
  return reply.status(204).send();
}

export async function bulkUpsertHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const admin = requireAdmin(request, reply);
  if (!admin) return;

  const input = bulkUpsertRequirementsSchema.parse(request.body);
  const requirements = await service.bulkUpsertRequirements(
    admin.churchId,
    input
  );
  return reply.send({ requirements });
}