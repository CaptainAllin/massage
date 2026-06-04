import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { res } from '@/lib/api-auth';

// GET — return available time slots for a therapist on a specific date
// Query: therapistId, date (ISO), duration (minutes), serviceType?, nextAvailable=true
export async function GET(
  req: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const { businessId } = params;
    const { searchParams } = new URL(req.url);

    const therapistId = searchParams.get('therapistId');
    const date = searchParams.get('date');
    const duration = parseInt(searchParams.get('duration') || '60', 10);
    const serviceType = searchParams.get('serviceType') || undefined;
    const nextAvailable = searchParams.get('nextAvailable') === 'true';

    if (!therapistId || !date) return res.badRequest('therapistId and date are required');

    // Verify therapist belongs to this business
    const therapist = await prisma.therapist.findFirst({
      where: { id: therapistId, businessId, isActive: true },
      select: { id: true },
    });
    if (!therapist) return res.notFound('Therapist not found');

    // If nextAvailable is requested, scan up to 60 days ahead to find the first open slot
    if (nextAvailable) {
      const startDate = new Date(date);
      for (let offset = 0; offset < 60; offset++) {
        const checkDate = new Date(startDate);
        checkDate.setDate(checkDate.getDate() + offset);
        const slots = await getSlotsForDate(businessId, therapistId, checkDate, duration, serviceType);
        const first = slots.find((s) => s.available);
        if (first) return res.ok({ nextAvailable: first, date: checkDate.toISOString().substring(0, 10) });
      }
      return res.ok({ nextAvailable: null });
    }

    const targetDate = new Date(date);
    const slots = await getSlotsForDate(businessId, therapistId, targetDate, duration, serviceType);
    return res.ok(slots);
  } catch (err) {
    console.error('[PUBLIC SLOTS]', err);
    return res.error();
  }
}

async function getSlotsForDate(
  businessId: string,
  therapistId: string,
  targetDate: Date,
  duration: number,
  serviceType?: string
): Promise<Array<{ startTime: string; endTime: string; available: boolean }>> {
  const dayOfWeek = targetDate.getDay();

  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Check business closure for this date (including recurring annual closures by month+day)
  const closures = await prisma.businessClosure.findMany({
    where: { businessId },
  });
  const isClosed = closures.some((c) => {
    const cDate = new Date(c.date);
    if (c.isRecurringAnnual) {
      return cDate.getMonth() === targetDate.getMonth() && cDate.getDate() === targetDate.getDate();
    }
    return (
      cDate.getFullYear() === targetDate.getFullYear() &&
      cDate.getMonth() === targetDate.getMonth() &&
      cDate.getDate() === targetDate.getDate()
    );
  });
  if (isClosed) return [];

  // Check business hours for this day
  const businessHours = await prisma.businessHours.findFirst({
    where: { businessId, locationId: null, dayOfWeek },
  });
  if (businessHours?.isClosed) return [];

  const availability = await prisma.therapistAvailability.findFirst({
    where: { therapistId, dayOfWeek, isActive: true },
  });
  if (!availability) return [];

  // Only APPROVED time-off blocks the calendar
  const timeOff = await prisma.therapistTimeOff.findFirst({
    where: {
      therapistId,
      status: 'APPROVED',
      startDate: { lte: endOfDay },
      endDate: { gte: startOfDay },
    },
  });
  if (timeOff) return [];

  const appointments = await prisma.appointment.findMany({
    where: {
      therapistId,
      startTime: { gte: startOfDay, lte: endOfDay },
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
    },
    orderBy: { startTime: 'asc' },
  });

  const availabilityRules = await prisma.availabilityRule.findMany({
    where: {
      businessId,
      OR: [
        { therapistId },
        ...(serviceType ? [{ serviceType }] : []),
      ],
    },
  });

  const ruleWindows = availabilityRules
    .filter((r) => (r.daysOfWeek as number[]).includes(dayOfWeek))
    .map((r) => ({ startTime: r.startTime, endTime: r.endTime }));

  // Effective window: intersection of therapist availability and business hours
  let effectiveStart = availability.startTime;
  let effectiveEnd = availability.endTime;
  if (businessHours && !businessHours.isClosed) {
    if (businessHours.openTime > effectiveStart) effectiveStart = businessHours.openTime;
    if (businessHours.closeTime < effectiveEnd) effectiveEnd = businessHours.closeTime;
  }

  const [startHour, startMinute] = effectiveStart.split(':').map(Number);
  const [endHour, endMinute] = effectiveEnd.split(':').map(Number);

  const slots: Array<{ startTime: string; endTime: string; available: boolean }> = [];
  let current = new Date(targetDate);
  current.setHours(startHour, startMinute, 0, 0);
  const windowEnd = new Date(targetDate);
  windowEnd.setHours(endHour, endMinute, 0, 0);

  const now = new Date();

  while (current < windowEnd) {
    const slotStart = new Date(current);
    const slotEnd = new Date(current.getTime() + duration * 60000);
    if (slotEnd > windowEnd) break;

    if (slotStart <= now) {
      current = new Date(current.getTime() + 30 * 60000);
      continue;
    }

    const slotStartStr = slotStart.toTimeString().substring(0, 5);
    const slotEndStr = slotEnd.toTimeString().substring(0, 5);

    const violatesRules = ruleWindows.length > 0 && !ruleWindows.some(
      (w) => slotStartStr >= w.startTime && slotEndStr <= w.endTime
    );

    const hasConflict = appointments.some(
      (apt) =>
        (slotStart >= apt.startTime && slotStart < apt.endTime) ||
        (slotEnd > apt.startTime && slotEnd <= apt.endTime) ||
        (slotStart <= apt.startTime && slotEnd >= apt.endTime)
    );

    slots.push({
      startTime: slotStart.toISOString(),
      endTime: slotEnd.toISOString(),
      available: !hasConflict && !violatesRules,
    });

    current = new Date(current.getTime() + 30 * 60000);
  }

  return slots;
}
