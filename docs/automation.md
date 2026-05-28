# Automation Plan

**Last Updated**: 2026-05-29
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

- [ ] **Phase 1 complete**

---

### 1.1 Wire Triggers Into Real Events

> Right now `POST /api/automation/trigger` must be called manually. No real event fires it.

- [ ] **1.1.1 — Appointment Triggers**
  - [ ] Call `emitAutomation('APPOINTMENT_BOOKED', data)` inside `POST /api/appointments` after record created
  - [ ] Call `emitAutomation('APPOINTMENT_COMPLETED', data)` when appointment status set to `COMPLETED`
  - [ ] Call `emitAutomation('APPOINTMENT_CANCELLED', data)` when appointment status set to `CANCELLED`
  - [ ] Include full payload: `appointmentId`, `clientId`, `therapistId`, `serviceType`, `startTime`, `businessId`

- [ ] **1.1.2 — Client Triggers**
  - [ ] Call `emitAutomation('CLIENT_CREATED', data)` inside `POST /api/clients` after record created
  - [ ] Schedule `CLIENT_INACTIVE` check via cron (daily at 9am): find clients with no appointment in 30+ days

- [ ] **1.1.3 — Payment Triggers**
  - [ ] Call `emitAutomation('PAYMENT_RECEIVED', data)` inside invoice payment handler
  - [ ] Call `emitAutomation('PAYMENT_FAILED', data)` on Stripe payment failure webhook

- [ ] **1.1.4 — Intake Form Trigger**
  - [ ] Call `emitAutomation('INTAKE_FORM_SUBMITTED', data)` inside `POST /api/intake-forms` after submission

- [ ] **1.1.5 — Membership Trigger**
  - [ ] Call `emitAutomation('MEMBERSHIP_RENEWED', data)` on Stripe subscription renewal webhook

- [ ] **1.1.6 — `emitAutomation` Helper**
  - [ ] Create `apps/web/lib/automation.ts` with `emitAutomation(trigger, businessId, data)` helper
  - [ ] Helper queries active rules by trigger, evaluates conditions, executes actions in background (non-blocking)

---

### 1.2 Template Variables

> Action params contain `{{client.email}}` etc. but nothing resolves them. Every `SEND_EMAIL` fires with raw `{{placeholders}}`.

- [ ] **1.2.1 — Variable Resolver**
  - [ ] Create `resolveTemplate(template: string, context: object): string` in `lib/automation.ts`
  - [ ] Support context keys: `client.*`, `appointment.*`, `invoice.*`, `business.*`, `therapist.*`
  - [ ] Resolve at execution time by fetching related records from DB using IDs in `triggerData`

- [ ] **1.2.2 — Available Variables Reference**
  - [ ] `{{client.firstName}}`, `{{client.lastName}}`, `{{client.email}}`, `{{client.phone}}`
  - [ ] `{{appointment.date}}`, `{{appointment.time}}`, `{{appointment.service}}`, `{{appointment.therapistName}}`
  - [ ] `{{invoice.amount}}`, `{{invoice.dueDate}}`, `{{invoice.number}}`
  - [ ] `{{business.name}}`, `{{business.phone}}`, `{{business.address}}`
  - [ ] Show variable picker in the UI rule builder with autocomplete

---

### 1.3 Action Stubs → Real Implementations

- [ ] **1.3.1 — SEND_SMS (fix stub)**
  - [ ] Wire `SEND_SMS` action to real Twilio send via existing `lib/sms.ts`
  - [ ] Resolve `{{client.phone}}` if `to` is a template variable

- [ ] **1.3.2 — ADD_TAG (fix stub)**
  - [ ] Add `tags` JSON field to `Client` model in schema (migration)
  - [ ] `ADD_TAG` action appends tag string to `client.tags` array

- [ ] **1.3.3 — CREATE_TASK (fix stub)**
  - [ ] `CREATE_TASK` action calls `prisma.task.create(...)` using existing `Task` model
  - [ ] Support template variables in task title and description
  - [ ] Assign to `{{therapist.id}}` or a fixed staff member (configurable in action params)

---

### 1.4 Automation Run History UI

- [ ] **1.4.1 — Log List in Automation Page**
  - [ ] Add "Run History" tab to `/automation` page
  - [ ] Table: rule name, trigger, status (SUCCESS/FAILED/SKIPPED), executed at, # actions run
  - [ ] Expandable row: show `triggerData` JSON and per-action results

