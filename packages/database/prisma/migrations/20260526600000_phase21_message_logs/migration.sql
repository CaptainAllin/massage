-- CreateEnum
CREATE TYPE "MessageChannel" AS ENUM ('SMS', 'EMAIL', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "MessageLogStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'UNDELIVERED');

-- CreateTable
CREATE TABLE "message_logs" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "clientId" TEXT,
    "appointmentId" TEXT,
    "channel" "MessageChannel" NOT NULL DEFAULT 'EMAIL',
    "messageType" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT,
    "status" "MessageLogStatus" NOT NULL DEFAULT 'QUEUED',
    "providerMessageId" TEXT,
    "errorCode" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastRetriedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "message_logs_businessId_idx" ON "message_logs"("businessId");

-- CreateIndex
CREATE INDEX "message_logs_clientId_idx" ON "message_logs"("clientId");

-- CreateIndex
CREATE INDEX "message_logs_appointmentId_idx" ON "message_logs"("appointmentId");

-- CreateIndex
CREATE INDEX "message_logs_status_idx" ON "message_logs"("status");

-- CreateIndex
CREATE INDEX "message_logs_channel_idx" ON "message_logs"("channel");

-- CreateIndex
CREATE INDEX "message_logs_createdAt_idx" ON "message_logs"("createdAt");

-- CreateIndex
CREATE INDEX "message_logs_businessId_status_idx" ON "message_logs"("businessId", "status");

-- CreateIndex
CREATE INDEX "message_logs_businessId_channel_idx" ON "message_logs"("businessId", "channel");

-- CreateIndex
CREATE INDEX "message_logs_providerMessageId_idx" ON "message_logs"("providerMessageId");

-- AddForeignKey
ALTER TABLE "message_logs" ADD CONSTRAINT "message_logs_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_logs" ADD CONSTRAINT "message_logs_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
