import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';

import { env } from './lib/env.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { AuthError } from './modules/auth/auth.service.js';
import { ZodError } from 'zod';

const app = Fastify({
  loggerInstance: logger,
  trustProxy: true,
  bodyLimit: 1 * 1024 * 1024,
});

// ===========================================
// PLUGINS DE SEGURIDAD
// ===========================================

await app.register(helmet, {
  contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
});

await app.register(cors, {
  origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});

await app.register(cookie, {
  secret: env.COOKIE_SECRET,
  hook: 'onRequest',
});

await app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  errorResponseBuilder: () => ({
    statusCode: 429,
    error: 'Too Many Requests',
    message: 'Demasiadas solicitudes. Intenta de nuevo en un momento.',
  }),
});

// ===========================================
// HEALTH CHECK
// ===========================================

app.get('/health', async () => ({
  status: 'ok',
  service: 'zoe-backend',
  env: env.NODE_ENV,
  timestamp: new Date().toISOString(),
}));

// ===========================================
// RUTAS
// ===========================================

await app.register(authRoutes, { prefix: '/api/auth' });

// ===========================================
// MANEJO GLOBAL DE ERRORES
// ===========================================

app.setErrorHandler((error, request, reply) => {
  // Zod (validación de input)
  if (error instanceof ZodError) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Error de validación',
      details: error.flatten().fieldErrors,
    });
  }

  // AuthError (nuestros errores controlados)
  if (error instanceof AuthError) {
    return reply.status(error.statusCode).send({
      statusCode: error.statusCode,
      error: 'AuthError',
      message: error.message,
    });
  }

  // Errores de Fastify con statusCode
  const statusCode = error.statusCode ?? 500;
  if (statusCode >= 500) {
    logger.error({ err: error, url: request.url, method: request.method }, 'Error interno');
  }

  const message =
    env.NODE_ENV === 'production' && statusCode === 500
      ? 'Error interno del servidor'
      : error.message;

  return reply.status(statusCode).send({
    statusCode,
    error: error.name || 'Error',
    message,
  });
});

app.setNotFoundHandler((request, reply) =>
  reply.status(404).send({
    statusCode: 404,
    error: 'Not Found',
    message: `Ruta ${request.method} ${request.url} no encontrada`,
  })
);

// ===========================================
// GRACEFUL SHUTDOWN
// ===========================================

const shutdown = async (signal: string) => {
  logger.info(`Recibida señal ${signal}, cerrando servidor...`);
  try {
    await app.close();
    await prisma.$disconnect();
    logger.info('Servidor cerrado correctamente');
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, 'Error cerrando servidor');
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// ===========================================
// ARRANQUE
// ===========================================

try {
  await app.listen({ port: env.PORT, host: env.HOST });
  logger.info(`🚀 Zoe backend corriendo en http://${env.HOST}:${env.PORT}`);
  logger.info(`   Entorno: ${env.NODE_ENV}`);
} catch (error) {
  logger.error({ err: error }, 'Error arrancando servidor');
  process.exit(1);
}