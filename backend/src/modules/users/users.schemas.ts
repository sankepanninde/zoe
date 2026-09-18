import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(2, 'El nombre es requerido').max(100),
  email: z.string().email('Email inválido').toLowerCase(),
  password: z.string().min(8, 'Mínimo 8 caracteres').max(72),
  phone: z.string().max(20).optional().nullable(),
  role: z.enum(['ADMIN', 'LEADER', 'TECHNICIAN']).default('TECHNICIAN'),
  position: z.string().max(50).optional().nullable(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional().nullable(),
  role: z.enum(['ADMIN', 'LEADER', 'TECHNICIAN']).optional(),
  position: z.string().max(50).optional().nullable(),
  active: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  password: z.string().min(8, 'Mínimo 8 caracteres').max(72),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;