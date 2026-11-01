import { z } from 'zod';

// ===========================================
// ADMIN: Crear / Editar asignaciones (líderes)
// ===========================================
export const createAssignmentSchema = z.object({
  userId: z.string().min(1, 'El usuario es requerido'),
  position: z.string().min(1, 'La posición es requerida').max(50),
  ministryId: z.string().optional().nullable(),
  notes: z.string().max(300).optional().nullable(),
});

export const updateAssignmentSchema = z.object({
  position: z.string().min(1).max(50).optional(),
  ministryId: z.string().optional().nullable(),
  notes: z.string().max(300).optional().nullable(),
  status: z.enum(['PENDING', 'CONFIRMED', 'REJECTED']).optional(),
});

// ===========================================
// ME: Rutas del propio usuario (/me/*)
// ===========================================

// GET /me/services?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
export const getMyServicesQuerySchema = z
  .object({
    desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD requerido'),
    hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD requerido'),
  })
  .refine(
    (data) => {
      const start = new Date(data.desde);
      const end = new Date(data.hasta);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
      const diffMs = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return diffDays <= 366;
    },
    {
      message: 'El rango de fechas no puede superar los 366 días',
      path: ['hasta'],
    }
  );

// PATCH /me/assignments/:id (solo permite confirmar, el rechazo va por replacement-request)
export const updateAssignmentStatusSchema = z.object({
  status: z.literal('CONFIRMED', {
    errorMap: () => ({ message: 'Solo se permite el estado CONFIRMED en este endpoint' }),
  }),
});

// POST /me/assignments/:id/replacement-requests
export const createReplacementRequestSchema = z.object({
  reason: z.string().min(1, 'El motivo es requerido').max(500, 'Máximo 500 caracteres'),
});

// ===========================================
// TIPOS
// ===========================================
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;

export type GetMyServicesQuery = z.infer<typeof getMyServicesQuerySchema>;
export type UpdateAssignmentStatusInput = z.infer<typeof updateAssignmentStatusSchema>;
export type CreateReplacementRequestInput = z.infer<typeof createReplacementRequestSchema>;