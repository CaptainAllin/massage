-- CreateEnum
CREATE TYPE "PromotionChannel" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "PromotionStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'CANCELLED');

-- CreateTable
CREATE TABLE "promotions" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "channel" "PromotionChannel" NOT NULL DEFAULT 'EMAIL',
    "status" "PromotionStatus" NOT NULL DEFAULT 'DRAFT',
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "recipientFilter" JSONB NOT NULL,
    "scheduledFor" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "totalSent" INTEGER NOT NULL DEFAULT 0,
    "totalOpened" INTEGER NOT NULL DEFAULT 0,
    "totalClicked" INTEGER NOT NULL DEFAULT 0,
    "totalConverted" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_recipients" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "promotions_businessId_idx" ON "promotions"("businessId");
CREATE INDEX "promotions_status_idx" ON "promotions"("status");
CREATE INDEX "promotions_channel_idx" ON "promotions"("channel");
CREATE INDEX "promotions_scheduledFor_idx" ON "promotions"("scheduledFor");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_recipients_promotionId_clientId_key" ON "promotion_recipients"("promotionId", "clientId");
CREATE INDEX "promotion_recipients_promotionId_idx" ON "promotion_recipients"("promotionId");
CREATE INDEX "promotion_recipients_clientId_idx" ON "promotion_recipients"("clientId");
CREATE INDEX "promotion_recipients_status_idx" ON "promotion_recipients"("status");

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_recipients" ADD CONSTRAINT "promotion_recipients_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_recipients" ADD CONSTRAINT "promotion_recipients_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
