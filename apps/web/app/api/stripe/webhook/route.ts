import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPaymentConfirmationSms } from '@/lib/sms';
import { emitAutomation } from '@/lib/automation';

// Public route — Stripe verifies via signature, no user auth needed
export async function POST(req: NextRequest) {
  if (process.env.ENABLE_STRIPE !== 'true') {
    return Response.json({ received: false }, { status: 400 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return Response.json({ received: false }, { status: 400 });
  }

  const body = await req.text();
  let event: any;

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error('[Stripe webhook] Signature verification failed:', err.message);
    return Response.json({ received: false }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;
    }
  } catch (err: any) {
    console.error('[Stripe webhook] Handler error:', err.message);
    // Return 200 to prevent Stripe from retrying on app errors
  }

  return Response.json({ received: true });
}

async function updateInvoicePaymentStatus(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true },
  });
  if (!invoice) return;

  const totalPaid = invoice.payments
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalRefunded = invoice.payments.reduce((sum, p) => sum + ((p as any).refundedAmount || 0), 0);
  const amountPaid = totalPaid - totalRefunded;
  const amountDue = invoice.total - amountPaid;

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      amountPaid,
      amountDue,
      status: amountDue <= 0 ? 'PAID' : amountPaid > 0 ? 'PARTIALLY_PAID' : invoice.status,
      paidAt: amountDue <= 0 ? new Date() : null,
    } as any,
  });
}

async function handlePaymentIntentSucceeded(paymentIntent: any) {
  const payment = await prisma.payment.findFirst({
    where: { stripePaymentIntentId: paymentIntent.id } as any,
    include: {
      client: { select: { firstName: true, phoneNumber: true } },
      business: { select: { name: true } },
      invoice: { select: { invoiceNumber: true } },
    } as any,
  });
  if (!payment) return;

  const charge = paymentIntent.charges?.data?.[0];
  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: 'COMPLETED', stripeChargeId: charge?.id, paidAt: new Date() } as any,
  });

  if (payment.invoiceId) await updateInvoicePaymentStatus(payment.invoiceId);

  const client = (payment as any).client;
  const business = (payment as any).business;
  const invoice = (payment as any).invoice;
  if (client?.phoneNumber && business?.name) {
    try {
      await sendPaymentConfirmationSms({
        to: client.phoneNumber,
        channel: 'SMS',
        businessName: business.name,
        client: { firstName: client.firstName },
        payment: { amount: payment.amount, invoiceNumber: invoice?.invoiceNumber },
      });
    } catch (err: any) {
      console.error('[PaymentConfirmationSms]', err.message);
    }
  }
}

async function handlePaymentIntentFailed(paymentIntent: any) {
  const payment = await prisma.payment.findFirst({
    where: { stripePaymentIntentId: paymentIntent.id } as any,
  });
  if (!payment) return;
  await prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } });
  emitAutomation('PAYMENT_FAILED', payment.businessId, {
    clientId: payment.clientId ?? undefined,
    invoiceId: payment.invoiceId ?? undefined,
    amount: payment.amount,
    businessId: payment.businessId,
  });
}

async function handleInvoicePaymentSucceeded(stripeInvoice: any) {
  if (!stripeInvoice.subscription) return;
  const membership = await prisma.membership.findFirst({
    where: { stripeSubscriptionId: stripeInvoice.subscription } as any,
  });
  if (!membership) return;
  await prisma.membership.update({
    where: { id: membership.id },
    data: {
      status: 'ACTIVE',
      nextBillingDate: stripeInvoice.period_end ? new Date(stripeInvoice.period_end * 1000) : undefined,
    } as any,
  });
  emitAutomation('MEMBERSHIP_RENEWED', membership.businessId, {
    membershipId: membership.id,
    clientId: membership.clientId,
    businessId: membership.businessId,
  });
}

async function handleSubscriptionUpdated(subscription: any) {
  const membership = await prisma.membership.findFirst({
    where: { stripeSubscriptionId: subscription.id } as any,
  });
  if (!membership) return;

  let status = membership.status as string;
  if (subscription.status === 'active') status = 'ACTIVE';
  else if (subscription.status === 'canceled') status = 'CANCELLED';
  else if (subscription.pause_collection) status = 'PAUSED';

  await prisma.membership.update({
    where: { id: membership.id },
    data: {
      status,
      nextBillingDate: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : undefined,
    } as any,
  });
}

async function handleSubscriptionDeleted(subscription: any) {
  const membership = await prisma.membership.findFirst({
    where: { stripeSubscriptionId: subscription.id } as any,
  });
  if (!membership) return;
  await prisma.membership.update({
    where: { id: membership.id },
    data: { status: 'CANCELLED', cancelledAt: new Date() } as any,
  });
}

async function handleChargeRefunded(charge: any) {
  const payment = await prisma.payment.findFirst({
    where: { stripeChargeId: charge.id } as any,
  });
  if (!payment) return;

  const refundedAmount = charge.amount_refunded / 100;
  const isFullRefund = refundedAmount >= payment.amount;

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
      refundedAmount,
      refundedAt: new Date(),
    } as any,
  });

  if (payment.invoiceId) await updateInvoicePaymentStatus(payment.invoiceId);
}
