import { withAuth, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const POST = withAuth(async (req, _user) => {
  if (process.env.ENABLE_STRIPE !== 'true') {
    return res.badRequest('Stripe integration is not enabled');
  }

  const body = await req.json();
  const { businessId, clientId } = body;
  if (!businessId || !clientId) return res.badRequest('businessId and clientId are required');

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    let stripeCustomer = await prisma.stripeCustomer.findFirst({
      where: { clientId, businessId },
    });

    if (!stripeCustomer) {
      const client = await prisma.client.findUnique({ where: { id: clientId } });
      const customer = await stripe.customers.create({
        email: client?.email || undefined,
        name: client ? `${client.firstName} ${client.lastName}` : undefined,
        metadata: { clientId, businessId },
      });
      stripeCustomer = await prisma.stripeCustomer.create({
        data: { clientId, businessId, stripeCustomerId: customer.id },
      });
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomer.stripeCustomerId,
      automatic_payment_methods: { enabled: true },
      metadata: { clientId, businessId },
    });

    return res.ok({
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
      customerId: stripeCustomer.stripeCustomerId,
    });
  } catch (err: any) {
    console.error('[Stripe SetupIntent]', err.message);
    return res.badRequest(err.message || 'Failed to create setup intent');
  }
});
