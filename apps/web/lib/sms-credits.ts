import { prisma } from './prisma';

// SMS credits included per subscription tier
export const SMS_PLAN_LIMITS: Record<string, number> = {
  FREE: 50,
  STARTER: 200,
  PRO: 1000,
  ENTERPRISE: -1, // unlimited
};

// Approximate Twilio SMS cost per message (USD)
export const SMS_COST_PER_MESSAGE = 0.0079;

export interface SmsCreditStatus {
  creditsIncluded: number;
  creditsUsed: number;
  creditsRemaining: number;
  percentUsed: number;
  isUnlimited: boolean;
  isExhausted: boolean;
  isNearLimit: boolean; // >= 80%
}

export async function getSmsCreditStatus(businessId: string): Promise<SmsCreditStatus> {
  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    select: {
      subscriptionTier: true,
      smsCreditsIncluded: true,
      smsCreditsUsed: true,
      smsBillingCycleStart: true,
    },
  });

  const tier = business.subscriptionTier ?? 'FREE';
  const planLimit = SMS_PLAN_LIMITS[tier] ?? SMS_PLAN_LIMITS.FREE;
  const isUnlimited = planLimit === -1;

  // Auto-reset if billing cycle has rolled over (monthly)
  const now = new Date();
  const cycleStart = business.smsBillingCycleStart;
  if (cycleStart) {
    const cycleAge = (now.getTime() - new Date(cycleStart).getTime()) / (1000 * 60 * 60 * 24);
    if (cycleAge >= 30) {
      await resetSmsCredits(businessId, planLimit);
      return {
        creditsIncluded: planLimit,
        creditsUsed: 0,
        creditsRemaining: isUnlimited ? Infinity : planLimit,
        percentUsed: 0,
        isUnlimited,
        isExhausted: false,
        isNearLimit: false,
      };
    }
  }

  const included = isUnlimited ? -1 : (business.smsCreditsIncluded ?? planLimit);
  const used = business.smsCreditsUsed ?? 0;
  const remaining = isUnlimited ? Infinity : Math.max(0, included - used);
  const percentUsed = isUnlimited ? 0 : included > 0 ? (used / included) * 100 : 100;

  return {
    creditsIncluded: included,
    creditsUsed: used,
    creditsRemaining: remaining,
    percentUsed,
    isUnlimited,
    isExhausted: !isUnlimited && remaining <= 0,
    isNearLimit: !isUnlimited && percentUsed >= 80,
  };
}

export async function consumeSmsCredit(businessId: string, _cost?: number): Promise<void> {
  await prisma.business.update({
    where: { id: businessId },
    data: {
      smsCreditsUsed: { increment: 1 },
      smsBillingCycleStart: undefined, // keep existing
    },
  });
}

export async function initSmsBillingCycle(businessId: string, planLimit: number): Promise<void> {
  await prisma.business.update({
    where: { id: businessId },
    data: {
      smsCreditsIncluded: planLimit,
      smsCreditsUsed: 0,
      smsBillingCycleStart: new Date(),
    },
  });
}

export async function resetSmsCredits(businessId: string, planLimit: number): Promise<void> {
  await prisma.business.update({
    where: { id: businessId },
    data: {
      smsCreditsIncluded: planLimit,
      smsCreditsUsed: 0,
      smsBillingCycleStart: new Date(),
    },
  });
}

// Check credits and optionally enforce hard-stop — returns true if SMS should proceed
export async function canSendSms(businessId: string): Promise<{ allowed: boolean; reason?: string }> {
  const commSettings = await prisma.communicationSettings.findUnique({
    where: { businessId },
    select: { smsHardStop: true, smsEnabled: true },
  });

  if (!commSettings?.smsEnabled) {
    return { allowed: true }; // SMS not configured via our credits, allow through
  }

  const status = await getSmsCreditStatus(businessId);

  if (status.isUnlimited) return { allowed: true };

  if (status.isExhausted && commSettings.smsHardStop) {
    return { allowed: false, reason: 'SMS credits exhausted' };
  }

  return { allowed: true };
}

// Notify business owner when 80% of credits used (called after consuming a credit)
export async function maybeSendOverageWarning(businessId: string): Promise<void> {
  const status = await getSmsCreditStatus(businessId);
  if (!status.isNearLimit || status.isUnlimited) return;

  // Only notify at exactly the 80% threshold (within 1 message of crossing it)
  const threshold = Math.floor(status.creditsIncluded * 0.8);
  if (status.creditsUsed !== threshold) return;

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { name: true, email: true, owner: { select: { email: true } } },
  });

  const ownerEmail = business?.owner?.email ?? business?.email;
  if (!ownerEmail) return;

  // Import email utility dynamically to avoid circular deps
  const { sendEmail } = await import('./email');
  await sendEmail({
    to: ownerEmail,
    subject: `SMS credits at 80% — ${business?.name}`,
    html: `
      <p>Hi there,</p>
      <p>Your practice <strong>${business?.name}</strong> has used ${status.creditsUsed} of ${status.creditsIncluded} SMS credits this billing period (${Math.round(status.percentUsed)}%).</p>
      <p>You have <strong>${status.creditsRemaining} credits remaining</strong>.</p>
      <p>Visit your settings to enable auto-purchase of overage credits or upgrade your plan.</p>
    `,
  });
}
