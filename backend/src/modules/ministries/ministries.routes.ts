import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../middlewares/auth.js';
import * as controller from './ministries.controller.js';

export async function ministriesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.get('/', controller.listHandler);
  app.get('/mine', controller.listMineHandler);
  app.post('/', controller.createHandler);
  app.patch('/:id', controller.updateHandler);
  app.delete('/:id', controller.deleteHandler);
}