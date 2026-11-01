import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken } from '../lib/jwt.js';
import { prisma } from '../lib/prisma.js';

export interface AuthUser {
  id: string;
  role: string;
  churchId: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      code: 'UNAUTHORIZED',
      message: 'Token de acceso no proporcionado',
    });
  }

  const token = authHeader.slice(7);

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    return reply.status(401).send({
      code: 'UNAUTHORIZED',
      message: 'Token inválido o expirado',
    });
  }

  // Buscamos al usuario para obtener el churchId real y validar que siga activo
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, role: true, churchId: true, active: true },
  });

  if (!user || !user.active) {
    return reply.status(401).send({
      code: 'UNAUTHORIZED',
      message: 'Usuario no válido o inactivo',
    });
  }

  // Adjuntamos el usuario al request para los controladores
  request.user = {
    id: user.id,
    role: user.role,
    churchId: user.churchId,
  };
}