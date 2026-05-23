# Pending Tasks — Wellness CRM

**Last Updated**: 2026-05-23
**Total Pending**: ~95 tasks across 5 phases

> Tasks are ordered by urgency and impact on the app. Complete phases in order — each phase unblocks the next.

---

## Index

| # | Phase | Focus | Status |
|---|-------|-------|--------|
| 0 | [Auth Migration](#phase-0--auth-migration) | Clerk → Supabase (BLOCKING) | 🔴 In Progress |
| 1 | [Core Gaps](#phase-1--core-functionality-gaps) | Complete near-done stages | 🟡 Next |
| 2 | [Missing MVP Features](#phase-2--missing-mvp-features) | Features not yet started | 🟡 Queued |
| 3 | [Deferred Stage Items](#phase-3--deferred-stage-items) | Deferred subtasks from stages 2–6 | 🟠 Queued |
| 4 | [Infrastructure & Quality](#phase-4--infrastructure--quality) | Testing, DevOps, security | 🟠 Pre-production |
| 5 | [Post-MVP Advanced Features](#phase-5--post-mvp-advanced-features) | Stage 8 + enterprise | 🔵 v2+ |

---

## Phase 0 — Auth Migration

> **BLOCKING** — Supabase auth must work end-to-end before any other feature can be reliably tested or shipped. We are on branch `migration/clerk-to-supabase`.

- [ ] **Phase 0 complete**

### 0.1 Database Setup
- [ ] Create Prisma migration renaming `authProviderId` → `authUserId`
- [ ] Point `DATABASE_URL` to Supabase database and run `prisma migrate deploy`
- [ ] Verify schema in Supabase dashboard
- [ ] Create `handle_new_user()` trigger function in Supabase SQL editor
- [ ] Create `on_auth_user_created` trigger
- [ ] Create `handle_user_update()` trigger function
- [ ] Create `on_auth_user_updated` trigger
- [ ] Create `handle_user_delete()` trigger function
- [ ] Create `on_auth_user_deleted` trigger
- [ ] Test triggers by creating a test user and verifying row appears in `public.users`

### 0.2 Backend Migration
- [ ] Create `services/api/src/common/supabase/supabase.service.ts`
- [ ] Create `services/api/src/common/supabase/supabase.module.ts`
- [ ] Import `SupabaseModule` in `app.module.ts`
- [ ] Replace `jwt.strategy.ts` with Supabase JWT validation
- [ ] Delete `clerk-webhook.controller.ts` and remove from `auth.module.ts`
- [ ] Find and replace all remaining `authProviderId` references in backend
- [ ] Run all backend tests (`pnpm test`) and fix failures
- [ ] Verify backend starts with no errors and passes Postman smoke tests

### 0.3 Frontend Migration
- [ ] Verify sign-in page (`/sign-in/page.tsx`) uses Supabase auth (not Clerk)
- [ ] Verify sign-up page (`/sign-up/page.tsx`) uses Supabase auth (not Clerk)
- [ ] Verify `AuthProvider.tsx` correctly exposes session, user, and sign-out
- [ ] Verify `middleware.ts` uses Supabase session check (not Clerk middleware)
- [ ] Verify `api-client.ts` retrieves token from Supabase session
- [ ] Scan codebase for remaining `useAuth`, `useUser`, `useClerk` Clerk references and replace
- [ ] Test full auth flow: sign up → sign in → session persistence → sign out

### 0.4 Storage Setup
- [ ] Create Supabase Storage buckets: `profiles` (public), `documents` (private), `progress-photos` (private), `branding` (public)
- [ ] Enable RLS on `storage.objects` table
- [ ] Apply profile images RLS policies (4 policies)
- [ ] Apply documents RLS policies (3 policies)
- [ ] Apply progress photos RLS policies (2 policies)
- [ ] Apply branding RLS policies (2 policies)
- [ ] Create `storage.service.ts` and `storage.module.ts` in backend
- [ ] Test file upload from frontend and verify access control

### 0.5 Row Level Security (RLS)
- [ ] Enable RLS on `users`, `businesses`, `clients`, `appointments`, `treatment_notes`, `therapist_notes` tables
- [ ] Apply RLS policies for `users` table (read own + staff read)
- [ ] Apply RLS policies for `businesses` table (owner + staff)
- [ ] Apply RLS policies for `clients` table (business scope)
- [ ] Apply RLS policies for `appointments` table (business scope)
- [ ] Apply RLS policies for `treatment_notes` table (therapist + owner)
- [ ] Apply RLS policies for `therapist_notes` table (therapist private)
- [ ] Test all policies using Supabase SQL editor with different roles

### 0.6 Migration Testing & Cleanup
- [ ] End-to-end test: Sign up → Create business → Add client → Book appointment
- [ ] Test all user roles: CLIENT, THERAPIST, RECEPTIONIST, BUSINESS_OWNER
- [ ] Test cross-business data isolation (user cannot see another business's data)
- [ ] Test password reset flow
- [ ] Test token refresh across page reloads and multiple tabs
- [ ] Verify all API endpoints return correct data with Supabase token
- [ ] Remove all remaining Clerk package references from `package.json`
- [ ] Update README and SETUP_GUIDE with new auth instructions
- [ ] Create PR and merge `migration/clerk-to-supabase` → `main`

---

## Phase 1 — Core Functionality Gaps

> Near-complete stages that need small finishing work. High impact, low effort.

- [ ] **Phase 1 complete**

### 1.1 Stage 6 Analytics — Email Delivery (95% → 100%)
- [ ] Integrate email service (SendGrid or Supabase SMTP) for report delivery
- [ ] Wire up scheduled reports email delivery (TODO at line 132 of `scheduled-reports.service.ts`)
- [ ] Wire up export email delivery (TODO at line 78 of `export.service.ts`)
- [ ] Test: trigger a scheduled report and verify email arrives
- [ ] Performance test analytics queries with realistic data volume (target: <2s)

### 1.2 Stage 2 CRM — Intake Forms Frontend (90% → 100%)
- [ ] Enhance intake forms frontend UI (currently backend-only with basic frontend)
- [ ] Build client-facing intake form submission page
- [ ] Add form completion status to client profile
- [ ] Link intake form responses to body map and medical history

### 1.3 Stage 5 Payments — End-to-End Validation
- [ ] End-to-end test payment flow with Stripe test mode (`4242 4242 4242 4242`)
- [ ] Test failed payment handling
- [ ] Test refund flow
- [ ] Test webhook handling locally via Stripe CLI
- [ ] Configure production Stripe keys and webhook endpoints

---

## Phase 2 — Missing MVP Features

> These features are referenced in the PRD navigation but have 0% implementation. All are needed before MVP launch.

- [ ] **Phase 2 complete**

### 2.1 Settings Page (Feature 11) — 0% complete
- [ ] Build settings page layout and navigation (Business, Team, Notifications, Branding)
- [ ] Build business profile settings (name, address, phone, logo upload)
- [ ] Build permissions system (assign roles to staff members)
- [ ] Build notification settings (email, SMS, WhatsApp toggles per event type)
- [ ] Build branding controls (logo, colors, email footer)

### 2.2 Therapist Performance Dashboard (Feature 9) — 0% complete
- [ ] Build therapist performance overview page
- [ ] Build per-therapist metrics: sessions completed, revenue, utilization rate, rebooking rate
- [ ] Build therapist comparison chart (bar chart from analytics engine)
- [ ] Build individual therapist detail view with time-range filter

### 2.3 Promotions Module (Feature 1) — 0% complete
- [ ] Build promotions dashboard (list, create, schedule, status)
- [ ] Build promotion template system with variable replacement (client name, offer, expiry)
- [ ] Build send workflow (select recipients, choose channel: SMS/Email/WhatsApp, schedule)
- [ ] Add delivery analytics tracking (sent, opened, clicked, converted to booking)
- [ ] Add scheduling (cron-based sends at future datetime)
- [ ] Add preview/test mode before send

### 2.4 Quick Call Intake Screen (Feature 3) — 0% complete
- [ ] Build quick-call popup/modal accessible from any page
- [ ] Build quick client search (find existing by name or phone)
- [ ] Build quick new-client creation (name, phone only — minimum fields)
- [ ] Build call notes field with auto-timestamp
- [ ] Build quick appointment booking from within the call screen

### 2.5 Online Booking Frontend (Feature 7 remainder)
- [ ] Build public booking page (API backend is ready)
- [ ] Display available therapists and time slots
- [ ] Client self-selects service, therapist, time
- [ ] Confirm and notify therapist + client on booking

---

## Phase 3 — Deferred Stage Items

> Items deferred within completed stages. Each has partial infrastructure already in place.

- [ ] **Phase 3 complete**

### 3.1 Payments — Deferred Items (Stage 5)
- [ ] Save payment methods for future use (Stripe SetupIntent flow)
- [ ] PDF invoice generation (pdfmake or Puppeteer)
- [ ] Email invoices directly to clients
- [ ] Revenue reports (daily sales, monthly summary, tax report)
- [ ] Payment reconciliation tools
- [ ] Membership renewal reminder notifications (7 days before renewal)
- [ ] Invoice overdue reminder emails

### 3.2 Analytics — Remaining Items (Stage 6)
- [ ] Performance load testing with production-scale data
- [ ] Add database indexes on `businessId`, date fields, status fields if missing
- [ ] Custom report builder UI (select fields, custom date ranges, save configuration)

### 3.3 CRM — AI Summaries (Stage 2 / Stage 7 completion)
- [ ] Verify `AISummaryButton` and `AISummaryViewer` are wired to the AI service
- [ ] Test AI note summary generation with real SOAP notes end-to-end
- [ ] Test AI treatment suggestions panel on client profile

### 3.4 Messaging — Stage 4 Integration Gaps
- [ ] Send invoice via SMS/WhatsApp directly from invoice detail page
- [ ] Payment confirmation message on successful charge
- [ ] Payment reminder message for overdue invoices

---

## Phase 4 — Infrastructure & Quality

> Required before production launch. Affects reliability, security, and compliance.

- [ ] **Phase 4 complete**

### 4.1 Testing Coverage
- [ ] Integration tests for auth and RBAC (real DB, not mocked)
- [ ] Integration tests for appointment booking with conflict detection
- [ ] Integration tests for payment flows
- [ ] E2E UI tests for critical user flows (Playwright or Cypress)
- [ ] Mobile browser testing (iOS Safari, Android Chrome)
- [ ] Security testing: SQL injection, XSS, IDOR, RBAC bypass attempts
- [ ] Load testing for analytics endpoints (Stripe webhooks, report generation)

### 4.2 Security & Compliance
- [ ] Encrypt sensitive fields at rest (payment metadata, medical history notes)
- [ ] Verify all Stripe webhook signatures are validated
- [ ] Audit log review — ensure all payment and auth events are logged
- [ ] HIPAA compliance review for AI features (anonymize data before sending to OpenAI/Claude)
- [ ] Set up automated secure database backups (Supabase point-in-time recovery)

### 4.3 Mobile Responsiveness
- [ ] Audit all dashboard pages for mobile layout (tablet + phone breakpoints)
- [ ] Fix any broken layouts on small screens (calendar, payment forms, client profile)
- [ ] Build push notifications infrastructure (FCM for Android, APNs for iOS) — for future mobile app
- [ ] Offline caching strategy for appointments page (service worker or React Query persistence)

### 4.4 DevOps & Deployment
- [ ] Set up staging environment (Vercel preview or separate project)
- [ ] Set up production environment (Vercel + Railway/Render for API)
- [ ] Configure production environment variables securely
- [ ] Set up monitoring and alerting (Sentry for errors, Supabase for DB)
- [ ] Configure automated database backup schedule
- [ ] Set up uptime monitoring (Better Uptime or Checkly)
- [ ] Document deployment process in DEPLOYMENT.md

### 4.5 Documentation
- [ ] Update README with Supabase setup (post-migration)
- [ ] Update API documentation (Swagger) to reflect all new endpoints from Stages 5–7
- [ ] Create CHANGELOG.md documenting migration and major features
- [ ] Create CONTRIBUTING.md updates for new dev environment

---

## Phase 5 — Post-MVP Advanced Features

> Build these only after MVP is live and validated with real users. Order by ROI.

- [ ] **Phase 5 complete**

### 5.1 Tier 1 — High ROI, Moderate Effort (v2 target)

#### Gift Cards
- [ ] Build gift card purchase flow (Stripe payment)
- [ ] Generate unique gift card codes
- [ ] Build redemption at checkout
- [ ] Track balances and expiry dates
- [ ] Email delivery of gift card to recipient

#### Loyalty Program
- [ ] Build points accumulation rules (e.g., 1 point per $1 spent)
- [ ] Build reward tiers (Bronze, Silver, Gold)
- [ ] Build reward redemption at checkout
- [ ] Build client-facing loyalty dashboard (points balance, tier status)

#### Multi-Location Support
- [ ] Add `Location` model to database schema
- [ ] Add `locationId` to Therapist, Appointment, Client, Payment tables and migrate
- [ ] Build location management UI in settings
- [ ] Build location-filtered views for calendar, clients, payments
- [ ] Build cross-location analytics reports

#### Inventory Management
- [ ] Build product catalog (oils, lotions, retail items)
- [ ] Build stock tracking with adjustment history
- [ ] Build low stock alerts (threshold notifications)
- [ ] Build purchase order workflow
- [ ] Link products to treatment sessions (supplies used)

### 5.2 Tier 2 — Useful When Requested

#### Telehealth / Video Consultations
- [ ] Integrate video provider (Twilio Video or Daily.co — HIPAA-compliant)
- [ ] Build in-app video call UI (join/leave, camera/mic controls)
- [ ] Build consent management for session recording
- [ ] Add post-consultation SOAP note flow
- [ ] Integrate video appointment type into scheduling

#### Payroll System
- [ ] Evaluate Gusto/ADP integration vs. custom build
- [ ] Build therapist hours and commission tracking
- [ ] Build payroll report generation (pay period summary)
- [ ] Build pay stub export (PDF)
- [ ] Build accounting software export (CSV for QuickBooks/Xero)

#### Advanced Automation Engine
- [ ] Build trigger system (appointment booked, payment received, client inactive X days)
- [ ] Build action system (send message, create task, apply tag)
- [ ] Build simple automation rules UI (if → then)
- [ ] Build re-engagement workflow (client inactive 30+ days → send promotion)
- [ ] OR: Evaluate Zapier webhook integration as alternative

### 5.3 Tier 3 — Only If Specifically Needed

#### White-Label Solution (Enterprise)
- [ ] Build custom branding system (logo, colors, custom domain)
- [ ] Build custom email template theming
- [ ] Remove platform branding from UI
- [ ] Build tenant-level configuration management

#### SSO / Enterprise Auth
- [ ] Integrate SAML or OAuth with Azure AD / Google Workspace
- [ ] Build API key management for external integrations
- [ ] Build advanced custom role builder (beyond 5 fixed roles)
- [ ] Enforce audit log retention for compliance (SOC2/HIPAA)

#### Insurance Claims Management
- [ ] Build insurance provider database
- [ ] Build CMS-1500 claim form generation
- [ ] Build claim submission and status tracking
- [ ] Build reimbursement tracking and reconciliation
- [ ] Note: Region-specific — only build if targeting medical clinics

#### Wearable Integrations
- [ ] Apple Health OAuth integration
- [ ] Google Fit OAuth integration
- [ ] Build client consent and data sharing controls
- [ ] Build health data visualization on client profile
- [ ] Note: Ensure HIPAA compliance before building

### 5.4 Tier 4 — Pivot Required

#### Therapist Marketplace
- [ ] Evaluate whether to pivot to marketplace model
- [ ] Build public therapist discovery/search
- [ ] Build therapist public profiles with reviews and ratings
- [ ] Build revenue sharing and Stripe Connect routing
- [ ] Build therapist verification system
- [ ] Note: Changes the entire business model — requires strategic decision first

---

## Quick Reference — High-Impact Pending Items

| Priority | Task | Phase | Effort |
|----------|------|-------|--------|
| 🔴 P0 | Complete Supabase auth migration | 0 | 3–5 days |
| 🔴 P0 | Database triggers for user sync | 0 | 0.5 day |
| 🔴 P0 | RLS policies on all tables | 0 | 1 day |
| 🟡 P1 | Analytics email delivery | 1 | 1–2 days |
| 🟡 P1 | Intake forms frontend | 1 | 2–3 days |
| 🟡 P1 | Stripe end-to-end testing | 1 | 1 day |
| 🟠 P2 | Settings page | 2 | 3–4 days |
| 🟠 P2 | Therapist performance dashboard | 2 | 2–3 days |
| 🟠 P2 | Promotions module | 2 | 4–5 days |
| 🟠 P2 | Quick call intake screen | 2 | 2–3 days |
| 🔵 P3 | Integration + E2E tests | 4 | 5–7 days |
| 🔵 P3 | Production deployment setup | 4 | 2–3 days |
| 🔵 P3 | Mobile responsiveness audit | 4 | 2–3 days |
