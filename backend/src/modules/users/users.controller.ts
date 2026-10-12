import type { FastifyRequest, FastifyReply } from 'fastify';
import * as service from './users.service.js';
import {
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
  updateOwnProfileSchema,
} from './users.schemas.js';
import { uploadAvatar, deleteAvatar } from '../../lib/cloudinary.js';

// ===========================================
// MIDDLEWARES LOCALES
// ===========================================

function requireUser(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) {
    reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'No autenticado',
    });
    return null;
  }
  return request.user;
}

/**
 * Permite ADMIN o LEADER (LEADER tendrá filtros adicionales en el service)
 */
function requireManager(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request, reply);
  if (!user) return null;

  if (
    user.role !== 'ADMIN' &&
    user.role !== 'SUPER_ADMIN' &&
    user.role !== 'LEADER'
  ) {
    reply.status(403).send({
      statusCode: 403,
      error: 'Forbidden',
      message: 'Solo administradores o líderes pueden gestionar usuarios',
    });
    return null;
  }
  return user;
}

// ===========================================
// HANDLERS
// ===========================================

export async function listHandler(
  request: FastifyRequest<{ Querystring: { active?: string } }>,
  reply: FastifyReply
) {
  const user = requireUser(request, reply);
  if (!user) return;

  const onlyActive = request.query.active === 'true';
  const users = await service.listUsers(
    user.churchId,
    user.id,
    user.role,
    onlyActive
  );
  return reply.send({ users });
}

export async function getHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const user = requireUser(request, reply);
  if (!user) return;

  const found = await service.getUser(user.churchId, request.params.id);
  return reply.send({ user: found });
}

export async function createHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const manager = requireManager(request, reply);
  if (!manager) return;

  const input = createUserSchema.parse(request.body);

  // Si es LEADER, solo puede asignar ministerios que lidera
  if (manager.role === 'LEADER') {
    const ledMinistries = await service.getLedMinistryIds(manager.id);
    const requested = input.ministries.map((m) => m.ministryId);
    const unauthorized = requested.filter((id) => !ledMinistries.includes(id));
    if (unauthorized.length > 0) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'No puedes asignar ministerios que no lideras',
      });
    }
  }

  const user = await service.createUser(manager.churchId, input);
  return reply.status(201).send({ user });
}

export async function updateHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const manager = requireManager(request, reply);
  if (!manager) return;

  // Verificar que puede gestionar al target
  const canManage = await service.canManageUser(
    manager.id,
    manager.role,
    manager.churchId,
    request.params.id
  );
  if (!canManage) {
    return reply.status(403).send({
      statusCode: 403,
      error: 'Forbidden',
      message: 'No tienes permiso para editar este usuario',
    });
  }

  const input = updateUserSchema.parse(request.body);

  // Si es LEADER, validar ministerios solicitados
  if (manager.role === 'LEADER' && input.ministries) {
    const ledMinistries = await service.getLedMinistryIds(manager.id);
    const requested = input.ministries.map((m) => m.ministryId);
    const unauthorized = requested.filter((id) => !ledMinistries.includes(id));
    if (unauthorized.length > 0) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'No puedes asignar ministerios que no lideras',
      });
    }
  }

  const user = await service.updateUser(
    manager.churchId,
    request.params.id,
    input
  );
  return reply.send({ user });
}

export async function changePasswordHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const manager = requireManager(request, reply);
  if (!manager) return;

  const canManage = await service.canManageUser(
    manager.id,
    manager.role,
    manager.churchId,
    request.params.id
  );
  if (!canManage) {
    return reply.status(403).send({
      statusCode: 403,
      error: 'Forbidden',
      message: 'No tienes permiso',
    });
  }

  const input = changePasswordSchema.parse(request.body);
  await service.changePassword(manager.churchId, request.params.id, input);
  return reply.status(204).send();
}

export async function deleteHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const manager = requireManager(request, reply);
  if (!manager) return;

  const canManage = await service.canManageUser(
    manager.id,
    manager.role,
    manager.churchId,
    request.params.id
  );
  if (!canManage) {
    return reply.status(403).send({
      statusCode: 403,
      error: 'Forbidden',
      message: 'No tienes permiso para eliminar este usuario',
    });
  }

  await service.deleteUser(manager.churchId, request.params.id, manager.id);
  return reply.status(204).send();
}
// ===========================================
// UPDATE OWN PROFILE
// ===========================================

export async function updateMeHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const user = requireUser(request, reply);
  if (!user) return;

  const input = updateOwnProfileSchema.parse(request.body);
  const updated = await service.updateOwnProfile(user.id, input);
  return reply.send({ user: updated });
}
// ===========================================
// AVATAR
// ===========================================

export async function uploadAvatarHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const user = requireUser(request, reply);
  if (!user) return;

  const data = await request.file();
  if (!data) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'No se recibió ninguna imagen',
    });
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(data.mimetype)) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Formato no permitido. Usa JPG, PNG, WebP o GIF.',
    });
  }

  const buffer = await data.toBuffer();

  const MAX_SIZE = 5 * 1024 * 1024;
  if (buffer.length > MAX_SIZE) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'La imagen es muy grande. Máximo 5 MB.',
    });
  }

  const result = await uploadAvatar(buffer, user.id);
  const updated = await service.updateAvatar(user.id, result.url);

  return reply.send({ user: updated });
}

export async function deleteAvatarHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const user = requireUser(request, reply);
  if (!user) return;

  await deleteAvatar(user.id);
  const updated = await service.updateAvatar(user.id, null);

  return reply.send({ user: updated });
}