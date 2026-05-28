# Cliniko Feature Parity & Differentiation Plan

**Last Updated**: 2026-05-26
**Goal**: Close all feature gaps with Cliniko and exploit the pain points their users complain about to build a meaningfully better product.

---

## Index

| # | Phase | Focus |
|---|-------|-------|
| 1 | [Cliniko Feature Parity](#phase-1--cliniko-feature-parity) | Features Cliniko has that we are missing |
| 2 | [Differentiation — Pain Points](#phase-2--differentiation--cliniko-pain-points) | Turn Cliniko user complaints into our strengths |
| 3 | [Platform & Ecosystem](#phase-3--platform--ecosystem) | Public API, integrations, scalability |

---

## Phase 1 — Cliniko Feature Parity

> Close the gaps. These are features Cliniko ships that we do not yet have.

- [ ] **Phase 1 complete**

---

### 1.1 Treatment Note Template Library

> Cliniko has customizable built-in templates. Jane (competitor) has 14,000+ community-shared templates. We only have SOAP notes today.

- [x] **1.1.1 — Template Data Model**
  - [x] Add `NoteTemplate` Prisma model: `id`, `businessId` (nullable for global), `name`, `category`, `fields` (JSON), `isGlobal`, `createdBy`, `createdAt`
  - [x] Add `fields` JSON schema: array of `{ label, type (text|checkbox|scale|body-map|signature), required, placeholder }`
  - [x] Create Prisma migration
  - [x] Seed 10 built-in global templates: SOAP, Initial Assessment, Progress Note, Discharge Summary, Remedial Massage, Sports Injury, Pregnancy Massage, Postural Assessment, Pain Scale, Movement Screen

- [x] **1.1.2 — Template Management UI**
  - [x] Create `/treatment-notes/templates` page
  - [x] Template list view: global templates tab + business custom templates tab
  - [x] Template builder: drag-and-drop field ordering, field type selector, preview pane
  - [x] Duplicate, edit, archive template actions
  - [x] Tag/category system for filtering (Massage, Chiro, Physio, General)

- [x] **1.1.3 — Template Usage in Notes**
  - [x] On new note creation, show template picker modal before opening editor
  - [x] Pre-fill note fields from selected template
  - [x] Allow switching templates mid-note (with confirmation if fields are populated)
  - [x] Show which template was used on saved notes

- [x] **1.1.4 — Community Template Sharing**
  - [x] "Share template" action — submits to a global moderated library
  - [x] Community library browse page with search, category filter, usage count
  - [x] One-click "Import to my templates" from community library
  - [x] Admin moderation queue for submitted templates

---

### 1.2 Group Sessions

> Cliniko supports one appointment slot with multiple clients (group classes, workshops). We have no group booking concept.

- [x] **1.2.1 — Data Model**
  - [x] Add `isGroup` boolean and `capacity` integer to `Appointment` model
  - [x] Add `GroupBooking` join table: `appointmentId`, `clientId`, `status`, `paidAt`
  - [x] Create Prisma migration

- [x] **1.2.2 — Staff-side Group Appointment Creation**
  - [x] Add "Group session" toggle when creating an appointment
  - [x] Capacity input field (max clients per session)
  - [x] Client search/add to session — multi-select within the booking form
  - [x] Group session shown on calendar with attendee count badge (e.g., "Yoga — 4/8")
  - [x] Attendee list view inside appointment detail modal
  - [x] Mark individual attendees as attended/no-show

- [x] **1.2.3 — Public Booking for Group Sessions**
  - [x] Group sessions appear on public booking page with "X spots remaining"
  - [x] Client selects a group session and books one spot
  - [x] Confirmation email/SMS includes group session details

- [x] **1.2.4 — Billing for Group Sessions**
  - [x] Invoice generated per attendee (not per session)
  - [ ] Package/membership credits deductible per group session booking
  - [ ] Refund flow for individual cancellations within a group session

---

### 1.3 Waitlist Management

> When a slot is full or cancelled, Cliniko automatically offers it to waitlisted clients. We have no waitlist.

- [x] **1.3.1 — Data Model**
  - [x] Add `Waitlist` model: `id`, `businessId`, `clientId`, `therapistId` (nullable), `serviceType`, `preferredDates` (JSON), `preferredTimes` (JSON), `status` (`WAITING` | `OFFERED` | `BOOKED` | `EXPIRED`), `createdAt`
  - [x] Create Prisma migration

- [x] **1.3.2 — Waitlist API**
  - [x] `POST /api/waitlist` — add client to waitlist
  - [x] `GET /api/waitlist` — list waitlisted clients for business
  - [x] `DELETE /api/waitlist/:id` — remove from waitlist
  - [x] Auto-trigger: when appointment is cancelled, query waitlist for matching criteria and notify matching clients

- [x] **1.3.3 — Staff UI**
  - [x] Waitlist tab on appointments page
  - [x] Table: client name, requested service, therapist preference, date preference, wait duration
  - [x] "Offer slot" action — sends SMS/email to waitlisted client with booking link
  - [x] Auto-offer toggle (send automatically on cancellation, first-come-first-served)
  - [x] Expiry setting: offer link expires after N hours (configurable)

- [x] **1.3.4 — Client-facing Waitlist**
  - [x] "Join waitlist" button on public booking page when no slots are available
  - [x] Client receives SMS/email when a matching slot opens
  - [x] One-click booking link in notification (pre-filled, no re-entry needed)

---

### 1.4 Recurring Appointments

> Cliniko lets clients book a repeating series (e.g., every Tuesday at 2pm for 8 weeks). Our booking only supports one-off appointments.

- [x] **1.4.1 — Data Model**
  - [x] Add `RecurringRule` model: `id`, `frequency` (`DAILY` | `WEEKLY` | `FORTNIGHTLY` | `MONTHLY`), `interval`, `daysOfWeek` (JSON), `endAfterOccurrences`, `endDate`, `appointmentIds` (relation)
  - [x] Link `Appointment` → `recurringRuleId` (nullable)
  - [x] Create Prisma migration

- [x] **1.4.2 — Recurring Booking UI (Staff)**
  - [x] "Repeat" toggle in appointment creation form
  - [x] Frequency selector: weekly / fortnightly / monthly
  - [x] Day-of-week picker for weekly rules
  - [x] End condition: after N sessions OR on a specific date
  - [x] Preview list of generated dates before confirming
  - [x] Edit options on existing recurring appointment: "this appointment only" | "this and following" | "all in series"
  - [x] Cancel options: same three scopes

- [x] **1.4.3 — Recurring Booking (Public Booking Page)**
  - [x] Checkbox "Book as recurring series" on public booking flow
  - [x] Frequency and end-date pickers
  - [x] Show generated schedule before confirming
  - [ ] Block if any slot in series is unavailable (show conflict)

- [x] **1.4.4 — Reminders for Series**
  - [x] Single reminder rule covers all appointments in series
  - [ ] Option to send reminder only for next occurrence vs. all upcoming

---

### 1.5 Online Booking Access Controls

> Cliniko lets practices restrict online booking to existing clients only. Our public booking page is open to anyone.

- [x] **1.5.1 — Business Setting**
  - [x] Add `bookingMode` to business settings: `PUBLIC` | `EXISTING_CLIENTS_ONLY` | `INVITE_ONLY`
  - [x] Settings UI under Settings → Booking → Access

- [x] **1.5.2 — Existing Clients Only Mode**
  - [x] Public booking page prompts for email/phone before showing availability
  - [x] Validate against client records — only proceed if match found
  - [x] Show "Contact us to register as a new client" message if no match

- [x] **1.5.3 — Invite-Only Mode**
  - [x] Generate unique booking link per client (token-based, expires optionally)
  - [x] Staff action "Send booking invite" on client profile
  - [x] Booking link pre-fills client details and bypasses access check

---

### 1.6 Fine-grained Availability Rules

> Cliniko lets you restrict specific appointment types to specific rooms, therapists, or time blocks. We only have basic therapist hours.

- [x] **1.6.1 — Data Model**
  - [x] Add `AvailabilityRule` model: `therapistId` (nullable), `roomId` (nullable), `serviceType` (nullable), `daysOfWeek` (JSON), `startTime`, `endTime`, `priority`
  - [x] Add `Room` model: `id`, `businessId`, `name`, `color`, `capacity`
  - [x] Create Prisma migration

- [x] **1.6.2 — Room Management**
  - [x] Rooms list under Settings → Locations → Rooms
  - [x] Create, edit, archive rooms
  - [x] Assign room to appointment (optional) in booking form
  - [ ] Room column view in calendar (resource view)

- [x] **1.6.3 — Availability Rule Builder**
  - [x] UI: Settings → Scheduling → Availability Rules
  - [x] Rule targets: "Therapist X" | "Room Y" | "Service Type Z" | combinations
  - [x] Time block input: days of week + start/end time
  - [ ] Rules shown in calendar as greyed-out unavailable blocks
  - [x] Booking form respects rules: hides time slots that violate any rule

---

### 1.7 Passkey Authentication

> Cliniko added passkeys in 2025. We are email/password only.

- [x] **1.7.1 — Backend**
  - [x] Enable Supabase passkey support (WebAuthn) in project settings
  - [x] Update `apps/web/lib/supabase/` client to handle passkey sign-in flow

- [x] **1.7.2 — Frontend**
  - [x] "Add passkey" button on Settings → Security
  - [x] Passkey sign-in option on `/sign-in` page (alongside email/password)
  - [x] Fallback to password if passkey auth fails
  - [x] Show registered passkeys list with revoke option

---

## Phase 2 — Differentiation — Cliniko Pain Points

> These are things Cliniko users actively complain about. We can build these better and use them as marketing differentiators.

- [ ] **Phase 2 complete**

---

### 2.1 SMS & Email Delivery Reliability Dashboard

> Cliniko's #1 complaint: messages show "sent" but patients never receive them. We use Twilio — leverage it.

- [x] **2.1.1 — Delivery Tracking Data Model**
  - [x] Add `MessageLog` model: `id`, `appointmentId` (nullable), `clientId`, `channel` (`SMS` | `EMAIL` | `WHATSAPP`), `status` (`QUEUED` | `SENT` | `DELIVERED` | `FAILED` | `UNDELIVERED`), `providerMessageId`, `errorCode`, `sentAt`, `deliveredAt`
  - [x] Create Prisma migration

- [x] **2.1.2 — Twilio Webhook Handler**
  - [x] `POST /api/webhooks/twilio/status` — receive Twilio delivery status callbacks
  - [x] Update `MessageLog.status` on each callback event
  - [x] Retry logic: auto-retry FAILED messages once after 5 minutes

- [x] **2.1.3 — SendGrid Webhook Handler**
  - [x] `POST /api/webhooks/resend/events` — receive Resend delivery events (we use Resend, not SendGrid)
  - [x] Map Resend events (`delivered`, `bounced`, `delivery_delayed`) → `MessageLog.status`

- [x] **2.1.4 — Delivery Dashboard UI**
  - [x] Communications → Delivery Reports tab (sidebar link + `/communications/delivery-reports` page)
  - [x] Stats row: total sent, delivered %, failed %, pending
  - [x] Per-message table: client, channel, message type, status badge, timestamp
  - [x] Filter by: date range, channel, status
  - [x] Failed message actions: retry, mark resolved
  - [x] Alert banner on dashboard when delivery failure rate exceeds 5%

- [x] **2.1.5 — Client-level Delivery History**
  - [x] Client profile → Communications tab shows all message history with delivery status
  - [x] Staff can see at a glance if a reminder was actually received before calling to follow up

---

### 2.2 Two-way Accounting Integration

> Cliniko's Xero sync is one-way only. Invoices changed in Xero don't flow back. Users find this deeply frustrating.

- [x] **2.2.1 — Xero Integration**
  - [x] OAuth 2.0 connection flow: Settings → Integrations → Xero → Connect
  - [x] Sync invoices from app → Xero on creation and update (two-way)
  - [x] Sync payments from Xero → app when marked paid in Xero
  - [x] Webhook from Xero for real-time sync (vs. polling)
  - [x] Conflict resolution UI: show diff when both sides changed, let staff pick winner
  - [x] Disconnect and re-sync option

- [x] **2.2.2 — QuickBooks Integration**
  - [x] Same two-way sync as Xero (parallel implementation)
  - [x] OAuth 2.0 connection flow
  - [x] Invoice and payment sync
  - [x] Webhook-based real-time updates

- [x] **2.2.3 — Sync Logs**
  - [x] Settings → Integrations → Sync Logs table
  - [x] Per-record: entity type, direction, status, timestamp, error message
  - [x] Manual "Force sync" button per integration

---

### 2.3 Staff Task Management

> Cliniko has no task system. Users specifically call this out as missing. Practices need to assign follow-up tasks to staff.

- [x] **2.3.1 — Data Model**
  - [x] Add `Task` model: `id`, `businessId`, `assignedToId`, `createdById`, `title`, `description`, `dueDate`, `priority` (`LOW` | `MEDIUM` | `HIGH` | `URGENT`), `status` (`TODO` | `IN_PROGRESS` | `DONE`), `relatedClientId` (nullable), `relatedAppointmentId` (nullable), `completedAt`
  - [x] Create Prisma migration

- [x] **2.3.2 — Task API**
  - [x] `POST /api/tasks` — create task
  - [x] `GET /api/tasks` — list tasks (filterable by assignee, status, priority, due date)
  - [x] `PATCH /api/tasks/:id` — update task
  - [x] `DELETE /api/tasks/:id` — delete task

- [x] **2.3.3 — Task UI**
  - [x] Add "Tasks" to dashboard sidebar navigation
  - [x] Tasks page: Kanban view (Todo | In Progress | Done) + List view toggle
  - [x] Task card: title, assignee avatar, due date, priority color, linked client/appointment chip
  - [ ] Create task from appointment detail modal ("Add follow-up task")
  - [ ] Create task from client profile
  - [x] Dashboard widget: "My tasks due today" with count badge on sidebar icon
  - [x] Overdue tasks highlighted in red

- [x] **2.3.4 — Task Notifications**
  - [ ] Push notification when task assigned to you
  - [x] Daily digest email at 8am: tasks due today
  - [ ] Reminder push notification 1 hour before task due time

---

### 2.4 Advanced Reporting

> Cliniko users consistently say reports "could be more detailed." This is a major switching reason.

- [x] **2.4.1 — Revenue Reports**
  - [x] Revenue by therapist (table + bar chart)
  - [x] Revenue by service type (table + pie chart)
  - [x] Revenue by month with YoY comparison (area chart with prior year overlay)
  - [x] Outstanding invoices ageing report (30/60/90+ days) — new INVOICE_AGEING report type
  - [x] Average invoice value trend (line chart by month)

- [x] **2.4.2 — Client Reports**
  - [x] Client retention rate (% returning within 90 days)
  - [x] New vs. returning clients per month (stacked bar chart)
  - [x] Client lifetime value (total spend)
  - [x] Lapsed clients report (no visit in X days — configurable)
  - [ ] Referral source breakdown (where clients come from) — skipped: no referral source field in client schema

- [x] **2.4.3 — Appointment Reports**
  - [x] Utilisation rate per therapist (booked hours / available hours) — in Therapist report
  - [x] No-show and cancellation rate per therapist / overall (bar chart + table)
  - [x] Peak hours heatmap (day of week × hour of day) — full heatmap grid
  - [x] Average appointment duration by service type (bar chart)

- [x] **2.4.4 — Export & Scheduling**
  - [x] Export any report to CSV (Download CSV button in report viewer)
  - [x] Scheduled reports: configure a report to email to owner weekly/monthly
  - [x] Date range presets: this week, last month, last quarter, custom (This Month + Last Month added)

---

### 2.5 Cross-Therapist Note Access & Sign-off Workflow

> Cliniko users complain they can't read or sign off on a colleague's draft notes. Critical for supervision workflows.

- [x] **2.5.1 — Draft Note Visibility Rules**
  - [x] Business setting: "Draft notes visible to" — `Only Author` | `All Therapists` | `Business Owner Only`
  - [x] Business owner can always see all drafts regardless of setting

- [x] **2.5.2 — Supervisor Sign-off**
  - [x] Note statuses: `DRAFT` → `PENDING_REVIEW` → `APPROVED` | `REJECTED`
  - [x] Therapist can submit note for review — assigns to a supervisor (dropdown)
  - [x] Supervisor sees a "Pending Review" queue in treatment notes
  - [x] Supervisor can approve (locks note) or reject with comment (returns to author)
  - [x] Approval history shown on note: who approved, when

- [x] **2.5.3 — UI**
  - [x] "Submit for review" button on draft note toolbar
  - [x] Reviewer queue: Treatment Notes → Pending Review tab
  - [x] Approve / Reject with comment modal
  - [x] Status badge on note list: Draft, In Review, Approved

---

### 2.6 Self-serve Data Export

> Cliniko users report needing to contact support to export their data. We have an exports page — make it great.

- [x] **2.6.1 — Export Coverage**
  - [x] Clients export: all fields, intake answers, custom fields
  - [x] Appointments export: date range filter, therapist filter, status filter
  - [x] Invoices & payments export: date range, paid/unpaid filter
  - [x] Treatment notes export: date range, therapist, client
  - [x] Full practice data export (all of the above in one ZIP)

- [x] **2.6.2 — Export Formats**
  - [x] CSV for all data types
  - [x] PDF for treatment notes (formatted, printable)
  - [x] JSON for developers / migration use

- [x] **2.6.3 — Scheduled & Automated Exports**
  - [x] Schedule recurring exports (daily/weekly/monthly) to email
  - [x] Export history log: file, date, who triggered it, download link (expires 7 days)
  - [x] One-click full data export for GDPR / client data requests

---

### 2.7 Bundled SMS — No Add-on Cost

> Cliniko charges extra for SMS. Build SMS cost into the subscription and market it as included.

- [x] **2.7.1 — SMS Credit System**
  - [x] Add `smsCreditsIncluded` and `smsCreditsUsed` to subscription plan model
  - [x] Track Twilio SMS cost per message in `MessageLog`
  - [x] Dashboard widget: SMS credits used this billing period

- [x] **2.7.2 — Overage Handling**
  - [x] Notify business owner when 80% of monthly SMS credits used
  - [x] Auto-purchase overage credits via Stripe (opt-in setting)
  - [x] Hard stop option: disable SMS when credits exhausted (opt-in)

- [x] **2.7.3 — Pricing Page & Marketing Copy**
  - [x] Update pricing page to show SMS as included
  - [x] Show credit allowance per plan tier (e.g., Starter: 200 SMS/mo, Pro: 1000/mo)

---

### 2.8 Restrict Booking to Existing Clients (Improved)

> Listed under Phase 1.5 — already covered. Cross-reference: [[phase-1-booking-access-controls]]

---

## Phase 3 — Platform & Ecosystem

> Make the platform extensible and scalable. These are table-stakes for competing at a higher tier.

- [ ] **Phase 3 complete**

---

### 3.1 Public API & Developer Docs

> Cliniko has a well-documented public API that third-party tools integrate with natively. We need the same.

- [x] **3.1.1 — API Keys**
  - [x] `ApiKey` model: `id`, `businessId`, `name`, `keyHash`, `permissions` (JSON scopes), `lastUsedAt`, `expiresAt` (nullable)
  - [x] Settings → Developer → API Keys page: generate API key with scope selector (read-only, read-write, specific resources)
  - [x] Key shown once on creation (only hash stored)
  - [x] Revoke key action

- [x] **3.1.2 — API Key Authentication**
  - [x] API middleware: accept `Authorization: ApiKey <key>` in addition to Bearer JWT
  - [x] Rate limiting per API key: 1000 req/hour default (noted in docs; enforced at infra layer)

- [x] **3.1.3 — Developer Documentation Site**
  - [x] OpenAPI 3.0 spec served at `/api/developer/openapi`
  - [x] Settings → Developer page with authentication docs and curl examples
  - [ ] Interactive "Try it" panel (Swagger UI or Scalar) — future enhancement
  - [x] Code examples in curl for each endpoint

- [ ] **3.1.4 — Zapier / Make Integration**
  - [ ] Register as Zapier app with triggers: new appointment, new client, invoice paid
  - [ ] Register actions: create appointment, create client, send message
  - [ ] Same for Make (formerly Integromat)

---

### 3.2 Webhooks

> Allow businesses and third-party developers to subscribe to real-time events.

- [x] **3.2.1 — Data Model**
  - [x] `Webhook` model: `id`, `businessId`, `url`, `events` (JSON array), `secret`, `isActive`, `lastTriggeredAt`, `failureCount`
  - [x] `WebhookDelivery` model: `id`, `webhookId`, `event`, `payload`, `statusCode`, `responseBody`, `attemptedAt`, `succeeded`
  - [x] Create Prisma migration

- [x] **3.2.2 — Webhook Engine**
  - [x] Event publisher: emit events on appointment create/update/cancel, invoice paid/created, client create, note completed
  - [x] Delivery worker: POST payload to subscriber URL with HMAC-SHA256 signature header (`X-Webhook-Signature`)
  - [x] Retry: exponential backoff, up to 5 attempts
  - [x] Disable webhook after 10 consecutive failures

- [x] **3.2.3 — Webhook Management UI**
  - [x] Settings → Integrations → Webhooks (linked from integrations page)
  - [x] Add endpoint: URL, select events to subscribe
  - [x] Delivery log per webhook: event, status code, timestamp
  - [x] Test button: sends a `ping` event to verify endpoint
  - [x] Signing secret shown once on creation with copy button
  - [x] Signature verification code example shown in UI

---

### 3.3 Multi-location Scalability

> Cliniko supports multi-location but users say it struggles at scale. We should build this properly from the start.

- [x] **3.3.1 — Location Model**
  - [x] Add `Location` model: `id`, `businessId`, `name`, `address`, `phone`, `timezone`, `isActive`
  - [x] Link `Therapist`, `Room`, `Appointment` → `locationId`; added `TherapistLocation` join table for multi-location
  - [x] Create Prisma migration (20260530000000_multi_location_client_portal)

- [x] **3.3.2 — Location Management UI**
  - [x] Settings → Locations: list, create, edit, deactivate (already existed, enhanced with timezone field)
  - [x] Each location has its own rooms and therapist assignments (rooms tab + assign therapists modal)
  - [x] Calendar: location filter dropdown (show all or specific location)
  - [ ] Reports: filter by location

- [x] **3.3.3 — Cross-location Staff**
  - [x] Therapist can be assigned to multiple locations (`TherapistLocation` join table added)
  - [ ] Availability set per location
  - [x] Public booking page: client picks location first — location filter chips on therapist step

- [x] **3.3.4 — Location-level Permissions**
  - [x] Role: `LOCATION_MANAGER` added to `UserRole` enum
  - [x] Business owner sees all locations (enforced in `requireBusinessAccess`)
  - [x] `requireLocationAccess` helper added to api-auth for location-scoped enforcement

---

### 3.4 Client Portal

> Give clients a self-service login to view their appointments, invoices, and notes.

- [x] **3.4.1 — Client Auth**
  - [x] Client sign-up / sign-in at `/client-portal/sign-in`
  - [x] Supabase auth for clients (same Supabase project, separate session)
  - [x] Link client auth user → `Client` record via email match

- [x] **3.4.2 — Client Portal Pages**
  - [x] `/client-portal/appointments` — upcoming and past appointments with tabs
  - [x] `/client-portal/invoices` — view invoices and payment history
  - [x] `/client-portal/intake-forms` — view and complete outstanding intake forms
  - [x] `/client-portal/documents` — approved treatment summaries shared by care team

- [x] **3.4.3 — Staff Controls**
  - [x] Toggle: enable/disable client portal per business (Settings → Client Portal tab)
  - [x] Choose which records are visible to clients (invoices, intake forms, documents toggles)
  - [x] "Send portal invite" button on client profile (`/api/clients/[id]/portal-invite`)

---

## Summary — Priority Order

| Priority | Phase | Section | Effort |
|----------|-------|---------|--------|
| 🔴 High | 2 | 2.1 SMS/Email Delivery Dashboard | Small |
| 🔴 High | 1 | 1.1 Note Template Library | Medium |
| 🔴 High | 2 | 2.3 Staff Task Management | Medium |
| 🔴 High | 1 | 1.3 Waitlist Management | Medium |
| 🟡 Medium | 1 | 1.2 Group Sessions | Large |
| 🟡 Medium | 1 | 1.4 Recurring Appointments | Large |
| 🟡 Medium | 2 | 2.4 Advanced Reporting | Medium |
| 🟡 Medium | 2 | 2.5 Note Sign-off Workflow | Small |
| 🟡 Medium | 2 | 2.6 Self-serve Data Export | Small |
| 🟠 Lower | 1 | 1.5 Booking Access Controls | Small |
| 🟠 Lower | 1 | 1.6 Fine-grained Availability Rules | Large |
| 🟠 Lower | 1 | 1.7 Passkey Auth | Small |
| 🟠 Lower | 2 | 2.2 Two-way Xero/QuickBooks | Large |
| 🟠 Lower | 2 | 2.7 Bundled SMS Pricing | Small |
| 🔵 V2 | 3 | 3.1 Public API & Docs | Large |
| 🔵 V2 | 3 | 3.2 Webhooks | Medium |
| 🔵 V2 | 3 | 3.3 Multi-location Scalability | Large |
| 🔵 V2 | 3 | 3.4 Client Portal | Large |
