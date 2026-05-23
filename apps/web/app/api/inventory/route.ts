import { withAuth, requireBusinessAccess, res, logAudit } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (req, user) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  if (!businessId) return res.badRequest('businessId is required');
  await requireBusinessAccess(user, businessId);

  const where: any = { businessId };
  const isActive = searchParams.get('isActive');
  const category = searchParams.get('category');
  if (isActive !== null) where.isActive = isActive === 'true';
  if (category) where.category = category;
  // lowStock filter applied post-query (threshold varies per product)

  const products = await prisma.product.findMany({
    where,
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });

  const lowStockItems = products.filter(
    (p) => p.lowStockThreshold !== null && p.currentStock <= (p.lowStockThreshold ?? 5)
  );

  return res.ok({ products, lowStockCount: lowStockItems.length });
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const { businessId, name, unitPrice, ...rest } = body;
  if (!businessId || !name || unitPrice === undefined) {
    return res.badRequest('businessId, name, and unitPrice are required');
  }
  await requireBusinessAccess(user, businessId);

  const product = await prisma.product.create({ data: { businessId, name, unitPrice, ...rest } });

  await logAudit(req, {
    userId: user.id,
    businessId,
    action: 'PRODUCT_CREATED',
    entityType: 'Product',
    entityId: product.id,
    metadata: { name, unitPrice },
  });

  return res.created(product);
});
