import { withAuth, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const POST = withAuth(async (req, _user) => {
  if (process.env.ENABLE_STRIPE !== 'true') return res.badRequest('Stripe integration is not enabled');

  const body = await req.json();
  const { businessId, clientId, name, sessionsPerMonth, pricePerMonth, paymentMethodId, ...rest } = body;

  if (!businessId || !clientId || !pricePerMonth) {
    return res.badRequest('businessId, clientId, pricePerMonth are required');
  }

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    let stripeCustomer = await prisma.stripeCustomer.findFirst({ where: { clientId, businessId } });
    if (!stripeCustomer) {
      const client = await prisma.client.findUnique({ where: { id: clientId } });
      const customer = await stripe.customers.create({
        email: client?.email || undefined,
        name: client ? `${client.firstName} ${client.lastName}` : undefined,
        metadata: { clientId, businessId },
        ...(paymentMethodId && { payment_method: paymentMethodId, invoice_settings: { default_payment_method: paymentMethodId } }),
      });
      stripeCustomer = await prisma.stripeCustomer.create({
        data: { clientId, businessId, stripeCustomerId: customer.id },
      });
    }

    // Create Stripe subscription (requires a price ID)
    // For now, create a one-off subscription with inline price
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomer.stripeCustomerId,
      items: [{ price_data: { currency: 'usd', unit_amount: Math.round(pricePerMonth * 100), recurring: { interval: 'month' }, product_data: { name: name || 'Membership' } } }],
      ...(paymentMethodId && { default_payment_method: paymentMethodId }),
      metadata: { clientId, businessId },
    });

    const membership = await prisma.membership.create({
      data: {
        businessId, clientId, name, sessionsPerMonth, pricePerMonth,
        status: 'ACTIVE',
        startDate: new Date(),
        stripeSubscriptionId: subscription.id,
        nextBillingDate: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000) : null,
        ...rest,
      } as any,
      include: { client: true },
    });

    return res.created(membership, 'Membership with Stripe subscription created');
  } catch (err: any) {
    console.error('[Stripe membership]', err.message);
    return res.badRequest(err.message || 'Failed to create Stripe subscription');
  }
});
