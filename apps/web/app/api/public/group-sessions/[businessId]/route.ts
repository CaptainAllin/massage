import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { res } from '@/lib/api-auth';
import { AppointmentStatus, GroupBookingStatus } from '@prisma/client';
import { sendBookingConfirmation } from '@/lib/email';
import { sendBookingConfirmationSms } from '@/lib/sms';

// GET — return upcoming group sessions for public booking
export async function GET(
  _req: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const { businessId } = params;

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true },
    });
    if (!business) return res.notFound('Business not found');

    const sessions = await prisma.appointment.findMany({
      where: {
        businessId,
        isGroup: true,
        status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] },
        startTime: { gte: new Date() },
      },
      include: {
        therapist: { include: { user: { select: { firstName: true, lastName: true } } } },
        groupBookings: { where: { status: { not: GroupBookingStatus.CANCELLED } } },
      },
      orderBy: { startTime: 'asc' },
    });

    const result = sessions.map((s) => ({
      id: s.id,
      serviceType: s.serviceType,
      startTime: s.startTime,
      endTime: s.endTime,
      duration: s.duration,
      price: s.price,
      capacity: s.capacity,
      spotsRemaining: s.capacity ? s.capacity - s.groupBookings.length : null,
      therapist: s.therapist
        ? {
            id: s.therapist.id,
            name: `${s.therapist.user?.firstName ?? ''} ${s.therapist.user?.lastName ?? ''}`.trim(),
          }
        : null,
    }));

    return res.ok(result);
  } catch (err) {
    console.error('[PUBLIC GROUP SESSIONS GET]', err);
    return res.error();
  }
}

// POST — book a spot in a group session
export async function POST(
  req: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const { businessId } = params;
    const body = await req.json();
    const { appointmentId, clientFirstName, clientLastName, clientEmail, clientPhone } = body;

    if (!appointmentId || !clientFirstName || !clientLastName) {
      return res.badRequest('Missing required fields: appointmentId, clientFirstName, clientLastName');
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true, email: true },
    });
    if (!business) return res.notFound('Business not found');

    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, businessId, isGroup: true },
      include: {
        therapist: { include: { user: { select: { firstName: true, lastName: true } } } },
        groupBookings: { where: { status: { not: GroupBookingStatus.CANCELLED } } },
      },
    });
    if (!appointment) return res.notFound('Group session not found');

    if (appointment.status !== AppointmentStatus.SCHEDULED && appointment.status !== AppointmentStatus.CONFIRMED) {
      return res.badRequest('This session is no longer available for booking');
    }

    if (appointment.capacity && appointment.groupBookings.length >= appointment.capacity) {
      return res.badRequest('Sorry, this session is fully booked');
    }

    // Find or create client
    let client = clientEmail
      ? await prisma.client.findFirst({ where: { businessId, email: clientEmail } })
      : null;

    if (!client && clientPhone) {
      client = await prisma.client.findFirst({ where: { businessId, phoneNumber: clientPhone } });
    }

    if (!client) {
      client = await prisma.client.create({
        data: {
          businessId,
          firstName: clientFirstName,
          lastName: clientLastName,
          email: clientEmail || null,
          phoneNumber: clientPhone || null,
        },
      });
    }

    const existing = await prisma.groupBooking.findUnique({
      where: { appointmentId_clientId: { appointmentId, clientId: client.id } },
    });
    if (existing && existing.status !== GroupBookingStatus.CANCELLED) {
      return res.badRequest('You are already booked in this session');
    }

    const booking = existing
      ? await prisma.groupBooking.update({
          where: { id: existing.id },
          data: { status: GroupBookingStatus.REGISTERED },
        })
      : await prisma.groupBooking.create({
          data: { appointmentId, clientId: client.id, status: GroupBookingStatus.REGISTERED },
        });

    const therapistName = appointment.therapist?.user
      ? `${appointment.therapist.user.firstName ?? ''} ${appointment.therapist.user.lastName ?? ''}`.trim()
      : 'Your therapist';

    const therapistUser = appointment.therapist?.user;

    // Send confirmation
    if (clientEmail) {
      await sendBookingConfirmation({
        businessName: business.name,
        appointment: {
          id: appointment.id,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          duration: appointment.duration,
          serviceType: appointment.serviceType ?? 'Group Session',
        },
        client: { firstName: clientFirstName, lastName: clientLastName, email: clientEmail },
        therapist: {
          firstName: therapistUser?.firstName ?? '',
          lastName: therapistUser?.lastName ?? '',
          email: null,
        },
      }).catch(() => {});
    }

    if (clientPhone) {
      await sendBookingConfirmationSms({
        to: clientPhone,
        businessName: business.name,
        client: { firstName: clientFirstName },
        appointment: {
          startTime: appointment.startTime,
          serviceType: appointment.serviceType ?? 'Group Session',
          duration: appointment.duration,
        },
        therapist: {
          firstName: therapistUser?.firstName ?? '',
          lastName: therapistUser?.lastName ?? '',
        },
      }).catch(() => {});
    }

    return res.created(
      {
        bookingId: booking.id,
        clientId: client.id,
        appointmentId,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        serviceType: appointment.serviceType,
        therapistName,
        businessName: business.name,
      },
      'Group session booked successfully'
    );
  } catch (err) {
    console.error('[PUBLIC GROUP SESSIONS POST]', err);
    return res.error();
  }
}
