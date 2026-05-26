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

- [ ] **1.3.1 — Data Model**
  - [ ] Add `Waitlist` model: `id`, `businessId`, `clientId`, `therapistId` (nullable), `serviceType`, `preferredDates` (JSON), `preferredTimes` (JSON), `status` (`WAITING` | `OFFERED` | `BOOKED` | `EXPIRED`), `createdAt`
  - [ ] Create Prisma migration

- [ ] **1.3.2 — Waitlist API**
  - [ ] `POST /api/waitlist` — add client to waitlist
  - [ ] `GET /api/waitlist` — list waitlisted clients for business
  - [ ] `DELETE /api/waitlist/:id` — remove from waitlist
  - [ ] Auto-trigger: when appointment is cancelled, query waitlist for matching criteria and notify matching clients

- [ ] **1.3.3 — Staff UI**
  - [ ] Waitlist tab on appointments page
  - [ ] Table: client name, requested service, therapist preference, date preference, wait duration
  - [ ] "Offer slot" action — sends SMS/email to waitlisted client with booking link
  - [ ] Auto-offer toggle (send automatically on cancellation, first-come-first-served)
  - [ ] Expiry setting: offer link expires after N hours (configurable)

- [ ] **1.3.4 — Client-facing Waitlist**
  - [ ] "Join waitlist" button on public booking page when no slots are available
  - [ ] Client receives SMS/email when a matching slot opens
  - [ ] One-click booking link in notification (pre-filled, no re-entry needed)

---

### 1.4 Recurring Appointments

> Cliniko lets clients book a repeating series (e.g., every Tuesday at 2pm for 8 weeks). Our booking only supports one-off appointments.

- [ ] **1.4.1 — Data Model**
  - [ ] Add `RecurringRule` model: `id`, `frequency` (`DAILY` | `WEEKLY` | `FORTNIGHTLY` | `MONTHLY`), `interval`, `daysOfWeek` (JSON), `endAfterOccurrences`, `endDate`, `appointmentIds` (relation)
  - [ ] Link `Appointment` → `recurringRuleId` (nullable)
  - [ ] Create Prisma migration

- [ ] **1.4.2 — Recurring Booking UI (Staff)**
  - [ ] "Repeat" toggle in appointment creation form
  - [ ] Frequency selector: weekly / fortnightly / monthly
  - [ ] Day-of-week picker for weekly rules
  - [ ] End condition: after N sessions OR on a specific date
  - [ ] Preview list of generated dates before confirming
  - [ ] Edit options on existing recurring appointment: "this appointment only" | "this and following" | "all in series"
  - [ ] Cancel options: same three scopes

- [ ] **1.4.3 — Recurring Booking (Public Booking Page)**
  - [ ] Checkbox "Book as recurring series" on public booking flow
  - [ ] Frequency and end-date pickers
  - [ ] Show generated schedule before confirming
  - [ ] Block if any slot in series is unavailable (show conflict)

- [ ] **1.4.4 — Reminders for Series**
  - [ ] Single reminder rule covers all appointments in series
  - [ ] Option to send reminder only for next occurrence vs. all upcoming

---

### 1.5 Online Booking Access Controls

> Cliniko lets practices restrict online booking to existing clients only. Our public booking page is open to anyone.

- [ ] **1.5.1 — Business Setting**
  - [ ] Add `bookingMode` to business settings: `PUBLIC` | `EXISTING_CLIENTS_ONLY` | `INVITE_ONLY`
  - [ ] Settings UI under Settings → Booking → Access

- [ ] **1.5.2 — Existing Clients Only Mode**
  - [ ] Public booking page prompts for email/phone before showing availability
  - [ ] Validate against client records — only proceed if match found
  - [ ] Show "Contact us to register as a new client" message if no match

- [ ] **1.5.3 — Invite-Only Mode**
  - [ ] Generate unique booking link per client (token-based, expires optionally)
  - [ ] Staff action "Send booking invite" on client profile
  - [ ] Booking link pre-fills client details and bypasses access check

