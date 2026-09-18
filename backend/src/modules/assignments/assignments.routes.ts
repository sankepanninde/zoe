import type { FastifyInstance } from 'fastify';
import * as controller from './assignments.controller.js';

export async function assignmentsRoutes(app: FastifyInstance) {
  app.get('/:serviceId/assignments', controller.listHandler);
  app.post('/:serviceId/assignments', controller.createHandler);
  app.patch('/:serviceId/assignments/:assignmentId', controller.updateHandler);
  app.delete('/:serviceId/assignments/:assignmentId', controller.deleteHandler);
}