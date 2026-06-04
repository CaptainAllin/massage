import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { res } from '@/lib/api-auth';
import { AppointmentStatus } from '@prisma/client';
import { checkAvailability } from '@/lib/check-availability';
import { sendBookingConfirmation } from '@/lib/email';
import { sendBookingConfirmationSms } from '@/lib/sms';
import { emitAutomation } from '@/lib/automation';

// GET — return business info + active therapists with availability days
export async function GET(
  _req: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const { businessId } = params;

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true, name: true, logo: true, primaryColor: true, secondaryColor: true, bookingMode: true,
        minBookingNoticeHours: true, maxBookingWindowDays: true,
        depositRequired: true, depositAmount: true, depositType: true,
      },
    });

    if (!business) return res.notFound('Business not found');

    const [therapists, locations] = await Promise.all([
      prisma.therapist.findMany({
        where: { businessId, isActive: true },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, profileImageUrl: true } },
          availability: { where: { isActive: true }, select: { dayOfWeek: true, startTime: true, endTime: true } },
          location: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.location.findMany({
        where: { businessId, isActive: true },
        select: { id: true, name: true, address: true, city: true },
        orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
      }),
    ]);

    return res.ok({ business, therapists, locations });
  } catch (err) {
    console.error('[PUBLIC BOOKING GET]', err);
    return res.error();
  }
}

