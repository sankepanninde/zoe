import { z } from 'zod';

export const updateChurchSchema = z.object({
  name: z.string().min(2, 'El nombre es requerido').max(100).optional(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  timezone: z.string().max(50).optional(),
});

export type UpdateChurchInput = z.infer<typeof updateChurchSchema>;