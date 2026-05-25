# User Onboarding Walkthrough Plan

A structured guide for inducting new users into the platform. Each phase builds on the previous, walking users from first login through mastering the full practice management suite.

---

## Phase 1 — Welcome & First Impressions

> Triggered on first sign-in. Goal: orient the user and make them feel at home.

- [x] **1.1** Display a full-screen welcome modal with the user's first name
  - [x] 1.1.1 Show a brief tagline ("Your practice, beautifully managed")
  - [x] 1.1.2 Include a "Let's get started" CTA that launches the setup checklist
  - [x] 1.1.3 Offer a "Skip tour, go to dashboard" option for returning users migrating data
- [x] **1.2** Render a persistent onboarding progress bar at the top of the dashboard
  - [x] 1.2.1 Show % complete across all setup tasks
  - [x] 1.2.2 Collapse automatically once all Phase 2–4 tasks are marked done
- [x] **1.3** Show a "Getting Started" checklist card on the dashboard
  - [x] 1.3.1 List the five most important first steps with checkboxes
  - [x] 1.3.2 Each item deep-links to the relevant section
  - [x] 1.3.3 Dismiss permanently once all items are checked

---

## Phase 2 — Business Profile Setup

> Route: `/setup` (dedicated wizard). Goal: complete the practice identity before going live.

- [x] **2.1** Prompt the user to fill in their Business Profile
  - [x] 2.1.1 Highlight the Business Name field as required
  - [x] 2.1.2 Explain that this name appears on invoices, reminders, and the booking page
  - [x] 2.1.3 Prompt for address (used on invoices and Google Maps link for clients)
  - [x] 2.1.4 Prompt for phone, email, and website
- [x] **2.2** Guide branding setup (Settings → Branding tab)
  - [x] 2.2.1 Walk through uploading a business logo (PNG/JPG/SVG, max 2 MB)
  - [x] 2.2.2 Pick a primary and secondary color (shown on booking page and emails)
  - [x] 2.2.3 Set an email footer / signature for outbound communications
- [x] **2.3** Configure notification channels (Settings → Notifications tab)
  - [x] 2.3.1 Toggle Email Notifications on/off
  - [x] 2.3.2 Toggle SMS and WhatsApp (note: Twilio API key required — link to comms settings)
  - [x] 2.3.3 Set default reminder lead time (hours before appointment)
  - [x] 2.3.4 Enable Auto-Send Reminders toggle
  - [x] 2.3.5 Prompt to enable Browser Push Notifications

---

## Phase 3 — Team Setup

> Route: `/therapists`, then `/settings` → Team tab. Goal: add staff before scheduling.

- [x] **3.1** Introduce the Therapists section
  - [x] 3.1.1 Explain the difference between a Therapist record and a user account
  - [x] 3.1.2 Walk through creating the first therapist profile
  - [x] 3.1.3 Highlight specializations, credentials, and availability fields
- [x] **3.2** Assign roles via Settings → Team tab
  - [x] 3.2.1 Explain THERAPIST vs RECEPTIONIST roles and what each can access
  - [x] 3.2.2 Show how to activate/deactivate a team member
  - [x] 3.2.3 Note that additional team members are added as Therapist records first
- [x] **3.3** Set up locations (Settings → Manage Locations)
  - [x] 3.3.1 Explain multi-location support
  - [x] 3.3.2 Walk through adding the first location (name, address, operating hours)
  - [x] 3.3.3 Assign therapists to locations

---

## Phase 4 — Services, Packages & Memberships

> Routes: `/packages`, `/memberships`. Goal: define what the business sells before taking bookings.

- [x] **4.1** Introduce the Packages section
  - [x] 4.1.1 Explain what a package is (prepaid session bundles)
  - [x] 4.1.2 Walk through creating the first package (name, sessions, price, expiry)
  - [x] 4.1.3 Show how to view and edit an existing package (`/packages/[id]`)
- [x] **4.2** Set up Memberships
  - [x] 4.2.1 Explain the difference between a package (finite) and a membership (recurring)
  - [x] 4.2.2 Walk through creating a membership plan (billing cycle, price, perks)
  - [x] 4.2.3 Show how to attach a membership to a client later in the flow
- [x] **4.3** Configure Gift Cards (`/gift-cards`)
  - [x] 4.3.1 Explain when gift cards are useful (retail, seasonal promotions)
  - [x] 4.3.2 Walk through issuing a manual gift card
- [x] **4.4** Set up Loyalty & Promotions
  - [x] 4.4.1 Introduce the Loyalty program (`/loyalty`) — point accrual and redemption
  - [x] 4.4.2 Create a first promotion (`/promotions`) — percentage or flat discount

---

## Phase 5 — Client Management

> Route: `/clients`. Goal: understand how to add and manage client records.

