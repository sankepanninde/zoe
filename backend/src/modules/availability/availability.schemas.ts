import { z } from 'zod';

export const toggleDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  available: z.boolean(),
  reason: z.string().max(200).optional().nullable(),
});

export const bulkToggleSchema = z.object({
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  available: z.boolean(),
  reason: z.string().max(200).optional().nullable(),
});

export type ToggleDayInput = z.infer<typeof toggleDaySchema>;
export type BulkToggleInput = z.infer<typeof bulkToggleSchema>;
// ===========================================
// NUEVOS SCHEMAS
// ===========================================

export const listServicesQuerySchema = z.object({
  desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
});

export const setServiceStateSchema = z.object({
  estado: z.enum(['DISPONIBLE', 'NO_DISPONIBLE']).nullable(),
});

export const setDayStateSchema = z.object({
  estado: z.enum(['DISPONIBLE', 'NO_DISPONIBLE']),
});

export const createBlockSchema = z
  .object({
    desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
    hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
    motivo: z.string().max(200).optional().nullable(),
  })
  .refine((data) => data.hasta >= data.desde, {
    message: 'La fecha "hasta" debe ser mayor o igual a "desde"',
    path: ['hasta'],
  });

export type ListServicesQuery = z.infer<typeof listServicesQuerySchema>;
export type SetServiceStateInput = z.infer<typeof setServiceStateSchema>;
export type SetDayStateInput = z.infer<typeof setDayStateSchema>;
export type CreateBlockInput = z.infer<typeof createBlockSchema>;