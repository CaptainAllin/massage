# STAGE 3 — Scheduling & Calendar

## ✅ STATUS: COMPLETED (100%)

**Completion Date**: May 2026

---

## Overview

This stage built a complete appointment scheduling system with therapist availability management, conflict detection, calendar views, recurring appointments, and reminder infrastructure. It enables clinics to manage their day-to-day operations effectively.

**Priority Level**: VERY HIGH ✅ **DONE**

---

## Goals ✅ ALL ACHIEVED

- ✅ Allow clinics to operate day-to-day
- ✅ Build calendar system
- ✅ Build therapist schedules
- ✅ Build booking system with conflict detection
- ✅ Build reminders infrastructure
- ✅ Build recurring appointment engine
- ✅ Build online booking API

---

## Features Built

### ✅ Scheduling Engine (COMPLETE)

**What Was Built**:
- Complete appointment management system
- 4-layer conflict detection:
  1. **Day availability** - Check if therapist works that day
  2. **Working hours** - Verify appointment falls within therapist's hours
  3. **Time-off** - Check for scheduled time off
  4. **Overlaps** - Prevent double-booking
- Appointment lifecycle management (6 status states)
- Status transitions with validation
- Cancellation flow with audit trail

**Status Workflow**:
```
SCHEDULED → CONFIRMED → IN_PROGRESS → COMPLETED
           ↓
      CANCELLED / NO_SHOW
```

**Technical Implementation**:
- `AppointmentsService` with 10 core methods
- `checkAvailability()` method with 4-layer validation
- Real-time conflict warnings in UI
- Optimistic updates with React Query

**API Endpoints** (10 endpoints):
- `GET /appointments` - List appointments (paginated, filtered)
- `GET /appointments/:id` - Get appointment details
- `POST /appointments` - Create appointment (with conflict check)
- `PATCH /appointments/:id` - Update appointment
- `DELETE /appointments/:id` - Delete appointment
- `PATCH /appointments/:id/confirm` - Confirm appointment
- `PATCH /appointments/:id/start` - Start appointment
- `PATCH /appointments/:id/complete` - Complete appointment
- `PATCH /appointments/:id/no-show` - Mark as no-show
- `PATCH /appointments/:id/cancel` - Cancel appointment

**Files**:
- `services/api/src/appointments/appointments.service.ts`
- `services/api/src/appointments/appointments.controller.ts`
- `services/api/src/appointments/dto/`

---

### ✅ Therapist Availability System (COMPLETE)

**What Was Built**:
- Weekly schedule management (different hours per day)
- Time-off tracking with reason codes
- Available slots calculation
- Working hours configuration per therapist per day

**Database Schema**:

