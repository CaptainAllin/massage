import { withAuth, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const therapistId = searchParams.get('therapistId');
  const date = searchParams.get('date');
  const duration = parseInt(searchParams.get('duration') || '60', 10);

  if (!therapistId || !date) return res.badRequest('therapistId and date are required');

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

  const slots: Array<{ startTime: Date; endTime: Date; available: boolean }> = [];
  const [startHour, startMinute] = availability.startTime.split(':').map(Number);
  const [endHour, endMinute] = availability.endTime.split(':').map(Number);

  let current = new Date(targetDate);
  current.setHours(startHour, startMinute, 0, 0);
  const endTime = new Date(targetDate);
  endTime.setHours(endHour, endMinute, 0, 0);

  while (current < endTime) {
    const slotStart = new Date(current);
    const slotEnd = new Date(current.getTime() + duration * 60000);
    if (slotEnd > endTime) break;

    const hasConflict = appointments.some(
      (apt) =>
        (slotStart >= apt.startTime && slotStart < apt.endTime) ||
        (slotEnd > apt.startTime && slotEnd <= apt.endTime) ||
        (slotStart <= apt.startTime && slotEnd >= apt.endTime)
    );

    slots.push({ startTime: slotStart, endTime: slotEnd, available: !hasConflict });
    current = new Date(current.getTime() + 30 * 60000);
  }

  return res.ok(slots);
});
