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

    const periodDuration = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodDuration);
    const previousEndDate = new Date(startDate.getTime() - 1);

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const [totalActiveClients, newClients, previousNewClients, inactiveClients] = await Promise.all([
      prisma.client.count({ where: { businessId } }),
      prisma.client.count({ where: { businessId, createdAt: { gte: startDate, lte: endDate } } }),
      prisma.client.count({ where: { businessId, createdAt: { gte: previousStartDate, lte: previousEndDate } } }),
      prisma.client.count({
        where: {
          businessId,
          appointments: { none: { startTime: { gte: ninetyDaysAgo } } },
          createdAt: { lt: ninetyDaysAgo },
        },
      }),
    ]);

    const clientRetention = await prisma.$queryRaw<Array<{ one_time: number; returning: number; rate: number }>>`
      WITH client_appointments AS (
        SELECT "clientId", COUNT(*) as total_appointments
        FROM "Appointment"
        WHERE "businessId" = ${businessId} AND status = 'COMPLETED'
        GROUP BY "clientId"
      )
      SELECT
        COUNT(CASE WHEN total_appointments = 1 THEN 1 END)::int as one_time,
        COUNT(CASE WHEN total_appointments > 1 THEN 1 END)::int as returning,
        ROUND(COALESCE(
          COUNT(CASE WHEN total_appointments > 1 THEN 1 END)::numeric /
          NULLIF(COUNT(*)::numeric, 0) * 100, 0
        ), 2)::float as rate
      FROM client_appointments
    `;

    const clientLifetimeValue = await prisma.$queryRaw<Array<{ avg_ltv: number }>>`
      SELECT COALESCE(AVG(client_revenue), 0)::float as avg_ltv
      FROM (
        SELECT c.id, COALESCE(SUM(p.amount), 0) as client_revenue
        FROM "Client" c
        LEFT JOIN "Appointment" a ON a."clientId" = c.id AND a.status = 'COMPLETED'
        LEFT JOIN "Payment" p ON p."appointmentId" = a.id AND p.status = 'COMPLETED'
        WHERE c."businessId" = ${businessId} AND c."deletedAt" IS NULL
        GROUP BY c.id
      ) as client_revenues
    `;

    const retention = clientRetention[0] || { one_time: 0, returning: 0, rate: 0 };
    const ltv = clientLifetimeValue[0]?.avg_ltv || 0;
    const churnRate = totalActiveClients > 0 ? (inactiveClients / totalActiveClients) * 100 : 0;
    const newClientsGrowth = previousNewClients > 0
      ? ((newClients - previousNewClients) / previousNewClients) * 100
      : 0;

    return res.ok({
      totalActiveClients,
      newClients,
      returningClientRate: retention.rate,
      clientLifetimeValue: ltv,
      churnRate,
      newClientsGrowth,
      previousPeriodNewClients: previousNewClients,
    });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
