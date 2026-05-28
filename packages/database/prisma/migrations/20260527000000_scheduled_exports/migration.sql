-- CreateEnum
CREATE TYPE "ScheduleFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- AlterTable: add triggeredBy to export_history
ALTER TABLE "export_history" ADD COLUMN "triggeredBy" TEXT DEFAULT 'MANUAL';

-- CreateTable
CREATE TABLE "scheduled_exports" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "exportType" TEXT NOT NULL,
    "format" "ExportFormat" NOT NULL,
    "frequency" "ScheduleFrequency" NOT NULL,
    "filters" JSONB,
    "emailTo" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_exports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scheduled_exports_businessId_idx" ON "scheduled_exports"("businessId");

-- CreateIndex
CREATE INDEX "scheduled_exports_isActive_nextRunAt_idx" ON "scheduled_exports"("isActive", "nextRunAt");

-- AddForeignKey
ALTER TABLE "scheduled_exports" ADD CONSTRAINT "scheduled_exports_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
