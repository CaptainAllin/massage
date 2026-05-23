# Changelog

All notable changes to the Wellness CRM Platform are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) · Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

---

## [Unreleased]

### Pending
- Phase 0.6: Full auth role testing (blocked by Supabase sign-in issue for new users)
- Phase 0.6: Password reset flow
- Phase 0.6: Merge `migration/clerk-to-supabase` → `main` PR

---

## [0.9.0] - 2026-05-24 — Phase 4: Infrastructure & Quality

### Added
- **Testing suite** — Integration tests for auth/RBAC, appointments (conflict detection), and payments (`__tests__/integration/`)
- **E2E tests** — Playwright test suite covering auth, booking, payments; desktop + mobile (iPhone 13 / Pixel 5) projects
- **Security tests** — SQL injection, XSS, IDOR, RBAC bypass attempts (`__tests__/security/security.test.ts`)
- **Load tests** — k6 script for analytics endpoints with realistic data volume (`__tests__/load/analytics-load.js`)
- **Encryption** — AES-256-GCM field-level encryption utility (`lib/encryption.ts`); API credentials in CommunicationSettings encrypted at rest
- **Audit logging** — `logAudit()` helper in `lib/api-auth.ts`; captures IP, user-agent, event type; payment, refund, and USER_REGISTERED events logged
- **Mobile responsiveness** — Full audit and fixes across all dashboard pages (calendar, payment forms, client profile)
- **Push notifications infrastructure** — FCM/APNs setup (`/api/push/subscribe`, `/api/push/send`)
- **Offline caching** — React Query persistence for appointments page (service worker strategy)
- **Staging environment** — Vercel preview deployments via GitHub Actions on PRs
- **Production environment** — Vercel production deploy on push to `main`
- **Monitoring** — Sentry (`@sentry/nextjs`); `sentry.client/server/edge.config.ts`; `next.config.js` wrapped with `withSentryConfig`
- **Health endpoint** — `GET /api/health`
- **DEPLOYMENT.md** — Full production deployment guide (Vercel, Supabase, Checkly uptime monitoring, PITR backup setup)

### Security
- Stripe webhook signature validation via `stripe.webhooks.constructEvent` verified on all webhook events
- HIPAA compliance for AI features: treatment suggestions strip all PII; all AI endpoints enforce input length limits (1k–3k chars) and prompt injection guards
- Supabase PITR (point-in-time recovery) documented for automated database backups

---

## [0.8.0] - 2026-04-15 — Auth Migration: Clerk → Supabase

### Changed
- **Auth provider** — Replaced Clerk with Supabase Auth (email/password); zero Clerk package references remain
- **Frontend auth** — `AuthProvider.tsx` uses `supabase.auth.onAuthStateChange`; sign-in/up pages use Supabase methods
- **Middleware** — `middleware.ts` uses `@supabase/ssr` `createServerClient` + `supabase.auth.getSession()`
- **API auth** — `lib/api-auth.ts` validates tokens via `supabase.auth.getUser()`; auto-creates `public.users` row on first request
- **Token passing** — `api-client.ts` reads token from `supabase.auth.getSession().access_token`
- **Field rename** — `authProviderId` → `authUserId` across all schema and code

### Added
- **Database triggers** — `handle_new_user`, `handle_user_update`, `handle_user_delete` sync `auth.users` → `public.users`
- **RLS** — Row Level Security enabled on 6 tables (users, businesses, clients, appointments, treatment_notes, therapist_notes); 24 policies; 6 helper SQL functions
- **Storage buckets** — 4 Supabase Storage buckets: `profiles` (public), `branding` (public), `documents` (private), `progress-photos` (private); 14 RLS policies
- **Storage utility** — `lib/storage.ts` with `uploadFile`, `getPublicUrl`, `getSignedUrl`, `deleteFile`, path helpers
- **`useBusinessId` hook** — resolves `businessId` from Supabase JWT metadata; used by all dashboard pages

### Removed
- All `@clerk/*` packages and imports
- NestJS backend service (`services/api/`) — no longer needed; all API logic lives in Next.js Route Handlers

---

## [0.7.0] - 2026-03-20 — Stage 8: AI & Advanced Features

### Added
- **SOAP note AI assist** — Autocomplete, format, and improve endpoints (`/api/ai/soap-assist/*`) powered by Anthropic Claude
- **AI treatment suggestions** — Per-client panel with clinical suggestions and feedback loop (`/api/ai/treatment-suggestions/[clientId]`)
- **AI note summaries** — On-demand and regeneration endpoints (`/api/treatment-notes/[id]/ai-summary`, `/regenerate`)
- **Telehealth / Video sessions** — Twilio Video integration; join/start/end endpoints (`/api/video-sessions/*`); appointment-linked sessions
- **Voice notes** — Voice recording support on treatment note forms

---

## [0.6.0] - 2026-02-28 — Stage 7: Messaging & Communications

### Added
- **Conversations** — Full conversation model with archive, close, reopen, read-status (`/api/conversations/*`)
- **Messages** — Per-conversation message threads; bulk send (`/api/messages/*`)
- **Communication settings** — Per-business channel configuration (SMS, email, WhatsApp toggles per event type) (`/api/communication-settings`)
- **Invoice messaging** — Send invoices via SMS/WhatsApp from invoice detail page (`/api/invoices/[id]/send-sms`)
- **Payment notifications** — Confirmation message on successful charge; reminder for overdue invoices
- **Promotions module** — Promotion dashboard, template system with variable replacement, send workflow (SMS/Email/WhatsApp), delivery analytics, scheduling (`/api/promotions/*`)
- **Quick Call screen** — Modal accessible from any page; quick client search, new-client creation (name/phone only), call notes, quick appointment booking

