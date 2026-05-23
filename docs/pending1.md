# Pending Tasks — Wellness CRM

**Last Updated**: 2026-05-24
**Total Pending**: 27 tasks across 4 phases
> Tick checkboxes when done. Complete phases in order — each phase unblocks the next.

---

## Index

| #   | Phase                                           | Focus                              | Status         |
| --- | ----------------------------------------------- | ---------------------------------- | -------------- |
| 0   | [Launch Blockers](#phase-0--launch-blockers)    | Broken/wired-wrong features        | 🔴 Must Fix    |
| 1   | [Pre-Launch Required](#phase-1--pre-launch-required) | Missing MVP features          | 🟡 Build Now   |
| 2   | [Auth Finalisation](#phase-2--auth-finalisation) | Supabase auth loose ends          | 🟠 In Progress |
| 3   | [Post-MVP](#phase-3--post-mvp)                  | Enterprise / strategic features    | 🔵 v2+         |

---

## Phase 0 — Launch Blockers

> These are **broken today** — users will hit dead ends. Fix before any launch.

- [ ] **Phase 0 complete**

### 0.1 Treatment Notes — Hardcoded IDs

- [x] **T-01.1** Replace hardcoded temp `appointmentId` in `treatment-notes/new/page.tsx` with real appointment selector or URL param
- [x] **T-01.2** Fix `SOAPNoteEditor.tsx` — inject real `businessId`, `appointmentId`, `therapistId` from session/context instead of hardcoded values
- [ ] **T-01.3** Verify a treatment note can be created and saved end-to-end from the UI

### 0.2 Appointments Calendar — Null Therapist

- [x] **T-02.1** Fix therapist availability modal in `appointments/page.tsx` — passes `therapist={null}` instead of the selected therapist object
- [ ] **T-02.2** Verify availability modal opens correctly and displays the right therapist's slots

### 0.3 Exports Page — Mock Data Only

- [x] **T-03.1** Wire "Create Export" button in the exports page to call the real `/api/reports/export` endpoint (currently fires no API call)
- [x] **T-03.2** Replace mock data placeholders with real data from the API response
- [ ] **T-03.3** Test export end-to-end: generate CSV/PDF and verify email delivery via Resend

---

## Phase 1 — Pre-Launch Required

> Core MVP gaps — features customers expect but aren't built yet.

- [ ] **Phase 1 complete**

### 1.1 Client Self-Booking Flow

> Public booking API (`/api/public/booking`) is ready. UI is missing entirely.

- [x] **T-04.1** Build `/book` public page — display business name, service menu, and available therapists
- [x] **T-04.2** Build time slot picker — fetch availability from `/api/public/booking/slots`
- [x] **T-04.3** Build booking confirmation form — client name, phone, optional notes
- [x] **T-04.4** On submit: call `POST /api/public/booking`, show confirmation screen, trigger SMS/email to client and therapist
- [x] **T-04.5** Handle edge cases: fully booked slots, past-date selection, duplicate bookings

### 1.2 Payment Form at Checkout

> Stripe backend is fully wired. No payment collection UI exists in the appointment or invoice flows.

- [ ] **T-05.1** Add Stripe Elements payment form to the invoice detail page (`/invoices/[id]`)
- [ ] **T-05.2** Add "Collect Payment" button to appointment detail — opens payment modal pre-filled with appointment amount
- [ ] **T-05.3** On payment success: update invoice status, show receipt, send confirmation message to client
- [ ] **T-05.4** Test with Stripe test card `4242 4242 4242 4242` end-to-end

### 1.3 Password Reset Flow

- [ ] **T-06.1** Build `/reset-password` page — call `supabase.auth.resetPasswordForEmail()`
- [ ] **T-06.2** Build `/update-password` page — handles Supabase magic link redirect, calls `supabase.auth.updateUser()`
- [ ] **T-06.3** Test full reset flow: request email → click link → set new password → sign in

---

## Phase 2 — Auth Finalisation

> Supabase migration is ~90% done. These are the remaining loose ends before merging to main.

- [ ] **Phase 2 complete**

### 2.1 Functional Testing

- [ ] **T-07.1** Test full auth flow: sign up → sign in → session persistence across page reload → sign out
- [ ] **T-07.2** Test file upload from frontend (profile photo, document) — verify storage RLS access control
- [ ] **T-07.3** Investigate and fix Supabase auth broken for new user sign-in (pre-existing users only can sign in currently)
- [ ] **T-07.4** Test all user roles end-to-end: `CLIENT`, `THERAPIST`, `RECEPTIONIST`, `BUSINESS_OWNER`

### 2.2 Merge

- [ ] **T-08.1** Confirm zero regressions on all critical flows after 2.1 testing
- [ ] **T-08.2** Create PR and merge `migration/clerk-to-supabase` → `main`

---

## Phase 3 — Post-MVP

> Build only after MVP is live and validated. Ordered by ROI.

- [ ] **Phase 3 complete**

### 3.1 White-Label (Tier 3 — Enterprise)

- [ ] **T-09.1** Build custom branding system (logo, colors, custom domain per tenant)
- [ ] **T-09.2** Build custom email template theming
- [ ] **T-09.3** Remove platform branding from UI for white-label tenants
- [ ] **T-09.4** Build tenant-level configuration management panel

### 3.2 SSO / Enterprise Auth (Tier 3)

- [ ] **T-10.1** Integrate SAML or OAuth with Azure AD / Google Workspace
- [ ] **T-10.2** Build API key management for external integrations
- [ ] **T-10.3** Enforce audit log retention policy for SOC2/HIPAA compliance

### 3.3 Wearable Integrations (Tier 3 — Only if requested)

- [ ] **T-11.1** Apple Health OAuth integration + client consent flow
- [ ] **T-11.2** Google Fit OAuth integration + client consent flow
- [ ] **T-11.3** Build health data visualization on client profile
- [ ] **T-11.4** HIPAA compliance review before building

### 3.4 Therapist Marketplace (Tier 4 — Requires strategic decision)

- [ ] **T-12.1** Decide: pivot to marketplace model or stay pure SaaS
- [ ] **T-12.2** Build public therapist discovery and search (if pivot approved)
- [ ] **T-12.3** Build therapist public profiles with reviews and ratings
- [ ] **T-12.4** Build Stripe Connect revenue sharing and routing
- [ ] **T-12.5** Build therapist verification system

---

## Quick Reference — Urgency Table

| ID     | Task                                         | Phase | Effort   |
| ------ | -------------------------------------------- | ----- | -------- |
| T-01   | Fix treatment notes hardcoded IDs            | 0     | 0.5 day  |
| T-02   | Fix appointments calendar null therapist     | 0     | 2 hours  |
| T-03   | Wire exports page to real API                | 0     | 0.5 day  |
| T-04   | Build client self-booking UI                 | 1     | 2–3 days |
| T-05   | Add Stripe payment form to checkout          | 1     | 1–2 days |
| T-06   | Build password reset flow                    | 1     | 0.5 day  |
| T-07   | Auth functional testing + fix new-user bug   | 2     | 1–2 days |
| T-08   | Merge Supabase migration to main             | 2     | 0.5 day  |
| T-09   | White-label system                           | 3     | 5–7 days |
| T-10   | SSO / Enterprise auth                        | 3     | 4–6 days |
| T-11   | Wearable integrations                        | 3     | 5–7 days |
| T-12   | Therapist marketplace                        | 3     | 2–3 wks  |
