-- CreateEnum
CREATE TYPE "WaitlistStatus" AS ENUM ('WAITING', 'OFFERED', 'BOOKED', 'EXPIRED');

-- CreateTable
CREATE TABLE "waitlist" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "therapistId" TEXT,
    "serviceType" TEXT,
    "preferredDates" JSONB NOT NULL DEFAULT '[]',
    "preferredTimes" JSONB NOT NULL DEFAULT '[]',
    "status" "WaitlistStatus" NOT NULL DEFAULT 'WAITING',
    "offerToken" TEXT,
    "offerExpiresAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_offerToken_key" ON "waitlist"("offerToken");

-- CreateIndex
CREATE INDEX "waitlist_businessId_idx" ON "waitlist"("businessId");

-- CreateIndex
CREATE INDEX "waitlist_clientId_idx" ON "waitlist"("clientId");

-- CreateIndex
CREATE INDEX "waitlist_therapistId_idx" ON "waitlist"("therapistId");

-- CreateIndex
CREATE INDEX "waitlist_status_idx" ON "waitlist"("status");

-- CreateIndex
CREATE INDEX "waitlist_businessId_status_idx" ON "waitlist"("businessId", "status");

-- CreateIndex
CREATE INDEX "waitlist_offerToken_idx" ON "waitlist"("offerToken");

-- AddForeignKey
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "therapists"("id") ON DELETE SET NULL ON UPDATE CASCADE;
