import { withAuth, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { AppointmentStatus, GroupBookingStatus } from '@prisma/client';
import { checkAvailability } from '@/lib/check-availability';
import { emitWebhookEvent } from '@/lib/webhooks';
import { emitAutomation } from '@/lib/automation';

export const GET = withAuth(async (req, _user) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  if (!businessId) return res.badRequest('businessId is required');

  const status = searchParams.get('status');
  const therapistId = searchParams.get('therapistId');
  const clientId = searchParams.get('clientId');
  const locationId = searchParams.get('locationId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const sortBy = searchParams.get('sortBy') || 'startTime';
  const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';

  const where: any = { businessId };

  if (status) {
    const statuses = status.split(',');
    where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
  }
  if (therapistId) where.therapistId = therapistId;
  if (clientId) where.clientId = clientId;
  if (locationId) where.locationId = locationId;
  if (startDate || endDate) {
    where.startTime = {};
    if (startDate) where.startTime.gte = new Date(startDate);
    if (endDate) where.startTime.lte = new Date(endDate);
  }

  const [total, appointments] = await Promise.all([
    prisma.appointment.count({ where }),
    prisma.appointment.findMany({
      where,
      include: {
        client: true,
        therapist: { include: { user: true } },
        cancellation: true,
        groupBookings: { include: { client: true }, orderBy: { createdAt: 'asc' } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return Response.json({
    success: true,
    data: appointments,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const { businessId, clientId, therapistId, startTime, duration, isGroup, capacity, groupClientIds, ...rest } = body;

  if (!businessId || !therapistId || !startTime || !duration) {
    return res.badRequest('Missing required fields: businessId, therapistId, startTime, duration');
  }

  // For group sessions, clientId can be the first group member; for individual sessions it's required
  const primaryClientId = clientId || (isGroup && groupClientIds?.length > 0 ? groupClientIds[0] : null);
  if (!primaryClientId) {
    return res.badRequest('clientId is required (or groupClientIds for group sessions)');
  }

  const start = new Date(startTime);
  const end = new Date(start.getTime() + duration * 60000);

  const availability = await checkAvailability(therapistId, start, end);
  if (!availability.available) {
    return res.badRequest(availability.message || 'Appointment slot not available');
  }

  const appointment = await prisma.appointment.create({
    data: {
      businessId,
      clientId: primaryClientId,
      therapistId,
      startTime: start,
      endTime: end,
      duration,
      status: AppointmentStatus.SCHEDULED,
      isGroup: isGroup ?? false,
      capacity: isGroup ? (capacity ?? null) : null,
      ...rest,
    },
    include: {
      client: true,
      therapist: { include: { user: true } },
      groupBookings: { include: { client: true } },
    },
  });

  // Create GroupBooking records for all group clients
  if (isGroup && groupClientIds?.length > 0) {
    const clientIds: string[] = groupClientIds;
    await prisma.groupBooking.createMany({
      data: clientIds.map((cId: string) => ({
        appointmentId: appointment.id,
        clientId: cId,
        status: GroupBookingStatus.REGISTERED,
      })),
      skipDuplicates: true,
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      businessId,
      action: 'APPOINTMENT_CREATED',
      entityType: 'Appointment',
      entityId: appointment.id,
      metadata: { clientId: primaryClientId, therapistId, startTime: start, duration, isGroup: isGroup ?? false },
    },
  });

  emitWebhookEvent(businessId, 'appointment.created', { id: appointment.id, clientId: primaryClientId, therapistId, startTime: start, status: 'SCHEDULED' }).catch(() => {});

  const automationPayload = {
    appointmentId: appointment.id, clientId: primaryClientId, therapistId,
    serviceType: (rest as any).serviceType ?? null, startTime: start.toISOString(), businessId,
  };
  emitAutomation('APPOINTMENT_BOOKED', businessId, automationPayload);

  const totalAppointments = await prisma.appointment.count({ where: { clientId: primaryClientId, businessId } });
  if (totalAppointments === 1) {
    emitAutomation('CLIENT_FIRST_APPOINTMENT', businessId, automationPayload);
  }

  return res.created(appointment, 'Appointment created successfully');
});

