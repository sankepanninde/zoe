import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { env } from './env.js';

// Access Token: solo sub y role (sin datos personales)
export interface AccessTokenPayload {
  sub: string;
  role: string;
}

// Refresh Token: sub, jti y familyId (para rotación segura)
export interface RefreshTokenPayload {
  sub: string;
  jti: string;
  familyId: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    issuer: 'zoe-backend',
  } as jwt.SignOptions);
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    issuer: 'zoe-backend',
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: 'zoe-backend',
  }) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: 'zoe-backend',
  }) as RefreshTokenPayload;
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match || !match[1] || !match[2]) {
    throw new Error(`Formato de duración inválido: ${duration}`);
  }
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  const multiplier = multipliers[unit];
  if (multiplier === undefined) {
    throw new Error(`Unidad de duración inválida: ${unit}`);
  }
  return value * multiplier;
}