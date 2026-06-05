# MVP Launch Plan — Iris

> Generated: 2026-06-04  
> Status: In Progress  
> Goal: Close all functional gaps before first real-user launch.

---

## Index

| ID | Title | Phase | Status |
|----|-------|-------|--------|
| [1.0](#phase-1-services--treatment-types) | Services & Treatment Types | 1 | ✅ |
| [1.1](#11-prisma-schema--migration) | Prisma schema + migration | 1 | ✅ |
| [1.2](#12-api-routes) | API routes (CRUD) | 1 | ✅ |
| [1.3](#13-react-query-hooks) | React Query hooks | 1 | ✅ |
| [1.4](#14-services-management-page) | Services management page | 1 | ✅ |
| [1.5](#15-sidebar-nav-entry) | Sidebar nav entry | 1 | ✅ |
| [1.6](#16-dynamic-services-on-public-booking-page) | Dynamic services on public booking page | 1 | ✅ |
| [1.7](#17-dynamic-services-in-newsessionmodal) | Dynamic services in NewSessionModal | 1 | ✅ |
| [2.0](#phase-2-booking-settings-expansion) | Booking Settings Expansion | 2 | ✅ |
| [2.1](#21-schema-fields) | Schema fields (cancellation, deposit, notice, buffer) | 2 | ✅ |
| [2.2](#22-expand-bookingtab-in-settingspagetsx) | Expand BookingTab in settings/page.tsx | 2 | ✅ |
| [2.3](#23-enforce-cancellation-window-in-api) | Enforce cancellation window in cancel API | 2 | ✅ |
| [2.4](#24-enforce-deposit--min-notice-on-public-booking) | Enforce deposit + min-notice on public booking | 2 | ✅ |
| [3.0](#phase-3-settings-navigation-fixes) | Settings Navigation Fixes | 3 | ✅ |
| [3.1](#31-add-availability-rules-to-settings-nav) | Add Availability Rules to settings nav | 3 | ✅ |
| [3.2](#32-add-reminders-link-to-settings-nav) | Add Reminders link to settings nav | 3 | ✅ |
| [3.3](#33-scheduling-availability-rules-link-in-settings-layout) | Scheduling → Availability Rules in settings layout | 3 | ✅ |
| [4.0](#phase-4-clinical-settings-expansion) | Clinical Settings Expansion | 4 | ✅ |
| [4.1](#41-intake-form-auto-assignment-per-service) | Intake form auto-assignment per service | 4 | ✅ |
| [4.2](#42-default-soap-note-template-per-service) | Default SOAP note template per service | 4 | ✅ |

---

## Phase 1 — Services & Treatment Types

**Why this is first:** Services are currently hardcoded strings in both the public booking page (`['Swedish Massage', 'Deep Tissue Massage', ...]`) and a free-text input in the New Session modal. There is no `Service` model in the schema. A business owner cannot define their own catalog (name, duration, price, description) without code changes. This blocks a real launch entirely.

---

### 1.1 Prisma schema + migration

- [x] **1.1.1** Add `Service` model to `packages/database/prisma/schema.prisma`:
  ```
  model Service {
    id          String   @id @default(cuid())
    businessId  String
    name        String
    description String?
    duration    Int      // minutes
    price       Float
    color       String?  // hex, for calendar display
    isActive    Boolean  @default(true)
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt
    business    Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
    appointments Appointment[]
    @@map("services")
  }
  ```
- [x] **1.1.2** Add `serviceId String?` foreign key to `Appointment` model (nullable to keep existing data valid)
- [x] **1.1.3** Add `services Service[]` back-relation to `Business` model
- [x] **1.1.4** Run `prisma migrate dev --name add_services` and verify migration applies cleanly (used `db push` in dev environment)

---

### 1.2 API routes

- [x] **1.2.1** Create `apps/web/app/api/services/route.ts` — `GET` (list by businessId) + `POST` (create)
- [x] **1.2.2** Create `apps/web/app/api/services/[id]/route.ts` — `GET`, `PATCH`, `DELETE`
- [x] **1.2.3** Add auth guard (requireBusinessMember) to all routes consistent with other API routes
- [x] **1.2.4** On `DELETE`, soft-delete (set `isActive = false`) if service has linked appointments; hard-delete otherwise

---

### 1.3 React Query hooks

- [x] **1.3.1** Create `apps/web/lib/hooks/use-services.ts` with hooks:
  - `useServices(businessId)` — list active services
  - `useCreateService(businessId)`
  - `useUpdateService(businessId)`
  - `useDeleteService(businessId)`
- [x] **1.3.2** Export from `apps/web/lib/hooks/index.ts`

---

### 1.4 Services management page

- [x] **1.4.1** Create `apps/web/app/(dashboard)/services/page.tsx`
- [x] **1.4.2** Table/card list of services showing: name, duration, price, active toggle
- [x] **1.4.3** "Add Service" modal with fields: name, description, duration (preset options + custom), price, color picker, active toggle
- [x] **1.4.4** Inline edit and delete with confirmation
- [x] **1.4.5** Empty state with prompt to add first service
- [x] **1.4.6** Wrap in `PermissionGuard` (owner/manager only for create/edit/delete)

---

### 1.5 Sidebar nav entry

- [x] **1.5.1** Add "Services" nav item to `packages/ui/src/Sidebar.tsx` under the Appointments/Clients group, with `href: '/services'` and a `Scissors` or `Sparkles` icon

---

### 1.6 Dynamic services on public booking page

- [x] **1.6.1** In `apps/web/app/book/[businessId]/page.tsx`, replace the hardcoded `SERVICES` array (line ~49) with a `useEffect` fetch to `/api/public/booking/[businessId]/services`
- [x] **1.6.2** Create public route `apps/web/app/api/public/booking/[businessId]/services/route.ts` — returns active services for the business (no auth required)
- [x] **1.6.3** On Step 2 (service selection), render services fetched from API showing name, duration, and price
- [x] **1.6.4** Pass selected service's `id` and `duration` into the booking payload instead of the freetext string
- [x] **1.6.5** Handle empty state (no services configured) with a fallback message

---

### 1.7 Dynamic services in NewSessionModal

- [x] **1.7.1** In `apps/web/components/new-session/NewSessionModal.tsx`, replace the free-text `serviceType` input with a `<select>` or searchable dropdown populated by `useServices(businessId)`
- [x] **1.7.2** Auto-fill `duration` and `price` fields when a service is selected
- [x] **1.7.3** Allow manual override of duration and price post-selection
- [x] **1.7.4** Pass `serviceId` in addition to `serviceType` string to the appointments API

---

## Phase 2 — Booking Settings Expansion

**Why this is second:** The Booking tab in settings only controls who can book (Public / Existing clients / Invite only). Missing: cancellation policy, deposit requirements, minimum advance notice, and buffer time. These are table-stakes for any real business.

---

### 2.1 Schema fields

- [x] **2.1.1** Add fields to `Business` model in schema:
  ```
  cancellationWindowHours  Int     @default(24)   // hours before appt cancellation is allowed
  depositRequired          Boolean @default(false)
  depositAmount            Float?                  // fixed $ or percentage (see depositType)
  depositType              String  @default("PERCENT") // "PERCENT" | "FIXED"
  minBookingNoticeHours    Int     @default(1)    // minimum hours ahead a client can book
  maxBookingWindowDays     Int     @default(60)   // how far ahead clients can book
  appointmentBufferMinutes Int     @default(0)    // gap between appointments
  ```
- [x] **2.1.2** Run `prisma migrate dev --name add_booking_settings` (used `db push` in dev environment)

---

### 2.2 Expand BookingTab in settings/page.tsx

- [x] **2.2.1** Add form fields to `BookingTab` (around line 1716 in `settings/page.tsx`):
  - Cancellation policy: number input for hours notice required
  - Minimum advance notice: hours selector (0, 1, 2, 4, 12, 24, 48)
  - Maximum booking window: days selector (7, 14, 30, 60, 90, 180)
  - Appointment buffer: minutes selector (0, 5, 10, 15, 30)
- [x] **2.2.2** Add deposit section with toggle (required/not) + amount input + type toggle (% or $)
- [x] **2.2.3** Wire to `useUpdateBusiness` mutation (consistent with existing BookingTab pattern)

---

### 2.3 Enforce cancellation window in API

- [x] **2.3.1** In `apps/web/app/api/appointments/[id]/cancel/route.ts`, fetch business `cancellationWindowHours` and reject client-initiated cancellations that are within the window
- [x] **2.3.2** Return a clear error message with the policy (e.g., "Cancellations require 24 hours notice")
- [x] **2.3.3** Skip enforcement for staff/owner-initiated cancellations

---

### 2.4 Enforce deposit + min-notice on public booking

- [x] **2.4.1** In the public booking API (`/api/public/booking/[businessId]`), validate `startTime` is at least `minBookingNoticeHours` from now
- [x] **2.4.2** In `apps/web/app/book/[businessId]/page.tsx` Step 3 (date/time), filter out slots within the min-notice window client-side
- [x] **2.4.3** If `depositRequired`, show deposit amount on Step 5 (confirm) — Stripe payment gate deferred to post-MVP (requires full payment collection UI + webhooks)
- [x] **2.4.4** Apply `appointmentBufferMinutes` in the slots calculation in `apps/web/app/api/public/booking/[businessId]/slots/route.ts`

---

## Phase 3 — Settings Navigation Fixes

**Why this is third:** Two complete, working pages (`/settings/scheduling` — Availability Rules, and `/settings/reminders` — per-trigger automation rules) are not reachable from the Settings navigation. Users can only get to them via direct URL or sidebar links, which is confusing and causes them to look incomplete.

---

### 3.1 Add Availability Rules to settings nav

- [x] **3.1.1** In `apps/web/app/(dashboard)/settings/layout.tsx`, add to the `Scheduling` group:
  ```ts
  { id: 'scheduling', label: 'Availability rules', icon: SlidersHorizontal, desc: 'Fine-grained booking windows', href: '/settings/scheduling' }
  ```
- [x] **3.1.2** Verify the `/settings/scheduling` page renders correctly when navigated from the settings sidebar

---

### 3.2 Add Reminders link to settings nav

- [x] **3.2.1** In `apps/web/app/(dashboard)/settings/layout.tsx`, add to the `Client experience` group (after Notifications):
  ```ts
  { id: 'reminders', label: 'Reminder rules', icon: Bell, desc: '10 trigger templates', href: '/settings/reminders' }
  ```
- [x] **3.2.2** Add a "Configure reminder rules →" link in the `NotificationsTab` in `settings/page.tsx` pointing to `/settings/reminders` so users discover it from the channel toggles

---

### 3.3 Scheduling — Availability Rules link in settings layout

- [x] **3.3.1** Verify the settings layout nav `SlidersHorizontal` icon is imported; add import if missing
- [x] **3.3.2** Smoke-test all settings nav links after changes to confirm none are broken

---

## Phase 4 — Clinical Settings Expansion

**Why this is last:** The Clinical tab currently only controls "Draft Note Visibility". Useful for a clinical setup but not blocking an MVP. Add once the first three phases are shipped.

---

### 4.1 Intake form auto-assignment per service

- [x] **4.1.1** Add `defaultIntakeFormTemplateId String?` to `Service` model (Phase 1 prereq)
- [x] **4.1.2** Add intake form selector to the Service form modal (Phase 1.4)
- [x] **4.1.3** In the appointment creation flow, auto-attach the service's default intake form to the new appointment if one is configured
- [x] **4.1.4** Add a "Default intake form" row to the ClinicalTab in `settings/page.tsx` for the business-wide fallback

---

### 4.2 Default SOAP note template per service

- [x] **4.2.1** Add `defaultNoteTemplateId String?` to `Service` model
- [x] **4.2.2** In the treatment note creation flow, pre-select the template matching the appointment's service
- [x] **4.2.3** Add template selector to the Service form modal alongside the intake form selector

---

## Completion Order Summary

```
Phase 1 (blocking — do first)
  1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6 → 1.7

Phase 2 (important — do before soft launch)
  2.1 → 2.2 → 2.3 → 2.4

Phase 3 (polish — do before any user testing)
  3.1 → 3.2 → 3.3

Phase 4 (nice-to-have — post soft-launch)
  4.1 → 4.2
```
