-- CreateEnum
CREATE TYPE "VoiceNoteStatus" AS ENUM ('UPLOADING', 'UPLOADED', 'TRANSCRIBING', 'TRANSCRIBED', 'FAILED', 'DELETED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AIFeature" ADD VALUE 'VOICE_TRANSCRIPTION';
ALTER TYPE "AIFeature" ADD VALUE 'VOICE_TO_SOAP';

-- AlterTable
ALTER TABLE "ai_usage" ADD COLUMN     "voiceNoteId" TEXT;

-- CreateTable
CREATE TABLE "voice_notes" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "treatmentNoteId" TEXT,
    "audioFileUrl" TEXT NOT NULL,
    "audioFileName" TEXT NOT NULL,
    "audioFileSize" INTEGER NOT NULL,
    "audioMimeType" TEXT NOT NULL,
    "audioDuration" INTEGER,
    "transcription" TEXT,
    "transcriptionCost" DOUBLE PRECISION DEFAULT 0,
    "status" "VoiceNoteStatus" NOT NULL DEFAULT 'UPLOADING',
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transcribedAt" TIMESTAMP(3),
    "linkedToNoteAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voice_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "voice_notes_businessId_idx" ON "voice_notes"("businessId");

-- CreateIndex
CREATE INDEX "voice_notes_clientId_idx" ON "voice_notes"("clientId");

-- CreateIndex
CREATE INDEX "voice_notes_therapistId_idx" ON "voice_notes"("therapistId");

-- CreateIndex
CREATE INDEX "voice_notes_appointmentId_idx" ON "voice_notes"("appointmentId");

-- CreateIndex
CREATE INDEX "voice_notes_treatmentNoteId_idx" ON "voice_notes"("treatmentNoteId");

-- CreateIndex
CREATE INDEX "voice_notes_status_idx" ON "voice_notes"("status");

-- CreateIndex
CREATE INDEX "voice_notes_recordedAt_idx" ON "voice_notes"("recordedAt");

-- CreateIndex
CREATE INDEX "ai_usage_voiceNoteId_idx" ON "ai_usage"("voiceNoteId");

-- AddForeignKey
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_voiceNoteId_fkey" FOREIGN KEY ("voiceNoteId") REFERENCES "voice_notes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_notes" ADD CONSTRAINT "voice_notes_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_notes" ADD CONSTRAINT "voice_notes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_notes" ADD CONSTRAINT "voice_notes_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "therapists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_notes" ADD CONSTRAINT "voice_notes_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_notes" ADD CONSTRAINT "voice_notes_treatmentNoteId_fkey" FOREIGN KEY ("treatmentNoteId") REFERENCES "treatment_notes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
