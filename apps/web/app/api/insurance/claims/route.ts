import { withAuth, requireBusinessAccess, res, logAudit } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

function generateClaimNumber(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `CLM-${datePart}-${rand}`;
}

export const GET = withAuth(async (req, user) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  const status = searchParams.get('status');
  const clientId = searchParams.get('clientId');
  if (!businessId) return res.badRequest('businessId is required');
  await requireBusinessAccess(user, businessId);

  const claims = await prisma.insuranceClaim.findMany({
    where: {
      businessId,
      ...(status ? { status: status as any } : {}),
      ...(clientId ? { clientId } : {}),
    },
    include: {
      client: { select: { id: true, firstName: true, lastName: true, dateOfBirth: true } },
      insuranceProvider: { select: { id: true, name: true, payerId: true } },
      reimbursements: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.ok({ claims });
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const {
    businessId, clientId, appointmentId, insuranceProviderId,
    subscriberName, subscriberDOB, subscriberPolicyNumber, groupNumber,
    relationshipToSubscriber, diagnosisCodes, procedureCodes,
    renderingProviderName, renderingProviderNPI,
    billingProviderName, billingProviderNPI, billingProviderTaxId,
    totalCharge, claimedAmount, submissionMethod, notes,
  } = body;

  if (!businessId || !clientId || !insuranceProviderId) {
    return res.badRequest('businessId, clientId, and insuranceProviderId are required');
  }
  await requireBusinessAccess(user, businessId);

  let claimNumber = generateClaimNumber();
  // Ensure uniqueness
  let existing = await prisma.insuranceClaim.findUnique({ where: { businessId_claimNumber: { businessId, claimNumber } } });
  while (existing) {
    claimNumber = generateClaimNumber();
    existing = await prisma.insuranceClaim.findUnique({ where: { businessId_claimNumber: { businessId, claimNumber } } });
  }

  const claim = await prisma.insuranceClaim.create({
    data: {
      businessId, clientId, appointmentId: appointmentId || null, insuranceProviderId, claimNumber,
      subscriberName, subscriberDOB: subscriberDOB ? new Date(subscriberDOB) : null,
      subscriberPolicyNumber, groupNumber, relationshipToSubscriber,
      diagnosisCodes: diagnosisCodes ?? [],
      procedureCodes: procedureCodes ?? [],
      renderingProviderName, renderingProviderNPI,
      billingProviderName, billingProviderNPI, billingProviderTaxId,
      totalCharge: totalCharge ?? 0, claimedAmount: claimedAmount ?? 0,
      submissionMethod, notes,
    },
    include: {
      client: { select: { id: true, firstName: true, lastName: true, dateOfBirth: true } },
      insuranceProvider: { select: { id: true, name: true, payerId: true } },
    },
  });

  await logAudit(req, {
    userId: user.id,
    businessId,
    action: 'INSURANCE_CLAIM_CREATED',
    entityType: 'InsuranceClaim',
    entityId: claim.id,
    metadata: { claimNumber, clientId, totalCharge },
  });

  return res.created(claim);
});
