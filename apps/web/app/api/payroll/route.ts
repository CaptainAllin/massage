import { withAuth, requirePermission, res, logAudit } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (req, user) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  if (!businessId) return res.badRequest('businessId is required');
  await requirePermission(user, businessId, 'payroll:view');

  const periods = await prisma.payrollPeriod.findMany({
    where: { businessId },
    include: {
      records: {
        include: { therapist: { include: { user: true } } },
      },
    },
    orderBy: { startDate: 'desc' },
  });

  return res.ok({ periods });
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const { businessId, startDate, endDate, notes } = body;
  if (!businessId || !startDate || !endDate) {
    return res.badRequest('businessId, startDate, and endDate are required');
  }
  await requirePermission(user, businessId, 'payroll:manage');

  // Auto-calculate payroll records from completed appointments in the period
  const start = new Date(startDate);
  const end = new Date(endDate);

  const therapists = await prisma.therapist.findMany({
    where: { businessId, isActive: true },
    include: { user: true },
  });

  const period = await prisma.payrollPeriod.create({
    data: { businessId, startDate: start, endDate: end, notes },
  });

  // Generate records for each therapist
  const records = await Promise.all(
    therapists.map(async (therapist) => {
      const appointments = await prisma.appointment.findMany({
        where: {
          businessId,
          therapistId: therapist.id,
          status: 'COMPLETED',
          startTime: { gte: start, lte: end },
        },
      });

      const sessionsCompleted = appointments.length;
      const baseRate = therapist.hourlyRate ?? 0;
      const hoursWorked = appointments.reduce((sum, appt) => {
        return sum + (appt.duration ?? 60) / 60;
      }, 0);

      const revenue = appointments.reduce((sum, appt) => {
        return sum + (appt.price ?? 0);
      }, 0);

      const commissionRate = 0.3; // 30% default commission
      const commissionAmount = revenue * commissionRate;
      const totalAmount = baseRate * hoursWorked + commissionAmount;

      return prisma.payrollRecord.create({
        data: {
          payrollPeriodId: period.id,
          businessId,
          therapistId: therapist.id,
          hoursWorked: Math.round(hoursWorked * 100) / 100,
          sessionsCompleted,
          baseRate,
          commissionRate,
          commissionAmount: Math.round(commissionAmount * 100) / 100,
          totalAmount: Math.round(totalAmount * 100) / 100,
        },
        include: { therapist: { include: { user: true } } },
      });
    })
  );

  const totalAmount = records.reduce((sum: number, r: any) => sum + r.totalAmount, 0);
  const updated = await prisma.payrollPeriod.update({
    where: { id: period.id },
    data: { totalAmount: Math.round(totalAmount * 100) / 100 },
    include: { records: { include: { therapist: { include: { user: true } } } } },
  });

  await logAudit(req, {
    userId: user.id,
    businessId,
    action: 'PAYROLL_PERIOD_CREATED',
    entityType: 'PayrollPeriod',
    entityId: period.id,
    metadata: { startDate, endDate, totalAmount },
  });

  return res.created(updated);
});
