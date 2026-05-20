-- CreateTable
CREATE TABLE "therapist_availability" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "therapist_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "therapist_time_off" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "isAllDay" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "therapist_time_off_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_cancellations" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "cancelledBy" TEXT NOT NULL,
    "reason" TEXT,
    "cancellationType" TEXT NOT NULL,
    "cancelledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_cancellations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "therapist_availability_businessId_idx" ON "therapist_availability"("businessId");

-- CreateIndex
CREATE INDEX "therapist_availability_therapistId_idx" ON "therapist_availability"("therapistId");

-- CreateIndex
CREATE INDEX "therapist_availability_dayOfWeek_idx" ON "therapist_availability"("dayOfWeek");

-- CreateIndex
CREATE INDEX "therapist_availability_isActive_idx" ON "therapist_availability"("isActive");

-- CreateIndex
CREATE INDEX "therapist_time_off_businessId_idx" ON "therapist_time_off"("businessId");

-- CreateIndex
CREATE INDEX "therapist_time_off_therapistId_idx" ON "therapist_time_off"("therapistId");

-- CreateIndex
CREATE INDEX "therapist_time_off_startDate_idx" ON "therapist_time_off"("startDate");

-- CreateIndex
CREATE INDEX "therapist_time_off_endDate_idx" ON "therapist_time_off"("endDate");

-- CreateIndex
CREATE UNIQUE INDEX "appointment_cancellations_appointmentId_key" ON "appointment_cancellations"("appointmentId");

-- CreateIndex
CREATE INDEX "appointment_cancellations_businessId_idx" ON "appointment_cancellations"("businessId");

-- CreateIndex
CREATE INDEX "appointment_cancellations_appointmentId_idx" ON "appointment_cancellations"("appointmentId");

-- CreateIndex
CREATE INDEX "appointment_cancellations_cancelledBy_idx" ON "appointment_cancellations"("cancelledBy");

-- CreateIndex
CREATE INDEX "appointment_cancellations_cancelledAt_idx" ON "appointment_cancellations"("cancelledAt");

-- AddForeignKey
ALTER TABLE "therapist_availability" ADD CONSTRAINT "therapist_availability_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "therapist_availability" ADD CONSTRAINT "therapist_availability_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "therapists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "therapist_time_off" ADD CONSTRAINT "therapist_time_off_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "therapist_time_off" ADD CONSTRAINT "therapist_time_off_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "therapists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_cancellations" ADD CONSTRAINT "appointment_cancellations_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_cancellations" ADD CONSTRAINT "appointment_cancellations_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