- [ ] **1.4.2 — Per-rule Log**
  - [ ] In rule detail modal, show last 10 executions
  - [ ] "Re-run" button on failed executions (replays with same triggerData)

---

## Phase 2 — Action Types

> Expand the action library beyond email/SMS/tag/task.

- [ ] **Phase 2 complete**

---

### 2.1 HTTP Request Action

> Generic webhook action — calls any external URL. Enables headless integration with any third-party without native support.

- [ ] **2.1.1 — Action Schema**
  - [ ] New action type: `HTTP_REQUEST`
  - [ ] Params: `url`, `method` (GET/POST/PUT), `headers` (JSON key/value pairs), `body` (template string)
  - [ ] Resolve template variables in `url`, `headers`, and `body` before sending

- [ ] **2.1.2 — Execution**
  - [ ] POST/GET/PUT to the configured URL with resolved payload
  - [ ] Log response status and body in `AutomationLog.result`
  - [ ] Treat 2xx as success, anything else as failure

- [ ] **2.1.3 — UI**
  - [ ] HTTP Request action card in rule builder
  - [ ] Header key/value editor (add/remove rows)
  - [ ] Body textarea with variable picker

---

### 2.2 Slack Notification Action

- [ ] **2.2.1 — Slack App**
  - [ ] Create Slack app in Slack API dashboard, get Bot Token scope: `chat:write`, `incoming-webhook`
  - [ ] Settings → Integrations → Slack: OAuth connect flow, store `slackAccessToken` and default channel in business settings
  - [ ] Disconnect Slack action

- [ ] **2.2.2 — Action Schema**
  - [ ] New action type: `SEND_SLACK`
  - [ ] Params: `channel` (defaults to connected channel, overridable), `message` (template string)
  - [ ] POST to Slack `chat.postMessage` API with resolved message

- [ ] **2.2.3 — Preset Examples**
  - [ ] "New booking → Slack" preset template in UI
  - [ ] "Payment received → Slack" preset template

---

### 2.3 Internal Notification Action

- [ ] **2.3.1 — Action Schema**
  - [ ] New action type: `SEND_PUSH`
  - [ ] Params: `recipientUserId` (or `ALL_STAFF`), `title`, `body` (template strings)
  - [ ] Calls existing push notification infrastructure (`/api/push`)

- [ ] **2.3.2 — Trigger Examples**
  - [ ] Appointment booked → push to assigned therapist
  - [ ] Payment failed → push to business owner

---

### 2.4 Update Client Field Action

- [ ] **2.4.1 — Action Schema**
  - [ ] New action type: `UPDATE_CLIENT`
  - [ ] Params: `field` (e.g. `notes`, `referralSource`, any custom field), `value` (template string)
  - [ ] Calls `prisma.client.update` with the specified field

---

## Phase 3 — Trigger Coverage

> Complete trigger set matching Cliniko plus time-based and scheduled triggers.

- [ ] **Phase 3 complete**

---

### 3.1 Time-Based Triggers

> Cliniko's most-used automations fire X hours/days before or after an event, not at event time.

- [ ] **3.1.1 — Reminder Scheduler**
  - [ ] New cron job: runs every 15 minutes, queries upcoming appointments
  - [ ] Checks `AutomationRule` where `trigger = 'APPOINTMENT_REMINDER'` and evaluates `conditions.hoursBeforeAppointment`
  - [ ] Fires rule if `appointment.startTime - now() <= hoursBeforeAppointment * 60 * 60 * 1000` and not already fired (track in `AutomationLog`)

- [ ] **3.1.2 — Pre-Appointment Triggers**
  - [ ] `APPOINTMENT_REMINDER_24H` — fires 24 hours before start
  - [ ] `APPOINTMENT_REMINDER_2H` — fires 2 hours before start
  - [ ] `APPOINTMENT_REMINDER_CUSTOM` — configurable offset (hours), set in rule conditions

- [ ] **3.1.3 — Post-Appointment Triggers**
  - [ ] `APPOINTMENT_FOLLOWUP` — fires X hours after appointment completed (configurable, default 24h)
  - [ ] Track fired state: add `firedAt` to `AutomationLog` with `appointmentId` to prevent duplicates

- [ ] **3.1.4 — Date-Based Triggers**
  - [ ] `CLIENT_BIRTHDAY` — daily cron checks `client.dateOfBirth`, fires on matching month/day
  - [ ] `MEMBERSHIP_EXPIRY_SOON` — fires 7 days before membership expiry date
  - [ ] `INVOICE_OVERDUE` — fires when invoice passes `dueDate` with status still `UNPAID`

