import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendAppointmentReminderEmail } from '@/lib/email';
import { sendAppointmentReminderSms } from '@/lib/sms';
import { res } from '@/lib/api-auth';

// Runs every hour. Sends reminders for appointments scheduled within the next 24–25 hours.
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return res.unauthorized('Invalid cron secret');
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  // Find upcoming appointments in the reminder window that haven't been reminded yet
  const appointments = await prisma.appointment.findMany({
    where: {
      startTime: { gte: windowStart, lte: windowEnd },
      status: { in: ['SCHEDULED', 'CONFIRMED'] },
      reminders: { none: { reminderType: '24h', status: { in: ['SENT', 'PENDING'] } } },
    },
    include: {
      client: { select: { firstName: true, lastName: true, email: true, phoneNumber: true } },
      therapist: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
      business: { select: { id: true, name: true } },
    },
  });

  let sent = 0;
  let failed = 0;

  for (const apt of appointments) {
    const reminder = await prisma.appointmentReminder.create({
      data: {
        appointmentId: apt.id,
        businessId: apt.businessId,
        reminderType: '24h',
        scheduledFor: now,
        status: 'PENDING',
      },
    });

    try {
      const therapistFirstName = apt.therapist.user?.firstName ?? '';
      const therapistLastName = apt.therapist.user?.lastName ?? '';

      if (apt.client.email) {
        await sendAppointmentReminderEmail({
          to: apt.client.email,
          businessName: apt.business.name,
          client: { firstName: apt.client.firstName, lastName: apt.client.lastName },
          therapist: { firstName: therapistFirstName, lastName: therapistLastName },
          appointment: {
            startTime: apt.startTime,
            endTime: apt.endTime,
            duration: apt.duration,
            serviceType: apt.serviceType,
          },
        });
      }

      if (apt.client.phoneNumber) {
        await sendAppointmentReminderSms({
          to: apt.client.phoneNumber,
          businessName: apt.business.name,
          client: { firstName: apt.client.firstName },
          therapist: { firstName: therapistFirstName, lastName: therapistLastName },
          appointment: {
            startTime: apt.startTime,
            serviceType: apt.serviceType,
            duration: apt.duration,
          },
        });
      }

      await prisma.appointmentReminder.update({
        where: { id: reminder.id },
        data: { status: 'SENT', sentAt: new Date() },
      });

      sent++;
    } catch (err) {
      console.error('[AppointmentReminder] failed for appointment', apt.id, err);
      await prisma.appointmentReminder.update({
        where: { id: reminder.id },
        data: {
          status: 'FAILED',
          failureReason: err instanceof Error ? err.message : String(err),
        },
      });
      failed++;
    }
  }

  return res.ok({ processed: appointments.length, sent, failed });
}
