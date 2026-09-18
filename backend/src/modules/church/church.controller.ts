import type { FastifyRequest, FastifyReply } from 'fastify';
import * as churchService from './church.service.js';
import { updateChurchSchema } from './church.schemas.js';

export async function getMyChurchHandler(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'No autenticado' });
  }
  const church = await churchService.getChurch(request.user.churchId);
  return reply.send({ church });
}

export async function updateMyChurchHandler(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'No autenticado' });
  }

  // Solo ADMIN puede editar la iglesia
  if (request.user.role !== 'ADMIN' && request.user.role !== 'SUPER_ADMIN') {
    return reply.status(403).send({
      statusCode: 403,
      error: 'Forbidden',
      message: 'Solo el administrador puede editar la iglesia',
    });
  }

  const input = updateChurchSchema.parse(request.body);
  const church = await churchService.updateChurch(request.user.churchId, input);
  return reply.send({ church });
}