-- Composite indexes for analytics query performance
-- Covers: therapist perf reports, revenue breakdowns, overdue invoices,
--         active client counts, membership billing queries, AI cost tracking,
--         scheduled promotion dispatch, reminder cron jobs

-- appointments: therapist performance queries filter by business + therapist + date range
CREATE INDEX IF NOT EXISTS "appointments_businessId_therapistId_startTime_idx"
  ON "appointments"("businessId", "therapistId", "startTime");

-- payments: payment method breakdown reports
CREATE INDEX IF NOT EXISTS "payments_businessId_paymentMethod_idx"
  ON "payments"("businessId", "paymentMethod");

-- invoices: overdue tracking and date-range invoice reports
CREATE INDEX IF NOT EXISTS "invoices_businessId_dueDate_idx"
  ON "invoices"("businessId", "dueDate");

CREATE INDEX IF NOT EXISTS "invoices_businessId_issuedAt_idx"
  ON "invoices"("businessId", "issuedAt");

-- memberships: active membership counts and upcoming billing queries
CREATE INDEX IF NOT EXISTS "memberships_businessId_status_idx"
  ON "memberships"("businessId", "status");

CREATE INDEX IF NOT EXISTS "memberships_businessId_nextBillingDate_idx"
  ON "memberships"("businessId", "nextBillingDate");

-- clients: active client filtering and retention/churn analytics
CREATE INDEX IF NOT EXISTS "clients_businessId_isActive_idx"
  ON "clients"("businessId", "isActive");

CREATE INDEX IF NOT EXISTS "clients_businessId_lastVisitDate_idx"
  ON "clients"("businessId", "lastVisitDate");

-- treatment_notes: note activity over time and per-therapist note counts
CREATE INDEX IF NOT EXISTS "treatment_notes_businessId_createdAt_idx"
  ON "treatment_notes"("businessId", "createdAt");

CREATE INDEX IF NOT EXISTS "treatment_notes_businessId_therapistId_idx"
  ON "treatment_notes"("businessId", "therapistId");

-- ai_usage: AI cost reports by date range and per-feature breakdowns
CREATE INDEX IF NOT EXISTS "ai_usage_businessId_createdAt_idx"
  ON "ai_usage"("businessId", "createdAt");

CREATE INDEX IF NOT EXISTS "ai_usage_businessId_feature_idx"
  ON "ai_usage"("businessId", "feature");

-- promotions: cron job queries for upcoming scheduled sends
CREATE INDEX IF NOT EXISTS "promotions_businessId_scheduledFor_idx"
  ON "promotions"("businessId", "scheduledFor");

-- appointment_reminders: cron job picks up pending reminders due before a cutoff
CREATE INDEX IF NOT EXISTS "appointment_reminders_businessId_status_scheduledFor_idx"
  ON "appointment_reminders"("businessId", "status", "scheduledFor");

-- analytics_snapshots: time-series queries filter by business + type + date range
-- (the existing unique on (businessId, date, type) doesn't help type-first queries)
CREATE INDEX IF NOT EXISTS "analytics_snapshots_businessId_type_date_idx"
  ON "analytics_snapshots"("businessId", "type", "date");
