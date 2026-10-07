import { prisma } from '../../lib/prisma.js';
import { sendAssignmentEmail } from '../../lib/email.js';
import type {
  CreateAssignmentInput,
  UpdateAssignmentInput,
} from './assignments.schemas.js';

export async function listAssignments(churchId: string, serviceId: string) {
  // Verificar servicio
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
      ministry: {
        select: { id: true, name: true, color: true, icon: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
}   // ← ESTA LLAVE FALTABA

export async function createAssignment(
  churchId: string,
  serviceId: string,
  input: CreateAssignmentInput
) {
    // Verificar servicio (incluye la iglesia para el email)
  const service = await prisma.service.findFirst({
    where: { id: serviceId, churchId },
    include: {
      church: { select: { name: true } },
    },
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

    // Verificar que el ministerio sea válido si viene
  if (input.ministryId) {
    const ministry = await prisma.ministry.findFirst({
      where: { id: input.ministryId, churchId, active: true },
    });
    if (!ministry) {
      const err = new Error('Ministerio no válido');
      (err as Error & { statusCode: number }).statusCode = 400;
      throw err;
    }
  }

  const assignment = await prisma.assignment.create({
    data: {
      serviceId,
      userId: input.userId,
      position: input.position,
      ministryId: input.ministryId ?? null,
      notes: input.notes ?? null,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, position: true },
      },
      ministry: {
        select: { id: true, name: true, color: true, icon: true },
      },
    },
  });

  // Enviar email de notificación (no bloquea la respuesta al cliente)
  sendAssignmentEmail({
    to: targetUser.email,
    userName: targetUser.name,
    churchName: service.church.name,
    serviceTitle: service.title ?? 'Servicio Dominical',
    serviceDate: service.date,
    startTime: service.startTime,
    endTime: service.endTime,
    position: input.position,
  }).catch((err) => {
    console.error('[assignments] Error al enviar email:', err);
  });

  return assignment;
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
      ...(input.ministryId !== undefined && { ministryId: input.ministryId }),
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
      ministry: {
        select: { id: true, name: true, color: true, icon: true },
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