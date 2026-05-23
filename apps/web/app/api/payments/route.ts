import { withAuth, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  if (!businessId) return res.badRequest('businessId is required');

  const where: any = { businessId };
  const clientId = searchParams.get('clientId');
  const status = searchParams.get('status');
  const paymentMethod = searchParams.get('paymentMethod');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (clientId) where.clientId = clientId;
  if (status) {
    const statuses = status.split(',');
    where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
  }
  if (paymentMethod) where.paymentMethod = paymentMethod;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const payments = await prisma.payment.findMany({
    where,
    include: { client: true, invoice: true },
    orderBy: { createdAt: 'desc' },
  });

  return res.ok(payments);
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const { businessId, clientId, amount, currency = 'USD', paymentMethod, ...rest } = body;

  if (!businessId || !clientId || !amount || !paymentMethod) {
    return res.badRequest('businessId, clientId, amount, paymentMethod are required');
  }

  const payment = await prisma.payment.create({
    data: { businessId, clientId, amount, currency, paymentMethod, status: 'PENDING', ...rest },
    include: { client: true, invoice: true },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      businessId,
      action: 'PAYMENT_CREATED',
      entityType: 'Payment',
      entityId: payment.id,
      metadata: { amount, method: paymentMethod },
    },
  });

  return res.created(payment);
});
