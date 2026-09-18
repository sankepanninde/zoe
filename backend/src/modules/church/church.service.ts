import { prisma } from '../../lib/prisma.js';
import type { UpdateChurchInput } from './church.schemas.js';

export async function getChurch(churchId: string) {
  const church = await prisma.church.findUnique({
    where: { id: churchId },
    select: {
      id: true,
      name: true,
      slug: true,
      timezone: true,
      country: true,
      phone: true,
      email: true,
      address: true,
      logoUrl: true,
      plan: true,
      trialEndsAt: true,
      createdAt: true,
    },
  });
  if (!church) throw new Error('Iglesia no encontrada');
  return church;
}

export async function updateChurch(churchId: string, input: UpdateChurchInput) {
  return prisma.church.update({
    where: { id: churchId },
    data: input,
    select: {
      id: true,
      name: true,
      slug: true,
      timezone: true,
      country: true,
      phone: true,
      email: true,
      address: true,
      logoUrl: true,
      plan: true,
      trialEndsAt: true,
    },
  });
}