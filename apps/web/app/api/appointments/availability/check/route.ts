import { withAuth, res } from '@/lib/api-auth';
import { checkAvailability } from '../../route';

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const therapistId = searchParams.get('therapistId');
  const startTime = searchParams.get('startTime');
  const endTime = searchParams.get('endTime');
  const excludeAppointmentId = searchParams.get('excludeAppointmentId') ?? undefined;

  if (!therapistId || !startTime || !endTime) {
    return res.badRequest('therapistId, startTime, and endTime are required');
  }

  const result = await checkAvailability(
    therapistId,
    new Date(startTime),
    new Date(endTime),
    excludeAppointmentId
  );

  return res.ok(result);
});
