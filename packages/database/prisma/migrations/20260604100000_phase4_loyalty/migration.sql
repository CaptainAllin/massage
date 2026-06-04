-- AlterTable loyalty_settings: add tier thresholds, bonus rates, event bonuses
ALTER TABLE "loyalty_settings" ADD COLUMN "platinumMinPoints" INTEGER NOT NULL DEFAULT 5000;
ALTER TABLE "loyalty_settings" ADD COLUMN "silverBonusRate" DOUBLE PRECISION NOT NULL DEFAULT 0.05;
ALTER TABLE "loyalty_settings" ADD COLUMN "goldBonusRate" DOUBLE PRECISION NOT NULL DEFAULT 0.10;
ALTER TABLE "loyalty_settings" ADD COLUMN "platinumBonusRate" DOUBLE PRECISION NOT NULL DEFAULT 0.15;
ALTER TABLE "loyalty_settings" ADD COLUMN "birthdayMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 2.0;
ALTER TABLE "loyalty_settings" ADD COLUMN "signupBonusPoints" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "loyalty_settings" ADD COLUMN "firstBookingBonusPoints" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "loyalty_settings" ADD COLUMN "intakeFormBonusPoints" INTEGER NOT NULL DEFAULT 25;
ALTER TABLE "loyalty_settings" ADD COLUMN "referralBonusPoints" INTEGER NOT NULL DEFAULT 200;
ALTER TABLE "loyalty_settings" ADD COLUMN "reviewBonusPoints" INTEGER NOT NULL DEFAULT 50;

-- AlterTable clients: add referral and birthday fields
ALTER TABLE "clients" ADD COLUMN "referralCode" TEXT;
ALTER TABLE "clients" ADD COLUMN "referredBy" TEXT;
ALTER TABLE "clients" ADD COLUMN "birthdayMonth" INTEGER;
ALTER TABLE "clients" ADD COLUMN "birthdayDay" INTEGER;

-- CreateIndex unique referral code
CREATE UNIQUE INDEX "clients_referralCode_key" ON "clients"("referralCode");

-- CreateTable loyalty_rewards
CREATE TABLE "loyalty_rewards" (
    "id" TEXT NOT NULL,
    "loyaltyAccountId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "pointsUsed" INTEGER,
    "dollarValue" DOUBLE PRECISION,
    "appointmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "loyalty_rewards_loyaltyAccountId_idx" ON "loyalty_rewards"("loyaltyAccountId");
CREATE INDEX "loyalty_rewards_businessId_idx" ON "loyalty_rewards"("businessId");
CREATE INDEX "loyalty_rewards_createdAt_idx" ON "loyalty_rewards"("createdAt");

-- AddForeignKey
ALTER TABLE "loyalty_rewards" ADD CONSTRAINT "loyalty_rewards_loyaltyAccountId_fkey" FOREIGN KEY ("loyaltyAccountId") REFERENCES "loyalty_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "loyalty_rewards" ADD CONSTRAINT "loyalty_rewards_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
