import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../middlewares/auth.js';
import * as controller from './service-types.controller.js';

export async function serviceTypesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.get('/', controller.listHandler);
  app.get('/:id', controller.getHandler);
  app.post('/', controller.createHandler);
  app.patch('/:id', controller.updateHandler);
  app.delete('/:id', controller.deleteHandler);
  app.post('/seed-defaults', controller.seedDefaultsHandler);
}