import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { res } from '@/lib/api-auth';
import { AppointmentStatus } from '@prisma/client';
import { generateOccurrenceDates } from '@/app/api/recurring-appointments/route';
import { sendBookingConfirmation } from '@/lib/email';

// POST — create a recurring series booking from the public booking page
export async function POST(
  req: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const { businessId } = params;
    const body = await req.json();

    const {
      therapistId,
      startTime,     // "HH:MM"
      startDate,     // "YYYY-MM-DD"
      duration,
      serviceType,
      frequency,
      daysOfWeek,
      endDate,
      occurrences,
      clientFirstName,
      clientLastName,
      clientEmail,
      clientPhone,
      notes,
    } = body;

    if (!therapistId || !startTime || !startDate || !duration || !frequency || !clientFirstName || !clientLastName) {
      return res.badRequest('Missing required fields');
    }
    if (!endDate && !occurrences) {
      return res.badRequest('Either endDate or occurrences must be provided');
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true, email: true },
    });
    if (!business) return res.notFound('Business not found');

    const therapist = await prisma.therapist.findFirst({
      where: { id: therapistId, businessId, isActive: true },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });
    if (!therapist) return res.notFound('Therapist not found');

    // Find or create client
    let client = clientEmail || clientPhone
      ? await prisma.client.findFirst({
          where: {
            businessId,
            OR: [
              ...(clientEmail ? [{ email: clientEmail }] : []),
              ...(clientPhone ? [{ phoneNumber: clientPhone }] : []),
            ],
          },
        })
      : null;

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

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = endDate ? new Date(endDate) : null;
    const daysOfWeekParsed: number[] | null = Array.isArray(daysOfWeek) ? daysOfWeek : null;

    const occurrenceDates = generateOccurrenceDates(
      frequency,
      1,
      null,
      daysOfWeekParsed,
      null,
      parsedStartDate,
      parsedEndDate,
      occurrences ?? null,
      startTime,
    );

    if (occurrenceDates.length === 0) {
      return res.badRequest('No valid appointment dates could be generated for the given parameters');
    }

    const series = await prisma.$transaction(async (tx) => {
      const created = await tx.recurringAppointmentSeries.create({
        data: {
          businessId,
          clientId: client!.id,
          therapistId,
          frequency,
          interval: 1,
          daysOfWeek: daysOfWeekParsed ?? undefined,
          startTime,
          duration,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          occurrences: occurrences ?? null,
          serviceType: serviceType || null,
          notes: notes || null,
          isActive: true,
        },
      });

      await tx.appointment.createMany({
        data: occurrenceDates.map((startDt) => ({
          businessId,
          clientId: client!.id,
          therapistId,
          startTime: startDt,
          endTime: new Date(startDt.getTime() + duration * 60000),
          duration,
          status: AppointmentStatus.SCHEDULED,
          serviceType: serviceType || null,
          notes: notes || null,
          recurringSeriesId: created.id,
        })),
      });

      return created;
    });

    // Send confirmation for first appointment
    const firstDate = occurrenceDates[0];
    if (client.email || therapist.user.email) {
      sendBookingConfirmation({
        businessName: business.name,
        appointment: {
          id: series.id,
          startTime: firstDate,
          endTime: new Date(firstDate.getTime() + duration * 60000),
          duration,
          serviceType: serviceType || 'Appointment',
        },
        client: { firstName: client.firstName, lastName: client.lastName, email: client.email || null },
        therapist: { firstName: therapist.user.firstName || '', lastName: therapist.user.lastName || '', email: therapist.user.email },
      }).catch((err) => console.error('[RECURRING BOOKING EMAIL]', err));
    }

    return res.created({
      seriesId: series.id,
      appointmentCount: occurrenceDates.length,
      firstAppointment: {
        startTime: firstDate.toISOString(),
        therapist: { firstName: therapist.user.firstName, lastName: therapist.user.lastName },
      },
      allDates: occurrenceDates.map((d) => d.toISOString()),
    }, 'Recurring booking confirmed!');
  } catch (err) {
    console.error('[PUBLIC RECURRING BOOKING POST]', err);
    return res.error();
  }
}
