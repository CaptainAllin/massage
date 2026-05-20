-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "recurringSeriesId" TEXT;

-- CreateTable
CREATE TABLE "recurring_appointment_series" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "startTime" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "occurrences" INTEGER,
    "serviceType" TEXT,
    "price" DOUBLE PRECISION,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_appointment_series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_reminders" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "reminderType" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointment_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recurring_appointment_series_businessId_idx" ON "recurring_appointment_series"("businessId");

-- CreateIndex
CREATE INDEX "recurring_appointment_series_clientId_idx" ON "recurring_appointment_series"("clientId");

-- CreateIndex
CREATE INDEX "recurring_appointment_series_therapistId_idx" ON "recurring_appointment_series"("therapistId");

-- CreateIndex
CREATE INDEX "recurring_appointment_series_isActive_idx" ON "recurring_appointment_series"("isActive");

-- CreateIndex
CREATE INDEX "recurring_appointment_series_startDate_idx" ON "recurring_appointment_series"("startDate");

-- CreateIndex
CREATE INDEX "appointment_reminders_businessId_idx" ON "appointment_reminders"("businessId");

-- CreateIndex
CREATE INDEX "appointment_reminders_appointmentId_idx" ON "appointment_reminders"("appointmentId");

-- CreateIndex
CREATE INDEX "appointment_reminders_scheduledFor_idx" ON "appointment_reminders"("scheduledFor");

-- CreateIndex
CREATE INDEX "appointment_reminders_status_idx" ON "appointment_reminders"("status");

-- CreateIndex
CREATE INDEX "appointments_recurringSeriesId_idx" ON "appointments"("recurringSeriesId");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_recurringSeriesId_fkey" FOREIGN KEY ("recurringSeriesId") REFERENCES "recurring_appointment_series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_appointment_series" ADD CONSTRAINT "recurring_appointment_series_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_appointment_series" ADD CONSTRAINT "recurring_appointment_series_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_appointment_series" ADD CONSTRAINT "recurring_appointment_series_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "therapists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_reminders" ADD CONSTRAINT "appointment_reminders_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_reminders" ADD CONSTRAINT "appointment_reminders_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "users_authProviderId_key" RENAME TO "users_authUserId_key";
