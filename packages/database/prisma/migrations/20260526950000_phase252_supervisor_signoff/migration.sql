-- Phase 2.5.2: Supervisor Sign-off workflow
-- Adds reviewer tracking fields to treatment_notes

ALTER TABLE "treatment_notes" ADD COLUMN "reviewerId" TEXT;
ALTER TABLE "treatment_notes" ADD COLUMN "reviewComment" TEXT;
ALTER TABLE "treatment_notes" ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "treatment_notes" ADD COLUMN "submittedForReviewAt" TIMESTAMP(3);

-- Foreign key to users table for the assigned reviewer
ALTER TABLE "treatment_notes" ADD CONSTRAINT "treatment_notes_reviewerId_fkey"
  FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Index for supervisor queue lookups
CREATE INDEX "treatment_notes_reviewerId_idx" ON "treatment_notes"("reviewerId");
CREATE INDEX "treatment_notes_status_businessId_idx" ON "treatment_notes"("status", "businessId");
