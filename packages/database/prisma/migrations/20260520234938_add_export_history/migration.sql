-- CreateEnum
CREATE TYPE "ExportFormat" AS ENUM ('CSV', 'PDF', 'EXCEL');

-- CreateEnum
CREATE TYPE "ExportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "export_history" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exportType" TEXT NOT NULL,
    "format" "ExportFormat" NOT NULL,
    "status" "ExportStatus" NOT NULL DEFAULT 'PENDING',
    "filters" JSONB,
    "fileName" TEXT,
    "fileUrl" TEXT,
    "fileSize" INTEGER,
    "rowCount" INTEGER,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "lastDownloadAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "export_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "export_history_businessId_idx" ON "export_history"("businessId");

-- CreateIndex
CREATE INDEX "export_history_userId_idx" ON "export_history"("userId");

-- CreateIndex
CREATE INDEX "export_history_status_idx" ON "export_history"("status");

-- CreateIndex
CREATE INDEX "export_history_requestedAt_idx" ON "export_history"("requestedAt");

-- CreateIndex
CREATE INDEX "export_history_expiresAt_idx" ON "export_history"("expiresAt");

-- AddForeignKey
ALTER TABLE "export_history" ADD CONSTRAINT "export_history_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
