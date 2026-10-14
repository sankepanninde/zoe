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