---

### 3.2 Additional Event Triggers

- [ ] **3.2.1 — Booking & Scheduling**
  - [ ] `APPOINTMENT_NO_SHOW` — when appointment marked no-show
  - [ ] `WAITLIST_SPOT_AVAILABLE` — when slot opens and waitlist entry is notified
  - [ ] `RECURRING_SERIES_CREATED` — when a recurring appointment series is booked
  - [ ] `ONLINE_BOOKING_REQUEST` — when a client self-books online (vs staff-created)

- [ ] **3.2.2 — Client Lifecycle**
  - [ ] `CLIENT_FIRST_APPOINTMENT` — first appointment ever for this client (check `appointmentCount == 1`)
  - [ ] `CLIENT_RECALL_DUE` — client hasn't booked in X days (configurable, default 60)
  - [ ] `INTAKE_FORM_NOT_COMPLETED` — form sent but not filled in after 24h

- [ ] **3.2.3 — Finance**
  - [ ] `PACKAGE_LOW_CREDITS` — package/membership drops below 2 sessions remaining
  - [ ] `GIFT_CARD_REDEEMED` — gift card used
  - [ ] `REFUND_ISSUED` — refund processed

---

## Phase 4 — Cliniko Automation Parity

> Every automation Cliniko offers out-of-the-box, plus improvements.

- [ ] **Phase 4 complete**

---

### 4.1 Appointment Reminders (Cliniko Core Feature)

> Cliniko sends reminders automatically. We need preset rules that work on install with zero configuration.

- [ ] **4.1.1 — Default Rule Seeding**
  - [ ] On business creation, auto-create default automation rules:
    - "Appointment Confirmation" — trigger: `APPOINTMENT_BOOKED` → SEND_EMAIL + SEND_SMS
    - "24-Hour Reminder" — trigger: `APPOINTMENT_REMINDER_24H` → SEND_SMS
    - "2-Hour Reminder" — trigger: `APPOINTMENT_REMINDER_2H` → SEND_EMAIL
  - [ ] All default rules have `isActive: true` but can be toggled/edited

- [ ] **4.1.2 — Reminder Templates**
  - [ ] Built-in email templates: Confirmation, Reminder, Cancellation, Rescheduled
  - [ ] Each template includes appointment details, therapist name, location, cancellation policy
  - [ ] Templates editable per business via Settings → Communications

- [ ] **4.1.3 — Reminder Settings UI**
  - [ ] Settings → Reminders page (shortcut from settings sidebar)
  - [ ] Toggle each default rule on/off without going to full automation builder
  - [ ] Edit message text inline without opening rule editor

---

### 4.2 Follow-Up & Re-engagement (Cliniko Core Feature)

- [ ] **4.2.1 — Post-Visit Follow-Up**
  - [ ] Default rule: `APPOINTMENT_FOLLOWUP` (24h after) → SEND_EMAIL with satisfaction check + rebooking link
  - [ ] Include direct link to book next appointment: `{{business.bookingUrl}}?clientToken={{client.bookingToken}}`

- [ ] **4.2.2 — Re-engagement Campaign**
  - [ ] Default rule: `CLIENT_RECALL_DUE` (60 days no visit) → SEND_EMAIL + SEND_SMS
  - [ ] Template: "We miss you — book your next session" with discount code field (optional)
  - [ ] Configurable recall period (30/60/90/custom days) per rule

- [ ] **4.2.3 — New Client Welcome**
  - [ ] Default rule: `CLIENT_CREATED` → SEND_EMAIL with welcome message, portal link, and intake form link

---

### 4.3 Birthday Messages (Cliniko Feature)

- [ ] **4.3.1 — Birthday Rule**
  - [ ] Default rule: `CLIENT_BIRTHDAY` → SEND_EMAIL + SEND_SMS with birthday message
  - [ ] Optional birthday discount: rule can include a Stripe coupon code (configured in action params)
  - [ ] UI to add client date of birth on client profile (if not already present — check schema)

---

### 4.4 Cancellation & No-Show Workflows (Cliniko Feature)

- [ ] **4.4.1 — Cancellation Confirmation**
  - [ ] Default rule: `APPOINTMENT_CANCELLED` → SEND_EMAIL confirming cancellation + rebooking link

