import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { NextRequest } from 'next/server';
import { generateOccurrenceDates } from '@/lib/recurring-appointments';

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const { frequency, interval = 1, dayOfWeek, dayOfMonth, daysOfWeek, startDate, endDate, occurrences, startTime } = body;

    if (!frequency || !startDate || !startTime) {
      return res.badRequest('frequency, startDate, and startTime are required');
    }
    if (!endDate && !occurrences) {
      return res.badRequest('Either endDate or occurrences must be provided');
    }

    const dates = generateOccurrenceDates(
      frequency,
      interval,
      dayOfWeek ?? null,
      Array.isArray(daysOfWeek) ? daysOfWeek : null,
      dayOfMonth ?? null,
      new Date(startDate),
      endDate ? new Date(endDate) : null,
      occurrences ?? null,
      startTime,
    );

    return res.ok({ dates: dates.map((d) => d.toISOString()), count: dates.length });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    return res.error();
  }
}