- [x] **5.1** Add the first client
  - [x] 5.1.1 Walk through the New Client form (name, DOB, contact, health notes)
  - [x] 5.1.2 Explain that a client record links appointments, notes, invoices, and forms
  - [x] 5.1.3 Show the client profile page (`/clients/[id]`) and its tabs
- [x] **5.2** Send an intake form to a new client
  - [x] 5.2.1 Introduce Intake Forms (`/intake-forms`)
  - [x] 5.2.2 Walk through creating a form from a template (`/intake-forms/templates`)
  - [x] 5.2.3 Explain how the client fills it out via the public `/intake/[id]` link
  - [x] 5.2.4 Show where completed forms appear on the client profile
- [x] **5.3** Import existing clients (if applicable)
  - [x] 5.3.1 Point to the Exports section (`/exports`) for CSV templates
  - [x] 5.3.2 Note bulk import workflow (manual steps for now)

---

## Phase 6 — Appointments & Scheduling

> Route: `/appointments`. Goal: book the first real appointment end-to-end.

- [x] **6.1** Tour the appointment calendar
  - [x] 6.1.1 Explain Day / Week / Month views and how to switch between them
  - [x] 6.1.2 Show the therapist color-coding and how to filter by therapist
  - [x] 6.1.3 Explain the "Now" indicator and appointment status badges
- [x] **6.2** Book the first appointment
  - [x] 6.2.1 Click an empty slot to open the New Appointment form
  - [x] 6.2.2 Select client, therapist, service type, duration, and room
  - [x] 6.2.3 Toggle reminder send on booking
  - [x] 6.2.4 Confirm and see it land on the calendar
- [x] **6.3** Manage an appointment
  - [x] 6.3.1 Click an appointment to open its detail panel
  - [x] 6.3.2 Walk through status transitions: Scheduled → Confirmed → Completed / Cancelled
  - [x] 6.3.3 Show rescheduling via drag-and-drop (Week view)
  - [x] 6.3.4 Explain the "Open slots" AI suggestion card on the dashboard
- [x] **6.4** Set up the client-facing booking page
  - [x] 6.4.1 Introduce the public booking URL (`/book/[businessId]`)
  - [x] 6.4.2 Explain that clients self-book here without needing a staff login
  - [x] 6.4.3 Show how branding (logo, colors) flows through to the booking page

---

## Phase 7 — Payments & Billing

> Routes: `/payments`, `/invoices`. Goal: process a payment after an appointment.

- [x] **7.1** Process a payment
  - [x] 7.1.1 Explain how payments link to completed appointments
  - [x] 7.1.2 Walk through creating a manual payment record
  - [x] 7.1.3 Show supported methods (card, cash, EFT, gift card)
- [x] **7.2** Generate and send an invoice
  - [x] 7.2.1 Walk through creating an invoice for a session (`/invoices`)
  - [x] 7.2.2 Show the invoice detail view (`/invoices/[id]`)
  - [x] 7.2.3 Explain how to email the invoice directly to the client
- [x] **7.3** Revenue reconciliation
  - [x] 7.3.1 Introduce the Payments Reconciliation page (`/payments/reconciliation`)
  - [x] 7.3.2 Walk through the Revenue Report (`/payments/revenue-report`)
- [x] **7.4** Payroll overview (`/payroll`)
  - [x] 7.4.1 Explain how therapist hours and commission are calculated
  - [x] 7.4.2 Show how to export a payroll run
- [x] **7.5** Insurance Claims (`/insurance-claims`)
  - [x] 7.5.1 Briefly explain the insurance billing workflow
  - [x] 7.5.2 Note prerequisites (insurance provider setup)

---

## Phase 8 — Clinical Tools

> Routes: `/treatment-notes`, `/intake-forms`, body map. Goal: document sessions professionally.

- [x] **8.1** Write a treatment note
  - [x] 8.1.1 Navigate to Treatment Notes (`/treatment-notes`) and click "New Note"
  - [x] 8.1.2 Select the linked appointment and client
  - [x] 8.1.3 Walk through SOAP fields (Subjective, Objective, Assessment, Plan)
  - [x] 8.1.4 Explain voice note recording as an alternative input method
  - [x] 8.1.5 Show the body map for annotating areas of focus
- [x] **8.2** Manage intake forms
  - [x] 8.2.1 Create a form from scratch (`/intake-forms/new`)
  - [x] 8.2.2 Preview the client-facing form experience
  - [x] 8.2.3 Review a submitted form attached to a client record
- [x] **8.3** Telehealth sessions (`/telehealth`)
  - [x] 8.3.1 Explain video call prerequisites (browser permissions)
  - [x] 8.3.2 Walk through starting a telehealth session from an appointment
  - [x] 8.3.3 Show in-session controls (mute, camera, end call)

---

## Phase 9 — Communications & Automation

