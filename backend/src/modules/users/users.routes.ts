import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../middlewares/auth.js';
import * as controller from './users.controller.js';

export async function usersRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.get('/', controller.listHandler);

  // ⚠️ /me va ANTES de /:id
  app.patch('/me', controller.updateMeHandler);
  app.post('/me/avatar', controller.uploadAvatarHandler);
  app.delete('/me/avatar', controller.deleteAvatarHandler);

  app.get('/:id', controller.getHandler);
  app.post('/', controller.createHandler);
  app.patch('/:id', controller.updateHandler);
  app.patch('/:id/password', controller.changePasswordHandler);
  app.delete('/:id', controller.deleteHandler);
}