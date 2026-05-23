import { withAuth, requireBusinessAccess, res, logAudit } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const POST = withAuth(async (req, user, { params }: { params: { id: string } }) => {
  const body = await req.json();
  const { quantity, type = 'ADJUSTMENT', notes, referenceId } = body;
  if (quantity === undefined) return res.badRequest('quantity is required');

  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product) return res.notFound('Product not found');
  await requireBusinessAccess(user, product.businessId);

  const previousStock = product.currentStock;
  const newStock = Math.max(0, previousStock + quantity);

  const [adjustment] = await prisma.$transaction([
    prisma.inventoryAdjustment.create({
      data: {
        productId: params.id,
        businessId: product.businessId,
        type,
        quantity,
        previousStock,
        newStock,
        notes: notes || null,
        referenceId: referenceId || null,
        adjustedById: user.id,
      },
    }),
    prisma.product.update({
      where: { id: params.id },
      data: { currentStock: newStock },
    }),
  ]);

  await logAudit(req, {
    userId: user.id,
    businessId: product.businessId,
    action: 'INVENTORY_ADJUSTED',
    entityType: 'Product',
    entityId: params.id,
    metadata: { type, quantity, previousStock, newStock },
  });

  const isLowStock =
    product.lowStockThreshold !== null && newStock <= (product.lowStockThreshold ?? 5);

  return res.ok({ adjustment, currentStock: newStock, isLowStock });
});
