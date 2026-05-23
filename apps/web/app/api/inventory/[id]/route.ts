import { withAuth, requireBusinessAccess, res, logAudit } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (_req, user, { params }: { params: { id: string } }) => {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { adjustments: { orderBy: { createdAt: 'desc' }, take: 50 } },
  });
  if (!product) return res.notFound('Product not found');
  await requireBusinessAccess(user, product.businessId);
  return res.ok(product);
});

export const PATCH = withAuth(async (req, user, { params }: { params: { id: string } }) => {
  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product) return res.notFound('Product not found');
  await requireBusinessAccess(user, product.businessId);

  const body = await req.json();
  const { businessId: _biz, currentStock: _stock, ...updates } = body;

  const updated = await prisma.product.update({ where: { id: params.id }, data: updates });
  return res.ok(updated);
});

export const DELETE = withAuth(async (req, user, { params }: { params: { id: string } }) => {
  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product) return res.notFound('Product not found');
  await requireBusinessAccess(user, product.businessId);

  await prisma.product.update({ where: { id: params.id }, data: { isActive: false } });

  await logAudit(req, {
    userId: user.id,
    businessId: product.businessId,
    action: 'PRODUCT_DEACTIVATED',
    entityType: 'Product',
    entityId: params.id,
    metadata: { name: product.name },
  });

  return res.ok({ success: true });
});
