import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  registerSchema,
  loginSchema,
} from './auth.schemas.js';
import * as authService from './auth.service.js';
import { env } from '../../lib/env.js';
import { parseDuration } from '../../lib/jwt.js';

const REFRESH_COOKIE_NAME = 'zoe_refresh_token';

function getSessionContext(request: FastifyRequest) {
  return {
    userAgent: request.headers['user-agent'],
    ipAddress: request.ip,
  };
}

function setRefreshCookie(reply: FastifyReply, token: string) {
  reply.setCookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'strict',
    domain: env.COOKIE_DOMAIN === 'localhost' ? undefined : env.COOKIE_DOMAIN,
    path: '/api/auth',
    maxAge: Math.floor(parseDuration(env.JWT_REFRESH_EXPIRES_IN) / 1000),
  });
}

function clearRefreshCookie(reply: FastifyReply) {
  reply.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
}

export async function registerHandler(request: FastifyRequest, reply: FastifyReply) {
  const input = registerSchema.parse(request.body);
  const result = await authService.registerChurchAndAdmin(input, getSessionContext(request));

  setRefreshCookie(reply, result.tokens.refreshToken);

  return reply.status(201).send({
    user: result.user,
    accessToken: result.tokens.accessToken,
  });
}

export async function loginHandler(request: FastifyRequest, reply: FastifyReply) {
  const input = loginSchema.parse(request.body);
  const result = await authService.login(input, getSessionContext(request));

  setRefreshCookie(reply, result.tokens.refreshToken);

  return reply.send({
    user: result.user,
    accessToken: result.tokens.accessToken,
  });
}

export async function refreshHandler(request: FastifyRequest, reply: FastifyReply) {
  const token = request.cookies[REFRESH_COOKIE_NAME];
  if (!token) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Refresh token no presente',
    });
  }

  const tokens = await authService.refreshSession(token, getSessionContext(request));

  setRefreshCookie(reply, tokens.refreshToken);

  return reply.send({ accessToken: tokens.accessToken });
}

export async function logoutHandler(request: FastifyRequest, reply: FastifyReply) {
  const token = request.cookies[REFRESH_COOKIE_NAME];
  if (token) {
    await authService.logout(token);
  }
  clearRefreshCookie(reply);
  return reply.status(204).send();
}

export async function meHandler(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'No autenticado',
    });
  }

  const user = await authService.getCurrentUser(request.user.id);
  return reply.send({ user });
}