---

### 1.6 Fine-grained Availability Rules

> Cliniko lets you restrict specific appointment types to specific rooms, therapists, or time blocks. We only have basic therapist hours.

- [ ] **1.6.1 — Data Model**
  - [ ] Add `AvailabilityRule` model: `therapistId` (nullable), `roomId` (nullable), `serviceType` (nullable), `daysOfWeek` (JSON), `startTime`, `endTime`, `priority`
  - [ ] Add `Room` model: `id`, `businessId`, `name`, `color`, `capacity`
  - [ ] Create Prisma migration

- [ ] **1.6.2 — Room Management**
  - [ ] Rooms list under Settings → Locations → Rooms
  - [ ] Create, edit, archive rooms
  - [ ] Assign room to appointment (optional) in booking form
  - [ ] Room column view in calendar (resource view)

- [ ] **1.6.3 — Availability Rule Builder**
  - [ ] UI: Settings → Scheduling → Availability Rules
  - [ ] Rule targets: "Therapist X" | "Room Y" | "Service Type Z" | combinations
  - [ ] Time block input: days of week + start/end time
  - [ ] Rules shown in calendar as greyed-out unavailable blocks
  - [ ] Booking form respects rules: hides time slots that violate any rule

---

### 1.7 Passkey Authentication

> Cliniko added passkeys in 2025. We are email/password only.

- [ ] **1.7.1 — Backend**
  - [ ] Enable Supabase passkey support (WebAuthn) in project settings
  - [ ] Update `apps/web/lib/supabase/` client to handle passkey sign-in flow

- [ ] **1.7.2 — Frontend**
  - [ ] "Add passkey" button on Settings → Security
  - [ ] Passkey sign-in option on `/sign-in` page (alongside email/password)
  - [ ] Fallback to password if passkey auth fails
  - [ ] Show registered passkeys list with revoke option

---

## Phase 2 — Differentiation — Cliniko Pain Points

> These are things Cliniko users actively complain about. We can build these better and use them as marketing differentiators.

- [ ] **Phase 2 complete**

---

### 2.1 SMS & Email Delivery Reliability Dashboard

> Cliniko's #1 complaint: messages show "sent" but patients never receive them. We use Twilio — leverage it.

- [ ] **2.1.1 — Delivery Tracking Data Model**
  - [ ] Add `MessageLog` model: `id`, `appointmentId` (nullable), `clientId`, `channel` (`SMS` | `EMAIL` | `WHATSAPP`), `status` (`QUEUED` | `SENT` | `DELIVERED` | `FAILED` | `UNDELIVERED`), `providerMessageId`, `errorCode`, `sentAt`, `deliveredAt`
  - [ ] Create Prisma migration

- [ ] **2.1.2 — Twilio Webhook Handler**
  - [ ] `POST /api/webhooks/twilio/status` — receive Twilio delivery status callbacks
  - [ ] Update `MessageLog.status` on each callback event
  - [ ] Retry logic: auto-retry FAILED messages once after 5 minutes

- [ ] **2.1.3 — SendGrid Webhook Handler**
  - [ ] `POST /api/webhooks/sendgrid/events` — receive SendGrid delivery events
  - [ ] Map SendGrid events (`delivered`, `bounce`, `dropped`) → `MessageLog.status`

- [ ] **2.1.4 — Delivery Dashboard UI**
  - [ ] Communications → Delivery Reports tab
  - [ ] Stats row: total sent, delivered %, failed %, pending
  - [ ] Per-message table: client, channel, message type, status badge, timestamp
  - [ ] Filter by: date range, channel, status, therapist
  - [ ] Failed message actions: retry, mark resolved, switch to alternative channel
  - [ ] Alert banner on dashboard when delivery failure rate exceeds 5%

- [ ] **2.1.5 — Client-level Delivery History**
  - [ ] Client profile → Communications tab shows all message history with delivery status
  - [ ] Staff can see at a glance if a reminder was actually received before calling to follow up

