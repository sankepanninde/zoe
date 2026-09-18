import { prisma } from '../../lib/prisma.js';
import type {
  CreateServiceTypeInput,
  UpdateServiceTypeInput,
} from './service-types.schemas.js';

export async function listServiceTypes(churchId: string) {
  return prisma.serviceType.findMany({
    where: { churchId, active: true },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getServiceType(churchId: string, id: string) {
  const type = await prisma.serviceType.findFirst({
    where: { id, churchId },
  });
  if (!type) {
    const err = new Error('Tipo de servicio no encontrado');
    (err as Error & { statusCode: number }).statusCode = 404;
    throw err;
  }
  return type;
}

export async function createServiceType(churchId: string, input: CreateServiceTypeInput) {
  // Verificar que no exista otro con el mismo nombre
  const exists = await prisma.serviceType.findFirst({
    where: { churchId, name: input.name, active: true },
  });
  if (exists) {
    const err = new Error('Ya existe un tipo de servicio con ese nombre');
    (err as Error & { statusCode: number }).statusCode = 409;
    throw err;
  }

  return prisma.serviceType.create({
    data: {
      churchId,
      name: input.name,
      description: input.description ?? null,
      color: input.color ?? '#6366f1',
      icon: input.icon ?? null,
    },
  });
}

export async function updateServiceType(
  churchId: string,
  id: string,
  input: UpdateServiceTypeInput
) {
  await getServiceType(churchId, id);
  return prisma.serviceType.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.color !== undefined && { color: input.color }),
      ...(input.icon !== undefined && { icon: input.icon }),
    },
  });
}

export async function deleteServiceType(churchId: string, id: string) {
  await getServiceType(churchId, id);

  // Verificar que no tenga servicios activos
  const servicesCount = await prisma.service.count({
    where: { serviceTypeId: id },
  });
  if (servicesCount > 0) {
    const err = new Error(
      `No se puede eliminar: hay ${servicesCount} servicio(s) usando este tipo`
    );
    (err as Error & { statusCode: number }).statusCode = 409;
    throw err;
  }

  // Soft delete (marcar como inactivo)
  return prisma.serviceType.update({
    where: { id },
    data: { active: false },
  });
}

export async function seedDefaults(churchId: string) {
  const defaults = [
    { name: 'Culto General', color: '#6366f1', icon: '⛪' },
    { name: 'Reunión de Damas', color: '#ec4899', icon: '🌸' },
    { name: 'Reunión de Jóvenes', color: '#3b82f6', icon: '🔥' },
    { name: 'Ensayo', color: '#f59e0b', icon: '🎵' },
  ];

  const created = [];
  for (const def of defaults) {
    const exists = await prisma.serviceType.findFirst({
      where: { churchId, name: def.name },
    });
    if (!exists) {
      const type = await prisma.serviceType.create({
        data: {
          churchId,
          name: def.name,
          color: def.color,
          icon: def.icon,
        },
      });
      created.push(type);
    }
  }
  return created;
}