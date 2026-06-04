import { withAuth, requireBusinessAccess, res, logAudit } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (_req, user, { params }: { params: { id: string } }) => {
  const service = await prisma.service.findUnique({ where: { id: params.id } });
  if (!service) return res.notFound('Service not found');
  await requireBusinessAccess(user, service.businessId);
  return res.ok(service);
});

export const PATCH = withAuth(async (req, user, { params }: { params: { id: string } }) => {
  const service = await prisma.service.findUnique({ where: { id: params.id } });
  if (!service) return res.notFound('Service not found');
  await requireBusinessAccess(user, service.businessId);

  const body = await req.json();
  const { businessId: _biz, ...updates } = body;
  if (updates.duration) updates.duration = parseInt(updates.duration);
  if (updates.price != null) updates.price = parseFloat(updates.price);

  const updated = await prisma.service.update({ where: { id: params.id }, data: updates });
  return res.ok(updated);
});

export const DELETE = withAuth(async (req, user, { params }: { params: { id: string } }) => {
  const service = await prisma.service.findUnique({
    where: { id: params.id },
    include: { _count: { select: { appointments: true } } },
  });
  if (!service) return res.notFound('Service not found');
  await requireBusinessAccess(user, service.businessId);

  if (service._count.appointments > 0) {
    await prisma.service.update({ where: { id: params.id }, data: { isActive: false } });
  } else {
    await prisma.service.delete({ where: { id: params.id } });
  }

  await logAudit(req, {
    userId: user.id,
    businessId: service.businessId,
    action: 'SERVICE_DELETED',
    entityType: 'Service',
    entityId: params.id,
    metadata: { name: service.name },
  });

  return res.ok({ success: true });
});
