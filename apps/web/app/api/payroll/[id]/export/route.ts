import { withAuth, requireBusinessAccess, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const GET = withAuth(async (req, user, { params }: { params: { id: string } }) => {
  const period = await prisma.payrollPeriod.findUnique({
    where: { id: params.id },
    include: {
      records: {
        include: { therapist: { include: { user: true } } },
        orderBy: { therapist: { user: { firstName: 'asc' } } },
      },
      business: true,
    },
  });
  if (!period) return res.notFound('Payroll period not found');
  await requireBusinessAccess(user, period.businessId);

  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') ?? 'csv';

  const startLabel = period.startDate.toISOString().split('T')[0];
  const endLabel = period.endDate.toISOString().split('T')[0];

  if (format === 'csv') {
    const header = 'Therapist,Hours Worked,Sessions,Base Rate,Commission Rate,Commission,Bonus,Deductions,Total\n';
    const rows = period.records.map((r: any) => {
      const name = `${r.therapist.user.firstName} ${r.therapist.user.lastName}`;
      return [
        `"${name}"`,
        r.hoursWorked.toFixed(2),
        r.sessionsCompleted,
        r.baseRate.toFixed(2),
        `${(r.commissionRate * 100).toFixed(0)}%`,
        r.commissionAmount.toFixed(2),
        r.bonusAmount.toFixed(2),
        r.deductions.toFixed(2),
        r.totalAmount.toFixed(2),
      ].join(',');
    });

    const csv = header + rows.join('\n');
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="payroll-${startLabel}-${endLabel}.csv"`,
      },
    });
  }

  // QuickBooks IIF format
  const iif = [
    '!TRNS\tTRNSTYPE\tDATE\tACCNT\tNAME\tCLASS\tAMOUNT\tMEMO',
    '!SPL\tTRNSTYPE\tDATE\tACCNT\tNAME\tCLASS\tAMOUNT\tMEMO',
    '!ENDTRNS',
    ...period.records.flatMap((r: any) => {
      const name = `${r.therapist.user.firstName} ${r.therapist.user.lastName}`;
      const date = period.endDate.toLocaleDateString('en-US');
      return [
        `TRNS\tPAYCHECK\t${date}\tPayroll Expenses\t${name}\t\t-${r.totalAmount.toFixed(2)}\tPayroll ${startLabel} to ${endLabel}`,
        `SPL\tPAYCHECK\t${date}\tChecking\t${name}\t\t${r.totalAmount.toFixed(2)}\t`,
        'ENDTRNS',
      ];
    }),
  ].join('\n');

  return new NextResponse(iif, {
    headers: {
      'Content-Type': 'text/plain',
      'Content-Disposition': `attachment; filename="payroll-${startLabel}-${endLabel}.iif"`,
    },
  });
});
