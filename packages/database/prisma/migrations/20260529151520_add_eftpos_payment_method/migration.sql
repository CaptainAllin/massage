-- CreateEnum
CREATE TYPE "CommunityTemplateStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "GroupBookingStatus" AS ENUM ('REGISTERED', 'ATTENDED', 'NO_SHOW', 'CANCELLED');

-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'EFTPOS';

-- AlterEnum
ALTER TYPE "ReportType" ADD VALUE 'INVOICE_AGEING';

-- DropIndex
DROP INDEX "note_templates_isArchived_idx";

-- DropIndex
DROP INDEX "treatment_notes_reviewerId_idx";

-- DropIndex
DROP INDEX "treatment_notes_status_businessId_idx";

-- DropIndex
DROP INDEX "treatment_notes_status_idx";

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "capacity" INTEGER,
ADD COLUMN     "isGroup" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "currency" TEXT DEFAULT 'AUD',
ALTER COLUMN "country" SET DEFAULT 'AU';

-- AlterTable
ALTER TABLE "treatment_notes" ADD COLUMN     "noteTemplateId" TEXT,
ADD COLUMN     "noteTemplateName" TEXT;

-- CreateTable
CREATE TABLE "community_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "fields" JSONB NOT NULL,
    "description" TEXT,
    "status" "CommunityTemplateStatus" NOT NULL DEFAULT 'PENDING',
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "submittedByUserId" TEXT NOT NULL,
    "submittedByBusinessId" TEXT,
    "rejectionReason" TEXT,
    "moderatedBy" TEXT,
    "moderatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_bookings" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" "GroupBookingStatus" NOT NULL DEFAULT 'REGISTERED',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "community_templates_status_idx" ON "community_templates"("status");

-- CreateIndex
CREATE INDEX "community_templates_category_idx" ON "community_templates"("category");

-- CreateIndex
CREATE INDEX "community_templates_submittedByUserId_idx" ON "community_templates"("submittedByUserId");

-- CreateIndex
CREATE INDEX "group_bookings_appointmentId_idx" ON "group_bookings"("appointmentId");

-- CreateIndex
CREATE INDEX "group_bookings_clientId_idx" ON "group_bookings"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "group_bookings_appointmentId_clientId_key" ON "group_bookings"("appointmentId", "clientId");

-- AddForeignKey
ALTER TABLE "community_templates" ADD CONSTRAINT "community_templates_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_templates" ADD CONSTRAINT "community_templates_submittedByBusinessId_fkey" FOREIGN KEY ("submittedByBusinessId") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_templates" ADD CONSTRAINT "community_templates_moderatedBy_fkey" FOREIGN KEY ("moderatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_bookings" ADD CONSTRAINT "group_bookings_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_bookings" ADD CONSTRAINT "group_bookings_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