---

### 2.2 Two-way Accounting Integration

> Cliniko's Xero sync is one-way only. Invoices changed in Xero don't flow back. Users find this deeply frustrating.

- [ ] **2.2.1 — Xero Integration**
  - [ ] OAuth 2.0 connection flow: Settings → Integrations → Xero → Connect
  - [ ] Sync invoices from app → Xero on creation and update (two-way)
  - [ ] Sync payments from Xero → app when marked paid in Xero
  - [ ] Webhook from Xero for real-time sync (vs. polling)
  - [ ] Conflict resolution UI: show diff when both sides changed, let staff pick winner
  - [ ] Disconnect and re-sync option

- [ ] **2.2.2 — QuickBooks Integration**
  - [ ] Same two-way sync as Xero (parallel implementation)
  - [ ] OAuth 2.0 connection flow
  - [ ] Invoice and payment sync
  - [ ] Webhook-based real-time updates

- [ ] **2.2.3 — Sync Logs**
  - [ ] Settings → Integrations → Sync Logs table
  - [ ] Per-record: entity type, direction, status, timestamp, error message
  - [ ] Manual "Force sync" button per integration

---

### 2.3 Staff Task Management

> Cliniko has no task system. Users specifically call this out as missing. Practices need to assign follow-up tasks to staff.

- [ ] **2.3.1 — Data Model**
  - [ ] Add `Task` model: `id`, `businessId`, `assignedToId`, `createdById`, `title`, `description`, `dueDate`, `priority` (`LOW` | `MEDIUM` | `HIGH` | `URGENT`), `status` (`TODO` | `IN_PROGRESS` | `DONE`), `relatedClientId` (nullable), `relatedAppointmentId` (nullable), `completedAt`
  - [ ] Create Prisma migration

- [ ] **2.3.2 — Task API**
  - [ ] `POST /api/tasks` — create task
  - [ ] `GET /api/tasks` — list tasks (filterable by assignee, status, priority, due date)
  - [ ] `PATCH /api/tasks/:id` — update task
  - [ ] `DELETE /api/tasks/:id` — delete task

- [ ] **2.3.3 — Task UI**
  - [ ] Add "Tasks" to dashboard sidebar navigation
  - [ ] Tasks page: Kanban view (Todo | In Progress | Done) + List view toggle
  - [ ] Task card: title, assignee avatar, due date, priority color, linked client/appointment chip
  - [ ] Create task from appointment detail modal ("Add follow-up task")
  - [ ] Create task from client profile
  - [ ] Dashboard widget: "My tasks due today" with count badge on sidebar icon
  - [ ] Overdue tasks highlighted in red

- [ ] **2.3.4 — Task Notifications**
  - [ ] Push notification when task assigned to you
  - [ ] Daily digest email at 8am: tasks due today
  - [ ] Reminder push notification 1 hour before task due time

---

### 2.4 Advanced Reporting

> Cliniko users consistently say reports "could be more detailed." This is a major switching reason.

- [ ] **2.4.1 — Revenue Reports**
  - [ ] Revenue by therapist (table + bar chart)
  - [ ] Revenue by service type
  - [ ] Revenue by month with YoY comparison
  - [ ] Outstanding invoices ageing report (30/60/90+ days)
  - [ ] Average invoice value trend

- [ ] **2.4.2 — Client Reports**
  - [ ] Client retention rate (% returning within 90 days)
  - [ ] New vs. returning clients per month
  - [ ] Client lifetime value (total spend)
  - [ ] Lapsed clients report (no visit in X days — configurable)
  - [ ] Referral source breakdown (where clients come from)

- [ ] **2.4.3 — Appointment Reports**
  - [ ] Utilisation rate per therapist (booked hours / available hours)
  - [ ] No-show and cancellation rate per therapist / overall
  - [ ] Peak hours heatmap (day of week × hour of day)
  - [ ] Average appointment duration by service type

