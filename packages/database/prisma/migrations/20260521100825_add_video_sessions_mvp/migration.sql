-- CreateEnum
CREATE TYPE "VideoSessionStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'ENDED', 'CANCELLED');

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "isVirtual" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "video_sessions" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "dailyRoomName" TEXT NOT NULL,
    "dailyRoomUrl" TEXT NOT NULL,
    "therapistToken" TEXT,
    "clientToken" TEXT,
    "status" "VideoSessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "actualDuration" INTEGER,
    "screenShareEnabled" BOOLEAN NOT NULL DEFAULT true,
    "chatEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "video_sessions_appointmentId_key" ON "video_sessions"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "video_sessions_dailyRoomName_key" ON "video_sessions"("dailyRoomName");

-- CreateIndex
CREATE INDEX "video_sessions_businessId_idx" ON "video_sessions"("businessId");

-- CreateIndex
CREATE INDEX "video_sessions_appointmentId_idx" ON "video_sessions"("appointmentId");

-- CreateIndex
CREATE INDEX "video_sessions_therapistId_idx" ON "video_sessions"("therapistId");

-- CreateIndex
CREATE INDEX "video_sessions_clientId_idx" ON "video_sessions"("clientId");

-- CreateIndex
CREATE INDEX "video_sessions_status_idx" ON "video_sessions"("status");

-- AddForeignKey
ALTER TABLE "video_sessions" ADD CONSTRAINT "video_sessions_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_sessions" ADD CONSTRAINT "video_sessions_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_sessions" ADD CONSTRAINT "video_sessions_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "therapists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_sessions" ADD CONSTRAINT "video_sessions_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