> Routes: `/messages`, `/communications/templates`, `/automation`. Goal: reduce manual follow-up.

- [x] **9.1** Send a message to a client
  - [x] 9.1.1 Navigate to Messages (`/messages`) and compose a new message
  - [x] 9.1.2 Show channel options (Email, SMS, WhatsApp) based on active settings
  - [x] 9.1.3 Explain message history and thread view per client
- [x] **9.2** Create a communication template
  - [x] 9.2.1 Navigate to Communications → Templates
  - [x] 9.2.2 Walk through creating an appointment reminder template
  - [x] 9.2.3 Explain available merge tags (client name, appointment time, therapist name)
- [x] **9.3** Set up automation rules (`/automation`)
  - [x] 9.3.1 Explain what automations can trigger (appointment booked, form submitted, payment received)
  - [x] 9.3.2 Walk through creating a "Send reminder 24h before" automation
  - [x] 9.3.3 Show how to enable/disable automations without deleting them

---

## Phase 10 — Analytics & Reporting

> Routes: `/analytics`, `/reports`. Goal: use data to grow the practice.

- [ ] **10.1** Dashboard KPIs
  - [ ] 10.1.1 Explain the four stat cards (Sessions, Clients, Revenue, Pending Forms)
  - [ ] 10.1.2 Walk through the Revenue chart and period toggles (30d / 90d / 1y)
  - [ ] 10.1.3 Explain the Service Mix breakdown (top 5 services by volume)
- [ ] **10.2** Analytics deep-dive (`/analytics`)
  - [ ] 10.2.1 Show client retention and new-vs-returning breakdown
  - [ ] 10.2.2 Explain therapist performance metrics
  - [ ] 10.2.3 Walk through filtering by date range and location
- [ ] **10.3** Reports (`/reports`)
  - [ ] 10.3.1 Explain report types: Revenue, Appointments, Client, Therapist
  - [ ] 10.3.2 Show how to save a custom report configuration
  - [ ] 10.3.3 Walk through exporting a report to CSV
- [ ] **10.4** Data Exports (`/exports`)
  - [ ] 10.4.1 Explain full data export options (clients, appointments, payments)
  - [ ] 10.4.2 Note compliance use cases (HIPAA, audits)

---

## Phase 11 — Inventory Management

> Route: `/inventory`. Goal: track products and supplies used in sessions.

- [ ] **11.1** Add inventory items
  - [ ] 11.1.1 Walk through adding a product (name, SKU, quantity, unit cost)
  - [ ] 11.1.2 Set a low-stock threshold and explain reorder alerts
- [ ] **11.2** Link inventory to appointments
  - [ ] 11.2.1 Show how to log products used during a session
  - [ ] 11.2.2 Explain how product cost affects profitability in reports
- [ ] **11.3** Update stock levels
  - [ ] 11.3.1 Manually adjust quantities after receiving a delivery
  - [ ] 11.3.2 View stock history for a given item

---

## Phase 12 — Completion & Ongoing Mastery

> Final onboarding milestone. Goal: leave the user confident and self-sufficient.

- [ ] **12.1** Mark onboarding complete
  - [ ] 12.1.1 Show a congratulations screen when all checklist items are done
  - [ ] 12.1.2 Summarize what has been set up (business, team, first booking, first payment)
  - [ ] 12.1.3 Dismiss the onboarding progress bar permanently
- [ ] **12.2** Surface contextual help going forward
  - [ ] 12.2.1 Add "?" tooltip icons on complex fields across the app
  - [ ] 12.2.2 Link to a Help Center / documentation from the sidebar
  - [ ] 12.2.3 Show a "What's New" badge when a feature is updated
- [ ] **12.3** Encourage team adoption
  - [ ] 12.3.1 Suggest inviting therapists to log in for the first time
  - [ ] 12.3.2 Share the public booking URL with the first real client
  - [ ] 12.3.3 Set a reminder to review analytics after the first full week

---

## Summary

| Phase | Focus | Key Routes |
|-------|-------|------------|
| 1 | Welcome & orientation | `/dashboard` |
| 2 | Business profile & branding | `/settings` |
| 3 | Team & locations | `/therapists`, `/settings` |
| 4 | Services, packages & memberships | `/packages`, `/memberships`, `/loyalty` |
| 5 | Client management | `/clients`, `/intake-forms` |
| 6 | Appointments & booking | `/appointments`, `/book/[businessId]` |
| 7 | Payments & billing | `/payments`, `/invoices`, `/payroll` |
| 8 | Clinical tools | `/treatment-notes`, `/telehealth` |
| 9 | Communications & automation | `/messages`, `/automation` |
| 10 | Analytics & reporting | `/analytics`, `/reports`, `/exports` |
| 11 | Inventory | `/inventory` |
| 12 | Completion & ongoing mastery | All |
