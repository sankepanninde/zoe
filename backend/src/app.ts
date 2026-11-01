import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

import { env } from './lib/env.js';
import { logger } from './lib/logger.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { churchRoutes } from './modules/church/church.routes.js';
import { serviceTypesRoutes } from './modules/service-types/service-types.routes.js';
import { ministriesRoutes } from './modules/ministries/ministries.routes.js';
import { servicesRoutes } from './modules/services/services.routes.js';
import { AuthError } from './modules/auth/auth.service.js';
import { ZodError } from 'zod';
import { assignmentsRoutes } from './modules/assignments/assignments.routes.js';
import { meAssignmentsRoutes } from './modules/assignments/me-assignments.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { positionRequirementsRoutes } from './modules/position-requirements/position-requirements.routes.js';
import { availabilityRoutes } from './modules/availability/availability.routes.js';
import { calendarRoutes } from './modules/calendar/calendar.routes.js';

export async function buildApp() {
  const app = Fastify({
    loggerInstance: env.NODE_ENV === 'test' ? undefined : logger,
    trustProxy: true,
    bodyLimit: 1 * 1024 * 1024,
  });

  // Content-Type parser tolerante a body vacío en DELETE
  app.removeContentTypeParser('application/json');
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
    const str = (body as string).trim();
    if (str.length === 0) return done(null, {});
    try { done(null, JSON.parse(str)); } catch (err) { done(err as Error, undefined); }
  });

  // Plugins
  await app.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
  });
  await app.register(cors, {
    origin: env.CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  await app.register(cookie, { secret: env.COOKIE_SECRET, hook: 'onRequest' });
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Demasiadas solicitudes.',
    }),
  });
  await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024, files: 1 } });

  // Swagger (solo en desarrollo)
  if (env.NODE_ENV === 'development') {
    await app.register(swagger, {
      openapi: {
        info: { title: 'Zoe API', version: '1.0.0' },
        servers: [{ url: 'http://localhost:4000', description: 'Desarrollo' }],
        components: {
          securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          },
        },
      },
    });
    await app.register(swaggerUi, { routePrefix: '/docs' });
  }

  // Health check
  app.get('/health', async () => ({
    status: 'ok',
    service: 'zoe-backend',
    env: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  }));

  // Rutas
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(churchRoutes, { prefix: '/api/churches' });
  await app.register(serviceTypesRoutes, { prefix: '/api/service-types' });
  await app.register(servicesRoutes, { prefix: '/api/services' });
  await app.register(assignmentsRoutes, { prefix: '/api/services' });
  await app.register(meAssignmentsRoutes, { prefix: '/api/me' });
  await app.register(usersRoutes, { prefix: '/api/users' });
  await app.register(ministriesRoutes, { prefix: '/api/ministries' });
  await app.register(positionRequirementsRoutes, { prefix: '/api/position-requirements' });
  await app.register(availabilityRoutes, { prefix: '/api/availability' });
  await app.register(calendarRoutes, { prefix: '/api/calendar' });

  // Manejo global de errores
  app.setErrorHandler((error: unknown, request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        code: 'VALIDATION_ERROR',
        message: 'Error de validación',
        details: error.flatten().fieldErrors,
      });
    }
    if (error instanceof AuthError) {
      const code =
        error.statusCode === 401 ? 'UNAUTHORIZED'
        : error.statusCode === 403 ? 'FORBIDDEN'
        : error.statusCode === 404 ? 'NOT_FOUND'
        : error.statusCode === 409 ? 'CONFLICT'
        : 'AUTH_ERROR';
      return reply.status(error.statusCode).send({ code, message: error.message });
    }
    const err = error as { statusCode?: number; message?: string; validation?: unknown };
    if (err.validation) {
      return reply.status(400).send({
        code: 'VALIDATION_ERROR',
        message: 'Error de validación',
        details: err.validation,
      });
    }
    const statusCode = err.statusCode ?? 500;
    if (statusCode >= 500) logger.error({ err: error, url: request.url }, 'Error interno');
    return reply.status(statusCode).send({
      code: statusCode === 429 ? 'RATE_LIMITED' : 'INTERNAL_ERROR',
      message: env.NODE_ENV === 'production' && statusCode === 500 ? 'Error interno' : err.message,
    });
  });

  app.setNotFoundHandler((request, reply) =>
    reply.status(404).send({
      code: 'NOT_FOUND',
      message: `Ruta ${request.method} ${request.url} no encontrada`,
    })
  );

  return app;
}