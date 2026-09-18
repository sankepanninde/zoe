import { z } from 'zod';

export const createAssignmentSchema = z.object({
  userId: z.string().min(1, 'El usuario es requerido'),
  position: z.string().min(1, 'La posición es requerida').max(50),
  notes: z.string().max(300).optional().nullable(),
});

export const updateAssignmentSchema = z.object({
  position: z.string().min(1).max(50).optional(),
  notes: z.string().max(300).optional().nullable(),
  status: z.enum(['PENDING', 'CONFIRMED', 'REJECTED']).optional(),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;