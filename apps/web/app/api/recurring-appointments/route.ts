import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { AppointmentStatus } from '@prisma/client';
import { NextRequest } from 'next/server';

const seriesInclude = {
  client: true,
  therapist: { include: { user: true } },
  appointments: { orderBy: { startTime: 'asc' as const } },
};

// Generate appointment start times from a recurring series definition
export function generateOccurrenceDates(
  frequency: string,
  interval: number,
  dayOfWeek: number | null,
  daysOfWeek: number[] | null,
  dayOfMonth: number | null,
  startDate: Date,
  endDate: Date | null,
  occurrences: number | null,
  startTimeStr: string,
): Date[] {
  const [h, m] = startTimeStr.split(':').map(Number);
  const MAX_CAP = 104;
  const limit = occurrences ?? MAX_CAP;
  const dates: Date[] = [];

  function setTime(d: Date): Date {
    const copy = new Date(d);
    copy.setHours(h, m, 0, 0);
    return copy;
  }

  function addDays(d: Date, n: number): Date {
    const copy = new Date(d);
    copy.setDate(copy.getDate() + n);
    return copy;
  }

  if (frequency === 'DAILY') {
    let d = setTime(new Date(startDate));
    while (dates.length < limit && (!endDate || d <= endDate)) {
      dates.push(new Date(d));
      d = addDays(d, interval);
    }
    return dates;
  }

  if (frequency === 'WEEKLY' || frequency === 'FORTNIGHTLY') {
    const weekStep = frequency === 'FORTNIGHTLY' ? 2 * interval : interval;
    const targets = daysOfWeek?.length ? daysOfWeek : dayOfWeek !== null && dayOfWeek !== undefined ? [dayOfWeek] : [startDate.getDay()];

    // Start at the beginning of the week containing startDate (Sunday=0)
    let weekAnchor = new Date(startDate);
    weekAnchor.setHours(0, 0, 0, 0);
    // Move back to Sunday of that week
    weekAnchor.setDate(weekAnchor.getDate() - weekAnchor.getDay());

    while (dates.length < limit) {
      for (const dow of targets.sort((a, b) => a - b)) {
        const d = setTime(addDays(weekAnchor, dow));
        if (d >= setTime(new Date(startDate)) && d >= new Date(startDate) && (!endDate || d <= endDate)) {
          dates.push(d);
          if (dates.length >= limit) break;
        }
      }
      weekAnchor = addDays(weekAnchor, 7 * weekStep);
      if (endDate && weekAnchor > endDate) break;
    }
    return dates;
  }

  if (frequency === 'MONTHLY') {
    let d = new Date(startDate);
    d.setHours(h, m, 0, 0);
    if (dayOfMonth) {
      d.setDate(dayOfMonth);
      if (d < new Date(startDate)) d.setMonth(d.getMonth() + interval);
    }
    while (dates.length < limit && (!endDate || d <= endDate)) {
      dates.push(new Date(d));
      d = new Date(d);
      d.setMonth(d.getMonth() + interval);
    }
    return dates;
  }

  return dates;
}

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) return res.badRequest('businessId is required');

    const clientId = searchParams.get('clientId');
    const therapistId = searchParams.get('therapistId');
    const isActiveParam = searchParams.get('isActive');
    const frequency = searchParams.get('frequency');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: any = { businessId };
    if (clientId) where.clientId = clientId;
    if (therapistId) where.therapistId = therapistId;
    if (isActiveParam !== null) where.isActive = isActiveParam === 'true';
    if (frequency) where.frequency = frequency;

    const [series, total] = await Promise.all([
      prisma.recurringAppointmentSeries.findMany({
        where,
        include: seriesInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.recurringAppointmentSeries.count({ where }),
    ]);

    return Response.json({
      success: true,
      data: series,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const {
      businessId,
      clientId,
      therapistId,
      frequency,
      interval = 1,
      dayOfWeek,
      dayOfMonth,
      daysOfWeek,
      startTime,
      duration,
      startDate,
      endDate,
      occurrences,
      serviceType,
      price,
      notes,
    } = body;

    if (!businessId) return res.badRequest('businessId is required');
    if (!clientId) return res.badRequest('clientId is required');
    if (!therapistId) return res.badRequest('therapistId is required');
    if (!frequency) return res.badRequest('frequency is required');
    if (!startTime) return res.badRequest('startTime is required');
    if (!duration) return res.badRequest('duration is required');
    if (!startDate) return res.badRequest('startDate is required');
    if (!endDate && !occurrences) {
      return res.badRequest('Either endDate or occurrences must be provided');
    }

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = endDate ? new Date(endDate) : null;

    // Generate all appointment dates
    const datesOfWeekParsed: number[] | null = Array.isArray(daysOfWeek) ? daysOfWeek : null;
    const occurrenceDates = generateOccurrenceDates(
      frequency,
      interval,
      dayOfWeek ?? null,
      datesOfWeekParsed,
      dayOfMonth ?? null,
      parsedStartDate,
      parsedEndDate,
      occurrences ?? null,
      startTime,
    );

    // Create series + all appointments in a transaction
    const series = await prisma.$transaction(async (tx) => {
      const created = await tx.recurringAppointmentSeries.create({
        data: {
          businessId,
          clientId,
          therapistId,
          frequency,
          interval,
          dayOfWeek: dayOfWeek ?? null,
          dayOfMonth: dayOfMonth ?? null,
          daysOfWeek: datesOfWeekParsed ?? undefined,
          startTime,
          duration,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          occurrences: occurrences ?? null,
          serviceType: serviceType ?? null,
          price: price ?? null,
          notes: notes ?? null,
          isActive: true,
        },
      });

      if (occurrenceDates.length > 0) {
        await tx.appointment.createMany({
          data: occurrenceDates.map((startDt) => ({
            businessId,
            clientId,
            therapistId,
            startTime: startDt,
            endTime: new Date(startDt.getTime() + duration * 60000),
            duration,
            status: AppointmentStatus.SCHEDULED,
            serviceType: serviceType ?? null,
            price: price ?? null,
            notes: notes ?? null,
            recurringSeriesId: created.id,
          })),
        });
      }

      return tx.recurringAppointmentSeries.findUniqueOrThrow({
        where: { id: created.id },
        include: seriesInclude,
      });
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: 'RECURRING_SERIES_CREATED',
        entityType: 'RecurringAppointmentSeries',
        entityId: series.id,
        metadata: { frequency, startDate, endDate, occurrences, appointmentsGenerated: occurrenceDates.length },
      },
    });

    return res.created(series);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
