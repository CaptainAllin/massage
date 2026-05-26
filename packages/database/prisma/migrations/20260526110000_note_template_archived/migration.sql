-- AlterTable
ALTER TABLE "note_templates" ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "note_templates_isArchived_idx" ON "note_templates"("isArchived");
