import { prisma } from '@/lib/prisma';
import { AppointmentStatus } from '@prisma/client';

export async function checkAvailability(
  therapistId: string,
  startTime: Date,
  endTime: Date,
  excludeAppointmentId?: string,
  serviceType?: string
) {
  const dayOfWeek = startTime.getDay();
  const timeString = startTime.toTimeString().substring(0, 5);
  const endTimeString = endTime.toTimeString().substring(0, 5);

  const availability = await prisma.therapistAvailability.findFirst({
    where: { therapistId, dayOfWeek, isActive: true },
  });

  if (!availability) {
    return { available: false, reason: 'NO_AVAILABILITY', message: 'Therapist has no availability set for this day' };
  }

  if (timeString < availability.startTime || endTimeString > availability.endTime) {
    return {
      available: false,
      reason: 'OUTSIDE_HOURS',
      message: `Therapist works ${availability.startTime} - ${availability.endTime} on this day`,
    };
  }

  const timeOff = await prisma.therapistTimeOff.findFirst({
    where: {
      therapistId,
      OR: [
        { AND: [{ startDate: { lte: startTime } }, { endDate: { gte: startTime } }] },
        { AND: [{ startDate: { lte: endTime } }, { endDate: { gte: endTime } }] },
        { AND: [{ startDate: { gte: startTime } }, { endDate: { lte: endTime } }] },
      ],
    },
  });

  if (timeOff) {
    return { available: false, reason: 'TIME_OFF', message: 'Therapist is on time off during this period' };
  }

  // Check availability rules — if any rules exist for this therapist/service, slot must be within a rule window
  const ruleFilter: any[] = [{ therapistId }];
  if (serviceType) ruleFilter.push({ serviceType });

  const rules = await prisma.availabilityRule.findMany({
    where: { OR: ruleFilter },
  });

  if (rules.length > 0) {
    const slotStartStr = timeString;
    const slotEndStr = endTimeString;
    const matchesRule = rules.some((r) => {
      const days = r.daysOfWeek as number[];
      return (
        days.includes(dayOfWeek) &&
        slotStartStr >= r.startTime &&
        slotEndStr <= r.endTime
      );
    });
    if (!matchesRule) {
      return {
        available: false,
        reason: 'RULE_VIOLATION',
        message: 'This time slot is outside the configured availability rules',
      };
    }
  }

  const conflictWhere: any = {
    therapistId,
    status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] },
    OR: [
      { AND: [{ startTime: { lte: startTime } }, { endTime: { gt: startTime } }] },
      { AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }] },
      { AND: [{ startTime: { gte: startTime } }, { endTime: { lte: endTime } }] },
    ],
  };
  if (excludeAppointmentId) conflictWhere.id = { not: excludeAppointmentId };

  const conflicts = await prisma.appointment.findMany({
    where: conflictWhere,
    include: { client: true },
  });

  if (conflicts.length > 0) {
    return {
      available: false,
      reason: 'CONFLICT',
      conflicts,
      message: `Therapist has ${conflicts.length} conflicting appointment(s)`,
    };
  }

  return { available: true };
}
