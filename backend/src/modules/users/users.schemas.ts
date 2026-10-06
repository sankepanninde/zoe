import { z } from 'zod';

// ===========================================
// MINISTERIOS POR USUARIO
// ===========================================

const userMinistrySchema = z.object({
  ministryId: z.string().min(1, 'Ministerio requerido'),
  isLeader: z.boolean().default(false),
  position: z.string().max(50).optional().nullable(),
});

// ===========================================
// CREATE
// ===========================================

export const createUserSchema = z.object({
  name: z.string().min(2, 'El nombre es requerido').max(100),
  email: z.string().email('Email inválido').toLowerCase(),
  password: z.string().min(8, 'Mínimo 8 caracteres').max(72),
  phone: z.string().max(20).optional().nullable(),
  role: z.enum(['ADMIN', 'LEADER', 'TECHNICIAN']).default('TECHNICIAN'),
  ministries: z.array(userMinistrySchema).default([]),
});

// ===========================================
// UPDATE
// ===========================================

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional().nullable(),
  role: z.enum(['ADMIN', 'LEADER', 'TECHNICIAN']).optional(),
  active: z.boolean().optional(),
  // Si viene, reemplaza la lista completa de ministerios del usuario
  ministries: z.array(userMinistrySchema).optional(),
});

export const changePasswordSchema = z.object({
  password: z.string().min(8, 'Mínimo 8 caracteres').max(72),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;