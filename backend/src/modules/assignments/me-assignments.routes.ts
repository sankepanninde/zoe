import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../middlewares/auth.js';
import * as controller from './me-assignments.controller.js';

export async function meAssignmentsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.get('/services', controller.listMyServicesHandler);
  app.patch('/assignments/:id', controller.confirmAssignmentHandler);
  app.post('/assignments/:id/replacement-requests', controller.requestReplacementHandler);
}