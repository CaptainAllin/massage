---
name: project-phase16-availability-rules
description: Phase 1.6 Fine-grained Availability Rules — Room model, AvailabilityRule model, room management UI, availability rule builder
metadata:
  type: project
---

Phase 1.6 complete (except 2 calendar-view items deferred).

**What was built:**
- `Room` model: id, businessId, name, color, capacity, isActive
- `AvailabilityRule` model: id, businessId, therapistId (nullable), roomId (nullable), serviceType (nullable), daysOfWeek (JSON), startTime, endTime, priority
- `roomId` added to `Appointment` model
- Migration: `20260526500000_phase16_availability_rules`
- API routes: `/api/rooms`, `/api/rooms/[id]`, `/api/availability-rules`, `/api/availability-rules/[id]`
- Hooks: `use-rooms.ts`, `use-availability-rules.ts`
- Settings → Locations page: added "Rooms" tab (create/edit/archive rooms with color picker)
- Settings → Scheduling page (`/settings/scheduling`): availability rule builder (therapist + room + serviceType targets, days picker, time range, priority)
- Settings page: added links to "Locations & Rooms" and "Availability Rules"
- AddAppointmentModal + EditAppointmentModal: room dropdown (only shown when rooms exist)
- `check-availability.ts`: checks AvailabilityRule before allowing booking
- Public slots API (`/api/public/booking/[businessId]/slots`): filters out slots violating rules

**Deferred (left unchecked in cliniko.md):**
- Room column view in calendar (resource view) — requires calendar refactor
- Rules shown as greyed-out blocks on calendar — same dependency

**Why:** [[project-phase14-recurring]]
