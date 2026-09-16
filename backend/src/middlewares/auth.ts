import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken } from '../lib/jwt.js';
import { prisma } from '../lib/prisma.js';

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const header = request.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Token no proporcionado',
    });
  }

  const token = header.slice(7);

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Token inválido o expirado',
    });
  }

  // Revalidar contra DB (defensa en profundidad)
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, churchId: true, role: true, email: true, active: true },
  });

  if (!user || !user.active || user.churchId !== payload.churchId) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Usuario no válido',
    });
  }

  request.user = {
    id: user.id,
    churchId: user.churchId,
    role: user.role,
    email: user.email,
  };
}