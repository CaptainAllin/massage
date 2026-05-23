import { withAuth, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

// GET /api/payments/saved-methods?businessId=&clientId=
// POST /api/payments/saved-methods — save a method after SetupIntent confirmed
export const GET = withAuth(async (req, _user) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  const clientId = searchParams.get('clientId');

  if (!businessId || !clientId) return res.badRequest('businessId and clientId are required');

  const methods = await prisma.savedPaymentMethod.findMany({
    where: { businessId, clientId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });

  return res.ok(methods);
});

export const POST = withAuth(async (req, _user) => {
  if (process.env.ENABLE_STRIPE !== 'true') {
    return res.badRequest('Stripe integration is not enabled');
  }

  const body = await req.json();
  const { businessId, clientId, stripePaymentMethodId } = body;
  if (!businessId || !clientId || !stripePaymentMethodId) {
    return res.badRequest('businessId, clientId, and stripePaymentMethodId are required');
  }

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const stripeCustomer = await prisma.stripeCustomer.findFirst({
      where: { clientId, businessId },
    });
    if (!stripeCustomer) return res.notFound('Stripe customer not found');

    const pm = await stripe.paymentMethods.retrieve(stripePaymentMethodId);
    const card = pm.card;

    const existingCount = await prisma.savedPaymentMethod.count({
      where: { businessId, clientId },
    });

    const saved = await prisma.savedPaymentMethod.create({
      data: {
        businessId,
        clientId,
        stripePaymentMethodId,
        stripeCustomerId: stripeCustomer.stripeCustomerId,
        brand: card?.brand,
        last4: card?.last4,
        expMonth: card?.exp_month,
        expYear: card?.exp_year,
        isDefault: existingCount === 0,
      },
    });

    return res.created(saved);
  } catch (err: any) {
    console.error('[SavedPaymentMethod]', err.message);
    return res.badRequest(err.message || 'Failed to save payment method');
  }
});
