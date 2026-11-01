import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../middlewares/auth.js';
import * as controller from './calendar.controller.js';

export async function calendarRoutes(app: FastifyInstance) {
  // Rutas autenticadas (/me/link)
  app.get('/me/link', { preHandler: authMiddleware }, controller.getLinkHandler);
  app.post('/me/link/regenerate', { preHandler: authMiddleware }, controller.regenerateLinkHandler);

  // Ruta pública (.ics) con rate limit específico
  app.get(
    '/:token',
    {
      config: {
        rateLimit: {
          max: 60,
          timeWindow: '1 hour',
          errorResponseBuilder: () => ({
            code: 'RATE_LIMITED',
            message: 'Demasiadas solicitudes a este calendario.',
          }),
        },
      },
    },
    controller.getIcsHandler
  );
}