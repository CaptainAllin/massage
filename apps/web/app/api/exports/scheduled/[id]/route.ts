import { withAuth, requireBusinessAccess, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export const PATCH = withAuth(async (req: NextRequest, user, ctx) => {
  const id = ctx?.params?.id as string;
  if (!id) return res.badRequest('ID required');

  const record = await prisma.scheduledExport.findUnique({ where: { id } });
  if (!record) return res.notFound('Scheduled export not found');
  await requireBusinessAccess(user, record.businessId);

  const body = await req.json();
  const { name, isActive, emailTo, filters } = body;

  const updated = await prisma.scheduledExport.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(isActive !== undefined && { isActive }),
      ...(emailTo !== undefined && { emailTo: emailTo.trim() }),
      ...(filters !== undefined && { filters }),
    },
  });

  return res.ok(updated);
});

export const DELETE = withAuth(async (_req: NextRequest, user, ctx) => {
  const id = ctx?.params?.id as string;
  if (!id) return res.badRequest('ID required');

  const record = await prisma.scheduledExport.findUnique({ where: { id } });
  if (!record) return res.notFound('Scheduled export not found');
  await requireBusinessAccess(user, record.businessId);

  await prisma.scheduledExport.delete({ where: { id } });

  return res.ok({ deleted: true });
});
