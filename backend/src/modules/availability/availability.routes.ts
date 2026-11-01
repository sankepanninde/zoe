import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../middlewares/auth.js';
import * as controller from './availability.controller.js';

export async function availabilityRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  // Disponibilidad del usuario
  app.get('/me/services', controller.listMineHandler);
  app.put('/me/days/:fecha', controller.putDayHandler);
  app.put('/me/services/:serviceId', controller.putServiceHandler);

  // Bloqueos
  app.get('/me/blocks', controller.listBlocksHandler);  
  app.post('/me/blocks', controller.createBlockHandler);
  app.patch('/me/blocks/:id', controller.updateBlockHandler);
  app.delete('/me/blocks/:id', controller.deleteBlockHandler);
}