---

## [0.5.0] - 2026-02-10 — Stage 6: Analytics & Reports

### Added
- **Analytics endpoints** — Overview, appointments, revenue, clients, therapists (`/api/analytics/*`)
- **Reports** — Appointment, client, revenue, therapist, financial-summary reports (`/api/reports/*`)
- **Saved reports** — Save, list, get, delete, trigger on schedule (`/api/reports/saved/*`)
- **Export** — Report export with email delivery via Resend (`/api/reports/export`)
- **Custom report builder** — UI for selecting fields, date ranges, saving configurations
- **Performance timing** — `_durationMs` on all report types; slow queries (>2s) logged
- **Database indexes** — Added on `businessId`, date fields, and status fields

---

## [0.4.0] - 2026-01-25 — Stage 5: Payments

### Added
- **Stripe integration** — Process card payments (`/api/payments/process-stripe`), cash (`/process-cash`), check (`/process-check`)
- **Saved payment methods** — Stripe SetupIntent flow; save, list, delete (`/api/payments/saved-methods/*`, `/api/payments/setup-intent`)
- **Invoices** — Full invoice CRUD, line items, mark sent/paid, email send (`/api/invoices/*`)
- **Invoice messaging** — Email invoices directly to clients; overdue reminder cron job
- **Refunds** — Partial and full refund flow (`/api/payments/[id]/refund`)
- **Stripe webhooks** — `payment_intent.succeeded`, `payment_intent.payment_failed`, `customer.subscription.*` events handled (`/api/stripe/webhook`)
- **Memberships** — Create, cancel, pause, resume, redeem session, sessions-remaining (`/api/memberships/*`); Stripe subscription-linked
- **Packages** — Session packages with redemption tracking (`/api/packages/*`)
- **Revenue reports** — Daily sales, monthly summary, tax report (`/api/payments/revenue-report`)
- **Payment reconciliation** — Reconciliation tools (`/api/payments/reconciliation`)
- **Stats summary** — Payment and invoice summary endpoints
- **Membership renewal reminders** — Cron job sends reminder 7 days before renewal (`/api/cron/membership-reminders`)
- **PDF invoices** — Browser print-to-PDF from invoice detail page

---

## [0.3.0] - 2025-12-15 — Stage 4: Scheduling (Appointments)

### Added
- **Appointments** — Full CRUD with conflict detection; status transitions: confirm, cancel, complete, start, no-show (`/api/appointments/*`)
- **Recurring appointments** — Create and manage recurring series (`/api/recurring-appointments/*`)
- **Therapist availability** — Weekly schedule and time-off management (`/api/therapist-availability/*`)
- **Availability check** — Real-time slot conflict checking (`/api/appointments/availability/check`)
- **Available slots** — Query available slots for a therapist+date (`/api/therapist-availability/slots`)
- **Online booking** — Public booking page; client self-selects service, therapist, time; confirmation notifications (`/api/public/booking/[businessId]/*`)
- **Calendar UI** — Week view calendar with conflict highlighting, drag-and-drop rescheduling, filter panel

---

## [0.2.0] - 2025-11-01 — Stages 2–3: CRM, Intake Forms & Treatment Notes

### Added
- **Clients** — Full client profile CRUD; medical history, tags, notes; soft delete (`/api/clients/*`)
- **Intake form templates** — Create and manage form templates (`/api/intake-form-templates/*`)
- **Intake forms** — Assign forms to clients; client-facing public submission page (`/api/intake-forms/*`, `/api/public/intake-forms/*`)
- **Body maps** — Interactive body map for pain/treatment point annotation (`/api/body-maps/*`)
- **Medical conditions** — Per-client condition tracking linked to body map and intake forms (`/api/medical-conditions/*`)
- **Treatment notes** — SOAP notes (Subjective, Objective, Assessment, Plan) with full CRUD (`/api/treatment-notes/*`)
- **Therapist notes** — Internal therapist notes with pin support (`/api/therapist-notes/*`)
- **Therapist performance dashboard** — Per-therapist metrics (sessions, revenue, utilization, rebooking rate); comparison chart; time-range filter
- **Settings page** — Business profile, team/roles, notifications, branding (`/api/businesses/*`)
- **Users** — Profile management endpoints (`/api/users/me`, `/api/users/[id]`)
- **Businesses** — Business CRUD (`/api/businesses/*`)
- **Therapists** — Therapist management (`/api/therapists/*`)

---

## [0.1.0] - 2025-09-01 — Stage 1: Foundation

### Added
- Turborepo monorepo with `apps/web` (Next.js 14), `packages/database` (Prisma), `packages/auth`, `packages/ui`, `packages/types`
- App Router with route groups: `(auth)`, `(dashboard)`, `(public)`
- Dashboard layout with sidebar navigation and header
- Authentication with Clerk (later migrated to Supabase in v0.8.0)
- 8 Prisma models: User, Business, Therapist, Client, Appointment, IntakeForm, TreatmentNote, AuditLog
- Wellness design system: color palette, typography (Poppins + Inter), TailwindCSS config
- UI component library: Button, Input, Card, Badge, Avatar, EmptyState, Sidebar, Header
- GitHub Actions CI: lint, type-check, build, unit tests
- ESLint, Prettier, TypeScript strict mode across all packages
