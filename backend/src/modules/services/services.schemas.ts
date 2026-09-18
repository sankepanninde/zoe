import { z } from 'zod';

export const createServiceSchema = z.object({
  serviceTypeId: z.string().min(1, 'El tipo de servicio es requerido'),
  title: z.string().max(120).optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:MM)'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:MM)'),
  location: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const updateServiceSchema = createServiceSchema.partial();

export const listServicesQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  serviceTypeId: z.string().optional(),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type ListServicesQuery = z.infer<typeof listServicesQuerySchema>;