-- CreateEnum
CREATE TYPE "AccountingProvider" AS ENUM ('XERO', 'QUICKBOOKS');

-- CreateEnum
CREATE TYPE "AccountingStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "SyncDirection" AS ENUM ('OUTBOUND', 'INBOUND');

-- CreateEnum
CREATE TYPE "SyncLogStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'CONFLICT', 'RESOLVED');

-- CreateTable
CREATE TABLE "accounting_integrations" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "provider" "AccountingProvider" NOT NULL,
    "status" "AccountingStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tenantId" TEXT,
    "tenantName" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "webhookKey" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounting_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounting_sync_logs" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "externalId" TEXT,
    "direction" "SyncDirection" NOT NULL,
    "status" "SyncLogStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "localSnapshot" JSONB,
    "externalSnapshot" JSONB,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounting_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounting_integrations_businessId_provider_key" ON "accounting_integrations"("businessId", "provider");

-- CreateIndex
CREATE INDEX "accounting_integrations_businessId_idx" ON "accounting_integrations"("businessId");

-- CreateIndex
CREATE INDEX "accounting_sync_logs_integrationId_idx" ON "accounting_sync_logs"("integrationId");

-- CreateIndex
CREATE INDEX "accounting_sync_logs_businessId_idx" ON "accounting_sync_logs"("businessId");

-- CreateIndex
CREATE INDEX "accounting_sync_logs_entityType_entityId_idx" ON "accounting_sync_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "accounting_sync_logs_status_idx" ON "accounting_sync_logs"("status");

-- CreateIndex
CREATE INDEX "accounting_sync_logs_createdAt_idx" ON "accounting_sync_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "accounting_integrations" ADD CONSTRAINT "accounting_integrations_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_sync_logs" ADD CONSTRAINT "accounting_sync_logs_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "accounting_integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_sync_logs" ADD CONSTRAINT "accounting_sync_logs_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
