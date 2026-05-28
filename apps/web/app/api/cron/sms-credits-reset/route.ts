import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { res } from '@/lib/api-auth';
import { SMS_PLAN_LIMITS } from '@/lib/sms-credits';

// Runs monthly on the 1st. Resets SMS credits for all businesses whose billing cycle has elapsed.
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) return res.unauthorized('Invalid cron secret');

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Find businesses whose billing cycle has elapsed (or never started)
  const businesses = await prisma.business.findMany({
    where: {
      OR: [
        { smsBillingCycleStart: null },
        { smsBillingCycleStart: { lte: thirtyDaysAgo } },
      ],
    },
    select: { id: true, subscriptionTier: true },
  });

  let reset = 0;
  for (const business of businesses) {
    const tier = business.subscriptionTier ?? 'FREE';
    const planLimit = SMS_PLAN_LIMITS[tier] ?? SMS_PLAN_LIMITS.FREE;
    await prisma.business.update({
      where: { id: business.id },
      data: {
        smsCreditsIncluded: planLimit,
        smsCreditsUsed: 0,
        smsBillingCycleStart: new Date(),
      },
    });
    reset++;
  }

  return res.ok({ message: `Reset SMS credits for ${reset} businesses` });
}
