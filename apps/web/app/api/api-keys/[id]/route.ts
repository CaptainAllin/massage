import { withAuth, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const DELETE = withAuth(async (_req, user, ctx) => {
  const id = ctx?.params?.id as string;
  const key = await prisma.apiKey.findUnique({ where: { id }, include: { business: { select: { ownerId: true } } } });
  if (!key) return res.notFound('API key not found');
  if (key.business.ownerId !== user.id) return res.forbidden();

  await prisma.apiKey.delete({ where: { id } });
  return res.ok({ id });
});

export const PATCH = withAuth(async (req, user, ctx) => {
  const id = ctx?.params?.id as string;
  const body = await req.json();
  const key = await prisma.apiKey.findUnique({ where: { id }, include: { business: { select: { ownerId: true } } } });
  if (!key) return res.notFound('API key not found');
  if (key.business.ownerId !== user.id) return res.forbidden();

  const updated = await prisma.apiKey.update({
    where: { id },
    data: { isActive: body.isActive ?? key.isActive, name: body.name ?? key.name },
    select: { id: true, name: true, isActive: true, permissions: true, lastUsedAt: true, expiresAt: true, createdAt: true },
  });
  return res.ok(updated);
});
