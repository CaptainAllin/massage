---
name: project-phase14-recurring
description: Phase 1.4 recurring appointments — what was implemented and what's left
metadata:
  type: project
---

Phase 1.4 (Recurring Appointments) is complete. Key implementation details:

- Schema: `RecurringAppointmentSeries` already existed; added `daysOfWeek Json?` field for multi-day weekly recurrence (migration `20260526300000_phase14_recurring_appointments`)
- `Appointment` type now includes `recurringSeriesId`
- Recurring series POST now **generates all appointment records** atomically in a transaction using `generateOccurrenceDates()` in `/api/recurring-appointments/route.ts`
- Preview endpoint: `POST /api/recurring-appointments/preview` — compute dates without saving
- Staff cancel modal (`CancelAppointmentModal`) has scope picker (this only / this & following / all) when `recurringSeriesId` prop is passed
- Staff edit modal (`EditAppointmentModal`) has scope picker for bulk propagating service/price/notes/therapist changes
- Staff add modal (`AddAppointmentModal`) has "Repeat" toggle with frequency/day-of-week/end-condition/preview
- Public booking page: "Book as recurring series" toggle after slot selection; creates via `POST /api/public/booking/[businessId]/recurring`
- Reminders cron: `POST /api/cron/appointment-reminders` sends 24h-ahead reminders; uses `AppointmentReminder` records to deduplicate

**Why:** generateOccurrenceDates() exported from `route.ts` and reused in public recurring route and preview endpoint.

**Skipped/minor gaps:**
- Blocking if any slot in series is unavailable on public booking (shows error but no pre-check)
- "Reminder only for next occurrence vs. all" UI toggle not built (cron always handles all)
