import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../middlewares/auth.js';
import * as controller from './position-requirements.controller.js';

export async function positionRequirementsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.get('/', controller.listHandler);
  app.post('/', controller.createHandler);
  app.post('/bulk', controller.bulkUpsertHandler);
  app.patch('/:id', controller.updateHandler);
  app.delete('/:id', controller.deleteHandler);
}