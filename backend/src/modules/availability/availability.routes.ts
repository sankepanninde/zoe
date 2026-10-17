import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../middlewares/auth.js';
import * as controller from './availability.controller.js';

export async function availabilityRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  // ── Nuevos endpoints ──
  app.get('/me/services', controller.listServicesHandler);
  app.put('/me/services/:serviceId', controller.setServiceStateHandler);
  app.put('/me/days/:fecha', controller.setDayStateHandler);
  app.post('/me/blocks', controller.createBlockHandler);
  app.delete('/me/blocks/:id', controller.deleteBlockHandler);

  // ── Endpoints viejos (transición) ──
  app.get('/me', controller.listMineHandler);
  app.post('/me/toggle', controller.toggleDayHandler);
  app.post('/me/bulk', controller.bulkToggleHandler);
  app.delete('/me/month', controller.clearMonthHandler);

  // ── Ver disponibilidad de otro usuario (líder/admin) ──
  app.get('/user/:userId', controller.listUserHandler);
}