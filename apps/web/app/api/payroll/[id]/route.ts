import { withAuth, requireBusinessAccess, res, logAudit } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (_req, user, { params }: { params: { id: string } }) => {
  const period = await prisma.payrollPeriod.findUnique({
    where: { id: params.id },
    include: {
      records: {
        include: { therapist: { include: { user: true } } },
      },
    },
  });
  if (!period) return res.notFound('Payroll period not found');
  await requireBusinessAccess(user, period.businessId);
  return res.ok(period);
});

export const PATCH = withAuth(async (req, user, { params }: { params: { id: string } }) => {
  const period = await prisma.payrollPeriod.findUnique({ where: { id: params.id } });
  if (!period) return res.notFound('Payroll period not found');
  await requireBusinessAccess(user, period.businessId);

  const body = await req.json();
  const { status, notes, paidAt } = body;

  const updated = await prisma.payrollPeriod.update({
    where: { id: params.id },
    data: {
      ...(status && { status }),
      ...(notes !== undefined && { notes }),
      ...(paidAt !== undefined && { paidAt: paidAt ? new Date(paidAt) : null }),
    },
    include: { records: { include: { therapist: { include: { user: true } } } } },
  });

  await logAudit(req, {
    userId: user.id,
    businessId: period.businessId,
    action: 'PAYROLL_PERIOD_UPDATED',
    entityType: 'PayrollPeriod',
    entityId: period.id,
    metadata: { status, paidAt },
  });

  return res.ok(updated);
});

export const DELETE = withAuth(async (_req, user, { params }: { params: { id: string } }) => {
  const period = await prisma.payrollPeriod.findUnique({ where: { id: params.id } });
  if (!period) return res.notFound('Payroll period not found');
  if (period.status === 'PAID') return res.badRequest('Cannot delete a paid payroll period');
  await requireBusinessAccess(user, period.businessId);

  await prisma.payrollPeriod.delete({ where: { id: params.id } });
  return res.ok({ deleted: true });
});
