import { NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { res } from '@/lib/api-auth';
import { computeTier, neverDecreaseTier } from '@/lib/loyalty';

// GET /api/client-portal/loyalty — returns the client's loyalty account, transactions, settings, and referral code
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return res.unauthorized();

    const token = authHeader.substring(7);
    const supabase = createServiceClient();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return res.unauthorized('Invalid session');

    const client = await prisma.client.findFirst({
      where: { email: data.user.email },
      select: { id: true, businessId: true, referralCode: true },
    });
    if (!client) return res.notFound('Client not found');

    // Auto-generate referral code if missing
    if (!client.referralCode) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      await prisma.client.update({ where: { id: client.id }, data: { referralCode: code } });
      client.referralCode = code;
    }

    const [account, settings] = await Promise.all([
      prisma.loyaltyAccount.findUnique({
        where: { businessId_clientId: { businessId: client.businessId, clientId: client.id } },
        include: {
          transactions: { orderBy: { createdAt: 'desc' }, take: 100 },
        },
      }),
      prisma.loyaltySettings.findUnique({ where: { businessId: client.businessId } }),
    ]);

    if (!account) {
      return res.ok({
        points: 0,
        lifetimePoints: 0,
        tier: 'BRONZE',
        transactions: [],
        settings,
        referralCode: client.referralCode,
        nextTier: null,
        pointsToNextTier: null,
      });
    }

    const computedTier = computeTier(account.lifetimePoints, settings);
    const tier = neverDecreaseTier(account.tier, computedTier);

    // Sync tier if changed
    if (tier !== account.tier) {
      await prisma.loyaltyAccount.update({ where: { id: account.id }, data: { tier } });
    }

    const { nextTier, pointsToNextTier } = getNextTierInfo(account.lifetimePoints, tier, settings);

    return res.ok({
      points: account.points,
      lifetimePoints: account.lifetimePoints,
      tier,
      transactions: account.transactions,
      settings,
      referralCode: client.referralCode,
      nextTier,
      pointsToNextTier,
    });
  } catch {
    return res.error();
  }
}

function getNextTierInfo(
  lifetimePoints: number,
  currentTier: string,
  settings: any
): { nextTier: string | null; pointsToNextTier: number | null } {
  if (!settings) return { nextTier: null, pointsToNextTier: null };
  if (currentTier === 'PLATINUM') return { nextTier: null, pointsToNextTier: null };

  const thresholds = [
    { tier: 'SILVER', min: settings.silverMinPoints ?? 500 },
    { tier: 'GOLD', min: settings.goldMinPoints ?? 1500 },
    { tier: 'PLATINUM', min: settings.platinumMinPoints ?? 5000 },
  ];

  for (const { tier, min } of thresholds) {
    if (lifetimePoints < min) {
      return { nextTier: tier, pointsToNextTier: min - lifetimePoints };
    }
  }

  return { nextTier: null, pointsToNextTier: null };
}