- [ ] **2.4.4 — Export & Scheduling**
  - [ ] Export any report to CSV or PDF
  - [ ] Scheduled reports: configure a report to email to owner weekly/monthly
  - [ ] Date range presets: this week, last month, last quarter, custom

---

### 2.5 Cross-Therapist Note Access & Sign-off Workflow

> Cliniko users complain they can't read or sign off on a colleague's draft notes. Critical for supervision workflows.

- [ ] **2.5.1 — Draft Note Visibility Rules**
  - [ ] Business setting: "Draft notes visible to" — `Only Author` | `All Therapists` | `Business Owner Only`
  - [ ] Business owner can always see all drafts regardless of setting

- [ ] **2.5.2 — Supervisor Sign-off**
  - [ ] Note statuses: `DRAFT` → `PENDING_REVIEW` → `APPROVED` | `REJECTED`
  - [ ] Therapist can submit note for review — assigns to a supervisor (dropdown)
  - [ ] Supervisor sees a "Pending Review" queue in treatment notes
  - [ ] Supervisor can approve (locks note) or reject with comment (returns to author)
  - [ ] Approval history shown on note: who approved, when

- [ ] **2.5.3 — UI**
  - [ ] "Submit for review" button on draft note toolbar
  - [ ] Reviewer queue: Treatment Notes → Pending Review tab
  - [ ] Approve / Reject with comment modal
  - [ ] Status badge on note list: Draft, In Review, Approved

---

### 2.6 Self-serve Data Export

> Cliniko users report needing to contact support to export their data. We have an exports page — make it great.

- [ ] **2.6.1 — Export Coverage**
  - [ ] Clients export: all fields, intake answers, custom fields
  - [ ] Appointments export: date range filter, therapist filter, status filter
  - [ ] Invoices & payments export: date range, paid/unpaid filter
  - [ ] Treatment notes export: date range, therapist, client
  - [ ] Full practice data export (all of the above in one ZIP)

- [ ] **2.6.2 — Export Formats**
  - [ ] CSV for all data types
  - [ ] PDF for treatment notes (formatted, printable)
  - [ ] JSON for developers / migration use

- [ ] **2.6.3 — Scheduled & Automated Exports**
  - [ ] Schedule recurring exports (daily/weekly/monthly) to email
  - [ ] Export history log: file, date, who triggered it, download link (expires 7 days)
  - [ ] One-click full data export for GDPR / client data requests

---

### 2.7 Bundled SMS — No Add-on Cost

> Cliniko charges extra for SMS. Build SMS cost into the subscription and market it as included.

- [ ] **2.7.1 — SMS Credit System**
  - [ ] Add `smsCreditsIncluded` and `smsCreditsUsed` to subscription plan model
  - [ ] Track Twilio SMS cost per message in `MessageLog`
  - [ ] Dashboard widget: SMS credits used this billing period

- [ ] **2.7.2 — Overage Handling**
  - [ ] Notify business owner when 80% of monthly SMS credits used
  - [ ] Auto-purchase overage credits via Stripe (opt-in setting)
  - [ ] Hard stop option: disable SMS when credits exhausted (opt-in)

- [ ] **2.7.3 — Pricing Page & Marketing Copy**
  - [ ] Update pricing page to show SMS as included
  - [ ] Show credit allowance per plan tier (e.g., Starter: 200 SMS/mo, Pro: 1000/mo)

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

- [ ] **3.1.1 — API Keys**
  - [ ] `ApiKey` model: `id`, `businessId`, `name`, `keyHash`, `permissions` (JSON scopes), `lastUsedAt`, `expiresAt` (nullable)
  - [ ] Settings → API → Generate API key with scope selector (read-only, read-write, specific resources)
  - [ ] Key shown once on creation (only hash stored)
  - [ ] Revoke key action

- [ ] **3.1.2 — API Key Authentication**
  - [ ] API middleware: accept `Authorization: ApiKey <key>` in addition to Bearer JWT
  - [ ] Rate limiting per API key: 1000 req/hour default, configurable per plan

