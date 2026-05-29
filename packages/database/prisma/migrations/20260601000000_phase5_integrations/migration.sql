-- AlterTable
ALTER TABLE "businesses" ADD COLUMN "googleAccessToken" TEXT,
ADD COLUMN "googleRefreshToken" TEXT,
ADD COLUMN "mailchimpApiKey" TEXT,
ADD COLUMN "mailchimpAudienceId" TEXT,
ADD COLUMN "hubspotAccessToken" TEXT;
