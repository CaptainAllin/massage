import { withAuth, requireBusinessAccess, res, logAudit } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (_req, user, { params }: { params: { id: string } }) => {
  const claim = await prisma.insuranceClaim.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      insuranceProvider: true,
      appointment: { select: { id: true, startTime: true, serviceType: true, duration: true, price: true } },
      reimbursements: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!claim) return res.notFound('Claim not found');
  await requireBusinessAccess(user, claim.businessId);
  return res.ok(claim);
});

export const PATCH = withAuth(async (req, user, { params }: { params: { id: string } }) => {
  const claim = await prisma.insuranceClaim.findUnique({ where: { id: params.id } });
  if (!claim) return res.notFound('Claim not found');
  await requireBusinessAccess(user, claim.businessId);

  const body = await req.json();

  const updatedClaim = await prisma.insuranceClaim.update({
    where: { id: params.id },
    data: {
      insuranceProviderId: body.insuranceProviderId,
      status: body.status,
      submittedAt: body.status === 'SUBMITTED' && !claim.submittedAt ? new Date() : (body.submittedAt ? new Date(body.submittedAt) : undefined),
      subscriberName: body.subscriberName,
      subscriberDOB: body.subscriberDOB ? new Date(body.subscriberDOB) : undefined,
      subscriberPolicyNumber: body.subscriberPolicyNumber,
      groupNumber: body.groupNumber,
      relationshipToSubscriber: body.relationshipToSubscriber,
      diagnosisCodes: body.diagnosisCodes,
      procedureCodes: body.procedureCodes,
      renderingProviderName: body.renderingProviderName,
      renderingProviderNPI: body.renderingProviderNPI,
      billingProviderName: body.billingProviderName,
      billingProviderNPI: body.billingProviderNPI,
      billingProviderTaxId: body.billingProviderTaxId,
      totalCharge: body.totalCharge,
      claimedAmount: body.claimedAmount,
      submissionMethod: body.submissionMethod,
      notes: body.notes,
    },
    include: {
      client: { select: { id: true, firstName: true, lastName: true, dateOfBirth: true } },
      insuranceProvider: { select: { id: true, name: true, payerId: true } },
      reimbursements: true,
    },
  });

  await logAudit(req, {
    userId: user.id,
    businessId: claim.businessId,
    action: 'INSURANCE_CLAIM_UPDATED',
    entityType: 'InsuranceClaim',
    entityId: params.id,
    metadata: { status: body.status },
  });

  return res.ok(updatedClaim);
});

export const DELETE = withAuth(async (_req, user, { params }: { params: { id: string } }) => {
  const claim = await prisma.insuranceClaim.findUnique({ where: { id: params.id } });
  if (!claim) return res.notFound('Claim not found');
  await requireBusinessAccess(user, claim.businessId);

  if (claim.status !== 'DRAFT') {
    return res.badRequest('Only DRAFT claims can be deleted');
  }

  await prisma.insuranceClaim.delete({ where: { id: params.id } });
  return res.ok({ success: true });
});
