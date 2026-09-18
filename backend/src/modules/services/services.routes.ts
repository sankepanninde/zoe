import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../middlewares/auth.js';
import * as controller from './services.controller.js';

export async function servicesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.get('/', controller.listHandler);
  app.get('/:id', controller.getHandler);
  app.post('/', controller.createHandler);
  app.patch('/:id', controller.updateHandler);
  app.patch('/:id/status', controller.updateStatusHandler);
  app.delete('/:id', controller.deleteHandler);
}