import { prisma } from '../../lib/prisma.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import {
  signAccessToken,
  signRefreshToken,
  hashToken,
  parseDuration,
} from '../../lib/jwt.js';
import { env } from '../../lib/env.js';
import type { RegisterInput, LoginInput } from './auth.schemas.js';
import crypto from 'node:crypto';

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400
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

export async function registerChurchAndAdmin(
  input: RegisterInput,
  ctx: SessionContext = {}
): Promise<{ user: { id: string; email: string; name: string; role: string; churchId: string }; tokens: AuthTokens }> {
  // Verificar que el email no exista ya
  const existingUser = await prisma.user.findFirst({
    where: { email: input.email },
  });
  if (existingUser) {
    throw new AuthError('Ya existe un usuario con ese email', 409);
  }

  // Verificar que el slug no exista
  const existingChurch = await prisma.church.findUnique({
    where: { slug: input.churchSlug },
  });
  if (existingChurch) {
    throw new AuthError('Ya existe una iglesia con ese slug', 409);
  }

  const passwordHash = await hashPassword(input.password);

  // Crear church + user en una transacción
  const result = await prisma.$transaction(async (tx) => {
    const church = await tx.church.create({
      data: {
        name: input.churchName,
        slug: input.churchSlug,
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 días de trial
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

  const tokens = await createSession(result.user.id, result.church.id, result.user.role, result.user.email, ctx);

  return {
    user: {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
      churchId: result.church.id,
    },
    tokens,
  };
}

export async function login(
  input: LoginInput,
  ctx: SessionContext = {}
): Promise<{ user: { id: string; email: string; name: string; role: string; churchId: string }; tokens: AuthTokens }> {
  const user = await prisma.user.findFirst({
    where: { email: input.email },
  });

  if (!user || !user.active) {
    throw new AuthError('Credenciales inválidas', 401);
  }

  const valid = await verifyPassword(user.passwordHash, input.password);
  if (!valid) {
    throw new AuthError('Credenciales inválidas', 401);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const tokens = await createSession(user.id, user.churchId, user.role, user.email, ctx);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      churchId: user.churchId,
    },
    tokens,
  };
}

async function createSession(
  userId: string,
  churchId: string,
  role: string,
  email: string,
  ctx: SessionContext
): Promise<AuthTokens> {
  const accessToken = signAccessToken({
    sub: userId,
    churchId,
    role,
    email,
  });

  // Generar refresh token con jti único
  const jti = crypto.randomUUID();
  const refreshToken = signRefreshToken({ sub: userId, churchId, jti });

  // Guardar hash en DB
  const expiresAt = new Date(Date.now() + parseDuration(env.JWT_REFRESH_EXPIRES_IN));
  await prisma.refreshToken.create({
    data: {
      userId,
      churchId,
      tokenHash: hashToken(refreshToken),
      expiresAt,
      userAgent: ctx.userAgent,
      ipAddress: ctx.ipAddress,
    },
  });

  return { accessToken, refreshToken };
}

export async function refreshSession(
  refreshToken: string,
  ctx: SessionContext = {}
): Promise<AuthTokens> {
  const { verifyRefreshToken } = await import('../../lib/jwt.js');

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AuthError('Refresh token inválido o expirado', 401);
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
  });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new AuthError('Refresh token revocado o expirado', 401);
  }

  // Revocar el actual (rotación)
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  // Verificar que el usuario siga activo
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.active) {
    throw new AuthError('Usuario no válido', 401);
  }

  return createSession(user.id, user.churchId, user.role, user.email, ctx);
}

export async function logout(refreshToken: string): Promise<void> {
  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

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

  if (!user) throw new AuthError('Usuario no encontrado', 404);
  return user;
}