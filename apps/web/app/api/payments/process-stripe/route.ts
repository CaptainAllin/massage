import { withAuth, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

// Stripe payment processing — requires ENABLE_STRIPE=true and Stripe SDK
export const POST = withAuth(async (req, _user) => {
  if (process.env.ENABLE_STRIPE !== 'true') {
    return res.badRequest('Stripe integration is not enabled');
  }

  const body = await req.json();
  const { paymentId, businessId, paymentMethodId } = body;
  if (!paymentId || !businessId) return res.badRequest('paymentId and businessId are required');

  const payment = await prisma.payment.findFirst({ where: { id: paymentId, businessId } });
  if (!payment) return res.notFound('Payment not found');
  if (payment.status !== 'PENDING') return res.badRequest('Payment has already been processed');

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    // Get or create Stripe customer
    let stripeCustomer = await prisma.stripeCustomer.findFirst({
      where: { clientId: payment.clientId, businessId },
    });

    if (!stripeCustomer) {
      const client = await prisma.client.findUnique({ where: { id: payment.clientId } });
      const customer = await stripe.customers.create({
        email: client?.email || undefined,
        name: client ? `${client.firstName} ${client.lastName}` : undefined,
        metadata: { clientId: payment.clientId, businessId },
      });
      stripeCustomer = await prisma.stripeCustomer.create({
        data: { clientId: payment.clientId, businessId, stripeCustomerId: customer.id },
      });
    }

    // Create or retrieve payment intent
    let paymentIntent;
    if (payment.stripePaymentIntentId) {
      paymentIntent = await stripe.paymentIntents.retrieve(payment.stripePaymentIntentId);
    } else {
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(payment.amount * 100),
        currency: payment.currency.toLowerCase(),
        customer: stripeCustomer.stripeCustomerId,
        metadata: { paymentId: payment.id, businessId, clientId: payment.clientId },
      });
      await prisma.payment.update({
        where: { id: payment.id },
        data: { stripePaymentIntentId: paymentIntent.id, status: 'PROCESSING' },
      });
    }

    if (paymentMethodId) {
      paymentIntent = await stripe.paymentIntents.confirm(paymentIntent.id, {
        payment_method: paymentMethodId,
      });
    }

    return res.ok({
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status,
    });
  } catch (err: any) {
    console.error('[Stripe]', err.message);
    await prisma.payment.update({ where: { id: paymentId }, data: { status: 'FAILED' } });
    return res.badRequest(err.message || 'Stripe payment failed');
  }
});
