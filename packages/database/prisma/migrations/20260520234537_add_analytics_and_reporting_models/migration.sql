-- CreateEnum
CREATE TYPE "AnalyticsSnapshotType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('REVENUE', 'CLIENTS', 'THERAPISTS', 'APPOINTMENTS', 'FINANCIAL_SUMMARY');

-- CreateEnum
CREATE TYPE "ReportSchedule" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateTable
CREATE TABLE "analytics_snapshots" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "AnalyticsSnapshotType" NOT NULL,
    "metrics" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_reports" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "filters" JSONB NOT NULL,
    "schedule" "ReportSchedule",
    "emailTo" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analytics_snapshots_businessId_idx" ON "analytics_snapshots"("businessId");

-- CreateIndex
CREATE INDEX "analytics_snapshots_date_idx" ON "analytics_snapshots"("date");

-- CreateIndex
CREATE INDEX "analytics_snapshots_type_idx" ON "analytics_snapshots"("type");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_snapshots_businessId_date_type_key" ON "analytics_snapshots"("businessId", "date", "type");

-- CreateIndex
CREATE INDEX "saved_reports_businessId_idx" ON "saved_reports"("businessId");

-- CreateIndex
CREATE INDEX "saved_reports_type_idx" ON "saved_reports"("type");

-- CreateIndex
CREATE INDEX "saved_reports_isActive_idx" ON "saved_reports"("isActive");

-- AddForeignKey
ALTER TABLE "analytics_snapshots" ADD CONSTRAINT "analytics_snapshots_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_reports" ADD CONSTRAINT "saved_reports_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
