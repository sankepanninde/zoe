import 'dotenv/config';
import { execSync } from 'node:child_process';
import { beforeAll, beforeEach } from 'vitest';

if (!process.env.DATABASE_URL_TEST) {
  throw new Error('DATABASE_URL_TEST no está definido en .env');
}
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;

beforeAll(() => {
  // Usamos npx para evitar el overhead de pnpm (es más rápido y confiable en tests)
  execSync('npx prisma migrate deploy', { 
    stdio: 'inherit',
    timeout: 50000, // Fuerza a que no se cuelgue más de 50s
  });
});

beforeEach(async () => {
  const { prisma } = await import('../src/lib/prisma.js');
  await prisma.availabilityBlock.deleteMany();
  await prisma.availabilityService.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.userMinistry.deleteMany();
  await prisma.ministry.deleteMany();
  await prisma.service.deleteMany();
  await prisma.serviceType.deleteMany();
  await prisma.user.deleteMany();
  await prisma.church.deleteMany();
});