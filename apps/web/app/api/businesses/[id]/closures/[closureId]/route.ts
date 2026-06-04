import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireBusinessRole, res } from '@/lib/api-auth';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; closureId: string } }
) {
  try {
    const user = await requireAuth(req);
    const { id: businessId, closureId } = params;
    await requireBusinessRole(user, businessId, ['OWNER']);

    const closure = await prisma.businessClosure.findFirst({
      where: { id: closureId, businessId },
    });
    if (!closure) return res.notFound('Closure not found');

    await prisma.businessClosure.delete({ where: { id: closureId } });
    return res.ok({ deleted: true });
  } catch (err: any) {
    if (err.name === 'AuthError') return res.unauthorized(err.message);
    console.error('[CLOSURES DELETE]', err);
    return res.error();
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; closureId: string } }
) {
  try {
    const user = await requireAuth(req);
    const { id: businessId, closureId } = params;
    await requireBusinessRole(user, businessId, ['OWNER']);

    const closure = await prisma.businessClosure.findFirst({
      where: { id: closureId, businessId },
    });
    if (!closure) return res.notFound('Closure not found');

    const body = await req.json();
    const { date, reason, notifyClients, isRecurringAnnual } = body;

    const updated = await prisma.businessClosure.update({
      where: { id: closureId },
      data: {
        ...(date !== undefined && { date: new Date(date) }),
        ...(reason !== undefined && { reason }),
        ...(notifyClients !== undefined && { notifyClients }),
        ...(isRecurringAnnual !== undefined && { isRecurringAnnual }),
      },
    });

    return res.ok(updated);
  } catch (err: any) {
    if (err.name === 'AuthError') return res.unauthorized(err.message);
    console.error('[CLOSURES PATCH]', err);
    return res.error();
  }
}
