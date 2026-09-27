import { z } from 'zod';

const timeRegex = /^\d{2}:\d{2}$/;

export const createServiceSchema = z.object({
  serviceTypeId: z.string().min(1, 'El tipo de servicio es requerido'),
  title: z.string().max(120).optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  startTime: z.string().regex(timeRegex, 'Formato de hora inválido (HH:MM)'),
  endTime: z.string().regex(timeRegex, 'Formato de hora inválido (HH:MM)'),
  location: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),

  // Campos de sonido (opcionales)
  soundCheckTime: z.string().regex(timeRegex, 'Formato de hora inválido').optional().nullable(),
  sceneName: z.string().max(100).optional().nullable(),
  patchName: z.string().max(100).optional().nullable(),
  inputListCount: z.number().int().positive().max(500).optional().nullable(),
  setlistUrl: z.string().url().optional().nullable(),
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