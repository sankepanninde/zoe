import { prisma } from '../../lib/prisma.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  parseDuration,
} from '../../lib/jwt.js';
import { env } from '../../lib/env.js';
import type { RegisterInput, LoginInput } from './auth.schemas.js';
import crypto from 'node:crypto';
import { Role } from '@prisma/client'; // Importamos el enum de Prisma

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public code: string = 'AUTH_ERROR'
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface SessionContext {
  userAgent?: string;
  ipAddress?: string;
}

// ===========================================
// REGISTRO
// ===========================================
export async function registerChurchAndAdmin(
  input: RegisterInput,
  ctx: SessionContext = {}
): Promise<{
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    churchId: string;
    mustChangePassword: boolean;
  };
  tokens: AuthTokens;
}> {
  const existingUser = await prisma.user.findFirst({
    where: { email: input.email },
  });
  if (existingUser) {
    throw new AuthError('Ya existe un usuario con ese email', 409, 'CONFLICT');
  }

  const existingChurch = await prisma.church.findUnique({
    where: { slug: input.churchSlug },
  });
  if (existingChurch) {
    throw new AuthError('Ya existe una iglesia con ese slug', 409, 'CONFLICT');
  }

  const passwordHash = await hashPassword(input.password);

  const result = await prisma.$transaction(async (tx) => {
    const church = await tx.church.create({
      data: {
        name: input.churchName,
        slug: input.churchSlug,
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    const user = await tx.user.create({
      data: {
        churchId: church.id,
        email: input.email,
        passwordHash,
        name: input.name,
        phone: input.phone,
        role: 'ADMIN',
      },
    });

    return { church, user };
  });

  // AUTO-SEEDS
  try {
    const { seedDefaultMinistries } = await import('../ministries/ministries.service.js');
    await seedDefaultMinistries(result.church.id);
  } catch (err) {
    console.error('[auth] Error al crear ministerios:', err);
  }

  try {
    const { seedYearSundays } = await import('../services/services.service.js');
    await seedYearSundays(result.church.id, new Date().getFullYear());
  } catch (err) {
    console.error('[auth] Error al generar domingos:', err);
  }

  // Creamos una nueva familia de tokens
  const familyId = crypto.randomUUID();

  const tokens = await createSession(
    result.user.id,
    result.user.role,
    familyId,
    ctx
  );

  return {
    user: {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
      churchId: result.church.id,
      mustChangePassword: false,
    },
    tokens,
  };
}

// ===========================================
// LOGIN
// ===========================================
export async function login(
  input: LoginInput,
  ctx: SessionContext = {}
): Promise<{
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    churchId: string;
    mustChangePassword: boolean;
  };
  tokens: AuthTokens;
}> {
  const user = await prisma.user.findFirst({
    where: { email: input.email },
  });

  if (!user || !user.active) {
    // Mensaje genérico para no revelar si el correo existe
    throw new AuthError('Credenciales inválidas', 401, 'UNAUTHORIZED');
  }

  const valid = await verifyPassword(user.passwordHash, input.password);
  if (!valid) {
    throw new AuthError('Credenciales inválidas', 401, 'UNAUTHORIZED');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Creamos una nueva familia de tokens
  const familyId = crypto.randomUUID();
  const tokens = await createSession(user.id, user.role, familyId, ctx);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      churchId: user.churchId,
      mustChangePassword: user.mustChangePassword,
    },
    tokens,
  };
}

// ===========================================
// CREAR SESIÓN (Interno)
// ===========================================
async function createSession(
  userId: string,
  role: Role,
  familyId: string,
  ctx: SessionContext
): Promise<AuthTokens> {
  // Access token: solo sub y role (sin email)
  const accessToken = signAccessToken({
    sub: userId,
    role,
  });

  const jti = crypto.randomUUID();
  const refreshToken = signRefreshToken({
    sub: userId,
    jti,
    familyId,
  });

  const expiresAt = new Date(Date.now() + parseDuration(env.JWT_REFRESH_EXPIRES_IN));

  await prisma.refreshToken.create({
    data: {
      userId,
      familyId,
      tokenHash: hashToken(refreshToken),
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
}

// ===========================================
// REFRESH (Rotación con familia)
// ===========================================
export async function refreshSession(
  refreshToken: string,
  ctx: SessionContext = {}
): Promise<AuthTokens> {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AuthError('Refresh token inválido o expirado', 401, 'UNAUTHORIZED');
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
  });

  // Si no existe o ya fue revocado (posible robo)
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    if (stored && stored.revokedAt) {
      // Revocar toda la familia por seguridad
      await prisma.refreshToken.updateMany({
        where: { familyId: stored.familyId },
        data: { revokedAt: new Date() },
      });
    }
    throw new AuthError('Refresh token revocado o expirado', 401, 'UNAUTHORIZED');
  }

  // Revocar el actual (rotación)
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.active) {
    throw new AuthError('Usuario no válido', 401, 'UNAUTHORIZED');
  }

  // Emitir nuevos tokens manteniendo el mismo familyId
  return createSession(user.id, user.role, stored.familyId, ctx);
}

// ===========================================
// LOGOUT
// ===========================================
export async function logout(refreshToken: string): Promise<void> {
  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

// ===========================================
// USUARIO ACTUAL
// ===========================================
export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      churchId: true,
      phone: true,
      position: true,
      mustChangePassword: true,
      createdAt: true,
      church: {
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
          trialEndsAt: true,
        },
      },
    },
  });

  if (!user) throw new AuthError('Usuario no encontrado', 404, 'NOT_FOUND');
  return user;
}

// ===========================================
// CAMBIO DE CONTRASEÑA
// ===========================================
export async function changeOwnPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user || !user.active) {
    throw new AuthError('Usuario no válido', 404, 'NOT_FOUND');
  }

  const valid = await verifyPassword(user.passwordHash, currentPassword);
  if (!valid) {
    throw new AuthError('La contraseña actual es incorrecta', 400, 'VALIDATION_ERROR');
  }

  const newHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: newHash,
      mustChangePassword: false,
    },
  });

  // Revocar todos los refresh tokens
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

// ===========================================
// RESET PASSWORD
// ===========================================
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: { email, active: true },
    include: { church: { select: { name: true } } },
  });

  if (!user) {
    console.log(`[auth] Password reset solicitado para email inexistente: ${email}`);
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: token,
      resetTokenExpiresAt: expiresAt,
    },
  });

  try {
    const { sendPasswordResetEmail } = await import('../../lib/email.js');
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    await sendPasswordResetEmail({
      to: user.email,
      userName: user.name,
      churchName: user.church.name,
      resetUrl,
    });
  } catch (err) {
    console.error('[auth] Error al enviar email de reset:', err);
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: { resetToken: token },
  });

  if (!user) {
    throw new AuthError('Token inválido', 400, 'VALIDATION_ERROR');
  }

  if (!user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
    throw new AuthError('El token ha expirado. Solicita uno nuevo.', 400, 'VALIDATION_ERROR');
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      mustChangePassword: false,
      resetToken: null,
      resetTokenExpiresAt: null,
    },
  });

  await prisma.refreshToken.updateMany({
    where: { userId: user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}