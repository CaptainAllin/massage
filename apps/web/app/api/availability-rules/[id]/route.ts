import { withAuth, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

const TIME_REGEX = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

export const PATCH = withAuth(async (req, user, { params }: { params: { id: string } }) => {
  const { id } = params;
  const body = await req.json();
  const { businessId, therapistId, roomId, serviceType, daysOfWeek, startTime, endTime, priority } = body;

  if (!businessId) return res.badRequest('businessId is required');

  const existing = await prisma.availabilityRule.findFirst({ where: { id, businessId } });
  if (!existing) return res.notFound('Availability rule not found');

  if (startTime && !TIME_REGEX.test(startTime)) return res.badRequest('Invalid startTime format');
  if (endTime && !TIME_REGEX.test(endTime)) return res.badRequest('Invalid endTime format');
  const resolvedStart = startTime ?? existing.startTime;
  const resolvedEnd = endTime ?? existing.endTime;
  if (resolvedStart >= resolvedEnd) return res.badRequest('startTime must be before endTime');

  const rule = await prisma.availabilityRule.update({
    where: { id },
    data: {
      ...(therapistId !== undefined && { therapistId: therapistId || null }),
      ...(roomId !== undefined && { roomId: roomId || null }),
      ...(serviceType !== undefined && { serviceType: serviceType || null }),
      ...(daysOfWeek !== undefined && { daysOfWeek }),
      ...(startTime !== undefined && { startTime }),
      ...(endTime !== undefined && { endTime }),
      ...(priority !== undefined && { priority }),
    },
    include: {
      therapist: { include: { user: { select: { firstName: true, lastName: true } } } },
      room: true,
    },
  });

  await prisma.auditLog.create({
    data: { userId: user.id, businessId, action: 'UPDATE', entityType: 'AvailabilityRule', entityId: id },
  });

  return res.ok(rule);
});

export const DELETE = withAuth(async (req, user, { params }: { params: { id: string } }) => {
  const { id } = params;
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');

  if (!businessId) return res.badRequest('businessId is required');

  const existing = await prisma.availabilityRule.findFirst({ where: { id, businessId } });
  if (!existing) return res.notFound('Availability rule not found');

  await prisma.availabilityRule.delete({ where: { id } });

  await prisma.auditLog.create({
    data: { userId: user.id, businessId, action: 'DELETE', entityType: 'AvailabilityRule', entityId: id },
  });

  return res.ok({ deleted: true });
});