- [ ] **3.1.3 — Developer Documentation Site**
  - [ ] OpenAPI 3.0 spec generated from existing route handlers
  - [ ] Hosted docs at `/docs/api` or separate subdomain
  - [ ] Interactive "Try it" panel (Swagger UI or Scalar)
  - [ ] Code examples in JS, Python, curl for each endpoint

- [ ] **3.1.4 — Zapier / Make Integration**
  - [ ] Register as Zapier app with triggers: new appointment, new client, invoice paid
  - [ ] Register actions: create appointment, create client, send message
  - [ ] Same for Make (formerly Integromat)

---

### 3.2 Webhooks

> Allow businesses and third-party developers to subscribe to real-time events.

- [ ] **3.2.1 — Data Model**
  - [ ] `Webhook` model: `id`, `businessId`, `url`, `events` (JSON array), `secret`, `isActive`, `lastTriggeredAt`, `failureCount`
  - [ ] `WebhookDelivery` model: `id`, `webhookId`, `event`, `payload`, `statusCode`, `responseBody`, `attemptedAt`, `succeeded`
  - [ ] Create Prisma migration

- [ ] **3.2.2 — Webhook Engine**
  - [ ] Event publisher: emit events on appointment create/update/cancel, invoice paid, client create, note completed
  - [ ] Delivery worker: POST payload to subscriber URL with HMAC-SHA256 signature header
  - [ ] Retry: exponential backoff, up to 5 attempts
  - [ ] Disable webhook after 10 consecutive failures, notify owner

- [ ] **3.2.3 — Webhook Management UI**
  - [ ] Settings → Integrations → Webhooks
  - [ ] Add endpoint: URL, select events to subscribe
  - [ ] Delivery log per webhook: event, status code, timestamp, "Resend" action
  - [ ] Test button: sends a `ping` event to verify endpoint

---

### 3.3 Multi-location Scalability

> Cliniko supports multi-location but users say it struggles at scale. We should build this properly from the start.

- [ ] **3.3.1 — Location Model**
  - [ ] Add `Location` model: `id`, `businessId`, `name`, `address`, `phone`, `timezone`, `isActive`
  - [ ] Link `Therapist`, `Room`, `Appointment` → `locationId`
  - [ ] Create Prisma migration

- [ ] **3.3.2 — Location Management UI**
  - [ ] Settings → Locations: list, create, edit, deactivate
  - [ ] Each location has its own operating hours, rooms, and therapist assignments
  - [ ] Calendar: location filter dropdown (show all or specific location)
  - [ ] Reports: filter by location

- [ ] **3.3.3 — Cross-location Staff**
  - [ ] Therapist can be assigned to multiple locations
  - [ ] Availability set per location
  - [ ] Public booking page: client picks location first, then sees that location's availability

- [ ] **3.3.4 — Location-level Permissions**
  - [ ] Role: `LOCATION_MANAGER` — manages one location, can't see other locations' data
  - [ ] Business owner sees all locations
  - [ ] RLS policies updated to enforce location-level isolation where needed

---

### 3.4 Client Portal

> Give clients a self-service login to view their appointments, invoices, and notes.

- [ ] **3.4.1 — Client Auth**
  - [ ] Client sign-up / sign-in at `/client-portal/sign-in`
  - [ ] Supabase auth for clients (separate from staff auth)
  - [ ] Link client auth user → `Client` record via email match

- [ ] **3.4.2 — Client Portal Pages**
  - [ ] `/client-portal/appointments` — upcoming and past appointments, cancel/reschedule action
  - [ ] `/client-portal/invoices` — view and pay outstanding invoices online
  - [ ] `/client-portal/intake-forms` — complete outstanding intake forms
  - [ ] `/client-portal/documents` — download shared treatment summaries / documents

- [ ] **3.4.3 — Staff Controls**
  - [ ] Toggle: enable/disable client portal per business
  - [ ] Choose which records are visible to clients (e.g., hide treatment notes)
  - [ ] "Send portal invite" button on client profile

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
