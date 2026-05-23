import { withAuth, requireBusinessAccess, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const PATCH = withAuth(async (req, user, { params }: { params: { id: string } }) => {
  const reimbursement = await prisma.claimReimbursement.findUnique({ where: { id: params.id } });
  if (!reimbursement) return res.notFound('Reimbursement not found');
  await requireBusinessAccess(user, reimbursement.businessId);

  const body = await req.json();
  const updated = await prisma.claimReimbursement.update({
    where: { id: params.id },
    data: {
      checkNumber: body.checkNumber,
      eobNumber: body.eobNumber,
      paymentDate: body.paymentDate ? new Date(body.paymentDate) : undefined,
      amountBilled: body.amountBilled,
      amountAllowed: body.amountAllowed,
      amountPaid: body.amountPaid,
      patientResponsibility: body.patientResponsibility,
      adjustmentReasons: body.adjustmentReasons,
      status: body.status,
      notes: body.notes,
    },
  });
  return res.ok(updated);
});
