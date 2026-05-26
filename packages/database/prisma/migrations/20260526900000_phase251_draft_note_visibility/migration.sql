-- CreateEnum
CREATE TYPE "DraftNoteVisibility" AS ENUM ('ONLY_AUTHOR', 'ALL_THERAPISTS', 'BUSINESS_OWNER_ONLY');

-- CreateEnum
CREATE TYPE "TreatmentNoteStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- AlterTable: add draftNoteVisibility to businesses
ALTER TABLE "businesses" ADD COLUMN "draftNoteVisibility" "DraftNoteVisibility" NOT NULL DEFAULT 'ALL_THERAPISTS';

-- AlterTable: add status to treatment_notes
ALTER TABLE "treatment_notes" ADD COLUMN "status" "TreatmentNoteStatus" NOT NULL DEFAULT 'DRAFT';

-- CreateIndex
CREATE INDEX "treatment_notes_status_idx" ON "treatment_notes"("status");
