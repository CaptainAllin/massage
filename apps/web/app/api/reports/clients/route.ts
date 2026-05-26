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

    if (!startDateParam || !endDateParam) {
      return res.badRequest('startDate and endDate are required');
    }

    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const [newClients, returningClientsData, clientsWithRevenue, inactiveClientsData] = await Promise.all([
      prisma.client.count({
        where: { businessId, createdAt: { gte: startDate, lte: endDate } },
      }),
      prisma.client.findMany({
        where: {
          businessId,
          appointments: { some: { startTime: { gte: startDate, lte: endDate }, status: 'COMPLETED' } },
          createdAt: { lt: startDate },
        },
      }),
      prisma.client.findMany({
        where: { businessId },
        include: {
          payments: { where: { status: 'COMPLETED' } },
          appointments: { where: { status: 'COMPLETED' } },
        },
      }),
      prisma.client.findMany({
        where: {
          businessId,
          isActive: true,
          lastVisitDate: { lt: ninetyDaysAgo },
        },
        orderBy: { lastVisitDate: 'desc' },
        take: 50,
      }),
    ]);

    const clientLifetimeValue = clientsWithRevenue
      .map(client => ({
        clientId: client.id,
        clientName: `${client.firstName} ${client.lastName}`,
        totalSpent:
          client.payments.reduce((sum, p) => sum + p.amount, 0) -
          client.payments.reduce((sum, p) => sum + ((p as any).refundedAmount || 0), 0),
        visitCount: client.appointments.length,
      }))
      .filter(c => c.totalSpent > 0);

    const topClients = [...clientLifetimeValue]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
      .map(c => ({ clientId: c.clientId, clientName: c.clientName, totalSpent: c.totalSpent }));

    const now = new Date();
    const inactiveClients = inactiveClientsData.map(client => ({
      clientId: client.id,
      clientName: `${client.firstName} ${client.lastName}`,
      lastVisit: client.lastVisitDate!,
      daysSinceLastVisit: Math.floor(
        (now.getTime() - client.lastVisitDate!.getTime()) / (1000 * 60 * 60 * 24),
      ),
    }));

    const returningClients = returningClientsData.length;
    const retentionRate =
      newClients + returningClients > 0
        ? Math.round((returningClients / (newClients + returningClients)) * 10000) / 100
        : 0;

    // Monthly new vs returning breakdown
    const allAptsInPeriod = await prisma.appointment.findMany({
      where: {
        businessId,
        status: 'COMPLETED',
        startTime: { gte: startDate, lte: endDate },
      },
      select: { startTime: true, client: { select: { id: true, createdAt: true } } },
    });

    const monthlyMap = new Map<string, { newClients: Set<string>; returningClients: Set<string> }>();
    allAptsInPeriod.forEach(apt => {
      const key = `${apt.startTime.getFullYear()}-${String(apt.startTime.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, { newClients: new Set(), returningClients: new Set() });
      }
      const bucket = monthlyMap.get(key)!;
      const monthStart = new Date(apt.startTime.getFullYear(), apt.startTime.getMonth(), 1);
      if (apt.client.createdAt >= monthStart) {
        bucket.newClients.add(apt.client.id);
      } else {
        bucket.returningClients.add(apt.client.id);
      }
    });

    const monthlyNewVsReturning = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        newClients: data.newClients.size,
        returningClients: data.returningClients.size,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return res.ok({
      newClients,
      returningClients,
      retentionRate,
      monthlyNewVsReturning,
      clientLifetimeValue,
      topClients,
      inactiveClients,
    });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
