import { z } from 'zod';

// GET /availability/me/services
export const getAvailabilityQuerySchema = z
  .object({
    desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD requerido'),
    hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD requerido'),
  })
  .refine(
    (data) => {
      const diff = Math.abs(new Date(data.hasta).getTime() - new Date(data.desde).getTime());
      return Math.ceil(diff / (1000 * 60 * 60 * 24)) <= 366;
    },
    { message: 'El rango no puede superar los 366 días', path: ['hasta'] }
  );

// PUT /availability/me/days/:fecha
export const putDayStateSchema = z.object({
  estado: z.enum(['DISPONIBLE', 'NO_DISPONIBLE']),
});

// PUT /availability/me/services/:serviceId
export const putServiceStateSchema = z.object({
  estado: z.enum(['DISPONIBLE', 'NO_DISPONIBLE']).nullable(),
});

// POST /availability/me/blocks
export const createBlockSchema = z
  .object({
    desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD requerido'),
    hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD requerido'),
    repite: z.enum(['ninguna', 'anual', 'mensual']).default('ninguna'),
    motivo: z.string().max(200, 'Máximo 200 caracteres').optional(),
  })
  .refine((data) => data.hasta >= data.desde, {
    message: 'La fecha "hasta" debe ser mayor o igual a "desde"',
    path: ['hasta'],
  });

// PATCH /availability/me/blocks/:id
export const updateBlockSchema = z.object({
  desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  repite: z.enum(['ninguna', 'anual', 'mensual']).optional(),
  motivo: z.string().max(200).optional(),
});