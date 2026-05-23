-- CreateEnum: InsuranceClaimStatus
CREATE TYPE "InsuranceClaimStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'PENDING', 'APPROVED', 'DENIED', 'APPEALING', 'PAID', 'VOID');

-- CreateEnum: ReimbursementStatus
CREATE TYPE "ReimbursementStatus" AS ENUM ('PENDING', 'RECEIVED', 'RECONCILED');

-- CreateTable: insurance_providers
CREATE TABLE "insurance_providers" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "payerId" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "phone" TEXT,
    "fax" TEXT,
    "portalUrl" TEXT,
    "claimsEmail" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable: insurance_claims
CREATE TABLE "insurance_claims" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "insuranceProviderId" TEXT NOT NULL,
    "claimNumber" TEXT NOT NULL,
    "status" "InsuranceClaimStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "subscriberName" TEXT,
    "subscriberDOB" TIMESTAMP(3),
    "subscriberPolicyNumber" TEXT,
    "groupNumber" TEXT,
    "relationshipToSubscriber" TEXT DEFAULT 'SELF',
    "diagnosisCodes" JSONB NOT NULL DEFAULT '[]',
    "procedureCodes" JSONB NOT NULL DEFAULT '[]',
    "renderingProviderName" TEXT,
    "renderingProviderNPI" TEXT,
    "billingProviderName" TEXT,
    "billingProviderNPI" TEXT,
    "billingProviderTaxId" TEXT,
    "totalCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "claimedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "submissionMethod" TEXT DEFAULT 'ELECTRONIC',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable: claim_reimbursements
CREATE TABLE "claim_reimbursements" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "checkNumber" TEXT,
    "eobNumber" TEXT,
    "paymentDate" TIMESTAMP(3),
    "amountBilled" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountAllowed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "patientResponsibility" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "adjustmentReasons" JSONB NOT NULL DEFAULT '[]',
    "status" "ReimbursementStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "claim_reimbursements_pkey" PRIMARY KEY ("id")
);

-- CreateUniqueIndex: insurance_claims.businessId + claimNumber
CREATE UNIQUE INDEX "insurance_claims_businessId_claimNumber_key" ON "insurance_claims"("businessId", "claimNumber");

-- CreateIndex: insurance_providers
CREATE INDEX "insurance_providers_businessId_idx" ON "insurance_providers"("businessId");
CREATE INDEX "insurance_providers_isActive_idx" ON "insurance_providers"("isActive");

-- CreateIndex: insurance_claims
CREATE INDEX "insurance_claims_businessId_idx" ON "insurance_claims"("businessId");
CREATE INDEX "insurance_claims_clientId_idx" ON "insurance_claims"("clientId");
CREATE INDEX "insurance_claims_appointmentId_idx" ON "insurance_claims"("appointmentId");
CREATE INDEX "insurance_claims_insuranceProviderId_idx" ON "insurance_claims"("insuranceProviderId");
CREATE INDEX "insurance_claims_status_idx" ON "insurance_claims"("status");
CREATE INDEX "insurance_claims_submittedAt_idx" ON "insurance_claims"("submittedAt");
CREATE INDEX "insurance_claims_businessId_status_idx" ON "insurance_claims"("businessId", "status");

-- CreateIndex: claim_reimbursements
CREATE INDEX "claim_reimbursements_businessId_idx" ON "claim_reimbursements"("businessId");
CREATE INDEX "claim_reimbursements_claimId_idx" ON "claim_reimbursements"("claimId");
CREATE INDEX "claim_reimbursements_status_idx" ON "claim_reimbursements"("status");
CREATE INDEX "claim_reimbursements_paymentDate_idx" ON "claim_reimbursements"("paymentDate");

-- AddForeignKey: insurance_providers -> businesses
ALTER TABLE "insurance_providers" ADD CONSTRAINT "insurance_providers_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: insurance_claims -> businesses
ALTER TABLE "insurance_claims" ADD CONSTRAINT "insurance_claims_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: insurance_claims -> clients
ALTER TABLE "insurance_claims" ADD CONSTRAINT "insurance_claims_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: insurance_claims -> appointments
ALTER TABLE "insurance_claims" ADD CONSTRAINT "insurance_claims_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: insurance_claims -> insurance_providers
ALTER TABLE "insurance_claims" ADD CONSTRAINT "insurance_claims_insuranceProviderId_fkey" FOREIGN KEY ("insuranceProviderId") REFERENCES "insurance_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: claim_reimbursements -> businesses
ALTER TABLE "claim_reimbursements" ADD CONSTRAINT "claim_reimbursements_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: claim_reimbursements -> insurance_claims
ALTER TABLE "claim_reimbursements" ADD CONSTRAINT "claim_reimbursements_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "insurance_claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;
