import { withAuth, requireBusinessAccess, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const PATCH = withAuth(async (req, user, { params }: { params: { id: string } }) => {
  const period = await prisma.payrollPeriod.findUnique({ where: { id: params.id } });
  if (!period) return res.notFound('Payroll period not found');
  if (period.status === 'PAID') return res.badRequest('Cannot edit a paid payroll period');
  await requireBusinessAccess(user, period.businessId);

  const body = await req.json();
  const { recordId, bonusAmount, deductions, notes, commissionRate } = body;
  if (!recordId) return res.badRequest('recordId is required');

  const record = await prisma.payrollRecord.findUnique({ where: { id: recordId } });
  if (!record || record.payrollPeriodId !== params.id) return res.notFound('Record not found');

  const newCommissionRate = commissionRate ?? record.commissionRate;
  const newCommissionAmount = record.hoursWorked > 0
    ? record.commissionAmount
    : newCommissionRate * record.sessionsCompleted;
  const newBonus = bonusAmount ?? record.bonusAmount;
  const newDeductions = deductions ?? record.deductions;
  const totalAmount = record.baseRate * record.hoursWorked + newCommissionAmount + newBonus - newDeductions;

  const updated = await prisma.payrollRecord.update({
    where: { id: recordId },
    data: {
      commissionRate: newCommissionRate,
      commissionAmount: Math.round(newCommissionAmount * 100) / 100,
      bonusAmount: Math.round(newBonus * 100) / 100,
      deductions: Math.round(newDeductions * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      ...(notes !== undefined && { notes }),
    },
    include: { therapist: { include: { user: true } } },
  });

  // Recalculate period total
  const allRecords = await prisma.payrollRecord.findMany({ where: { payrollPeriodId: params.id } });
  const periodTotal = allRecords.reduce((sum: number, r: any) => sum + r.totalAmount, 0);
  await prisma.payrollPeriod.update({
    where: { id: params.id },
    data: { totalAmount: Math.round(periodTotal * 100) / 100 },
  });

  return res.ok(updated);
});
