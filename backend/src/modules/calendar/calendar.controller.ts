import type { FastifyRequest, FastifyReply } from 'fastify';
import * as calendarService from './calendar.service.js';

function requireUser(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) {
    reply.status(401).send({ code: 'UNAUTHORIZED', message: 'No autenticado' });
    return null;
  }
  return request.user;
}

export async function getLinkHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request, reply);
  if (!user) return;

  const result = await calendarService.generateLink(user.id);
  return reply.send(result);
}

export async function regenerateLinkHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request, reply);
  if (!user) return;

  const result = await calendarService.regenerateLink(user.id, user.churchId, {
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
  });
  return reply.send(result);
}

export async function getIcsHandler(
  request: FastifyRequest<{ Params: { token: string } }>,
  reply: FastifyReply
) {
  const { token } = request.params;
  const rawToken = token.endsWith('.ics') ? token.slice(0, -4) : token;

  const { ics } = await calendarService.getIcsForToken(rawToken);

  reply
    .header('Content-Type', 'text/calendar; charset=utf-8')
    .header('Content-Disposition', 'inline; filename="zoe.ics"')
    .header('Cache-Control', 'private, max-age=900')
    .send(ics);
}