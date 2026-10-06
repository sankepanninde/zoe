import { z } from 'zod';

export const createMinistrySchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(50),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color debe ser hex (ej: #6366f1)')
    .optional(),
  icon: z.string().max(50).optional().nullable(),
});

export const updateMinistrySchema = z.object({
  name: z.string().min(2).max(50).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  icon: z.string().max(50).optional().nullable(),
  active: z.boolean().optional(),
});

export type CreateMinistryInput = z.infer<typeof createMinistrySchema>;
export type UpdateMinistryInput = z.infer<typeof updateMinistrySchema>;