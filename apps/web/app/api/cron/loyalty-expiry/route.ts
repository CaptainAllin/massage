import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPointsExpiryWarningEmail } from '@/lib/email';
import { res } from '@/lib/api-auth';

// Runs daily — warns clients whose points will expire within 7 days
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return res.unauthorized('Invalid cron secret');
  }

  const now = new Date();
  const warningWindowDays = 7;

  // Find all businesses that have points expiry configured
  const settingsList = await prisma.loyaltySettings.findMany({
    where: { expiryDays: { not: null }, isActive: true },
    select: { businessId: true, expiryDays: true, business: { select: { name: true } } },
  });

  let notified = 0;
  let skipped = 0;

  for (const settings of settingsList) {
    const expiryDays = settings.expiryDays!;
    const warningThreshold = expiryDays - warningWindowDays;
    if (warningThreshold <= 0) continue;

    // Accounts with points > 0 whose last EARN transaction was exactly at the warning threshold
    const cutoffStart = new Date(now);
    cutoffStart.setDate(cutoffStart.getDate() - (warningThreshold + 1));
    const cutoffEnd = new Date(now);
    cutoffEnd.setDate(cutoffEnd.getDate() - warningThreshold);

    const accounts = await prisma.loyaltyAccount.findMany({
      where: {
        businessId: settings.businessId,
        points: { gt: 0 },
        transactions: {
          some: {
            type: 'EARN',
            createdAt: { gte: cutoffStart, lt: cutoffEnd },
          },
        },
      },
      include: {
        client: { select: { email: true, firstName: true, lastName: true } },
        transactions: {
          where: { type: 'EARN' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    for (const account of accounts) {
      const clientEmail = account.client.email;
      if (!clientEmail || account.points <= 0) { skipped++; continue; }

      // Check the actual last earn transaction date
      const lastEarn = account.transactions[0];
      if (!lastEarn) { skipped++; continue; }

      const daysSinceEarn = Math.floor((now.getTime() - lastEarn.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceEarn < warningThreshold || daysSinceEarn >= warningThreshold + 1) { skipped++; continue; }

      const expiryDate = new Date(lastEarn.createdAt);
      expiryDate.setDate(expiryDate.getDate() + expiryDays);

      const clientName = [account.client.firstName, account.client.lastName].filter(Boolean).join(' ');

      try {
        await sendPointsExpiryWarningEmail({
          to: clientEmail,
          clientName,
          businessName: settings.business.name,
          points: account.points,
          expiryDate,
        });
        notified++;
      } catch {
        skipped++;
      }
    }
  }

  return res.ok({ notified, skipped });
}
