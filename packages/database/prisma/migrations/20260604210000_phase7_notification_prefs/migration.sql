-- AlterTable users: add notificationPrefs JSON field for per-user notification preferences
ALTER TABLE "users" ADD COLUMN "notificationPrefs" JSONB;
