import { prisma } from '../src/lib/prisma.js';
import { hashPassword } from '../src/lib/password.js';
import { signAccessToken } from '../src/lib/jwt.js';
import crypto from 'node:crypto';

export async function crearUsuarioDeTest(opts?: { email?: string; role?: 'SIERVO' | 'LEADER' | 'ADMIN' }) {
  const email = opts?.email ?? `user-${crypto.randomUUID()}@test.com`;
  const role = opts?.role ?? 'SIERVO';

  const church = await prisma.church.create({
    data: {
      name: `Iglesia Test ${crypto.randomUUID()}`,
      slug: `iglesia-${crypto.randomUUID()}`,
    },
  });

  const user = await prisma.user.create({
    data: {
      churchId: church.id,
      email,
      passwordHash: await hashPassword('password123'),
      name: 'Usuario Test',
      role,
    },
  });

  const accessToken = signAccessToken({ sub: user.id, role });
  return { user, church, accessToken };
}