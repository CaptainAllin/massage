import { prisma } from '@/lib/prisma';

export type LoyaltySettingsLike = {
  bronzeMinPoints: number;
  silverMinPoints: number;
  goldMinPoints: number;
  platinumMinPoints?: number;
  silverBonusRate?: number;
  goldBonusRate?: number;
  platinumBonusRate?: number;
  birthdayMultiplier?: number;
  pointsPerDollar: number;
  dollarPerPoint: number;
  isActive: boolean;
};

const TIER_RANKS: Record<string, number> = { BRONZE: 0, SILVER: 1, GOLD: 2, PLATINUM: 3 };

export function computeTier(lifetimePoints: number, settings: LoyaltySettingsLike | null): string {
  if (!settings) return 'BRONZE';
  const platinum = settings.platinumMinPoints ?? 5000;
  if (lifetimePoints >= platinum) return 'PLATINUM';
  if (lifetimePoints >= settings.goldMinPoints) return 'GOLD';
  if (lifetimePoints >= settings.silverMinPoints) return 'SILVER';
  return 'BRONZE';
}

export function tierBonusRate(tier: string, settings: LoyaltySettingsLike | null): number {
  if (!settings) return 0;
  switch (tier) {
    case 'SILVER': return settings.silverBonusRate ?? 0.05;
    case 'GOLD': return settings.goldBonusRate ?? 0.10;
    case 'PLATINUM': return settings.platinumBonusRate ?? 0.15;
    default: return 0;
  }
}

export function neverDecreaseTier(currentTier: string, newTier: string): string {
  return (TIER_RANKS[newTier] ?? 0) >= (TIER_RANKS[currentTier] ?? 0) ? newTier : currentTier;
}

// Auto-award loyalty points when a payment is completed.
export async function awardPaymentPoints({
  businessId,
  clientId,
  amount,
  paymentId,
}: {
  businessId: string;
  clientId: string;
  amount: number;
  paymentId: string;
}): Promise<void> {
  try {
    const [settings, client] = await Promise.all([
      prisma.loyaltySettings.findUnique({ where: { businessId } }),
      prisma.client.findUnique({
        where: { id: clientId },
        select: { birthdayMonth: true },
      }),
    ]);

    if (!settings?.isActive) return;

    const basePoints = Math.floor(amount * settings.pointsPerDollar);
    if (basePoints <= 0) return;

    const isBirthdayMonth = client?.birthdayMonth === new Date().getMonth() + 1;
    const multiplier = isBirthdayMonth ? (settings.birthdayMultiplier ?? 2) : 1;
    const earnedPoints = Math.floor(basePoints * multiplier);

    const account = await prisma.loyaltyAccount.upsert({
      where: { businessId_clientId: { businessId, clientId } },
      create: { businessId, clientId, points: 0, lifetimePoints: 0 },
      update: {},
    });

    const bonusRate = tierBonusRate(account.tier, settings);
    const bonusPoints = Math.floor(earnedPoints * bonusRate);
    const totalPoints = earnedPoints + bonusPoints;

    const newPoints = account.points + totalPoints;
    const newLifetime = account.lifetimePoints + totalPoints;
    const rawTier = computeTier(newLifetime, settings);
    const finalTier = neverDecreaseTier(account.tier, rawTier);

    const transactions: Parameters<typeof prisma.loyaltyTransaction.create>[0]['data'][] = [
      {
        loyaltyAccountId: account.id,
        businessId,
        type: 'EARN',
        points: earnedPoints,
        description: isBirthdayMonth
          ? `Payment earned (${settings.birthdayMultiplier ?? 2}× birthday bonus)`
          : 'Payment earned',
        referenceId: paymentId,
        referenceType: 'Payment',
      },
    ];

    if (bonusPoints > 0) {
      transactions.push({
        loyaltyAccountId: account.id,
        businessId,
        type: 'EARN',
        points: bonusPoints,
        description: `${account.tier} tier bonus`,
        referenceId: paymentId,
        referenceType: 'Payment',
      });
    }

    await prisma.$transaction([
      ...transactions.map((t) => prisma.loyaltyTransaction.create({ data: t })),
      prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: { points: newPoints, lifetimePoints: newLifetime, tier: finalTier },
      }),
    ]);
  } catch {
    // Non-critical — don't fail the payment if loyalty award fails
  }
}
