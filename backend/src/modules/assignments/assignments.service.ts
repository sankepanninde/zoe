import { prisma } from '../../lib/prisma.js';
import type {
  CreateAssignmentInput,
  UpdateAssignmentInput,
} from './assignments.schemas.js';

export async function listAssignments(churchId: string, serviceId: string) {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, churchId },
  });
  if (!service) {
    const err = new Error('Servicio no encontrado');
    (err as Error & { statusCode: number }).statusCode = 404;
    throw err;
  }

  return prisma.assignment.findMany({
    where: { serviceId },
    include: {
      user: {
        select: { id: true, name: true, email: true, position: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createAssignment(
  churchId: string,
  serviceId: string,
  input: CreateAssignmentInput
) {
  // Verificar servicio
  const service = await prisma.service.findFirst({
    where: { id: serviceId, churchId },
  });
  if (!service) {
    const err = new Error('Servicio no encontrado');
    (err as Error & { statusCode: number }).statusCode = 404;
    throw err;
  }

  // Verificar usuario pertenece a la misma iglesia
  const targetUser = await prisma.user.findFirst({
    where: { id: input.userId, churchId, active: true },
  });
  if (!targetUser) {
    const err = new Error('Usuario no válido');
    (err as Error & { statusCode: number }).statusCode = 400;
    throw err;
  }

  // Verificar que no exista ya asignación
  const exists = await prisma.assignment.findFirst({
    where: { serviceId, userId: input.userId },
  });
  if (exists) {
    const err = new Error('El usuario ya está asignado a este servicio');
    (err as Error & { statusCode: number }).statusCode = 409;
    throw err;
  }

  return prisma.assignment.create({
    data: {
      serviceId,
      userId: input.userId,
      position: input.position,
      notes: input.notes ?? null,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, position: true },
      },
    },
  });
}

export async function updateAssignment(
  churchId: string,
  serviceId: string,
  assignmentId: string,
  input: UpdateAssignmentInput
) {
  // Verificar que el servicio es de esta iglesia
  const service = await prisma.service.findFirst({
    where: { id: serviceId, churchId },
  });
  if (!service) {
    const err = new Error('Servicio no encontrado');
    (err as Error & { statusCode: number }).statusCode = 404;
    throw err;
  }

  const assignment = await prisma.assignment.findFirst({
    where: { id: assignmentId, serviceId },
  });
  if (!assignment) {
    const err = new Error('Asignación no encontrada');
    (err as Error & { statusCode: number }).statusCode = 404;
    throw err;
  }

  return prisma.assignment.update({
    where: { id: assignmentId },
    data: {
      ...(input.position !== undefined && { position: input.position }),
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.status !== undefined && {
        status: input.status,
        ...(input.status === 'CONFIRMED' && { confirmedAt: new Date() }),
      }),
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, position: true },
      },
    },
  });
}

export async function deleteAssignment(
  churchId: string,
  serviceId: string,
  assignmentId: string
) {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, churchId },
  });
  if (!service) {
    const err = new Error('Servicio no encontrado');
    (err as Error & { statusCode: number }).statusCode = 404;
    throw err;
  }

  await prisma.assignment.delete({ where: { id: assignmentId } });
}