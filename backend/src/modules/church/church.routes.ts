import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../middlewares/auth.js';
import * as controller from './church.controller.js';

export async function churchRoutes(app: FastifyInstance) {
  app.get('/me', { preHandler: authMiddleware, handler: controller.getMyChurchHandler });
  app.patch('/me', { preHandler: authMiddleware, handler: controller.updateMyChurchHandler });
}