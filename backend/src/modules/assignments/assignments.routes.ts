import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../middlewares/auth.js';
import * as controller from './assignments.controller.js';

export async function assignmentsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.get('/:serviceId/assignments', controller.listHandler);
  app.post('/:serviceId/assignments', controller.createHandler);
  app.patch('/:serviceId/assignments/:assignmentId', controller.updateHandler);
  app.delete('/:serviceId/assignments/:assignmentId', controller.deleteHandler);
}