import { prisma } from '../../lib/prisma.js';
import type {
  CreatePositionRequirementInput,
  UpdatePositionRequirementInput,
  BulkUpsertRequirementsInput,
} from './position-requirements.schemas.js';

// ===========================================
// SELECT PÚBLICO
// ===========================================

const publicSelect = {
  id: true,
  serviceTypeId: true,
  shift: true,
  position: true,
  count: true,
  createdAt: true,
  updatedAt: true,
  serviceType: {
    select: { id: true, name: true, color: true, icon: true },
  },
} as const;

// ===========================================
// LIST
// ===========================================

export async function listRequirements(
  churchId: string,
  serviceTypeId?: string
) {
  return prisma.positionRequirement.findMany({
    where: {
      churchId,
      ...(serviceTypeId && { serviceTypeId }),
    },
    select: publicSelect,
    orderBy: [{ serviceTypeId: 'asc' }, { shift: 'asc' }, { position: 'asc' }],
  });
}

// ===========================================
// CREATE
// ===========================================

export async function createRequirement(
  churchId: string,
  input: CreatePositionRequirementInput
) {
  // Verificar que el serviceType existe y es de esta iglesia
  const typeExists = await prisma.serviceType.findFirst({
    where: { id: input.serviceTypeId, churchId },
  });
  if (!typeExists) {
    const err = new Error('Tipo de servicio no válido');
    (err as Error & { statusCode: number }).statusCode = 400;
    throw err;
  }

  // Verificar que no exista ya (mismo serviceType + shift + position)
  const exists = await prisma.positionRequirement.findFirst({
    where: {
      serviceTypeId: input.serviceTypeId,
      shift: input.shift,
      position: input.position,
    },
  });
  if (exists) {
    const err = new Error(
      'Ya existe un requisito para esa posición en ese turno'
    );
    (err as Error & { statusCode: number }).statusCode = 409;
    throw err;
  }

  return prisma.positionRequirement.create({
    data: {
      churchId,
      serviceTypeId: input.serviceTypeId,
      shift: input.shift,
      position: input.position,
      count: input.count,
    },
    select: publicSelect,
  });
}

// ===========================================
// UPDATE
// ===========================================

export async function updateRequirement(
  churchId: string,
  id: string,
  input: UpdatePositionRequirementInput
) {
  const req = await prisma.positionRequirement.findFirst({
    where: { id, churchId },
  });
  if (!req) {
    const err = new Error('Requisito no encontrado');
    (err as Error & { statusCode: number }).statusCode = 404;
    throw err;
  }

  return prisma.positionRequirement.update({
    where: { id },
    data: {
      ...(input.position !== undefined && { position: input.position }),
      ...(input.count !== undefined && { count: input.count }),
    },
    select: publicSelect,
  });
}

// ===========================================
// DELETE
// ===========================================

export async function deleteRequirement(churchId: string, id: string) {
  const req = await prisma.positionRequirement.findFirst({
    where: { id, churchId },
  });
  if (!req) {
    const err = new Error('Requisito no encontrado');
    (err as Error & { statusCode: number }).statusCode = 404;
    throw err;
  }
  await prisma.positionRequirement.delete({ where: { id } });
}

// ===========================================
// BULK UPSERT (reemplaza todos los requisitos de un serviceType + shift)
// ===========================================

export async function bulkUpsertRequirements(
  churchId: string,
  input: BulkUpsertRequirementsInput
) {
  // Verificar serviceType
  const typeExists = await prisma.serviceType.findFirst({
    where: { id: input.serviceTypeId, churchId },
  });
  if (!typeExists) {
    const err = new Error('Tipo de servicio no válido');
    (err as Error & { statusCode: number }).statusCode = 400;
    throw err;
  }

  return prisma.$transaction(async (tx) => {
    // Borrar los existentes de ese shift
    await tx.positionRequirement.deleteMany({
      where: {
        churchId,
        serviceTypeId: input.serviceTypeId,
        shift: input.shift,
      },
    });

    // Crear los nuevos
    if (input.requirements.length > 0) {
      await tx.positionRequirement.createMany({
        data: input.requirements.map((r) => ({
          churchId,
          serviceTypeId: input.serviceTypeId,
          shift: input.shift,
          position: r.position,
          count: r.count,
        })),
      });
    }

    // Devolver los nuevos
    return tx.positionRequirement.findMany({
      where: {
        churchId,
        serviceTypeId: input.serviceTypeId,
        shift: input.shift,
      },
      select: publicSelect,
      orderBy: { position: 'asc' },
    });
  });
}