- [ ] **4.4.2 — No-Show Follow-Up**
  - [ ] Default rule: `APPOINTMENT_NO_SHOW` → SEND_EMAIL + CREATE_TASK for staff to follow up
  - [ ] Task: "Follow up with {{client.firstName}} — no-show on {{appointment.date}}"

- [ ] **4.4.3 — Cancellation Fee Warning**
  - [ ] Late cancellation detection: cancellation within X hours of start (configurable)
  - [ ] Trigger: `APPOINTMENT_LATE_CANCELLATION` → SEND_EMAIL notifying of fee + SEND_SMS

---

### 4.5 Invoice & Payment Reminders (Cliniko Feature)

- [ ] **4.5.1 — Invoice Created**
  - [ ] Default rule: `PAYMENT_RECEIVED` → SEND_EMAIL with receipt and download link

- [ ] **4.5.2 — Overdue Invoice Reminder**
  - [ ] Default rule: `INVOICE_OVERDUE` → SEND_EMAIL on day 1, SEND_SMS on day 3, SEND_EMAIL on day 7
  - [ ] Use multi-step delay (Phase 6.2) or separate rules with day-offset conditions

- [ ] **4.5.3 — Package Expiry Warning**
  - [ ] Default rule: `PACKAGE_LOW_CREDITS` → SEND_EMAIL "You have 2 sessions left — renew or book your next"

---

### 4.6 Staff Notifications (Cliniko Feature)

- [ ] **4.6.1 — New Booking Alert**
  - [ ] Default rule: `APPOINTMENT_BOOKED` → SEND_EMAIL to assigned therapist's email + SEND_PUSH

- [ ] **4.6.2 — Cancellation Alert to Staff**
  - [ ] Default rule: `APPOINTMENT_CANCELLED` → SEND_EMAIL to assigned therapist

- [ ] **4.6.3 — Intake Form Submitted**
  - [ ] Default rule: `INTAKE_FORM_SUBMITTED` → SEND_EMAIL to assigned therapist with link to review

---

## Phase 5 — Third-Party Integrations

> Native direct integrations using each service's API. No middleware.

- [ ] **Phase 5 complete**

---

### 5.1 Google Sheets Integration

- [ ] **5.1.1 — OAuth Connection**
  - [ ] Settings → Integrations → Google Sheets: OAuth 2.0 flow (Google Cloud console app)
  - [ ] Store `googleAccessToken` + `googleRefreshToken` per business; auto-refresh on expiry
  - [ ] Disconnect Google account action

- [ ] **5.1.2 — APPEND_SHEET Action**
  - [ ] New action type: `APPEND_SHEET`
  - [ ] Params: `spreadsheetId`, `sheetName`, `columns` (array of template strings per column)
  - [ ] On execution: resolves column values, appends a new row via Google Sheets API `values.append`

