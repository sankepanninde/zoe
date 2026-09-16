import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'La contraseña no puede exceder 72 caracteres');

export const registerSchema = z.object({
  churchName: z.string().min(2, 'El nombre de la iglesia es requerido').max(100),
  churchSlug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'El slug solo puede tener letras minúsculas, números y guiones'),
  name: z.string().min(2, 'El nombre es requerido').max(100),
  email: z.string().email('Email inválido').toLowerCase(),
  password: passwordSchema,
  phone: z.string().max(20).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase(),
  password: z.string().min(1, 'Contraseña requerida'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;