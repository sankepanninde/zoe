import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.string().default('debug'),
  
  DATABASE_URL: z.string().url(),
  DATABASE_URL_TEST: z.string().url().optional(),
  
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET debe tener al menos 32 caracteres'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET debe tener al menos 32 caracteres'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  API_URL: z.string().url().default('http://localhost:4000'),
  
  // CORS_ORIGINS se recibe como string separado por comas y se transforma en array
  CORS_ORIGINS: z.string().transform((str) => str.split(',').map((s) => s.trim())).default('http://localhost:5173'),
  
  COOKIE_SECRET: z.string().min(32, 'COOKIE_SECRET debe tener al menos 32 caracteres'),
  COOKIE_DOMAIN: z.string().default('localhost'),
  COOKIE_SECURE: z.string().transform((v) => v === 'true').default('false'),
  
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  
  // Emails
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
  BREVO_API_KEY: z.string().optional(),
  BREVO_FROM_EMAIL: z.string().optional(),
  BREVO_FROM_NAME: z.string().optional(),
  
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
}).superRefine((data, ctx) => {
  // Exigir variables críticas solo en producción
  if (data.NODE_ENV === 'production') {
    if (!data.RESEND_API_KEY) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'RESEND_API_KEY es obligatorio en producción', path: ['RESEND_API_KEY'] });
    if (!data.CLOUDINARY_CLOUD_NAME) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'CLOUDINARY_CLOUD_NAME es obligatorio en producción', path: ['CLOUDINARY_CLOUD_NAME'] });
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Error en variables de entorno:', parsed.error.format());
  process.exit(1); // El servidor NO arranca
}

if (parsed.data.JWT_ACCESS_SECRET === parsed.data.JWT_REFRESH_SECRET) {
  console.error('❌ SEGURIDAD: JWT_ACCESS_SECRET y JWT_REFRESH_SECRET deben ser diferentes');
  process.exit(1);
}

export const env = parsed.data;