- [ ] **5.1.3 — Preset Sheets Templates**
  - [ ] "New appointment → log to Google Sheet" preset
  - [ ] "Payment received → log to Google Sheet" preset
  - [ ] Spreadsheet picker in action UI (lists user's sheets via Drive API)

---

### 5.2 Slack Integration

> Already planned in Phase 2.2 — implementation detail repeated here for scheduling context.

- [ ] **5.2.1** — See Phase 2.2 above (Slack OAuth + `SEND_SLACK` action)
- [ ] **5.2.2 — Preset Presets**
  - [ ] "Daily summary → Slack" — cron trigger at 6pm, posts today's booking count + revenue to channel
  - [ ] "No-show → Slack alert" preset

---

### 5.3 Mailchimp / Email Marketing

- [ ] **5.3.1 — Mailchimp OAuth**
  - [ ] Settings → Integrations → Mailchimp: OAuth connect flow
  - [ ] Store API key and selected audience ID per business

- [ ] **5.3.2 — ADD_TO_MAILCHIMP Action**
  - [ ] New action type: `ADD_TO_EMAIL_LIST`
  - [ ] Params: `provider` (`mailchimp`), `listId`, `tags` (array)
  - [ ] On execution: upserts contact in Mailchimp audience with email + first/last name

- [ ] **5.3.3 — Preset**
  - [ ] "New client → add to Mailchimp audience" preset

---

### 5.4 Stripe Automation Triggers

> Stripe webhooks already fire. Wire them into the automation engine.

- [ ] **5.4.1 — Stripe Event → Automation Bridge**
  - [ ] In `POST /api/stripe/webhook`, after handling payment events, call `emitAutomation(...)` for:
    - `payment_intent.succeeded` → `PAYMENT_RECEIVED`
    - `payment_intent.payment_failed` → `PAYMENT_FAILED`
    - `customer.subscription.renewed` → `MEMBERSHIP_RENEWED`
    - `customer.subscription.deleted` → `MEMBERSHIP_CANCELLED`

- [ ] **5.4.2 — MEMBERSHIP_CANCELLED Trigger**
  - [ ] Add to triggers list in UI
  - [ ] Preset: "Membership cancelled → SEND_EMAIL win-back offer"

---

### 5.5 HubSpot CRM Integration

- [ ] **5.5.1 — HubSpot OAuth**
  - [ ] Settings → Integrations → HubSpot: OAuth connect flow
  - [ ] Store `hubspotAccessToken` per business

- [ ] **5.5.2 — SYNC_TO_HUBSPOT Action**
  - [ ] New action type: `SYNC_TO_HUBSPOT`
  - [ ] On execution: upsert HubSpot contact using client email; set properties from template variables
  - [ ] Support creating a HubSpot deal on `PAYMENT_RECEIVED`

---

## Phase 6 — Advanced Rules

> Power features: conditions builder, branching, multi-step flows with delays.

- [ ] **Phase 6 complete**

---

### 6.1 Conditions Builder

> Currently conditions are a flat key/value match. Replace with a proper rule engine.

- [ ] **6.1.1 — Condition Schema**
  - [ ] Conditions stored as `{ operator: 'AND'|'OR', rules: [{ field, comparator, value }] }`
  - [ ] Comparators: `equals`, `not_equals`, `contains`, `greater_than`, `less_than`, `is_empty`, `is_not_empty`
  - [ ] Fields: any key from `triggerData` (e.g. `serviceType`, `appointmentStatus`, `invoiceAmount`)

- [ ] **6.1.2 — Condition Evaluator**
  - [ ] Replace flat `Object.entries(conditions).every(...)` with recursive condition tree evaluator in `lib/automation.ts`

- [ ] **6.1.3 — UI Condition Builder**
  - [ ] Add/remove condition rows in rule editor
  - [ ] Field dropdown (populated from trigger's available data keys)
  - [ ] Comparator selector
  - [ ] Value input (text, number, or dropdown depending on field type)
  - [ ] AND / OR toggle between conditions

---

### 6.2 Multi-Step Flows with Delays

> Allow a single rule to fire multiple actions with time gaps (e.g., email now, SMS in 2 days if no reply).

- [ ] **6.2.1 — Delayed Action Schema**
  - [ ] Each action in the `actions` array gets an optional `delayHours: number` field
  - [ ] Actions execute in order; each one waits `delayHours` after the previous

- [ ] **6.2.2 — Delayed Execution Queue**
  - [ ] On rule trigger, schedule each action as a `ScheduledAction` record: `{ automationRuleId, actionIndex, executeAt, triggerData }`
  - [ ] Cron job every 5 minutes processes due `ScheduledAction` records

- [ ] **6.2.3 — Stop-on-Event Condition**
  - [ ] Action can have `cancelIfEvent: 'APPOINTMENT_BOOKED'` — if client books before the delayed action fires, skip it
  - [ ] Use case: send re-engagement SMS in 3 days, but cancel if they book first

---

### 6.3 Branching (If/Else)

> More sophisticated: one trigger, two paths based on a condition.

- [ ] **6.3.1 — Branch Action Type**
  - [ ] New meta-action type: `BRANCH`
  - [ ] Params: `condition` (single condition), `thenActions` (array), `elseActions` (array)
  - [ ] Evaluator checks condition and routes to the right action sub-array

- [ ] **6.3.2 — UI**
  - [ ] Branch node in rule builder shown as a split card (If / Else columns)
  - [ ] Each branch adds actions independently

---

### 6.4 Automation Analytics

- [ ] **6.4.1 — Stats Dashboard**
  - [ ] Automation page header: total rules active, runs this month, success rate %
  - [ ] Per-rule stats card: run count, last run, success/fail ratio bar

- [ ] **6.4.2 — Revenue Attribution**
  - [ ] Track if a re-engagement automation led to a booking (match `CLIENT_INACTIVE` log → next `APPOINTMENT_BOOKED` within 7 days for same client)
  - [ ] Show "Estimated revenue from automations" metric on automation dashboard

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
