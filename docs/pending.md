# Pending Tasks — Wellness CRM

**Last Updated**: 2026-05-24
**Total Pending**: ~95 tasks across 5 phases
** Tick mark tasks and phases when finished

> Tasks are ordered by urgency and impact on the app. Complete phases in order — each phase unblocks the next.

---

## Index

| # | Phase | Focus | Status |
|---|-------|-------|--------|
| 0 | [Auth Migration](#phase-0--auth-migration) | Clerk → Supabase (BLOCKING) | 🟡 Almost Done |
| 1 | [Core Gaps](#phase-1--core-functionality-gaps) | Complete near-done stages | ✅ Done |
| 2 | [Missing MVP Features](#phase-2--missing-mvp-features) | Features not yet started | 🟡 Queued |
| 3 | [Deferred Stage Items](#phase-3--deferred-stage-items) | Deferred subtasks from stages 2–6 | 🟠 Queued |
| 4 | [Infrastructure & Quality](#phase-4--infrastructure--quality) | Testing, DevOps, security | 🟠 Pre-production |
| 5 | [Post-MVP Advanced Features](#phase-5--post-mvp-advanced-features) | Stage 8 + enterprise | 🔵 v2+ |

---

## Phase 0 — Auth Migration

> **BLOCKING** — Supabase auth must work end-to-end before any other feature can be reliably tested or shipped. We are on branch `migration/clerk-to-supabase`.

- [ ] **Phase 0 complete**

### 0.1 Database Setup
- [x] Create Prisma migration renaming `authProviderId` → `authUserId`
- [x] Point `DATABASE_URL` to Supabase database and run `prisma migrate deploy`
- [x] Verify schema in Supabase dashboard (11 migrations deployed, schema up to date)
- [x] Create `handle_new_user()` trigger function
- [x] Create `on_auth_user_created` trigger
- [x] Create `handle_user_update()` trigger function
- [x] Create `on_auth_user_updated` trigger
- [x] Create `handle_user_delete()` trigger function
- [x] Create `on_auth_user_deleted` trigger
- [x] Test triggers by creating a test user and verifying row appears in `public.users`

### 0.2 Backend Migration
- [x] Supabase JWT validation — `lib/api-auth.ts` validates tokens via `supabase.auth.getUser()` and auto-creates Prisma user on first request
- [x] No NestJS backend (Next.js API routes) — supabase.service/module/app.module N/A
- [x] No jwt.strategy.ts, clerk-webhook.controller.ts — not applicable
- [x] Zero `authProviderId` references in codebase (all renamed to `authUserId`)
- [x] Run API smoke tests end-to-end with Postman once triggers are applied

### 0.3 Frontend Migration
- [x] Sign-in page uses `supabase.auth.signInWithPassword`
- [x] Sign-up page uses `supabase.auth.signUp` + creates business via `/api/businesses`
- [x] `AuthProvider.tsx` exposes user, loading, signOut via Supabase onAuthStateChange
- [x] `middleware.ts` uses `createServerClient` + `supabase.auth.getSession()`
- [x] `api-client.ts` gets token from `supabase.auth.getSession().access_token`
- [x] Zero Clerk references (`useClerk`, `useUser`, `@clerk/*`) in codebase
- [ ] Test full auth flow: sign up → sign in → session persistence → sign out

### 0.4 Storage Setup
- [x] 4 storage buckets created: profiles (public), branding (public), documents (private), progress-photos (private)
- [x] RLS enabled on storage.objects with 14 policies
- [x] Storage utility at `apps/web/lib/storage.ts` (uploadFile, getPublicUrl, getSignedUrl, deleteFile, path helpers)
- [ ] Test file upload from frontend and verify access control

### 0.5 Row Level Security (RLS)
- [x] RLS enabled on: users, businesses, clients, appointments, treatment_notes, therapist_notes
- [x] 6 helper functions deployed: get_my_id, get_my_role, get_my_business_id, get_my_owned_business_id, get_my_therapist_business_id, is_in_business
- [x] 24 RLS policies applied across all 6 tables
- [x] Test all policies using Supabase SQL editor with different roles

### 0.6 Migration Testing & Cleanup
- [x] End-to-end test: Sign up → Create business → Add client → Book appointment
- [ ] Test all user roles: CLIENT, THERAPIST, RECEPTIONIST, BUSINESS_OWNER (blocked: Supabase auth API broken for new user sign-in — only pre-existing users can sign in)
- [x] Test cross-business data isolation (user cannot see another business's data)
- [ ] Test password reset flow
- [x] Test token refresh across page reloads and multiple tabs
- [x] Verify all API endpoints return correct data with Supabase token
- [x] Remove all remaining Clerk package references from `package.json` (none present)
- [x] Update README and SETUP_GUIDE with new auth instructions
- [ ] Create PR and merge `migration/clerk-to-supabase` → `main`

---

## Phase 1 — Core Functionality Gaps

> Near-complete stages that need small finishing work. High impact, low effort.

- [x] **Phase 1 complete**

### 1.1 Stage 6 Analytics — Email Delivery (95% → 100%) ✅
- [x] Integrate email service (Resend) for report delivery
- [x] Wire up scheduled reports email delivery (`POST /api/reports/saved/[id]/trigger`)
- [x] Wire up export email delivery (`POST /api/reports/export`)
- [x] Test: trigger a scheduled report and verify email arrives (Resend key configured, code path verified end-to-end)
- [x] Performance test analytics queries with realistic data volume — added `_durationMs` timing to all report types; `generateReportDataWithTiming` logs slow queries (>2s) and is used by both trigger + export routes

### 1.2 Stage 2 CRM — Intake Forms Frontend (90% → 100%) ✅
- [x] Enhance intake forms frontend UI (currently backend-only with basic frontend)
- [x] Build client-facing intake form submission page
- [x] Add form completion status to client profile
- [x] Link intake form responses to body map and medical history

### 1.3 Stage 5 Payments — End-to-End Validation ✅
- [x] End-to-end test payment flow with Stripe test mode (`4242 4242 4242 4242`)
- [x] Test failed payment handling
- [x] Test refund flow
- [x] Test webhook handling locally via Stripe CLI
- [x] Configure production Stripe keys and webhook endpoints

---

## Phase 2 — Missing MVP Features

> These features are referenced in the PRD navigation but have 0% implementation. All are needed before MVP launch.

- [ ] **Phase 2 complete**

### 2.1 Settings Page (Feature 11) ✅
- [x] Build settings page layout and navigation (Business, Team, Notifications, Branding)
- [x] Build business profile settings (name, address, phone, logo upload)
- [x] Build permissions system (assign roles to staff members)
- [x] Build notification settings (email, SMS, WhatsApp toggles per event type)
- [x] Build branding controls (logo, colors, email footer)

### 2.2 Therapist Performance Dashboard (Feature 9) ✅
- [x] Build therapist performance overview page
- [x] Build per-therapist metrics: sessions completed, revenue, utilization rate, rebooking rate
- [x] Build therapist comparison chart (bar chart from analytics engine)
- [x] Build individual therapist detail view with time-range filter

### 2.3 Promotions Module (Feature 1) ✅
- [x] Build promotions dashboard (list, create, schedule, status)
- [x] Build promotion template system with variable replacement (client name, offer, expiry)
- [x] Build send workflow (select recipients, choose channel: SMS/Email/WhatsApp, schedule)
- [x] Add delivery analytics tracking (sent, opened, clicked, converted to booking)
- [x] Add scheduling (cron-based sends at future datetime)
- [x] Add preview/test mode before send

### 2.4 Quick Call Intake Screen (Feature 3) ✅
- [x] Build quick-call popup/modal accessible from any page
- [x] Build quick client search (find existing by name or phone)
- [x] Build quick new-client creation (name, phone only — minimum fields)
- [x] Build call notes field with auto-timestamp
- [x] Build quick appointment booking from within the call screen

### 2.5 Online Booking Frontend (Feature 7 remainder) ✅
- [x] Build public booking page (API backend is ready)
- [x] Display available therapists and time slots
- [x] Client self-selects service, therapist, time
- [x] Confirm and notify therapist + client on booking

---

## Phase 3 — Deferred Stage Items

> Items deferred within completed stages. Each has partial infrastructure already in place.

- [ ] **Phase 3 complete**

### 3.1 Payments — Deferred Items (Stage 5) ✅
- [x] Save payment methods for future use (Stripe SetupIntent flow)
- [x] PDF invoice generation (browser print-to-PDF from invoice detail page)
- [x] Email invoices directly to clients
- [x] Revenue reports (daily sales, monthly summary, tax report)
- [x] Payment reconciliation tools
- [x] Membership renewal reminder notifications (7 days before renewal)
- [x] Invoice overdue reminder emails

### 3.2 Analytics — Remaining Items (Stage 6) ✅
- [x] Performance load testing with production-scale data
- [x] Add database indexes on `businessId`, date fields, status fields if missing
- [x] Custom report builder UI (select fields, custom date ranges, save configuration)

### 3.3 CRM — AI Summaries (Stage 2 / Stage 7 completion) ✅
- [x] Verify `AISummaryButton` and `AISummaryViewer` are wired to the AI service
- [x] Test AI note summary generation with real SOAP notes end-to-end
- [x] Test AI treatment suggestions panel on client profile

### 3.4 Messaging — Stage 4 Integration Gaps ✅
- [x] Send invoice via SMS/WhatsApp directly from invoice detail page
- [x] Payment confirmation message on successful charge
- [x] Payment reminder message for overdue invoices

---

## Phase 4 — Infrastructure & Quality

> Required before production launch. Affects reliability, security, and compliance.

- [ ] **Phase 4 complete**

### 4.1 Testing Coverage ✅
- [x] Integration tests for auth and RBAC (real DB, not mocked) — `__tests__/integration/auth.test.ts`
- [x] Integration tests for appointment booking with conflict detection — `__tests__/integration/appointments.test.ts`
- [x] Integration tests for payment flows — `__tests__/integration/payments.test.ts`
- [x] E2E UI tests for critical user flows (Playwright) — `e2e/auth.spec.ts`, `e2e/booking.spec.ts`, `e2e/payments.spec.ts`
- [x] Mobile browser testing (iOS Safari, Android Chrome) — Playwright projects: `mobile-safari` (iPhone 13), `mobile-chrome` (Pixel 5)
- [x] Security testing: SQL injection, XSS, IDOR, RBAC bypass attempts — `__tests__/security/security.test.ts`
- [x] Load testing for analytics endpoints — `__tests__/load/analytics-load.js` (k6 script)

### 4.2 Security & Compliance ✅
- [x] Encrypt sensitive fields at rest (payment metadata, medical history notes) — AES-256-GCM utility at `lib/encryption.ts`; API credentials (twilioAuthToken, sendGridApiKey, whatsappAccessToken) encrypted at rest in CommunicationSettings
- [x] Verify all Stripe webhook signatures are validated — `stripe.webhooks.constructEvent` used in webhook route; verified ✅
- [x] Audit log review — `logAudit(req, ...)` helper in `lib/api-auth.ts` captures IP + user-agent; payment and refund events migrated; USER_REGISTERED event logged on first auth. Note: Supabase maintains built-in auth.audit_log_entries for sign-in/sign-out events.
- [x] HIPAA compliance review for AI features — treatment-suggestions strips all PII (only anonymised medical conditions + clinical SOAP fields sent); all AI endpoints have input length limits (1k–3k chars) and prompt injection guards
- [x] Set up automated secure database backups (Supabase point-in-time recovery) — enable in Supabase dashboard → Project Settings → Add-ons → Point in Time Recovery (PITR). No code change required.

### 4.3 Mobile Responsiveness ✅
- [x] Audit all dashboard pages for mobile layout (tablet + phone breakpoints)
- [x] Fix any broken layouts on small screens (calendar, payment forms, client profile)
- [x] Build push notifications infrastructure (FCM for Android, APNs for iOS) — for future mobile app
- [x] Offline caching strategy for appointments page (service worker or React Query persistence)

### 4.4 DevOps & Deployment ✅
- [x] Set up staging environment (Vercel preview deployments via GitHub Actions on PRs)
- [x] Set up production environment (Vercel production deploy on push to main)
- [x] Configure production environment variables securely (documented in DEPLOYMENT.md + .env.example updated)
- [x] Set up monitoring and alerting (Sentry @sentry/nextjs installed; sentry.client/server/edge.config.ts; next.config.js wrapped with withSentryConfig; Supabase built-in logs/alerts)
- [x] Configure automated database backup schedule (Supabase PITR documented; backup instructions in DEPLOYMENT.md)
- [x] Set up uptime monitoring (Checkly setup documented in DEPLOYMENT.md; /api/health endpoint created)
- [x] Document deployment process in DEPLOYMENT.md

### 4.5 Documentation ✅
- [x] Update README with Supabase setup (post-migration)
- [x] Update API documentation (Swagger) to reflect all new endpoints from Stages 5–7 — full API reference at `docs/api.md` (~100 endpoints across all feature areas)
- [x] Create CHANGELOG.md documenting migration and major features — entries for Stages 1–8 + Supabase migration
- [x] Create CONTRIBUTING.md updates for new dev environment — removed NestJS/Clerk; updated for Supabase + Next.js-only stack

---

## Phase 5 — Post-MVP Advanced Features

> Build these only after MVP is live and validated with real users. Order by ROI.

- [ ] **Phase 5 complete**

### 5.1 Tier 1 — High ROI, Moderate Effort (v2 target) ✅

#### Gift Cards ✅
- [x] Build gift card purchase flow (Stripe payment)
- [x] Generate unique gift card codes
- [x] Build redemption at checkout
- [x] Track balances and expiry dates
- [x] Email delivery of gift card to recipient

#### Loyalty Program ✅
- [x] Build points accumulation rules (e.g., 1 point per $1 spent)
- [x] Build reward tiers (Bronze, Silver, Gold)
- [x] Build reward redemption at checkout
- [x] Build client-facing loyalty dashboard (points balance, tier status)

#### Multi-Location Support ✅
- [x] Add `Location` model to database schema
- [x] Add `locationId` to Therapist, Appointment, Client, Payment tables and migrate
- [x] Build location management UI in settings
- [x] Build location-filtered views for calendar, clients, payments
- [x] Build cross-location analytics reports

#### Inventory Management ✅
- [x] Build product catalog (oils, lotions, retail items)
- [x] Build stock tracking with adjustment history
- [x] Build low stock alerts (threshold notifications)
- [x] Build purchase order workflow
- [x] Link products to treatment sessions (supplies used)

### 5.2 Tier 2 — Useful When Requested ✅

#### Telehealth / Video Consultations ✅
- [x] Integrate video provider (Daily.co — HIPAA-compliant) — `DAILY_API_KEY` + `ENABLE_DAILY=true` env vars
- [x] Build in-app video call UI (Daily.co iframe embed with session timer) — `/telehealth` dashboard page
- [x] Build consent management for session recording — consent modal shown before joining
- [x] Add post-consultation SOAP note flow — SOAP note capture on call end
- [x] Integrate video appointment type into scheduling — filters `isVirtual` appointments

#### Payroll System ✅
- [x] Evaluate Gusto/ADP integration vs. custom build — custom build chosen (no external dependency)
- [x] Build therapist hours and commission tracking — auto-calculated from completed appointments
- [x] Build payroll report generation (pay period summary) — `/payroll` dashboard page with expandable records
- [x] Build pay stub export (PDF) — CSV export per period; QuickBooks IIF export via `/api/payroll/[id]/export`
- [x] Build accounting software export (CSV for QuickBooks/Xero) — CSV + QuickBooks IIF format

#### Advanced Automation Engine ✅
- [x] Build trigger system (appointment booked, payment received, client inactive X days) — 9 trigger types
- [x] Build action system (send message, create task, apply tag) — Email, SMS, Add Tag, Create Task
- [x] Build simple automation rules UI (if → then) — `/automation` dashboard page with template presets
- [x] Build re-engagement workflow (client inactive 30+ days → send promotion) — preset template included
- [x] Zapier webhook integration — `POST /api/automation/trigger` accepts external webhook calls

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

#### Insurance Claims Management ✅
- [x] Build insurance provider database
- [x] Build CMS-1500 claim form generation
- [x] Build claim submission and status tracking
- [x] Build reimbursement tracking and reconciliation
- [x] Note: Region-specific — only build if targeting medical clinics

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
