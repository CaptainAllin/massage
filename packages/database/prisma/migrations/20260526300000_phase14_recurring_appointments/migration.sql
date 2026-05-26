-- Phase 1.4: Recurring Appointments
-- Add daysOfWeek JSON field to RecurringAppointmentSeries for multi-day weekly recurrence

ALTER TABLE "recurring_appointment_series" ADD COLUMN "daysOfWeek" JSONB;
