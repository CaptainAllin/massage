import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { triggerAutomation } from '@/lib/automation';
import { res } from '@/lib/api-auth';

// Runs daily at 6pm local (8am UTC for AEST).
// For each business with an active DAILY_SLACK_SUMMARY rule, aggregates today's
// bookings and revenue and fires the trigger so the rule's SEND_SLACK action runs.
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) return res.unauthorized('Invalid cron secret');

  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);

  const summaryRules = await prisma.automationRule.findMany({
    where: { trigger: 'DAILY_SLACK_SUMMARY', isActive: true },
    select: { id: true, businessId: true },
  });

  if (summaryRules.length === 0) return res.ok({ triggered: 0 });

  const bizIds = [...new Set(summaryRules.map((r) => r.businessId))];
  let triggered = 0;

  for (const businessId of bizIds) {
    const [bookingCount, paymentAgg] = await Promise.all([
      prisma.appointment.count({
        where: { businessId, startTime: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.payment.aggregate({
        where: {
          businessId,
          status: 'COMPLETED',
          paidAt: { gte: todayStart, lte: todayEnd },
        },
        _sum: { amount: true },
      }),
    ]);

    const revenue = paymentAgg._sum.amount ?? 0;
    const date = now.toLocaleDateString('en-AU', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    await triggerAutomation('DAILY_SLACK_SUMMARY', businessId, {
      businessId,
      bookingCount,
      revenue,
      date,
    });
    triggered++;
  }

  return res.ok({ triggered });
}
