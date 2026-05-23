import { withAuth, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

const TIME_REGEX = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const where: any = {};

  const businessId = searchParams.get('businessId');
  const therapistId = searchParams.get('therapistId');
  const dayOfWeek = searchParams.get('dayOfWeek');
  const isActive = searchParams.get('isActive');

  if (businessId) where.businessId = businessId;
  if (therapistId) where.therapistId = therapistId;
  if (dayOfWeek !== null) where.dayOfWeek = parseInt(dayOfWeek, 10);
  if (isActive !== null) where.isActive = isActive === 'true';

  const availability = await prisma.therapistAvailability.findMany({
    where,
    include: { therapist: { include: { user: true } } },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });

  return res.ok(availability);
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const { businessId, therapistId, dayOfWeek, startTime, endTime } = body;

  if (!businessId || !therapistId || dayOfWeek === undefined || !startTime || !endTime) {
    return res.badRequest('businessId, therapistId, dayOfWeek, startTime, endTime are required');
  }
  if (dayOfWeek < 0 || dayOfWeek > 6) return res.badRequest('dayOfWeek must be 0-6');
  if (!TIME_REGEX.test(startTime) || !TIME_REGEX.test(endTime)) {
    return res.badRequest('Time must be in HH:MM format');
  }
  if (startTime >= endTime) return res.badRequest('startTime must be before endTime');

  const existing = await prisma.therapistAvailability.findFirst({
    where: { therapistId, dayOfWeek, businessId },
  });

  let availability;
  if (existing) {
    availability = await prisma.therapistAvailability.update({
      where: { id: existing.id },
      data: { startTime, endTime, isActive: true },
    });
  } else {
    availability = await prisma.therapistAvailability.create({
      data: { businessId, therapistId, dayOfWeek, startTime, endTime, isActive: true },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      businessId,
      action: existing ? 'AVAILABILITY_UPDATED' : 'AVAILABILITY_CREATED',
      entityType: 'TherapistAvailability',
      entityId: availability.id,
      metadata: { therapistId, dayOfWeek, startTime, endTime },
    },
  });

  return res.created(availability);
});
