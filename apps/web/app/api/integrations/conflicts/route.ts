import { NextRequest } from 'next/server';
import { requireAuth, requireBusinessAccess, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');
    if (!businessId) return res.badRequest('businessId is required');
    await requireBusinessAccess(user, businessId);

    const conflicts = await prisma.accountingSyncLog.findMany({
      where: { businessId, status: 'CONFLICT' },
      include: {
        integration: { select: { provider: true, tenantName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.ok(conflicts);
  } catch (err: any) {
    if (err?.name === 'AuthError') return res.unauthorized(err.message);
    console.error('[conflicts/GET]', err);
    return res.error();
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { businessId, conflictId, winner } = body;
    // winner: 'local' | 'external'

    if (!businessId || !conflictId || !winner) return res.badRequest('businessId, conflictId and winner are required');
    if (!['local', 'external'].includes(winner)) return res.badRequest('winner must be "local" or "external"');
    await requireBusinessAccess(user, businessId);

    const conflict = await prisma.accountingSyncLog.findFirst({
      where: { id: conflictId, businessId, status: 'CONFLICT' },
      include: { integration: true },
    });

    if (!conflict) return res.notFound('Conflict not found');

    if (winner === 'external' && conflict.externalSnapshot) {
      const ext = conflict.externalSnapshot as any;
      const { entityId } = conflict;

      if (conflict.entityType === 'INVOICE') {
        const isPaid = conflict.integration.provider === 'XERO'
          ? ext.Status === 'PAID'
          : ext.Balance === 0 && ext.TotalAmt > 0;

        if (isPaid) {
          await prisma.invoice.update({
            where: { id: entityId },
            data: {
              status: 'PAID',
              paidAt: new Date(),
              amountPaid: conflict.integration.provider === 'XERO' ? ext.AmountPaid : ext.TotalAmt,
              amountDue: 0,
            },
          });
        }
      }
    }

    await prisma.accountingSyncLog.update({
      where: { id: conflictId },
      data: {
        status: 'RESOLVED',
        resolvedBy: user.id,
        resolvedAt: new Date(),
      },
    });

    return res.ok({ resolved: true, winner });
  } catch (err: any) {
    if (err?.name === 'AuthError') return res.unauthorized(err.message);
    console.error('[conflicts/POST]', err);
    return res.error();
  }
}
