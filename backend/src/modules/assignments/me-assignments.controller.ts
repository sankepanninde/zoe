import type { FastifyRequest, FastifyReply } from 'fastify';
import * as meService from './me-assignments.service.js';
import {
  getMyServicesQuerySchema,
  updateAssignmentStatusSchema,
  createReplacementRequestSchema,
} from './assignments.schemas.js';

export async function listMyServicesHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'No autenticado' });

  const query = getMyServicesQuerySchema.parse(request.query);
  const data = await meService.getMyServices(user.id, query);
  return reply.send(data);
}

export async function confirmAssignmentHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const user = request.user;
  if (!user) return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'No autenticado' });

  updateAssignmentStatusSchema.parse(request.body);
  const result = await meService.confirmAssignment(user.id, request.params.id);
  return reply.send(result);
}

export async function requestReplacementHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const user = request.user;
  if (!user) return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'No autenticado' });

  const input = createReplacementRequestSchema.parse(request.body);
  const result = await meService.requestReplacement(user.id, request.params.id, input.reason);
  return reply.status(201).send(result);
}