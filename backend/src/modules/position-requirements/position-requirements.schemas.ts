import { z } from 'zod';

export const createPositionRequirementSchema = z.object({
  serviceTypeId: z.string().min(1, 'Tipo de servicio requerido'),
  shift: z.enum(['MORNING', 'AFTERNOON']),
  position: z.string().min(1).max(50),
  count: z.number().int().positive().max(20).default(1),
});

export const updatePositionRequirementSchema = z.object({
  position: z.string().min(1).max(50).optional(),
  count: z.number().int().positive().max(20).optional(),
});

export const bulkUpsertRequirementsSchema = z.object({
  serviceTypeId: z.string().min(1),
  shift: z.enum(['MORNING', 'AFTERNOON']),
  requirements: z.array(
    z.object({
      position: z.string().min(1).max(50),
      count: z.number().int().positive().max(20).default(1),
    })
  ),
});

export type CreatePositionRequirementInput = z.infer<
  typeof createPositionRequirementSchema
>;
export type UpdatePositionRequirementInput = z.infer<
  typeof updatePositionRequirementSchema
>;
export type BulkUpsertRequirementsInput = z.infer<
  typeof bulkUpsertRequirementsSchema
>;