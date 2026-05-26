import { withAuth, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

const TIME_REGEX = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  const therapistId = searchParams.get('therapistId');
  const roomId = searchParams.get('roomId');

  if (!businessId) return res.badRequest('businessId is required');

  const where: any = { businessId };
  if (therapistId) where.therapistId = therapistId;
  if (roomId) where.roomId = roomId;

  const rules = await prisma.availabilityRule.findMany({
    where,
    include: {
      therapist: { include: { user: { select: { firstName: true, lastName: true } } } },
      room: true,
    },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
  });

  return res.ok(rules);
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const { businessId, therapistId, roomId, serviceType, daysOfWeek, startTime, endTime, priority } = body;

  if (!businessId) return res.badRequest('businessId is required');
  if (!daysOfWeek || !Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
    return res.badRequest('daysOfWeek must be a non-empty array');
  }
  if (!startTime || !endTime) return res.badRequest('startTime and endTime are required');
  if (!TIME_REGEX.test(startTime) || !TIME_REGEX.test(endTime)) {
    return res.badRequest('Time must be in HH:MM format');
  }
  if (startTime >= endTime) return res.badRequest('startTime must be before endTime');

  const rule = await prisma.availabilityRule.create({
    data: {
      businessId,
      therapistId: therapistId || null,
      roomId: roomId || null,
      serviceType: serviceType || null,
      daysOfWeek,
      startTime,
      endTime,
      priority: priority ?? 0,
    },
    include: {
      therapist: { include: { user: { select: { firstName: true, lastName: true } } } },
      room: true,
    },
  });

  await prisma.auditLog.create({
    data: { userId: user.id, businessId, action: 'CREATE', entityType: 'AvailabilityRule', entityId: rule.id },
  });

  return res.created(rule);
});
