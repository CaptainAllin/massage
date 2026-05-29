# Automation Plan

**Last Updated**: 2026-06-02
**Goal**: Build a native automation engine — no Zapier, no Make. Direct integrations, event-driven workflows, and scheduled triggers wired into the platform.

---

## Index

| # | Phase | Focus |
|---|-------|-------|
| 1 | [Engine Completion](#phase-1--engine-completion) | Fix stubs, wire triggers into real API routes, template variables |
| 2 | [Action Types](#phase-2--action-types) | Complete all action types: SMS, Slack, tasks, tagging, HTTP |
| 3 | [Trigger Coverage](#phase-3--trigger-coverage) | All events wired + time-based + scheduled triggers |
| 4 | [Cliniko Automations](#phase-4--cliniko-automation-parity) | Every automation Cliniko ships out-of-the-box |
| 5 | [Third-Party Integrations](#phase-5--third-party-integrations) | Slack, Google Sheets, Mailchimp, Stripe, HubSpot |
| 6 | [Advanced Rules](#phase-6--advanced-rules) | Conditions builder, branching, multi-step flows, delays |

---

## Phase 1 — Engine Completion

> The AutomationRule model and basic API exist. Stubs are not functional. Triggers are not called from real events. This phase makes the engine actually work.

- [x] **Phase 1 complete**

---

### 1.1 Wire Triggers Into Real Events

> Right now `POST /api/automation/trigger` must be called manually. No real event fires it.

- [x] **1.1.1 — Appointment Triggers**
  - [x] Call `emitAutomation('APPOINTMENT_BOOKED', data)` inside `POST /api/appointments` after record created
  - [x] Call `emitAutomation('APPOINTMENT_COMPLETED', data)` when appointment status set to `COMPLETED`
  - [x] Call `emitAutomation('APPOINTMENT_CANCELLED', data)` when appointment status set to `CANCELLED`
  - [x] Include full payload: `appointmentId`, `clientId`, `therapistId`, `serviceType`, `startTime`, `businessId`

- [x] **1.1.2 — Client Triggers**
  - [x] Call `emitAutomation('CLIENT_CREATED', data)` inside `POST /api/clients` after record created
  - [x] Schedule `CLIENT_INACTIVE` check via cron (daily at 9am): find clients with no appointment in 30+ days

- [x] **1.1.3 — Payment Triggers**
  - [x] Call `emitAutomation('PAYMENT_RECEIVED', data)` inside invoice payment handler
  - [x] Call `emitAutomation('PAYMENT_FAILED', data)` on Stripe payment failure webhook

- [x] **1.1.4 — Intake Form Trigger**
  - [x] Call `emitAutomation('INTAKE_FORM_SUBMITTED', data)` inside `POST /api/intake-forms` after submission

- [x] **1.1.5 — Membership Trigger**
  - [x] Call `emitAutomation('MEMBERSHIP_RENEWED', data)` on Stripe subscription renewal webhook

- [x] **1.1.6 — `emitAutomation` Helper**
  - [x] Create `apps/web/lib/automation.ts` with `emitAutomation(trigger, businessId, data)` helper
  - [x] Helper queries active rules by trigger, evaluates conditions, executes actions in background (non-blocking)

---

### 1.2 Template Variables

> Action params contain `{{client.email}}` etc. but nothing resolves them. Every `SEND_EMAIL` fires with raw `{{placeholders}}`.

- [x] **1.2.1 — Variable Resolver**
  - [x] Create `resolveTemplate(template: string, context: object): string` in `lib/automation.ts`
  - [x] Support context keys: `client.*`, `appointment.*`, `invoice.*`, `business.*`, `therapist.*`
  - [x] Resolve at execution time by fetching related records from DB using IDs in `triggerData`

- [x] **1.2.2 — Available Variables Reference**
  - [x] `{{client.firstName}}`, `{{client.lastName}}`, `{{client.email}}`, `{{client.phone}}`
  - [x] `{{appointment.date}}`, `{{appointment.time}}`, `{{appointment.service}}`, `{{appointment.therapistName}}`
  - [x] `{{invoice.amount}}`, `{{invoice.dueDate}}`, `{{invoice.number}}`
  - [x] `{{business.name}}`, `{{business.phone}}`, `{{business.address}}`
  - [x] Show variable picker in the UI rule builder with autocomplete



---

### 1.3 Action Stubs → Real Implementations

- [x] **1.3.1 — SEND_SMS (fix stub)**
  - [x] Wire `SEND_SMS` action to real Twilio send via existing `lib/sms.ts`
  - [x] Resolve `{{client.phone}}` if `to` is a template variable

- [x] **1.3.2 — ADD_TAG (fix stub)**
  - [x] Add `tags` JSON field to `Client` model in schema (migration)
  - [x] `ADD_TAG` action appends tag string to `client.tags` array

- [x] **1.3.3 — CREATE_TASK (fix stub)**
  - [x] `CREATE_TASK` action calls `prisma.task.create(...)` using existing `Task` model
  - [x] Support template variables in task title and description
  - [x] Assign to `{{therapist.id}}` or a fixed staff member (configurable in action params)

---

### 1.4 Automation Run History UI

- [x] **1.4.1 — Log List in Automation Page**
  - [x] Add "Run History" tab to `/automation` page
  - [x] Table: rule name, trigger, status (SUCCESS/FAILED/SKIPPED), executed at, # actions run
  - [x] Expandable row: show `triggerData` JSON and per-action results

- [x] **1.4.2 — Per-rule Log**
  - [x] In rule detail modal, show last 10 executions
  - [x] "Re-run" button on failed executions (replays with same triggerData)

---

## Phase 2 — Action Types

> Expand the action library beyond email/SMS/tag/task.

- [x] **Phase 2 complete**

---

### 2.1 HTTP Request Action

> Generic webhook action — calls any external URL. Enables headless integration with any third-party without native support.

- [x] **2.1.1 — Action Schema**
  - [x] New action type: `HTTP_REQUEST`
  - [x] Params: `url`, `method` (GET/POST/PUT), `headers` (JSON key/value pairs), `body` (template string)
  - [x] Resolve template variables in `url`, `headers`, and `body` before sending

- [x] **2.1.2 — Execution**
  - [x] POST/GET/PUT to the configured URL with resolved payload
  - [x] Log response status and body in `AutomationLog.result`
  - [x] Treat 2xx as success, anything else as failure

- [x] **2.1.3 — UI**
  - [x] HTTP Request action card in rule builder
  - [x] Header key/value editor (add/remove rows)
  - [x] Body textarea with variable picker

---

### 2.2 Slack Notification Action

- [x] **2.2.1 — Slack App**
  - [x] Create Slack app in Slack API dashboard, get Bot Token scope: `chat:write`, `incoming-webhook`
  - [x] Settings → Integrations → Slack: OAuth connect flow, store `slackAccessToken` and default channel in business settings
  - [x] Disconnect Slack action

- [x] **2.2.2 — Action Schema**
  - [x] New action type: `SEND_SLACK`
  - [x] Params: `channel` (defaults to connected channel, overridable), `message` (template string)
  - [x] POST to Slack `chat.postMessage` API with resolved message

- [x] **2.2.3 — Preset Examples**
  - [x] "New booking → Slack" preset template in UI
  - [x] "Payment received → Slack" preset template

---

### 2.3 Internal Notification Action

- [x] **2.3.1 — Action Schema**
  - [x] New action type: `SEND_PUSH`
  - [x] Params: `recipientUserId` (or `ALL_STAFF`), `title`, `body` (template strings)
  - [x] Calls existing push notification infrastructure (`/api/push`)

- [x] **2.3.2 — Trigger Examples**
  - [x] Appointment booked → push to assigned therapist
  - [x] Payment failed → push to business owner

---

### 2.4 Update Client Field Action

- [x] **2.4.1 — Action Schema**
  - [x] New action type: `UPDATE_CLIENT`
  - [x] Params: `field` (e.g. `goals`, `occupation`, `primaryPhysician`), `value` (template string)
  - [x] Calls `prisma.client.update` with the specified field (allowlisted: goals, occupation, primaryPhysician, insuranceProvider, insurancePolicyNumber)

---

## Phase 3 — Trigger Coverage

> Complete trigger set matching Cliniko plus time-based and scheduled triggers.

- [x] **Phase 3 complete**

---

### 3.1 Time-Based Triggers

> Cliniko's most-used automations fire X hours/days before or after an event, not at event time.

- [x] **3.1.1 — Reminder Scheduler**
  - [x] New cron job: runs every hour (`/api/cron/automation-appointment-triggers`), queries upcoming appointments
  - [x] Checks `AutomationRule` where `trigger = 'APPOINTMENT_REMINDER_*'` and evaluates `conditions.hoursBeforeAppointment`
  - [x] Fires rule if appointment is in the time window; deduplicates via `AutomationLog` (48h lookback on `triggerData.appointmentId`)

- [x] **3.1.2 — Pre-Appointment Triggers**
  - [x] `APPOINTMENT_REMINDER_24H` — fires 24 hours before start (23–25h window)
  - [x] `APPOINTMENT_REMINDER_2H` — fires 2 hours before start (1.5–2.5h window)
  - [x] `APPOINTMENT_REMINDER_CUSTOM` — configurable offset (hours), set in rule conditions via `conditions.hoursBeforeAppointment`

- [x] **3.1.3 — Post-Appointment Triggers**
  - [x] `APPOINTMENT_FOLLOWUP` — fires X hours after appointment start (configurable via `conditions.hoursAfterCompletion`, default 24h)
  - [x] Dedup via `AutomationLog` JSON path filter on `appointmentId` with 48h lookback

- [x] **3.1.4 — Date-Based Triggers**
  - [x] `CLIENT_BIRTHDAY` — daily cron (`/api/cron/automation-date-triggers`) checks `client.dateOfBirth`, fires on matching month/day
  - [x] `MEMBERSHIP_EXPIRY_SOON` — fires when membership `endDate` is 7 days away
  - [x] `INVOICE_OVERDUE` — fires daily for invoices past `dueDate` with status SENT/PARTIALLY_PAID/OVERDUE

---

### 3.2 Additional Event Triggers

- [x] **3.2.1 — Booking & Scheduling**
  - [x] `APPOINTMENT_NO_SHOW` — emitted in `PATCH /api/appointments/[id]/no-show`
  - [x] `WAITLIST_SPOT_AVAILABLE` — emitted in `POST /api/waitlist/[id]/offer`
  - [x] `RECURRING_SERIES_CREATED` — emitted in `POST /api/recurring-appointments` after series created
  - [x] `ONLINE_BOOKING_REQUEST` — emitted in `POST /api/public/booking/[businessId]` (client self-books)

- [x] **3.2.2 — Client Lifecycle**
  - [x] `CLIENT_FIRST_APPOINTMENT` — emitted in both staff and public booking routes when `appointmentCount == 1`
  - [x] `CLIENT_RECALL_DUE` — daily cron fires for clients whose `lastVisitDate` crossed the X-day threshold today (configurable via `conditions.daysSinceLastVisit`, default 60)
  - [x] `INTAKE_FORM_NOT_COMPLETED` — added `isSubmitted` flag to `IntakeForm`; daily cron fires trigger for forms created X+ days ago (default 3) that are still unsubmitted



- [x] **3.2.3 — Finance**
  - [x] `PACKAGE_LOW_CREDITS` — emitted in `POST /api/packages/[id]/redeem-session` when sessions remaining ≤ 2
  - [x] `GIFT_CARD_REDEEMED` — emitted in `POST /api/gift-cards/[id]/redeem`
  - [x] `REFUND_ISSUED` — emitted in `POST /api/payments/[id]/refund`

---

## Phase 4 — Cliniko Automation Parity

> Every automation Cliniko offers out-of-the-box, plus improvements.

- [x] **Phase 4 complete**

---

### 4.1 Appointment Reminders (Cliniko Core Feature)

> Cliniko sends reminders automatically. We need preset rules that work on install with zero configuration.

- [x] **4.1.1 — Default Rule Seeding**
  - [x] On business creation, auto-create default automation rules:
    - "Appointment Confirmation" — trigger: `APPOINTMENT_BOOKED` → SEND_EMAIL + SEND_SMS
    - "24-Hour Reminder" — trigger: `APPOINTMENT_REMINDER_24H` → SEND_SMS
    - "2-Hour Reminder" — trigger: `APPOINTMENT_REMINDER_2H` → SEND_EMAIL
  - [x] All default rules have `isActive: true` but can be toggled/edited

- [x] **4.1.2 — Reminder Templates**
  - [x] Built-in email templates: Confirmation, Reminder, Cancellation, Rescheduled
  - [x] Each template includes appointment details, therapist name, location, cancellation policy
  - [x] Templates editable per business via Settings → Reminders

- [x] **4.1.3 — Reminder Settings UI**
  - [x] Settings → Reminders page (shortcut from settings sidebar)
  - [x] Toggle each default rule on/off without going to full automation builder
  - [x] Edit message text inline without opening rule editor

---

### 4.2 Follow-Up & Re-engagement (Cliniko Core Feature)

- [x] **4.2.1 — Post-Visit Follow-Up**
  - [x] Default rule: `APPOINTMENT_FOLLOWUP` (24h after) → SEND_EMAIL with satisfaction check + rebooking link
  - [x] Include direct link to book next appointment: `{{business.bookingUrl}}`

- [x] **4.2.2 — Re-engagement Campaign**
  - [x] Default rule: `CLIENT_RECALL_DUE` (60 days no visit) → SEND_EMAIL + SEND_SMS
  - [x] Template: "We miss you — book your next session"
  - [x] Configurable recall period via rule conditions (`daysSinceLastVisit`)

- [x] **4.2.3 — New Client Welcome**
  - [x] Default rule: `CLIENT_CREATED` → SEND_EMAIL with welcome message and booking link

---

### 4.3 Birthday Messages (Cliniko Feature)

- [x] **4.3.1 — Birthday Rule**
  - [x] Default rule: `CLIENT_BIRTHDAY` → SEND_EMAIL + SEND_SMS with birthday message
  - [x] Optional birthday discount: rule can include a Stripe coupon code (configured in action params)
  - [x] Client `dateOfBirth` field already exists in schema (Client model line 196)

---

### 4.4 Cancellation & No-Show Workflows (Cliniko Feature)

- [x] **4.4.1 — Cancellation Confirmation**
  - [x] Default rule: `APPOINTMENT_CANCELLED` → SEND_EMAIL confirming cancellation + rebooking link

- [x] **4.4.2 — No-Show Follow-Up**
  - [x] Default rule: `APPOINTMENT_NO_SHOW` → SEND_EMAIL + CREATE_TASK for staff to follow up
  - [x] Task: "Follow up with {{client.firstName}} — no-show on {{appointment.date}}"

- [x] **4.4.3 — Cancellation Fee Warning**
  - [x] Late cancellation detection: cancellation within 24h of start emits `APPOINTMENT_LATE_CANCELLATION`
  - [x] Trigger: `APPOINTMENT_LATE_CANCELLATION` → can be wired to SEND_EMAIL/SEND_SMS via automation rules

---

### 4.5 Invoice & Payment Reminders (Cliniko Feature)

- [x] **4.5.1 — Invoice Created**
  - [x] Default rule: `PAYMENT_RECEIVED` → SEND_EMAIL with receipt

- [x] **4.5.2 — Overdue Invoice Reminder**
  - [x] Default rule: `INVOICE_OVERDUE` → SEND_EMAIL on day 1 (day 7 SMS requires Phase 6.2 delays)

- [x] **4.5.3 — Package Expiry Warning**
  - [x] Default rule: `PACKAGE_LOW_CREDITS` → SEND_EMAIL "You have 2 sessions left — renew or book your next"

---

### 4.6 Staff Notifications (Cliniko Feature)

- [x] **4.6.1 — New Booking Alert**
  - [x] Default rule: `APPOINTMENT_BOOKED` → SEND_EMAIL to `{{therapist.email}}` + SEND_PUSH to ALL_STAFF

- [x] **4.6.2 — Cancellation Alert to Staff**
  - [x] Default rule: `APPOINTMENT_CANCELLED` → SEND_EMAIL to `{{therapist.email}}`

- [x] **4.6.3 — Intake Form Submitted**
  - [x] Default rule: `INTAKE_FORM_SUBMITTED` → SEND_EMAIL to `{{therapist.email}}` with link to review

---

## Phase 5 — Third-Party Integrations

> Native direct integrations using each service's API. No middleware.

- [x] **Phase 5 complete**

---

### 5.1 Google Sheets Integration

- [x] **5.1.1 — OAuth Connection**
  - [x] Settings → Integrations → Google Sheets: OAuth 2.0 flow (Google Cloud console app)
  - [x] Store `googleAccessToken` + `googleRefreshToken` per business; auto-refresh on expiry
  - [x] Disconnect Google account action

- [x] **5.1.2 — APPEND_SHEET Action**
  - [x] New action type: `APPEND_SHEET`
  - [x] Params: `spreadsheetId`, `sheetName`, `columns` (array of template strings per column)
  - [x] On execution: resolves column values, appends a new row via Google Sheets API `values.append`

- [x] **5.1.3 — Preset Sheets Templates**
  - [x] "New appointment → log to Google Sheet" preset
  - [x] "New client → log to Google Sheet" preset
  - [x] Spreadsheet picker in action UI — "Browse" button fetches user's sheets via Drive API (`GET /api/integrations/google-sheets/sheets`); select a sheet to populate the spreadsheet ID automatically



---

### 5.2 Slack Integration

> Already planned in Phase 2.2 — implementation detail repeated here for scheduling context.

- [x] **5.2.1** — See Phase 2.2 above (Slack OAuth + `SEND_SLACK` action)
- [x] **5.2.2 — Preset Presets**
  - [x] "Daily summary → Slack" — `DAILY_SLACK_SUMMARY` trigger fires at 6pm via `/api/cron/slack-daily-summary`; aggregates today's booking count + revenue; supports `{{summary.bookingCount}}`, `{{summary.revenue}}`, `{{summary.date}}` variables; preset template added to rule builder


  - [x] "No-show → Slack alert" preset

---

### 5.3 Mailchimp / Email Marketing

- [x] **5.3.1 — Mailchimp OAuth**
  - [x] Settings → Integrations → Mailchimp: API key connect flow
  - [x] Store API key and selected audience ID per business

- [x] **5.3.2 — ADD_TO_MAILCHIMP Action**
  - [x] New action type: `ADD_TO_EMAIL_LIST`
  - [x] Params: `email`, `firstName`, `lastName`, `listId`, `tags` (array)
  - [x] On execution: upserts contact in Mailchimp audience with email + first/last name

- [x] **5.3.3 — Preset**
  - [x] "New client → add to Mailchimp audience" preset

---

### 5.4 Stripe Automation Triggers

> Stripe webhooks already fire. Wire them into the automation engine.

- [x] **5.4.1 — Stripe Event → Automation Bridge**
  - [x] In `POST /api/stripe/webhook`, after handling payment events, call `emitAutomation(...)` for:
    - [x] `payment_intent.succeeded` → `PAYMENT_RECEIVED`
    - [x] `payment_intent.payment_failed` → `PAYMENT_FAILED` (was already done in Phase 1)
    - [x] `customer.subscription.renewed` → `MEMBERSHIP_RENEWED` (was already done in Phase 1)
    - [x] `customer.subscription.deleted` → `MEMBERSHIP_CANCELLED`

- [x] **5.4.2 — MEMBERSHIP_CANCELLED Trigger**
  - [x] Add to triggers list in UI
  - [x] Preset: "Membership cancelled → SEND_EMAIL win-back offer"

---

### 5.5 HubSpot CRM Integration

- [x] **5.5.1 — HubSpot OAuth**
  - [x] Settings → Integrations → HubSpot: OAuth connect flow
  - [x] Store `hubspotAccessToken` per business

- [x] **5.5.2 — SYNC_TO_HUBSPOT Action**
  - [x] New action type: `SYNC_TO_HUBSPOT`
  - [x] On execution: upsert HubSpot contact using client email; set properties from template variables
  - [x] Support creating a HubSpot deal on `PAYMENT_RECEIVED`

---

## Phase 6 — Advanced Rules

> Power features: conditions builder, branching, multi-step flows with delays.

- [x] **Phase 6 complete**

---

### 6.1 Conditions Builder

> Currently conditions are a flat key/value match. Replace with a proper rule engine.

- [x] **6.1.1 — Condition Schema**
  - [x] Conditions stored as `{ operator: 'AND'|'OR', rules: [{ field, comparator, value }] }`
  - [x] Comparators: `equals`, `not_equals`, `contains`, `greater_than`, `less_than`, `is_empty`, `is_not_empty`
  - [x] Fields: any key from `triggerData` (e.g. `serviceType`, `appointmentStatus`, `invoiceAmount`)

- [x] **6.1.2 — Condition Evaluator**
  - [x] Replace flat `Object.entries(conditions).every(...)` with recursive condition tree evaluator in `lib/automation.ts`

- [x] **6.1.3 — UI Condition Builder**
  - [x] Add/remove condition rows in rule editor
  - [x] Field dropdown (populated from trigger's available data keys)
  - [x] Comparator selector
  - [x] Value input (text, number, or dropdown depending on field type)
  - [x] AND / OR toggle between conditions

---

### 6.2 Multi-Step Flows with Delays

> Allow a single rule to fire multiple actions with time gaps (e.g., email now, SMS in 2 days if no reply).

- [x] **6.2.1 — Delayed Action Schema**
  - [x] Each action in the `actions` array gets an optional `delayHours: number` field
  - [x] Actions execute in order; each one waits `delayHours` after the previous

- [x] **6.2.2 — Delayed Execution Queue**
  - [x] On rule trigger, schedule each action as a `ScheduledAction` record: `{ automationRuleId, actionIndex, executeAt, triggerData }`
  - [x] Cron job every 5 minutes processes due `ScheduledAction` records (`/api/cron/scheduled-actions`)

- [x] **6.2.3 — Stop-on-Event Condition**
  - [x] Action can have `cancelIfEvent: 'APPOINTMENT_BOOKED'` — if client books before the delayed action fires, skip it
  - [x] Use case: send re-engagement SMS in 3 days, but cancel if they book first

---

### 6.3 Branching (If/Else)

> More sophisticated: one trigger, two paths based on a condition.

- [x] **6.3.1 — Branch Action Type**
  - [x] New meta-action type: `BRANCH`
  - [x] Params: `conditionField`, `conditionComparator`, `conditionValue`, `thenActions` (array), `elseActions` (array)
  - [x] Evaluator checks condition and routes to the right action sub-array

- [x] **6.3.2 — UI**
  - [x] Branch node in rule builder shown as a split card (If / Else columns)
  - [x] Each branch accepts a JSON actions array independently

---

### 6.4 Automation Analytics

- [x] **6.4.1 — Stats Dashboard**
  - [x] Analytics tab: active rules, runs this month, success rate %, re-engaged clients
  - [x] Failed runs alert card when failures exist this month

- [x] **6.4.2 — Revenue Attribution**
  - [x] Track if a re-engagement automation led to a booking (match `CLIENT_RECALL_DUE`/`CLIENT_INACTIVE`/`CLIENT_BIRTHDAY` log → next `APPOINTMENT_BOOKED` within 7 days for same client)
  - [x] Show "Re-engaged Clients" metric on Analytics tab (`/api/automation/analytics`)

---

## Default Rule Catalog (Ship with Product)

> These rules are created automatically for every new business on signup.

| # | Name | Trigger | Actions |
|---|------|---------|---------|
| D1 | Booking Confirmation | `APPOINTMENT_BOOKED` | Email + SMS to client |
| D2 | 24-Hour Reminder | `APPOINTMENT_REMINDER_24H` | SMS to client |
| D3 | 2-Hour Reminder | `APPOINTMENT_REMINDER_2H` | Email to client |
| D4 | Post-Visit Follow-Up | `APPOINTMENT_FOLLOWUP` (24h) | Email to client with rebooking link |
| D5 | Cancellation Confirmation | `APPOINTMENT_CANCELLED` | Email to client |
| D6 | No-Show Follow-Up | `APPOINTMENT_NO_SHOW` | Email to client + Task for staff |
| D7 | New Client Welcome | `CLIENT_CREATED` | Email to client with portal link |
| D8 | Re-engagement | `CLIENT_RECALL_DUE` (60 days) | Email + SMS to client |
| D9 | Birthday Message | `CLIENT_BIRTHDAY` | Email + SMS to client |
| D10 | Invoice Receipt | `PAYMENT_RECEIVED` | Email to client with receipt |
| D11 | Overdue Invoice (Day 1) | `INVOICE_OVERDUE` | Email to client |
| D12 | Overdue Invoice (Day 7) | `INVOICE_OVERDUE` (+7d delay) | SMS to client |
| D13 | New Booking → Staff | `APPOINTMENT_BOOKED` | Push to assigned therapist |
| D14 | Cancellation → Staff | `APPOINTMENT_CANCELLED` | Email to assigned therapist |
| D15 | Package Running Low | `PACKAGE_LOW_CREDITS` | Email to client |
