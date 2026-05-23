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

    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [therapists, totalSessions] = await Promise.all([
      prisma.therapist.count({ where: { businessId } }),
      prisma.appointment.count({
        where: { businessId, startTime: { gte: startDate, lte: endDate }, status: 'COMPLETED' },
      }),
    ]);

    const avgSessionsPerTherapist = therapists > 0 ? totalSessions / therapists : 0;

    const topPerformer = await prisma.therapist.findFirst({
      where: { businessId },
      include: {
        user: { select: { firstName: true, lastName: true } },
        appointments: {
          where: { startTime: { gte: startDate, lte: endDate }, status: 'COMPLETED' },
          include: { payments: { where: { status: 'COMPLETED' } } },
        },
      },
      orderBy: { appointments: { _count: 'desc' } },
    });

    let topPerformerName = 'N/A';
    let topPerformerRevenue = 0;

    if (topPerformer) {
      topPerformerName = `${topPerformer.user.firstName} ${topPerformer.user.lastName}`;
      topPerformerRevenue = topPerformer.appointments.reduce(
        (sum, apt) => sum + apt.payments.reduce((pSum, p) => pSum + p.amount, 0),
        0,
      );
    }

    const utilizationData = await prisma.$queryRaw<Array<{ utilization: number }>>`
      SELECT
        COALESCE(AVG(CASE WHEN therapist_total > 0 THEN (completed_count::float / therapist_total * 100) ELSE 0 END), 0)::float as utilization
      FROM (
        SELECT t.id,
          COUNT(a.id) FILTER (WHERE a.status = 'COMPLETED') as completed_count,
          COUNT(a.id) as therapist_total
        FROM "Therapist" t
        LEFT JOIN "Appointment" a ON a."therapistId" = t.id
          AND a."startTime" >= ${startDate} AND a."startTime" <= ${endDate}
        WHERE t."businessId" = ${businessId} AND t."deletedAt" IS NULL
        GROUP BY t.id
      ) as therapist_stats
    `;

    const utilization = utilizationData[0]?.utilization || 0;

    return res.ok({
      activeTherapists: therapists,
      averageSessionsPerTherapist: Math.round(avgSessionsPerTherapist * 10) / 10,
      topPerformer: topPerformerName,
      topPerformerRevenue,
      utilizationRate: Math.round(utilization * 10) / 10,
    });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
