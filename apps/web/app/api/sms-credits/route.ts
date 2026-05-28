import { withAuth, res } from '@/lib/api-auth';
import { getSmsCreditStatus, resetSmsCredits, SMS_PLAN_LIMITS } from '@/lib/sms-credits';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  if (!businessId) return res.badRequest('businessId is required');

  const business = await prisma.business.findUnique({ where: { id: businessId }, select: { id: true } });
  if (!business) return res.notFound('Business not found');

  const status = await getSmsCreditStatus(businessId);
  return res.ok(status);
});

export const POST = withAuth(async (req) => {
  const body = await req.json();
  const { businessId, action } = body;
  if (!businessId) return res.badRequest('businessId is required');

  if (action === 'reset') {
    const business = await prisma.business.findUniqueOrThrow({
      where: { id: businessId },
      select: { subscriptionTier: true },
    });
    const tier = business.subscriptionTier ?? 'FREE';
    const planLimit = SMS_PLAN_LIMITS[tier] ?? SMS_PLAN_LIMITS.FREE;
    await resetSmsCredits(businessId, planLimit);
    return res.ok({ message: 'SMS credits reset' });
  }

  return res.badRequest('Unknown action');
});