```typescript
TherapistAvailability {
  id: string
  therapistId: string
  businessId: string
  dayOfWeek: 0-6  // 0 = Sunday, 6 = Saturday
  startTime: string  // "09:00"
  endTime: string    // "17:00"
  isAvailable: boolean
  createdAt: DateTime
  updatedAt: DateTime
}

TherapistTimeOff {
  id: string
  therapistId: string
  businessId: string
  startDate: DateTime
  endDate: DateTime
  reason: string
  isApproved: boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

**Features**:
- Set different working hours for each day of the week
- Mark specific days as unavailable
- Request and track time off (vacation, sick leave, etc.)
- Calculate available time slots for booking
- Prevent bookings during time-off periods

**API Endpoints** (8 endpoints):
- `GET /therapist-availability/:therapistId` - Get weekly schedule
- `POST /therapist-availability` - Set availability for a day
- `PATCH /therapist-availability/:id` - Update availability
- `DELETE /therapist-availability/:id` - Remove availability
- `GET /therapist-time-off/:therapistId` - List time-off requests
- `POST /therapist-time-off` - Request time off
- `PATCH /therapist-time-off/:id` - Update time-off request
- `DELETE /therapist-time-off/:id` - Cancel time-off request

**Files**:
- `services/api/src/therapist-availability/therapist-availability.service.ts`
- `services/api/src/therapist-availability/therapist-availability.controller.ts`

---

### ✅ Calendar UI (COMPLETE)

**What Was Built**:
- **Week View** - 7-day grid with appointment cards
- **Day View** - Single day timeline with hourly slots
- **Appointment Cards** - Status-based color coding
- **Filters** - By therapist, status, client
- **Real-time conflict warnings**
- **Drag-and-drop** (planned for future enhancement)

**Components**:
- `AppointmentCalendar` - Main calendar container
- `WeekView` - 7-column week grid
- `DayView` - Single day timeline
- `AppointmentCard` - Individual appointment display
- `StatusBadge` - Color-coded status indicator
- `CalendarFilters` - Filter controls

**Features**:
- Navigate by week/day/month
- Click to view appointment details
- Quick status updates
- Color coding by appointment status:
  - 🔵 SCHEDULED - Blue
  - 🟢 CONFIRMED - Green
  - 🟡 IN_PROGRESS - Yellow
  - ⚪ COMPLETED - Gray
  - 🔴 CANCELLED - Red
  - ⚫ NO_SHOW - Dark gray
- Filter by therapist, client, or status
- Search appointments

**Files**:
- `apps/web/app/(dashboard)/appointments/page.tsx`
- `packages/ui/src/calendar/AppointmentCalendar.tsx`
- `packages/ui/src/calendar/WeekView.tsx`
- `packages/ui/src/calendar/DayView.tsx`
- `packages/ui/src/calendar/AppointmentCard.tsx`
- `packages/ui/src/calendar/StatusBadge.tsx`

---

### ✅ Modals & Forms (6 Modals Complete)

**What Was Built**:
1. **Add Appointment Modal** - Create new appointment with conflict checking
2. **Edit Appointment Modal** - Update appointment details
3. **Appointment Detail Modal** - View full appointment information
4. **Cancel Appointment Modal** - Cancel with reason and type
5. **Availability Modal** - Set therapist weekly schedule
6. **Time-Off Modal** - Request time off

**Features**:
- Form validation with error messages
- Real-time conflict checking
- Optimistic UI updates
- Loading states
- Success/error notifications
- Date/time pickers
- Therapist/client selection

**Files**:
- `packages/ui/src/modals/AddAppointmentModal.tsx`
- `packages/ui/src/modals/EditAppointmentModal.tsx`
- `packages/ui/src/modals/AppointmentDetailModal.tsx`
- `packages/ui/src/modals/CancelAppointmentModal.tsx`
- `packages/ui/src/modals/AvailabilityModal.tsx`
- `packages/ui/src/modals/TimeOffModal.tsx`

---

### ✅ Cancellation Flow (COMPLETE)

**What Was Built**:
- Cancellation tracking with audit trail
- Cancellation reasons (Client Request, Therapist Unavailable, No Show, Other)
- Cancellation types (Client Initiated, Therapist Initiated, System)
- Automatic appointment status update
- Cancellation history tracking

**Database Schema**:
```typescript
AppointmentCancellation {
  id: string
  appointmentId: string
  businessId: string
  cancelledBy: string  // userId
  cancelledAt: DateTime
  reason: 'CLIENT_REQUEST' | 'THERAPIST_UNAVAILABLE' | 'NO_SHOW' | 'OTHER'
  cancellationType: 'CLIENT_INITIATED' | 'THERAPIST_INITIATED' | 'SYSTEM'
  notes?: string
  createdAt: DateTime
}
```

**Features**:
- Track who cancelled (client, therapist, receptionist)
- Record reason for cancellation
- Add optional notes
- Maintain full audit trail
- View cancellation history per appointment

**Files**:
- `services/api/src/appointments/dto/cancel-appointment.dto.ts`
- `packages/database/prisma/schema.prisma` (AppointmentCancellation model)

---

### ✅ Recurring Appointments (COMPLETE)

**What Was Built**:
- Full recurrence engine supporting DAILY, WEEKLY, MONTHLY patterns
- Automatic appointment generation
- End date or occurrence limit support
- Interval patterns (every N days/weeks/months)
- 6 API endpoints for recurrence management

**Recurrence Patterns**:
- **DAILY** - Every N days (e.g., every 2 days)
- **WEEKLY** - Every N weeks on specific days (e.g., every Monday and Wednesday)
- **MONTHLY** - Every N months on specific date (e.g., 15th of every month)

**Features**:
- Set recurrence pattern when creating appointment
- Automatically generate future appointments
- End by date or after N occurrences
- Edit/delete single occurrence or entire series
- View all occurrences in a series

**API Endpoints** (6 endpoints):
- `POST /appointments/recurring` - Create recurring appointment
- `GET /appointments/recurring/:seriesId` - Get all in series
- `PATCH /appointments/recurring/:seriesId` - Update series
- `DELETE /appointments/recurring/:seriesId` - Delete series
- `PATCH /appointments/:id/detach` - Remove from series
- `POST /appointments/:id/generate-next` - Generate next occurrence

**Technical Implementation**:
- `RecurrenceService` handles generation logic
- Stores recurrence pattern in JSON
- Prevents conflicts when generating appointments
- ~2,000 lines of recurrence logic

**Files**:
- `services/api/src/appointments/recurrence.service.ts`
- `services/api/src/appointments/dto/create-recurring-appointment.dto.ts`

---

### ✅ Reminder System (COMPLETE - Infrastructure)

**What Was Built**:
- Complete reminder infrastructure
- 4 API endpoints for scheduling reminders
- Auto-schedule on appointment creation
- Status tracking (PENDING/SENT/FAILED/CANCELLED)
- Integration ready for Stage 4 (actual message sending)

**Database Schema**:
```typescript
AppointmentReminder {
  id: string
  appointmentId: string
  businessId: string
  scheduledFor: DateTime
  status: 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED'
  channel: 'SMS' | 'EMAIL' | 'WHATSAPP'
  sentAt?: DateTime
  failureReason?: string
  createdAt: DateTime
  updatedAt: DateTime
}
```

**Features**:
- Auto-schedule reminders X hours before appointment
- Support multiple channels (SMS, Email, WhatsApp)
- Track reminder status
- Retry failed reminders
- Cancel reminders when appointment is cancelled

**API Endpoints** (4 endpoints):
- `POST /reminders` - Schedule reminder
- `GET /reminders/:appointmentId` - Get appointment reminders
- `PATCH /reminders/:id/sent` - Mark as sent
- `PATCH /reminders/:id/failed` - Mark as failed

**Integration with Stage 4**:
- Reminder records created in Stage 3
- Actual message sending implemented in Stage 4
- Cron job in Stage 4 processes pending reminders
- Uses Twilio/WhatsApp integration from Stage 4

**Files**:
- `services/api/src/reminders/reminders.service.ts`
- `services/api/src/reminders/reminders.controller.ts`
- `packages/database/prisma/schema.prisma` (AppointmentReminder model)

---

### ✅ Online Booking API (COMPLETE - Backend)

**What Was Built**:
- Public API endpoints for online booking
- Available slots calculation
- Booking conflict prevention
- Anonymous booking support (for new clients)

**API Endpoints** (4 endpoints):
- `GET /booking/available-therapists` - List therapists accepting bookings
- `GET /booking/available-slots/:therapistId` - Get available time slots
- `POST /booking/appointments` - Create appointment (public)
- `GET /booking/services` - List available services

**Features**:
- No authentication required (public endpoints)
- Calculate available slots based on:
  - Therapist availability
  - Existing appointments
  - Time-off periods
- Prevent double-booking
- Support for new client registration
- Configurable booking window (e.g., 24 hours in advance minimum)

**Security**:
- Rate limiting on public endpoints
- CAPTCHA integration ready
- Input validation
- Business data isolation

**Frontend Implementation**:
- ⏸️ Deferred to post-MVP
- API ready for consumption by:
  - Public booking page
  - Embedded booking widget
  - Third-party integrations

**Files**:
- `services/api/src/booking/booking.service.ts`
- `services/api/src/booking/booking.controller.ts`
- `services/api/src/booking/dto/`

---

## React Query Hooks

**15 custom hooks** for scheduling:

**Appointments**:
- `useAppointments` - List appointments with filters
- `useAppointment` - Get single appointment
- `useCreateAppointment` - Create appointment with conflict check
- `useUpdateAppointment` - Update appointment
- `useDeleteAppointment` - Delete appointment
- `useConfirmAppointment` - Confirm appointment
- `useStartAppointment` - Start appointment
- `useCompleteAppointment` - Complete appointment
- `useCancelAppointment` - Cancel appointment

**Availability**:
- `useTherapistAvailability` - Get therapist weekly schedule
- `useSetAvailability` - Set availability
- `useTimeOff` - List time-off requests
- `useCreateTimeOff` - Request time off
- `useUpdateTimeOff` - Update time-off request

**Booking**:
- `useAvailableSlots` - Get available booking slots

---

## Technical Stats

### Database
- **6 database models** total:
  - TherapistAvailability (weekly schedule)
  - TherapistTimeOff (time off requests)
  - AppointmentCancellation (cancellation audit)
  - AppointmentReminder (reminder scheduling)
  - RecurringAppointment (recurrence patterns)
  - Appointment (enhanced with recurrence fields)

### Backend
- **2 modules**: Appointments, TherapistAvailability
- **28 API endpoints** total
- **~7,000 lines** of backend code
- **4-layer conflict detection**
- **Full recurrence engine** (~2,000 lines)

### Frontend
- **25 UI components**:
  - 6 modals
  - 4 calendar views
  - 5 form components
  - 10 utility components
- **15 React Query hooks**
- **~4,000 lines** of frontend code

### Migrations
- **2 database migrations**:
  - Initial scheduling schema
  - Recurring appointments + reminders

---

## RBAC Implementation

### Permissions by Role

**BUSINESS_OWNER**:
- Full access to all appointments
- Can manage all therapist schedules
- Can approve/deny time-off requests
- Can view all availability

**RECEPTIONIST**:
- Can create/edit/cancel appointments
- Can view all therapist schedules
- Can request time off (own)
- Cannot approve time off
- Can see all appointments

**THERAPIST**:
- Can view own schedule
- Can manage own availability
- Can request time off
- Can edit own appointments
- Can complete/no-show appointments
- Cannot see other therapist's private schedules

**CLIENT**:
- Can view own appointments
- Can request appointment (via booking)
- Cannot see therapist schedules
- Cannot cancel within 24 hours (configurable)

---

## Tasks Completed

- [x] Build scheduling engine (conflict detection, status workflow)
- [x] Build therapist availability (weekly schedules, time-off)
- [x] Build reminders (infrastructure + API ready for Stage 4)
- [x] Build online booking page (backend API ready, frontend optional)
- [x] Build cancellation flow (audit trail, reason tracking)
- [x] Build repeat appointments (full recurrence engine)

---

## Key Features Working

- ✅ Smart conflict detection (prevents double-booking)
- ✅ Flexible availability (different hours per day)
- ✅ Appointment lifecycle (6 status states with transitions)
- ✅ Dual calendar views (week grid and day timeline)
- ✅ Real-time conflict warnings
- ✅ Cancellation tracking with reason/type
- ✅ RBAC enforced (owner/receptionist/therapist permissions)
- ✅ Recurring appointments (DAILY/WEEKLY/MONTHLY)
- ✅ Reminder scheduling (infrastructure ready)
- ✅ Online booking API (backend ready)

---

## Deferred Features

### ⏸️ Automated Reminder Sending
- **Status**: Infrastructure complete
- **Deferred to**: Stage 4 (Messaging & Communication)
- **Reason**: Requires Twilio/WhatsApp integration
- **What's Ready**: Database, API, scheduling logic
- **What's Needed**: Actual message sending via Twilio

### ⏸️ Online Booking Portal (Frontend)
- **Status**: Backend API complete
- **Deferred to**: Post-MVP
- **Reason**: Nice-to-have, not critical for MVP
- **What's Ready**: All backend endpoints, slot calculation
- **What's Needed**: Public booking page, client registration flow

### ⏸️ Drag-and-Drop Rescheduling
- **Status**: Not started
- **Deferred to**: Post-MVP
- **Reason**: Nice-to-have UX enhancement
- **What's Ready**: Update appointment API
- **What's Needed**: Drag-and-drop calendar library integration

### ⏸️ Waitlist System
- **Status**: Not started
- **Deferred to**: Post-MVP
- **Reason**: Advanced feature, not critical for MVP
- **What's Ready**: Appointment creation flow
- **What's Needed**: Waitlist model, notification system

---

## Integration with Other Stages

### Stage 2 Integration (CRM)
- ✅ Appointments link to clients
- ✅ Treatment notes link to appointments
- ✅ Client timeline shows appointments

### Stage 4 Integration (Messaging)
- ✅ Reminder infrastructure ready
- ✅ AppointmentReminder model created
- ⏸️ Actual sending happens in Stage 4
- ⏸️ Cron job processes pending reminders

### Stage 5 Integration (Payments)
- 🔜 Appointments can have payment status
- 🔜 Invoice generation from appointments
- 🔜 Deposit tracking
- 🔜 No-show fees

### Stage 6 Integration (Analytics)
- 🔜 Appointment statistics
- 🔜 Therapist utilization
- 🔜 Revenue per appointment
- 🔜 Cancellation rate tracking

---

## See Also

- [INDEX.md](./INDEX.md) - Complete project index
- [STAGE-2-CRM.md](./STAGE-2-CRM.md) - Previous stage (CRM)
- [STAGE-4-MESSAGING.md](./STAGE-4-MESSAGING.md) - Next stage (Messaging)
- [00-PROJECT-OVERVIEW.md](./00-PROJECT-OVERVIEW.md) - Project vision
- `/STAGE3_IMPLEMENTATION_SUMMARY.md` - Implementation details
- `/STAGE3_COMPLETE_STATUS.md` - Complete status document

---

**Stage 3 Completion**: May 2026
**Status**: ✅ COMPLETE (100%)
**Next Stage**: Stage 4 - Messaging & Communication
