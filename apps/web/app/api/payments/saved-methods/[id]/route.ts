import { withAuth, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

// DELETE — remove saved payment method
export const DELETE = withAuth(async (req, _user, ctx) => {
  const id = ctx?.params?.id;
  if (!id) return res.badRequest('id is required');

  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  if (!businessId) return res.badRequest('businessId is required');

  const method = await prisma.savedPaymentMethod.findFirst({ where: { id, businessId } });
  if (!method) return res.notFound('Saved payment method not found');

  if (process.env.ENABLE_STRIPE === 'true') {
    try {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      await stripe.paymentMethods.detach(method.stripePaymentMethodId);
    } catch (err: any) {
      console.error('[Stripe detach]', err.message);
    }
  }

  await prisma.savedPaymentMethod.delete({ where: { id } });

  if (method.isDefault) {
    const next = await prisma.savedPaymentMethod.findFirst({
      where: { businessId, clientId: method.clientId },
      orderBy: { createdAt: 'asc' },
    });
    if (next) await prisma.savedPaymentMethod.update({ where: { id: next.id }, data: { isDefault: true } });
  }

  return res.ok({ deleted: true });
});

// PATCH — set as default
export const PATCH = withAuth(async (req, _user, ctx) => {
  const id = ctx?.params?.id;
  if (!id) return res.badRequest('id is required');

  const body = await req.json();
  const { businessId } = body;
  if (!businessId) return res.badRequest('businessId is required');

  const method = await prisma.savedPaymentMethod.findFirst({ where: { id, businessId } });
  if (!method) return res.notFound('Saved payment method not found');

  await prisma.savedPaymentMethod.updateMany({
    where: { businessId, clientId: method.clientId },
    data: { isDefault: false },
  });
  await prisma.savedPaymentMethod.update({ where: { id }, data: { isDefault: true } });

  return res.ok({ updated: true });
});