// POST — create a booking (find-or-create client, check availability, create appointment)
export async function POST(
  req: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const { businessId } = params;
    const body = await req.json();

    const {
      therapistId,
      startTime,
      duration,
      serviceType,
      serviceId,
      clientFirstName,
      clientLastName,
      clientEmail,
      clientPhone,
      notes,
      inviteToken,
    } = body;

    if (!therapistId || !startTime || !duration || !clientFirstName || !clientLastName) {
      return res.badRequest('Missing required fields: therapistId, startTime, duration, clientFirstName, clientLastName');
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true, name: true, email: true, bookingMode: true,
        minBookingNoticeHours: true, maxBookingWindowDays: true,
        depositRequired: true, depositAmount: true, depositType: true,
      },
    });
    if (!business) return res.notFound('Business not found');

    // Enforce min booking notice
    const start = new Date(startTime);
    const hoursFromNow = (start.getTime() - Date.now()) / (1000 * 60 * 60);
    const minNotice = business.minBookingNoticeHours ?? 1;
    if (minNotice > 0 && hoursFromNow < minNotice) {
      return res.badRequest(
        `Bookings require at least ${minNotice} hour${minNotice !== 1 ? 's' : ''} advance notice.`
      );
    }

    // Enforce max booking window
    const maxDays = business.maxBookingWindowDays ?? 60;
    const daysFromNow = hoursFromNow / 24;
    if (daysFromNow > maxDays) {
      return res.badRequest(`Bookings can only be made up to ${maxDays} days in advance.`);
    }

    // Access control enforcement
    if (business.bookingMode === 'INVITE_ONLY') {
      if (!inviteToken) return res.forbidden('An invitation is required to book with this business.');
      const invite = await prisma.bookingInvite.findUnique({ where: { token: inviteToken } });
      if (!invite || invite.businessId !== businessId) return res.forbidden('Invalid or expired invitation.');
      if (invite.usedAt) return res.forbidden('This invitation has already been used.');
      if (invite.expiresAt && invite.expiresAt < new Date()) return res.forbidden('This invitation has expired.');
    } else if (business.bookingMode === 'EXISTING_CLIENTS_ONLY') {
      const exists = await prisma.client.findFirst({
        where: {
          businessId,
          OR: [
            ...(clientEmail ? [{ email: clientEmail }] : []),
            ...(clientPhone ? [{ phoneNumber: clientPhone }] : []),
          ],
        },
        select: { id: true },
      });
      if (!exists) return res.forbidden('Online booking is restricted to existing clients. Please contact us to register.');
    }

    const therapist = await prisma.therapist.findFirst({
      where: { id: therapistId, businessId, isActive: true },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });
    if (!therapist) return res.notFound('Therapist not found');

    const end = new Date(start.getTime() + duration * 60000);

    const availability = await checkAvailability(therapistId, start, end);
    if (!availability.available) {
      return res.badRequest(availability.message || 'This time slot is no longer available');
    }

    // Find or create client
    let client = await prisma.client.findFirst({
      where: {
        businessId,
        OR: [
          ...(clientEmail ? [{ email: clientEmail }] : []),
          ...(clientPhone ? [{ phoneNumber: clientPhone }] : []),
        ],
      },
    });

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

    const appointment = await prisma.appointment.create({
      data: {
        businessId,
        clientId: client.id,
        therapistId,
        startTime: start,
        endTime: end,
        duration,
        status: AppointmentStatus.SCHEDULED,
        serviceType: serviceType || null,
        serviceId: serviceId || null,
        notes: notes || null,
      },
      include: {
        client: true,
        therapist: { include: { user: true } },
      },
    });

    // Mark invite as used if invite-only booking
    if (business.bookingMode === 'INVITE_ONLY' && inviteToken) {
      await prisma.bookingInvite.update({
        where: { token: inviteToken },
        data: { usedAt: new Date() },
      });
    }

    // Send confirmation email (non-blocking)
    const clientEmail2 = client.email;
    const therapistEmail = therapist.user.email;
    if (clientEmail2 || therapistEmail) {
      sendBookingConfirmation({
        businessName: business.name,
        appointment: {
          id: appointment.id,
          startTime: start,
          endTime: end,
          duration,
          serviceType: serviceType || 'Massage',
        },
        client: { firstName: client.firstName, lastName: client.lastName, email: clientEmail2 || null },
        therapist: { firstName: therapist.user.firstName || '', lastName: therapist.user.lastName || '', email: therapistEmail },
      }).catch((err) => console.error('[BOOKING EMAIL]', err));
    }

    // Send confirmation SMS to client (non-blocking, no-op if Twilio not configured)
    if (client.phoneNumber) {
      sendBookingConfirmationSms({
        to: client.phoneNumber,
        businessName: business.name,
        client: { firstName: client.firstName },
        appointment: { startTime: start, serviceType: serviceType || 'Massage', duration },
        therapist: { firstName: therapist.user.firstName || '', lastName: therapist.user.lastName || '' },
      }).catch((err) => console.error('[BOOKING SMS]', err));
    }

    const automationPayload = {
      appointmentId: appointment.id, clientId: client.id, therapistId,
      serviceType: serviceType || null, startTime: start.toISOString(), businessId,
    };
    emitAutomation('ONLINE_BOOKING_REQUEST', businessId, automationPayload);

    // Fire CLIENT_FIRST_APPOINTMENT if this is the client's first booking
    const totalAppointments = await prisma.appointment.count({ where: { clientId: client.id, businessId } });
    if (totalAppointments === 1) {
      emitAutomation('CLIENT_FIRST_APPOINTMENT', businessId, automationPayload);
    }

    // 3.4.2 — Auto-attach: look up client's submitted intake form so therapists
    // always have health info on file without clients re-filling it per booking.
    const existingIntakeForm = await prisma.intakeForm.findFirst({
      where: { clientId: client.id, businessId, isSubmitted: true },
      orderBy: { submittedAt: 'desc' },
      select: { id: true },
    });

    return res.created(
      {
        appointmentId: appointment.id,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        intakeFormId: existingIntakeForm?.id ?? null,
        therapist: {
          firstName: therapist.user.firstName,
          lastName: therapist.user.lastName,
        },
        client: {
          firstName: client.firstName,
          lastName: client.lastName,
        },
      },
      'Booking confirmed!'
    );
  } catch (err) {
    console.error('[PUBLIC BOOKING POST]', err);
    return res.error();
  }
}
