-- AlterTable: add SMS credit fields to businesses
ALTER TABLE "businesses" ADD COLUMN "smsCreditsIncluded" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "businesses" ADD COLUMN "smsCreditsUsed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "businesses" ADD COLUMN "smsBillingCycleStart" TIMESTAMP(3);

-- AlterTable: add overage settings to communication_settings
ALTER TABLE "communication_settings" ADD COLUMN "smsOverageEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "communication_settings" ADD COLUMN "smsHardStop" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: add SMS cost tracking to message_logs
ALTER TABLE "message_logs" ADD COLUMN "smsCost" DOUBLE PRECISION;
