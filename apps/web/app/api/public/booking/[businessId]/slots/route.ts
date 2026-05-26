import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { res } from '@/lib/api-auth';

// GET — return available time slots for a therapist on a specific date
// Query: therapistId, date (ISO), duration (minutes)
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

    if (!therapistId || !date) return res.badRequest('therapistId and date are required');

    // Verify therapist belongs to this business
    const therapist = await prisma.therapist.findFirst({
      where: { id: therapistId, businessId, isActive: true },
      select: { id: true },
    });
    if (!therapist) return res.notFound('Therapist not found');

    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    const availability = await prisma.therapistAvailability.findFirst({
      where: { therapistId, dayOfWeek, isActive: true },
    });
    if (!availability) return res.ok([]);

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const timeOff = await prisma.therapistTimeOff.findFirst({
      where: { therapistId, startDate: { lte: endOfDay }, endDate: { gte: startOfDay } },
    });
    if (timeOff) return res.ok([]);

    const appointments = await prisma.appointment.findMany({
      where: {
        therapistId,
        startTime: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
      orderBy: { startTime: 'asc' },
    });

    // Load availability rules for this therapist/service to narrow slots further
    const serviceType = searchParams.get('serviceType') || undefined;
    const availabilityRules = await prisma.availabilityRule.findMany({
      where: {
        businessId,
        OR: [
          { therapistId: therapistId },
          ...(serviceType ? [{ serviceType }] : []),
        ],
      },
    });

    // Build restricted windows from rules that match this day
    const ruleWindows = availabilityRules
      .filter((r) => {
        const days = r.daysOfWeek as number[];
        return days.includes(dayOfWeek);
      })
      .map((r) => ({ startTime: r.startTime, endTime: r.endTime }));

    const slots: Array<{ startTime: string; endTime: string; available: boolean }> = [];
    const [startHour, startMinute] = availability.startTime.split(':').map(Number);
    const [endHour, endMinute] = availability.endTime.split(':').map(Number);

    let current = new Date(targetDate);
    current.setHours(startHour, startMinute, 0, 0);
    const endTime = new Date(targetDate);
    endTime.setHours(endHour, endMinute, 0, 0);

    const now = new Date();

    while (current < endTime) {
      const slotStart = new Date(current);
      const slotEnd = new Date(current.getTime() + duration * 60000);
      if (slotEnd > endTime) break;

      // Skip past slots
      if (slotStart <= now) {
        current = new Date(current.getTime() + 30 * 60000);
        continue;
      }

      const slotStartStr = slotStart.toTimeString().substring(0, 5);
      const slotEndStr = slotEnd.toTimeString().substring(0, 5);

      // If there are availability rules, the slot must fall within at least one rule window
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

    return res.ok(slots);
  } catch (err) {
    console.error('[PUBLIC SLOTS]', err);
    return res.error();
  }
}
