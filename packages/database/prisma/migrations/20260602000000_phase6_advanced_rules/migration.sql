-- CreateTable
CREATE TABLE "scheduled_actions" (
    "id" TEXT NOT NULL,
    "automationRuleId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "actionIndex" INTEGER NOT NULL,
    "executeAt" TIMESTAMP(3) NOT NULL,
    "triggerData" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "cancelIfEvent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scheduled_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scheduled_actions_businessId_idx" ON "scheduled_actions"("businessId");

-- CreateIndex
CREATE INDEX "scheduled_actions_status_executeAt_idx" ON "scheduled_actions"("status", "executeAt");

-- AddForeignKey
ALTER TABLE "scheduled_actions" ADD CONSTRAINT "scheduled_actions_automationRuleId_fkey" FOREIGN KEY ("automationRuleId") REFERENCES "automation_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_actions" ADD CONSTRAINT "scheduled_actions_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
