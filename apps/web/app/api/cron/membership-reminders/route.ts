import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendMembershipRenewalReminder } from '@/lib/email';
import { res } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return res.unauthorized('Invalid cron secret');
  }

  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const memberships = await prisma.membership.findMany({
    where: {
      status: 'ACTIVE',
      nextBillingDate: { gte: now, lte: in7Days },
    },
    include: {
      client: { select: { firstName: true, lastName: true, email: true } },
      business: { select: { name: true } },
    },
  });

  let sent = 0;
  let skipped = 0;

  for (const membership of memberships) {
    if (!membership.client.email) { skipped++; continue; }

    try {
      await sendMembershipRenewalReminder({
        to: membership.client.email,
        businessName: membership.business.name,
        client: { firstName: membership.client.firstName, lastName: membership.client.lastName },
        membership: {
          name: membership.name,
          price: membership.price,
          currency: membership.currency,
          nextBillingDate: membership.nextBillingDate!,
        },
      });
      sent++;
    } catch (err) {
      console.error('[MembershipReminder]', err);
    }
  }

  return res.ok({ processed: memberships.length, sent, skipped });
}
