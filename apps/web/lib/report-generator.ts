import { prisma } from '@/lib/prisma';
import { ReportType } from '@/lib/email';

export async function generateReportData(
  type: ReportType,
  businessId: string,
  startDate: Date,
  endDate: Date,
  therapistId?: string,
  serviceType?: string,
): Promise<Record<string, any> & { _durationMs?: number }> {
  const t0 = Date.now();
  switch (type) {
    case 'REVENUE': {
      const [revenueAgg, byPaymentMethod] = await Promise.all([
        prisma.payment.aggregate({
          where: {
            businessId,
            status: 'COMPLETED',
            paidAt: { gte: startDate, lte: endDate },
            ...(therapistId && { appointment: { therapistId } }),
          },
          _sum: { amount: true, refundedAmount: true },
        }),
        prisma.payment.groupBy({
          by: ['paymentMethod'],
          where: { businessId, status: 'COMPLETED', paidAt: { gte: startDate, lte: endDate } },
          _sum: { amount: true },
          _count: true,
        }),
      ]);

      const totalRevenue = revenueAgg._sum.amount ?? 0;
      const refundsTotal = revenueAgg._sum.refundedAmount ?? 0;

      const revenueByAppt = await prisma.payment.groupBy({
        by: ['appointmentId'],
        where: {
          businessId,
          status: 'COMPLETED',
          paidAt: { gte: startDate, lte: endDate },
          ...(therapistId && { appointment: { therapistId } }),
        },
        _sum: { amount: true },
      });

      const appointmentIds = revenueByAppt
        .map(r => r.appointmentId)
        .filter((id): id is string => id !== null);

      const appointments = await prisma.appointment.findMany({
        where: { id: { in: appointmentIds } },
        include: { therapist: { include: { user: true } } },
      });

      const therapistMap = new Map<string, { name: string; revenue: number; count: number }>();
      appointments.forEach(apt => {
        const revenue = revenueByAppt.find(r => r.appointmentId === apt.id)?._sum.amount ?? 0;
        const name = `${apt.therapist.user.firstName ?? ''} ${apt.therapist.user.lastName ?? ''}`.trim();
        const existing = therapistMap.get(apt.therapistId);
        if (existing) { existing.revenue += revenue; existing.count += 1; }
        else therapistMap.set(apt.therapistId, { name, revenue, count: 1 });
      });

      return {
        totalRevenue,
        refundsTotal,
        tipsTotal: 0,
        byTherapist: Array.from(therapistMap.entries()).map(([tid, d]) => ({
          therapistId: tid,
          therapistName: d.name,
          revenue: d.revenue,
          appointmentCount: d.count,
        })),
        byPaymentMethod: byPaymentMethod.map(pm => ({
          paymentMethod: pm.paymentMethod,
          amount: pm._sum.amount ?? 0,
          count: pm._count,
        })),
        _durationMs: Date.now() - t0,
      };
    }

    case 'CLIENTS': {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const [newClients, returningClientsData, clientsWithRevenue, inactiveClientsData] = await Promise.all([
        prisma.client.count({ where: { businessId, createdAt: { gte: startDate, lte: endDate } } }),
        prisma.client.findMany({
          where: {
            businessId,
            appointments: { some: { startTime: { gte: startDate, lte: endDate }, status: 'COMPLETED' } },
            createdAt: { lt: startDate },
          },
        }),
        prisma.client.findMany({
          where: { businessId },
          include: { payments: { where: { status: 'COMPLETED' } } },
        }),
        prisma.client.findMany({
          where: { businessId, isActive: true, lastVisitDate: { lt: ninetyDaysAgo } },
          orderBy: { lastVisitDate: 'desc' },
          take: 10,
        }),
      ]);

      const clientLifetimeValue = clientsWithRevenue
        .map(c => ({
          clientId: c.id,
          clientName: `${c.firstName} ${c.lastName}`,
          totalSpent: c.payments.reduce((s, p) => s + p.amount, 0),
        }))
        .filter(c => c.totalSpent > 0);

      const topClients = [...clientLifetimeValue].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10);

      const now = new Date();
      const inactiveClients = inactiveClientsData.map(c => ({
        clientId: c.id,
        clientName: `${c.firstName} ${c.lastName}`,
        lastVisit: c.lastVisitDate,
        daysSinceLastVisit: Math.floor((now.getTime() - c.lastVisitDate!.getTime()) / (1000 * 60 * 60 * 24)),
      }));

      return { newClients, returningClients: returningClientsData.length, topClients, inactiveClients, _durationMs: Date.now() - t0 };
    }

    case 'THERAPISTS': {
      const therapists = await prisma.therapist.findMany({
        where: { businessId, isActive: true, ...(therapistId && { id: therapistId }) },
        include: {
          user: true,
          appointments: {
            where: { startTime: { gte: startDate, lte: endDate } },
            include: { payments: { where: { status: 'COMPLETED' } } },
          },
          availability: true,
        },
      });

      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        therapists: therapists.map(t => {
          const completed = t.appointments.filter(a => a.status === 'COMPLETED');
          const revenue = completed.reduce((s, a) => s + a.payments.reduce((ps, p) => ps + p.amount, 0), 0);
          const totalAvailMin = (t.availability as any[]).reduce((s, av) => {
            if (!av.isActive) return s;
            const [sh, sm] = av.startTime.split(':').map(Number);
            const [eh, em] = av.endTime.split(':').map(Number);
            return s + (eh * 60 + em - (sh * 60 + sm)) * Math.floor(daysDiff / 7);
          }, 0);
          const bookedMin = completed.reduce((s, a) => s + a.duration, 0);
          const uniqueClients = new Set(t.appointments.map(a => a.clientId));
          const rebookedClients = Array.from(uniqueClients).filter(
            cid => t.appointments.filter(a => a.clientId === cid).length > 1,
          ).length;
          return {
            therapistId: t.id,
            therapistName: `${t.user.firstName ?? ''} ${t.user.lastName ?? ''}`.trim(),
            sessionsCompleted: completed.length,
            revenueGenerated: revenue,
            utilizationRate: totalAvailMin > 0 ? Math.round((bookedMin / totalAvailMin) * 10000) / 100 : 0,
            rebookingRate: uniqueClients.size > 0 ? Math.round((rebookedClients / uniqueClients.size) * 10000) / 100 : 0,
          };
        }),
        _durationMs: Date.now() - t0,
      };
    }

    case 'APPOINTMENTS': {
      const baseWhere: any = {
        businessId,
        startTime: { gte: startDate, lte: endDate },
        ...(therapistId && { therapistId }),
        ...(serviceType && { serviceType }),
      };

      const [total, byStatusData, byServiceTypeData, appts, avgDuration] = await Promise.all([
        prisma.appointment.count({ where: baseWhere }),
        prisma.appointment.groupBy({ by: ['status'], where: baseWhere, _count: true }),
        prisma.appointment.groupBy({ by: ['serviceType'], where: { ...baseWhere, serviceType: { not: null } }, _count: true }),
        prisma.appointment.findMany({ where: baseWhere, select: { startTime: true } }),
        prisma.appointment.aggregate({ where: baseWhere, _avg: { duration: true } }),
      ]);

      const peakMap = new Map<string, number>();
      appts.forEach(a => {
        const key = `${a.startTime.getDay()}-${a.startTime.getHours()}`;
        peakMap.set(key, (peakMap.get(key) ?? 0) + 1);
      });

      return {
        totalAppointments: total,
        averageDuration: avgDuration._avg.duration ?? 0,
        byStatus: byStatusData.map(s => ({
          status: s.status,
          count: s._count,
          percentage: total > 0 ? Math.round((s._count / total) * 10000) / 100 : 0,
        })),
        byServiceType: byServiceTypeData.map(s => ({ serviceType: s.serviceType ?? 'Unknown', count: s._count })),
        peakTimes: Array.from(peakMap.entries())
          .map(([k, count]) => { const [d, h] = k.split('-').map(Number); return { dayOfWeek: d, hour: h, count }; })
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
        _durationMs: Date.now() - t0,
      };
    }

    case 'FINANCIAL_SUMMARY': {
      const [revenueResult, paymentMethodData] = await Promise.all([
        prisma.payment.aggregate({
          where: { businessId, status: 'COMPLETED', paidAt: { gte: startDate, lte: endDate } },
          _sum: { amount: true, refundedAmount: true, stripeFee: true },
        }),
        prisma.payment.groupBy({
          by: ['paymentMethod'],
          where: { businessId, status: 'COMPLETED', paidAt: { gte: startDate, lte: endDate } },
          _sum: { amount: true },
        }),
      ]);

      const grossRevenue = revenueResult._sum.amount ?? 0;
      const refunds = revenueResult._sum.refundedAmount ?? 0;
      const stripeFees = (revenueResult._sum as any).stripeFee ?? 0;

      return {
        grossRevenue,
        netRevenue: grossRevenue - refunds - stripeFees,
        taxesCollected: 0,
        refunds,
        chargebacks: 0,
        paymentMethodBreakdown: paymentMethodData.map(pm => ({
          method: pm.paymentMethod,
          amount: pm._sum.amount ?? 0,
          percentage: grossRevenue > 0 ? Math.round(((pm._sum.amount ?? 0) / grossRevenue) * 10000) / 100 : 0,
        })),
        _durationMs: Date.now() - t0,
      };
    }

    default:
      return { _durationMs: Date.now() - t0 };
  }
}

// Thin wrapper used by the trigger route to log query timing.
export async function generateReportDataWithTiming(
  ...args: Parameters<typeof generateReportData>
): ReturnType<typeof generateReportData> {
  const result = await generateReportData(...args);
  const ms = result._durationMs ?? 0;
  if (ms > 2000) {
    console.warn(`[report-generator] SLOW query: ${args[0]} took ${ms}ms (target <2000ms)`);
  } else {
    console.log(`[report-generator] ${args[0]} completed in ${ms}ms`);
  }
  const { _durationMs: _, ...data } = result;
  return data;
}
