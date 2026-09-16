import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../middlewares/auth.js';
import * as controller from './auth.controller.js';

export async function authRoutes(app: FastifyInstance) {
  // Registro público (crea iglesia + admin)
  app.post('/register', {
    config: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
    handler: controller.registerHandler,
  });

  // Login público
  app.post('/login', {
    config: { rateLimit: { max: 10, timeWindow: '15 minutes' } },
    handler: controller.loginHandler,
  });

  // Refresh (usa cookie)
  app.post('/refresh', {
    handler: controller.refreshHandler,
  });

  // Logout (usa cookie)
  app.post('/logout', {
    handler: controller.logoutHandler,
  });

  // Me (requiere auth)
  app.get('/me', {
    preHandler: authMiddleware,
    handler: controller.meHandler,
  });
}