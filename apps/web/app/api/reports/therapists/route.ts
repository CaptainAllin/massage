import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) return res.badRequest('businessId is required');

    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const therapistId = searchParams.get('therapistId') || undefined;

    if (!startDateParam || !endDateParam) {
      return res.badRequest('startDate and endDate are required');
    }

    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);

    const therapists = await prisma.therapist.findMany({
      where: {
        businessId,
        isActive: true,
        ...(therapistId && { id: therapistId }),
      },
      include: {
        user: true,
        appointments: {
          where: { startTime: { gte: startDate, lte: endDate } },
          include: { payments: { where: { status: 'COMPLETED' } } },
        },
        availability: true,
      },
    });

    const periodDuration = endDate.getTime() - startDate.getTime();
    const daysDiff = Math.ceil(periodDuration / (1000 * 60 * 60 * 24));

    const therapistData = therapists.map(therapist => {
      const completedSessions = therapist.appointments.filter(apt => apt.status === 'COMPLETED').length;
      const revenue = therapist.appointments.reduce(
        (sum, apt) => sum + apt.payments.reduce((pSum, p) => pSum + p.amount, 0),
        0,
      );

      // Simplified utilization
      const totalAvailableMinutes = (therapist.availability as any[]).reduce((sum, avail) => {
        if (!avail.isActive) return sum;
        const [sh, sm] = avail.startTime.split(':').map(Number);
        const [eh, em] = avail.endTime.split(':').map(Number);
        const minutesPerDay = eh * 60 + em - (sh * 60 + sm);
        const occurrences = Math.floor(daysDiff / 7);
        return sum + minutesPerDay * occurrences;
      }, 0);

      const totalBookedMinutes = therapist.appointments
        .filter(apt => apt.status === 'COMPLETED')
        .reduce((sum, apt) => sum + apt.duration, 0);

      const utilizationRate = totalAvailableMinutes > 0
        ? (totalBookedMinutes / totalAvailableMinutes) * 100
        : 0;

      const uniqueClients = new Set(therapist.appointments.map(apt => apt.clientId));
      const clientsWithMultiple = Array.from(uniqueClients).filter(
        cid => therapist.appointments.filter(apt => apt.clientId === cid).length > 1,
      ).length;
      const rebookingRate = uniqueClients.size > 0 ? (clientsWithMultiple / uniqueClients.size) * 100 : 0;

      return {
        therapistId: therapist.id,
        therapistName: `${therapist.user.firstName || ''} ${therapist.user.lastName || ''}`.trim(),
        sessionsCompleted: completedSessions,
        revenueGenerated: revenue,
        utilizationRate: Math.round(utilizationRate * 100) / 100,
        rebookingRate: Math.round(rebookingRate * 100) / 100,
      };
    });

    return res.ok({ therapists: therapistData });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
