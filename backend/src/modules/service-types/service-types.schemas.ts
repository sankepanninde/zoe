import { z } from 'zod';

export const createServiceTypeSchema = z.object({
  name: z.string().min(2, 'El nombre es requerido').max(50),
  description: z.string().max(200).optional().nullable(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color inválido').default('#6366f1'),
  icon: z.string().max(30).optional().nullable(),
});

export const updateServiceTypeSchema = createServiceTypeSchema.partial();

export type CreateServiceTypeInput = z.infer<typeof createServiceTypeSchema>;
export type UpdateServiceTypeInput = z.infer<typeof updateServiceTypeSchema>;