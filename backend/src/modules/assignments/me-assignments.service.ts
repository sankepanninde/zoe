import { prisma } from '../../lib/prisma.js';
import { AuthError } from '../auth/auth.service.js';
import { getMyServicesQuerySchema } from './assignments.schemas.js';

// ===========================================
// GET /me/services
// ===========================================
export async function getMyServices(userId: string, query: { desde: string; hasta: string }) {
  const start = new Date(`${query.desde}T00:00:00.000Z`);
  const end = new Date(`${query.hasta}T23:59:59.999Z`);

  // Buscar asignaciones del usuario, sin borrar, en el rango de fechas
  const assignments = await prisma.assignment.findMany({
    where: {
      userId,
      deletedAt: null,
      service: {
        deletedAt: null,
        date: { gte: start, lte: end },
      },
    },
    include: {
      service: {
        include: {
          serviceType: true,
        },
      },
      ministry: true,
    },
    orderBy: {
      service: { date: 'asc' },
    },
  });

  // Formatear la respuesta exacta que exige el contrato
  return assignments.map((a) => ({
    serviceId: a.serviceId,
    date: a.service.date.toISOString().slice(0, 10),
    startTime: a.service.startTime,
    soundCheckTime: a.service.soundCheckTime,
    serviceType: a.service.serviceType.name,
    ministry: a.ministry?.name ?? null,
    assignment: {
      id: a.id,
      position: a.position,
      status: a.status,
    },
  }));
}

// ===========================================
// PATCH /me/assignments/:id (Confirmar)
// ===========================================
export async function confirmAssignment(userId: string, assignmentId: string) {
  const assignment = await prisma.assignment.findFirst({
    where: { id: assignmentId, userId, deletedAt: null },
    include: { service: true },
  });

  if (!assignment) {
    // 404 si no existe o no es suyo (Seguridad)
    throw new AuthError('Turno no encontrado', 404);
  }

  // Si el turno ya pasó
  if (assignment.service.date < new Date()) {
    throw new AuthError('No se puede confirmar un turno que ya pasó', 409);
  }

  // Idempotencia
  if (assignment.status === 'CONFIRMED') {
    return { success: true, message: 'El turno ya estaba confirmado' };
  }

  // Actualizar
  await prisma.assignment.update({
    where: { id: assignmentId },
    data: {
      status: 'CONFIRMED',
      confirmedAt: new Date(),
    },
  });

  return { success: true };
}

// ===========================================
// POST /me/assignments/:id/replacement-requests
// ===========================================
export async function requestReplacement(userId: string, assignmentId: string, reason: string) {
  const assignment = await prisma.assignment.findFirst({
    where: { id: assignmentId, userId, deletedAt: null },
    include: {
      service: true,
      ministry: true,
    },
  });

  if (!assignment) {
    throw new AuthError('Turno no encontrado', 404);
  }

  if (assignment.service.date < new Date()) {
    throw new AuthError('No se puede pedir reemplazo para un turno que ya pasó', 409);
  }

  // Verificar si ya hay una solicitud abierta (en este ejemplo simple, usaremos el status de Assignment)
  // En un sistema más complejo, habría una tabla 'ReplacementRequest'
  if (assignment.status === 'REJECTED') {
    throw new AuthError('Ya solicitaste un reemplazo para este turno', 409);
  }

  // Todo dentro de una transacción
  await prisma.$transaction(async (tx) => {
    // 1. Marcar como rechazado (solicitó reemplazo)
    await tx.assignment.update({
      where: { id: assignmentId },
      data: { status: 'REJECTED' },
    });

    // 2. Registrar en Auditoría
    await tx.auditLog.create({
      data: {
        churchId: assignment.service.churchId,
        userId,
        action: 'REPLACEMENT_REQUESTED',
        entity: 'Assignment',
        entityId: assignmentId,
        metadata: { reason },
      },
    });

    // 3. (Opcional) Crear notificación para el líder
    // Aquí podrías insertar en una tabla de notificaciones, pero por ahora lo dejamos listo.
  });

  return { success: true, message: 'Solicitud de reemplazo enviada al líder' };
}