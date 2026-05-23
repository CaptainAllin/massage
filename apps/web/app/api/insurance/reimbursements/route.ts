import { withAuth, requireBusinessAccess, res, logAudit } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (req, user) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  const claimId = searchParams.get('claimId');
  if (!businessId) return res.badRequest('businessId is required');
  await requireBusinessAccess(user, businessId);

  const reimbursements = await prisma.claimReimbursement.findMany({
    where: {
      businessId,
      ...(claimId ? { claimId } : {}),
    },
    include: {
      claim: {
        select: {
          id: true, claimNumber: true, status: true,
          client: { select: { id: true, firstName: true, lastName: true } },
          insuranceProvider: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.ok({ reimbursements });
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const {
    businessId, claimId, checkNumber, eobNumber, paymentDate,
    amountBilled, amountAllowed, amountPaid, patientResponsibility,
    adjustmentReasons, notes,
  } = body;

  if (!businessId || !claimId) return res.badRequest('businessId and claimId are required');
  await requireBusinessAccess(user, businessId);

  const claim = await prisma.insuranceClaim.findUnique({ where: { id: claimId } });
  if (!claim) return res.notFound('Claim not found');
  if (claim.businessId !== businessId) return res.forbidden();

  const reimbursement = await prisma.claimReimbursement.create({
    data: {
      businessId, claimId,
      checkNumber, eobNumber,
      paymentDate: paymentDate ? new Date(paymentDate) : null,
      amountBilled: amountBilled ?? 0,
      amountAllowed: amountAllowed ?? 0,
      amountPaid: amountPaid ?? 0,
      patientResponsibility: patientResponsibility ?? 0,
      adjustmentReasons: adjustmentReasons ?? [],
      notes,
    },
    include: {
      claim: { select: { claimNumber: true, status: true } },
    },
  });

  // If fully paid, auto-update claim status to PAID
  if (amountPaid > 0) {
    await prisma.insuranceClaim.update({
      where: { id: claimId },
      data: { status: 'PAID' },
    });
  }

  await logAudit(req, {
    userId: user.id,
    businessId,
    action: 'CLAIM_REIMBURSEMENT_RECORDED',
    entityType: 'ClaimReimbursement',
    entityId: reimbursement.id,
    metadata: { claimId, amountPaid },
  });

  return res.created(reimbursement);
});
