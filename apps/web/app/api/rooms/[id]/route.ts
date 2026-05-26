import { withAuth, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const PATCH = withAuth(async (req, user, { params }: { params: { id: string } }) => {
  const { id } = params;
  const body = await req.json();
  const { businessId, name, color, capacity, isActive } = body;

  if (!businessId) return res.badRequest('businessId is required');

  const existing = await prisma.room.findFirst({ where: { id, businessId } });
  if (!existing) return res.notFound('Room not found');

  const room = await prisma.room.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(color !== undefined && { color }),
      ...(capacity !== undefined && { capacity: parseInt(capacity) }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  await prisma.auditLog.create({
    data: { userId: user.id, businessId, action: 'UPDATE', entityType: 'Room', entityId: id },
  });

  return res.ok(room);
});

export const DELETE = withAuth(async (req, user, { params }: { params: { id: string } }) => {
  const { id } = params;
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');

  if (!businessId) return res.badRequest('businessId is required');

  const existing = await prisma.room.findFirst({ where: { id, businessId } });
  if (!existing) return res.notFound('Room not found');

  // Soft delete — archive instead of hard delete to preserve appointment history
  const room = await prisma.room.update({
    where: { id },
    data: { isActive: false },
  });

  await prisma.auditLog.create({
    data: { userId: user.id, businessId, action: 'DELETE', entityType: 'Room', entityId: id },
  });

  return res.ok(room);
});
