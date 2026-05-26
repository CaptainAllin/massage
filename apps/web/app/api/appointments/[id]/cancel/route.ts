import { NextRequest } from 'next/server';
import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { AppointmentStatus, WaitlistStatus } from '@prisma/client';
import crypto from 'crypto';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const id = params.id;
    const businessId = new URL(req.url).searchParams.get('businessId');
    if (!businessId) return res.badRequest('businessId is required');

    const body = await req.json().catch(() => ({}));
    const { reason, cancellationType, recurringScope } = body;
    // recurringScope: 'this_only' | 'this_and_following' | 'all'

    const appointment = await prisma.appointment.findFirst({ where: { id, businessId } });
    if (!appointment) return res.notFound('Appointment not found');
    if (appointment.status === AppointmentStatus.CANCELLED) return res.badRequest('Already cancelled');

    const [updated] = await prisma.$transaction([
      prisma.appointment.update({
        where: { id },
        data: { status: AppointmentStatus.CANCELLED },
        include: { client: true, therapist: { include: { user: true } } },
      }),
      prisma.appointmentCancellation.create({
        data: {
          appointmentId: id, businessId,
          cancelledBy: user.id,
          reason: reason || null,
          cancellationType: cancellationType || 'CLIENT_REQUESTED',
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: user.id, businessId,
          action: 'APPOINTMENT_CANCELLED', entityType: 'Appointment', entityId: id,
          metadata: { reason, type: cancellationType, recurringScope },
        },
      }),
    ]);

    // Handle recurring scope cancellation
    if (appointment.recurringSeriesId && recurringScope && recurringScope !== 'this_only') {
      const futureWhere: any = {
        recurringSeriesId: appointment.recurringSeriesId,
        status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] },
        id: { not: id },
      };
      if (recurringScope === 'this_and_following') {
        futureWhere.startTime = { gte: appointment.startTime };
      }
      await prisma.appointment.updateMany({
        where: futureWhere,
        data: { status: AppointmentStatus.CANCELLED },
      });
      if (recurringScope === 'all') {
        await prisma.recurringAppointmentSeries.update({
          where: { id: appointment.recurringSeriesId },
          data: { isActive: false },
        });
      }
    }

    // Auto-notify matching waitlisted clients
    notifyWaitlist(businessId, appointment, user.id).catch(() => {});

    return res.ok(updated, 'Appointment cancelled');
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    return res.error();
  }
}

async function notifyWaitlist(
  businessId: string,
  appointment: { therapistId: string; serviceType: string | null },
  triggeredByUserId: string
) {
  // Find matching WAITING entries — same business, optionally same service/therapist
  const waitingEntries = await prisma.waitlist.findMany({
    where: {
      businessId,
      status: WaitlistStatus.WAITING,
      OR: [
        { therapistId: null },
        { therapistId: appointment.therapistId },
      ],
      ...(appointment.serviceType
        ? { OR: [{ serviceType: null }, { serviceType: appointment.serviceType }] }
        : {}),
    },
    include: {
      client: { select: { id: true, firstName: true, email: true, phoneNumber: true } },
      business: { select: { name: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (waitingEntries.length === 0) return;

  const OFFER_EXPIRY_HOURS = 24;

  for (const entry of waitingEntries) {
    const offerToken = crypto.randomBytes(32).toString('hex');
    const offerExpiresAt = new Date(Date.now() + OFFER_EXPIRY_HOURS * 60 * 60 * 1000);

    await prisma.waitlist.update({
      where: { id: entry.id },
      data: { status: WaitlistStatus.OFFERED, offerToken, offerExpiresAt },
    });

    const bookingLink = `${process.env.NEXT_PUBLIC_APP_URL}/book/${businessId}?waitlistToken=${offerToken}`;
    const serviceText = entry.serviceType ? ` for ${entry.serviceType}` : '';
    const expiryStr = offerExpiresAt.toLocaleString('en-AU', {
      weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true,
    });
    const content = `Hi ${entry.client.firstName}, a slot has opened up${serviceText} at ${entry.business.name}! Book now (expires ${expiryStr}): ${bookingLink}`;

    const channel = entry.client.phoneNumber ? 'SMS' : 'EMAIL';

    await prisma.message.create({
      data: {
        businessId,
        senderId: triggeredByUserId,
        senderType: 'USER',
        recipientId: entry.clientId,
        recipientType: 'CLIENT',
        type: channel,
        subject: 'A slot has opened up!',
        content,
        status: 'PENDING',
        direction: 'OUTBOUND',
        metadata: { waitlistEntryId: entry.id, offerToken, autoTriggered: true },
      },
    });
  }
}
