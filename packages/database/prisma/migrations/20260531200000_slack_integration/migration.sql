-- AddColumns: Slack integration fields to businesses
ALTER TABLE "businesses" ADD COLUMN "slackAccessToken" TEXT;
ALTER TABLE "businesses" ADD COLUMN "slackDefaultChannel" TEXT;
