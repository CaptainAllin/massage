import { withAuth, requireBusinessAccess, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

// Returns the structured CMS-1500 form data for a claim
export const GET = withAuth(async (_req, user, { params }: { params: { id: string } }) => {
  const claim = await prisma.insuranceClaim.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      insuranceProvider: true,
      appointment: { select: { id: true, startTime: true, serviceType: true, duration: true, price: true } },
      business: true,
    },
  });
  if (!claim) return res.notFound('Claim not found');
  await requireBusinessAccess(user, claim.businessId);

  const client = claim.client;
  const provider = claim.insuranceProvider;
  const business = claim.business;

  const cms1500 = {
    // Box 1 — Insurance type (hardcoded as OTHER for wellness/massage)
    insuranceType: 'OTHER',

    // Box 1a — Insured ID Number
    insuredIdNumber: claim.subscriberPolicyNumber ?? '',

    // Box 2 — Patient name
    patientName: {
      lastName: client.lastName,
      firstName: client.firstName,
    },

    // Box 3 — Patient DOB and sex
    patientDOB: client.dateOfBirth ? client.dateOfBirth.toISOString().split('T')[0] : '',
    patientSex: '',

    // Box 4 — Insured name
    insuredName: claim.subscriberName ?? `${client.firstName} ${client.lastName}`,

    // Box 5 — Patient address
    patientAddress: {
      street: client.address ?? '',
      city: client.city ?? '',
      state: client.state ?? '',
      zip: client.postalCode ?? '',
      phone: client.phoneNumber ?? '',
    },

    // Box 6 — Patient relationship to insured
    patientRelationship: claim.relationshipToSubscriber ?? 'SELF',

    // Box 7 — Insured address (same as patient if self)
    insuredAddress: {
      street: client.address ?? '',
      city: client.city ?? '',
      state: client.state ?? '',
      zip: client.postalCode ?? '',
    },

    // Box 9 — Other insured name (left blank)
    otherInsuredName: '',

    // Box 11 — Insured policy/group number
    insuredPolicyNumber: claim.subscriberPolicyNumber ?? '',
    groupNumber: claim.groupNumber ?? '',

    // Box 11b — Insured DOB
    insuredDOB: claim.subscriberDOB ? claim.subscriberDOB.toISOString().split('T')[0] : '',

    // Box 21 — Diagnosis codes (ICD-10)
    diagnosisCodes: claim.diagnosisCodes as string[],

    // Box 24 — Service line items
    serviceLines: (claim.procedureCodes as any[]).map((pc, i) => ({
      lineNumber: i + 1,
      dateOfServiceFrom: pc.dateOfService ?? '',
      dateOfServiceTo: pc.dateOfService ?? '',
      placeOfService: pc.placeOfService ?? '11',
      procedureCode: pc.code ?? '',
      modifier: pc.modifier ?? '',
      diagnosisPointers: pc.diagnosisPointers ?? ['A'],
      charges: pc.fee ?? 0,
      quantity: pc.quantity ?? 1,
      description: pc.description ?? '',
    })),

    // Box 25 — Federal Tax ID
    federalTaxId: claim.billingProviderTaxId ?? '',

    // Box 26 — Patient account number
    patientAccountNumber: claim.claimNumber,

    // Box 28 — Total charge
    totalCharge: claim.totalCharge,

    // Box 29 — Amount paid (sum of reimbursements)
    amountPaid: 0,

    // Box 31 — Rendering provider
    renderingProvider: {
      name: claim.renderingProviderName ?? '',
      npi: claim.renderingProviderNPI ?? '',
    },

    // Box 32 — Service facility
    serviceFacility: {
      name: business.name,
      address: business.address ?? '',
      city: business.city ?? '',
      state: business.state ?? '',
      zip: business.postalCode ?? '',
    },

    // Box 33 — Billing provider
    billingProvider: {
      name: claim.billingProviderName ?? business.name,
      address: business.address ?? '',
      city: business.city ?? '',
      state: business.state ?? '',
      zip: business.postalCode ?? '',
      phone: business.phoneNumber ?? '',
      npi: claim.billingProviderNPI ?? '',
    },

    // Insurance company info (top of form)
    insuranceCompany: {
      name: provider.name,
      payerId: provider.payerId ?? '',
      address: provider.address ?? '',
      city: provider.city ?? '',
      state: provider.state ?? '',
      zip: provider.postalCode ?? '',
    },

    // Claim metadata
    claimNumber: claim.claimNumber,
    claimId: claim.id,
    status: claim.status,
    submittedAt: claim.submittedAt?.toISOString() ?? null,
  };

  return res.ok({ cms1500 });
});
