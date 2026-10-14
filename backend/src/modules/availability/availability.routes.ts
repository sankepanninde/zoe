import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../middlewares/auth.js';
import * as controller from './availability.controller.js';

export async function availabilityRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  // Mis días
  app.get('/me', controller.listMineHandler);
  app.post('/me/toggle', controller.toggleDayHandler);
  app.post('/me/bulk', controller.bulkToggleHandler);
  app.delete('/me/month', controller.clearMonthHandler);

  // Días de otro usuario (solo admin/líder)
  app.get('/user/:userId', controller.listUserHandler);
}