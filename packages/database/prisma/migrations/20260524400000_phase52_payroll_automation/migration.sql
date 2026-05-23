-- CreateEnum: PayrollStatus
CREATE TYPE "PayrollStatus" AS ENUM ('DRAFT', 'PROCESSING', 'PAID', 'CANCELLED');

-- CreateTable: payroll_periods
CREATE TABLE "payroll_periods" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "PayrollStatus" NOT NULL DEFAULT 'DRAFT',
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable: payroll_records
CREATE TABLE "payroll_records" (
    "id" TEXT NOT NULL,
    "payrollPeriodId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "hoursWorked" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sessionsCompleted" INTEGER NOT NULL DEFAULT 0,
    "baseRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commissionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bonusAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable: automation_rules
CREATE TABLE "automation_rules" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "trigger" TEXT NOT NULL,
    "conditions" JSONB NOT NULL DEFAULT '{}',
    "actions" JSONB NOT NULL,
    "lastRunAt" TIMESTAMP(3),
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable: automation_logs
CREATE TABLE "automation_logs" (
    "id" TEXT NOT NULL,
    "automationRuleId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "triggerData" JSONB,
    "result" JSONB,
    "errorMessage" TEXT,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_logs_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
ALTER TABLE "payroll_records" ADD CONSTRAINT "payroll_records_payrollPeriodId_therapistId_key" UNIQUE ("payrollPeriodId", "therapistId");

-- Indexes: payroll_periods
CREATE INDEX "payroll_periods_businessId_idx" ON "payroll_periods"("businessId");
CREATE INDEX "payroll_periods_status_idx" ON "payroll_periods"("status");
CREATE INDEX "payroll_periods_startDate_endDate_idx" ON "payroll_periods"("startDate", "endDate");

-- Indexes: payroll_records
CREATE INDEX "payroll_records_payrollPeriodId_idx" ON "payroll_records"("payrollPeriodId");
CREATE INDEX "payroll_records_businessId_idx" ON "payroll_records"("businessId");
CREATE INDEX "payroll_records_therapistId_idx" ON "payroll_records"("therapistId");

-- Indexes: automation_rules
CREATE INDEX "automation_rules_businessId_idx" ON "automation_rules"("businessId");
CREATE INDEX "automation_rules_isActive_idx" ON "automation_rules"("isActive");
CREATE INDEX "automation_rules_trigger_idx" ON "automation_rules"("trigger");

-- Indexes: automation_logs
CREATE INDEX "automation_logs_automationRuleId_idx" ON "automation_logs"("automationRuleId");
CREATE INDEX "automation_logs_businessId_idx" ON "automation_logs"("businessId");
CREATE INDEX "automation_logs_executedAt_idx" ON "automation_logs"("executedAt");

-- AddForeignKey: payroll_periods → businesses
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: payroll_records → businesses
ALTER TABLE "payroll_records" ADD CONSTRAINT "payroll_records_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: payroll_records → payroll_periods
ALTER TABLE "payroll_records" ADD CONSTRAINT "payroll_records_payrollPeriodId_fkey" FOREIGN KEY ("payrollPeriodId") REFERENCES "payroll_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: payroll_records → therapists
ALTER TABLE "payroll_records" ADD CONSTRAINT "payroll_records_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "therapists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: automation_rules → businesses
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: automation_logs → businesses
ALTER TABLE "automation_logs" ADD CONSTRAINT "automation_logs_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: automation_logs → automation_rules
ALTER TABLE "automation_logs" ADD CONSTRAINT "automation_logs_automationRuleId_fkey" FOREIGN KEY ("automationRuleId") REFERENCES "automation_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
