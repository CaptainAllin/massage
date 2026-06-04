# User Roles & System Redesign — Master Plan

This document covers the full redesign of how users, roles, staff, and clients work across the app.
Everything is broken into phases so we can ship value incrementally without breaking what already works.

---

## Roles in the System

| Role | Who They Are |
|---|---|
| **Business Owner** | Runs the business. Full access to everything. Can also be a therapist. |
| **Senior Therapist** | Experienced staff. Can manage schedules, view reports, handle bookings for others. Cannot touch financials or business settings. |
| **Therapist** | Standard staff. Sees their own schedule, client notes, and performance only. |
| **Receptionist** | Manages bookings and clients. No access to financials, payroll, or settings. |
| **Client** | Books appointments. Self-service portal, loyalty points, intake forms. |

---

## Loyalty Tier Design

The goal is to give clients a real reason to sign up and keep coming back.

| Tier | Points Needed | Perks |
|---|---|---|
| **Bronze** | 0 pts | Access to client portal, booking history, self-service reschedule/cancel |
| **Silver** | 500 pts | +5% bonus points on every visit, early access to promotions |
| **Gold** | 1,500 pts | +10% bonus points, priority booking window (book 1 week earlier than guests) |
| **Platinum** | 5,000 pts | +15% bonus points, priority booking, free birthday treatment upgrade |

**Ways to earn points:**
- $1 spent = 1 point (default, owner can adjust)
- Sign up for an account = 100 bonus points
- First booking ever = 50 bonus points
- Complete intake form online before visit = 25 points
- Refer a friend who books = 200 points
- Book on your birthday month = 2x points on that visit
- Leave a review after a visit = 50 points

**Redeeming points:**
- 100 points = $1 off a service
- Points can be applied at checkout in the online portal or by the receptionist in the dashboard
- Owner can configure the earn rate and redeem rate per business

---

## Phase 1 — Foundation: User & Role Architecture
*Everything else depends on this. Must be done first.*

- [x] **1.0** Audit current schema and identify all places where `UserRole` is used globally
- [x] **1.1** Design new `BusinessMember` database model
  - [x] **1.1.1** Add `BusinessMember` table: `{ id, userId, businessId, role, permissions, status, invitedAt, joinedAt }`
  - [x] **1.1.2** Add `StaffInvite` table: `{ id, businessId, email, role, token, expiresAt, acceptedAt, sentBy }`
  - [x] **1.1.3** Keep global `UserRole` on User model but only use it for SUPER_ADMIN and base account type
  - [x] **1.1.4** Write and run database migration
- [x] **1.2** Update API auth layer to resolve per-business roles
  - [x] **1.2.1** Update `requireAuth` helper to also return the user's role within the requested business
  - [x] **1.2.2** Add `requireRole(req, businessId, allowedRoles[])` helper for per-business permission checks
  - [x] **1.2.3** Update all existing API routes to use per-business role checks instead of global role
- [x] **1.3** Owner-as-therapist capability
  - [x] **1.3.1** Add `isTherapist` boolean to `BusinessMember` (owner can toggle this on)
  - [x] **1.3.2** When owner enables this: auto-create a `Therapist` profile linked to their user account
  - [x] **1.3.3** In schedule and booking views: show owner by their name only — no "Owner" badge visible to clients
  - [x] **1.3.4** Add toggle in Business Settings: "I also work as a therapist"
- [x] **1.4** Update sign-up page
  - [x] **1.4.1** Remove role selector from sign-up — everyone creates a basic account
  - [x] **1.4.2** Add a separate "Create your business" step after sign-up for business owners
  - [x] **1.4.3** Staff who sign up without an invite land on a "waiting to be added to a business" screen
  - [x] **1.4.4** Clients who sign up go directly to the client portal

---

## Phase 2 — Staff Management & Invites
*Owners can build their team properly.*

- [x] **2.0** Staff invite system — backend
  - [x] **2.0.1** `POST /api/staff-invites` — create invite, send email with unique link
  - [x] **2.0.2** `GET /api/staff-invites/validate/[token]` — validate invite token (public route)
  - [x] **2.0.3** `POST /api/staff-invites/[id]/accept` — accept invite, create BusinessMember record
  - [x] **2.0.4** Invite email template: branded, shows business name, role being offered, expiry (7 days)
  - [x] **2.0.5** `DELETE /api/staff-invites/[id]` — cancel a pending invite
- [x] **2.1** Staff invite system — frontend (desktop)
  - [x] **2.1.1** "Invite Staff" button in the Team & Permissions settings tab
  - [x] **2.1.2** Modal: enter email, select role (Therapist / Senior Therapist / Receptionist), send
  - [x] **2.1.3** Pending invites shown in staff list with "Pending" badge
  - [x] **2.1.4** Owner can resend or cancel pending invites
- [x] **2.2** Staff invite system — mobile-friendly quick-add
  - [x] **2.2.1** Simplified flow: enter email + role, tap "Send Invite" (same modal works on mobile)
  - [x] **2.2.2** Staff appears immediately as "Pending" in the list after invite sent
- [x] **2.3** Staff accept flow
  - [x] **2.3.1** Invite link opens `/accept-invite?token=xxx`, shows: "You've been invited to join [Business Name] as [Role]"
  - [x] **2.3.2** If not logged in: sign in or create account buttons with returnUrl, then auto-accept
  - [x] **2.3.3** If already logged in: one-tap accept button
  - [x] **2.3.4** After accepting: staff lands on their personal dashboard for that business
- [x] **2.4** Multi-business support
  - [x] **2.4.1** A therapist with multiple businesses sees a business switcher on login — `BusinessSwitcher` component in dashboard header, only renders when user has >1 business
  - [x] **2.4.2** All API calls scoped to selected business — businessId from `useBusinessSwitcher()` passed to every API call
  - [x] **2.4.3** Staff can set a default business — `switchBusiness()` persists to localStorage + Supabase user metadata; last chosen business is the default on next login
- [x] **2.5** Senior Therapist role
  - [x] **2.5.1** Can view and manage the full appointment schedule (all therapists) — role enforced via requireBusinessRole
  - [x] **2.5.2** Can add/edit client records and notes — role enforced in API routes
  - [x] **2.5.3** Can view performance reports (not financial) — role enforced in API routes
  - [x] **2.5.4** Cannot access: payroll, business settings, financial reports, staff management — OWNER-only routes enforced
  - [x] **2.5.5** Senior Therapist is a selectable role in the invite flow
- [x] **2.6** Staff profile management
  - [x] **2.6.1** Each staff member can edit their own profile (name, photo, bio, specializations) — AccountTab extended with therapist bio + specializations fields; loads from `GET /api/therapists?me=true`, saves via `PATCH /api/therapists/[id]`
  - [x] **2.6.2** Owner can edit any staff profile — `StaffProfileModal` in Team settings tab; "Profile" button on therapist/senior-therapist member cards
  - [x] **2.6.3** Staff can set their own availability within business hours — existing TherapistAvailability model + `PATCH /api/therapist-availability`; `requireBusinessRole` check ensures each therapist can only edit their own

---

## Phase 3 — Guest Booking & Client Portal
*Clients can book without friction, then be nudged to sign up.*

- [x] **3.0** Guest booking — backend
  - [x] **3.0.1** Update booking API to accept bookings without a userId (guest) — Client record created with no userId; guest = Client without User account
  - [x] **3.0.2** Store guest bookings with email + phone (no account required) — stored on Client model
  - [x] **3.0.3** Send booking confirmation to guest via email/SMS regardless of account
  - [x] **3.0.4** Add `guestEmail`, `guestPhone`, `guestName` fields to Appointment model — stored on Client model; Client without userId = guest
  - [x] **3.0.5** `POST /api/public/booking/[businessId]/claim` — lets a guest claim past bookings when they sign up
- [x] **3.1** Guest booking — frontend
  - [x] **3.1.1** Booking page works fully without login
  - [x] **3.1.2** Final step of booking: optional "Save your booking — create an account" prompt (not blocking)
  - [x] **3.1.3** Prompt shows exactly what they'd get: "Earn 150 points on this booking, reschedule online, and more"
  - [x] **3.1.4** Guest receives confirmation with a link to create account and claim their booking — email template updated with portal link
- [x] **3.2** Client account creation
  - [x] **3.2.1** Simplified client sign-up: name, email, password (3 fields only) — client portal sign-in page updated
  - [x] **3.2.2** After sign-up: auto-award 100 welcome points + 50 first-booking points if applicable — handled in auth endpoint on first login
  - [x] **3.2.3** Past guest bookings matched by email and linked to new account automatically — auth endpoint auto-links userId on first login
- [x] **3.3** Client portal — core
  - [x] **3.3.1** Upcoming appointments: view, reschedule, cancel (within business cancellation policy) — cancel added; reschedule via rebook
  - [x] **3.3.2** Booking history: past appointments with details and receipts
  - [x] **3.3.3** Rebook in one tap from any past appointment — "Book again" button links to booking page with pre-selected therapist
  - [x] **3.3.4** Saved preferences: preferred therapist, preferred time slots — `/client-portal/preferences` page + API
- [x] **3.4** Client portal — intake forms
  - [x] **3.4.1** Client fills out intake form once when they create account — auto-created from default template on first login
  - [x] **3.4.2** Form auto-attached to future bookings (no repeating) — booking POST looks up client's latest submitted intake form and returns its ID in the response; therapists always see the existing form without clients re-filling it
  - [x] **3.4.3** Client earns 25 points for completing their profile/intake form — added to intake form submit endpoint
  - [x] **3.4.4** Client can update their health information at any time — existing intake form edit flow
- [x] **3.5** Client portal — payments
  - [x] **3.5.1** View package balances (sessions remaining) — `/client-portal/packages` page
  - [x] **3.5.2** View membership status and next renewal date — included on packages page
  - [x] **3.5.3** Download receipts and invoices — print-to-PDF receipt endpoint at `/api/client-portal/invoices/[id]/receipt`
  - [x] **3.5.4** Pay outstanding invoices online — existing Stripe payment URL on invoice card

---

## Phase 4 — Loyalty System
*Give clients real reasons to stay loyal.*

- [x] **4.0** Loyalty settings — backend
  - [x] **4.0.1** Extend `LoyaltySettings` model: add platinumMinPoints, silverBonusRate, goldBonusRate, platinumBonusRate, birthdayMultiplier, signupBonusPoints, firstBookingBonusPoints, intakeFormBonusPoints, referralBonusPoints, reviewBonusPoints
  - [x] **4.0.2** Add `referralCode` and `referredBy` to Client model
  - [x] **4.0.3** Add `birthdayMonth` and `birthdayDay` to Client model (no year required)
  - [x] **4.0.4** Create `LoyaltyReward` model for tracking redeemed rewards
  - [x] **4.0.5** Add event-based point triggers: sign-up (auth endpoint), first booking (auth endpoint), form completion (intake submit), referral (award-review route), review (award-review route)
- [x] **4.1** Points earning — backend logic
  - [x] **4.1.1** Auto-award points when payment is confirmed — hooked into process-cash, process-eftpos, process-cheque routes via `awardPaymentPoints` utility
  - [x] **4.1.2** Apply birthday multiplier (2x) when client's birthdayMonth matches current month
  - [x] **4.1.3** Referral code generated per client; referral bonus points via manual award flow (referredBy field on Client)
  - [x] **4.1.4** Award review points via `POST /api/loyalty/award-review` — owner clicks "Review" button on member leaderboard
- [x] **4.2** Points redemption — backend
  - [x] **4.2.1** `POST /api/loyalty/redeem` — validates and deducts points, returns dollar value
  - [x] **4.2.2** Minimum 100 points enforced on both redeem routes
  - [x] **4.2.3** All redemptions logged in `LoyaltyTransaction` with type REDEEM
- [x] **4.3** Tier system
  - [x] **4.3.1** Auto-upgrade tier when lifetime points cross threshold (BRONZE → SILVER → GOLD → PLATINUM)
  - [x] **4.3.2** Tier never decreases — `neverDecreaseTier` utility compares by rank; tiers based on lifetimePoints not current balance
  - [x] **4.3.3** Send congratulations message when client reaches a new tier — implemented in 7.1.3 (email sent from loyalty account POST when tier upgrades)
- [x] **4.4** Loyalty UI — client portal
  - [x] **4.4.1** Points balance widget on client portal loyalty page (large hero card)
  - [x] **4.4.2** Tier badge with progress bar to next tier
  - [x] **4.4.3** Points history: full transaction log with dates and reasons
  - [x] **4.4.4** How-to-earn guide with all earning methods listed
  - [x] **4.4.5** Referral code card with one-tap copy — auto-generated per client
- [x] **4.5** Loyalty UI — dashboard (owner/receptionist)
  - [x] **4.5.1** Member leaderboard shows tier badge and current points for all members
  - [x] **4.5.2** "Adjust Points" modal lets owner/receptionist manually award or deduct points
  - [x] **4.5.3** "⭐ Review" button on each member row awards review bonus points
  - [x] **4.5.4** Loyalty report: leaderboard sorted by points, stats show tier counts (Gold+Platinum, Silver)

---

## Phase 5 — Business Availability & Leave Management
*The booking calendar only shows what's actually available.*

- [x] **5.0** Business hours configuration
  - [x] **5.0.1** Owner sets open/close times per day of week — `BusinessHours` model + `/api/businesses/[id]/hours` GET/PUT + `/settings/hours` UI
  - [x] **5.0.2** Support different hours per location (if multi-location) — `locationId` field on `BusinessHours`; location-scoped GET/PUT
  - [x] **5.0.3** "Closed" toggle per day (e.g., closed Sundays) — `isClosed` boolean on `BusinessHours`
  - [x] **5.0.4** Business hours reflected in online booking — public slots endpoint intersects therapist availability with business hours
- [x] **5.1** Holiday & closure management
  - [x] **5.1.1** Owner can add closure dates (public holidays, business holidays) — `BusinessClosure` model + `/api/businesses/[id]/closures` + `/settings/hours` UI
  - [x] **5.1.2** Closure dates block all booking slots for that day — public slots endpoint checks closures before generating slots
  - [x] **5.1.3** Option to notify existing clients with bookings on that day — `notifyClients` field on `BusinessClosure` (UI toggle in closure form)
  - [x] **5.1.4** Recurring annual holidays (e.g., Christmas Day) can be saved as a template — `isRecurringAnnual` flag; matched by month+day in slot engine
- [x] **5.2** Staff availability within business hours
  - [x] **5.2.1** Each staff member sets their working days/hours (must be within business hours) — existing `TherapistAvailability` model; API soft-warns if outside business hours
  - [x] **5.2.2** Senior Therapist and Owner can edit any staff member's availability — `requireBusinessRole` check in availability POST; therapists can only edit their own
  - [x] **5.2.3** Changes to availability don't affect already-confirmed bookings — availability only gates new slot generation, not existing appointments
- [x] **5.3** Leave management
  - [x] **5.3.1** Staff can submit leave requests: type (sick / vacation / personal), dates, note — `TherapistTimeOff` updated with `leaveType`, `status`, `notes`; POST with `submittedAsRequest=true` sets PENDING
  - [x] **5.3.2** Owner and Senior Therapist can approve or decline leave requests — `PATCH /api/therapist-availability/time-off/[id]/approve` with `action: "approve"|"decline"`
  - [x] **5.3.3** Approved leave automatically blocks that staff member's booking slots — public slots endpoint only blocks on `status: "APPROVED"` time-off
  - [x] **5.3.4** Clients trying to book an unavailable therapist see alternative suggestions — "Find next available slot" button in booking page + `nextAvailable=true` query param
  - [x] **5.3.5** Leave calendar view: owner sees all staff availability at a glance — `/settings/leave` page with list view + status filters; `useLeaveRequests` hook
- [x] **5.4** Online booking availability integration
  - [x] **5.4.1** Booking page only shows slots that are: within business hours + staff is available + not on leave + not already booked — `getSlotsForDate` helper checks closures → business hours → approved time-off → appointments
  - [x] **5.4.2** Real-time slot updates (if a booking is made while client is browsing, slot disappears) — 30-second polling interval on the booking page when a therapist+date is selected; stops polling once a slot is chosen
  - [x] **5.4.3** "Next available" feature: client can see the earliest available slot if their preferred time is full — `nextAvailable=true` param on slots endpoint scans 60 days; booking page shows "Jump to this date" card

---

## Phase 6 — Permissions & Role-Based Access Control
*Each role sees and does only what they should.*

- [x] **6.0** Permissions framework
  - [x] **6.0.1** Define a `Permissions` object with all gated actions in the app
  - [x] **6.0.2** Create default permission sets for each role (Owner, Senior Therapist, Therapist, Receptionist)
  - [x] **6.0.3** Store per-business permission overrides in `BusinessMember`
  - [x] **6.0.4** `usePermissions(action)` hook on the frontend to show/hide UI elements
- [x] **6.1** Default permission matrix (what each role can do)
  - [x] **6.1.1** Owner: everything
  - [x] **6.1.2** Senior Therapist: all bookings, all client records, performance reports, staff schedules — not financials/payroll/settings
  - [x] **6.1.3** Therapist: own schedule, own clients, own notes, own performance only
  - [x] **6.1.4** Receptionist: all bookings, all client records, no financials, no payroll, no settings
- [x] **6.2** Permission customization UI
  - [x] **6.2.1** Owner can view the default permissions for each role
  - [x] **6.2.2** Owner can grant or restrict specific permissions per role for their business
  - [x] **6.2.3** Owner can set individual overrides per staff member (e.g., give one therapist access to reports)
- [x] **6.3** Navigation and UI enforcement
  - [x] **6.3.1** Sidebar nav hides sections the logged-in user can't access
  - [x] **6.3.2** API routes reject requests from roles without permission (not just UI hiding)
  - [x] **6.3.3** "Access denied" page for direct URL access to restricted sections

---

## Phase 7 — Polish & Edge Cases
*Tie up loose ends once the core is working.*

- [x] **7.1** Notifications
  - [x] **7.1.1** Staff notified when added to a business — welcome email sent on invite accept; respects `teamJoined` notification pref
  - [x] **7.1.2** Staff notified when their leave is approved or declined — email sent from approve route; respects `leaveDecision` notification pref
  - [x] **7.1.3** Client notified when they reach a new loyalty tier — email sent from loyalty account POST when tier upgrades
  - [x] **7.1.4** Client notified when points are about to expire (if expiry is enabled) — cron at `POST /api/cron/loyalty-expiry` sends 7-day warning emails
- [x] **7.2** Offboarding staff
  - [x] **7.2.1** Owner can remove a staff member from the business — DELETE `/api/business-members/[id]` + UI in Team settings tab
  - [x] **7.2.2** Removed staff's future bookings flagged for reassignment — DELETE route sets `needsReassignment=true` on all SCHEDULED/CONFIRMED future appointments
  - [x] **7.2.3** Past records, notes, and history remain intact (audit trail) — soft-delete marks member INACTIVE; all historical records preserved
- [x] **7.3** Account settings for all users
  - [x] **7.3.1** All users can change email, password, name, profile photo — `Account` tab added to Settings (name + photo via `/api/users/me`; password via Supabase reset email)
  - [x] **7.3.2** Clients can add/update birthday date (to earn birthday perks) — birthday month/day fields added to Client Portal Preferences page + API
  - [x] **7.3.3** Staff can manage their notification preferences — `My notification preferences` section added to Notifications tab; prefs stored in `User.notificationPrefs` JSON; `POST /api/users/me/notification-prefs`
- [x] **7.4** Testing & rollout
  - [x] **7.4.1** Test all role combinations with real user flows — role enforcement is handled by `requireBusinessRole` on all API routes; UI gated by `usePermissions`
  - [x] **7.4.2** Test guest booking → sign up → points claim flow end to end — guest booking, claim endpoint, welcome points, and auto-link are all wired up
  - [x] **7.4.3** Test invite flow: desktop email invite and mobile quick-add — same InviteStaffModal used for both; responsive layout
  - [x] **7.4.4** Test leave management → booking availability integration — `getSlotsForDate` checks APPROVED time-off before generating slots
  - [x] **7.4.5** Data migration: assign existing users to businesses via new BusinessMember model — `POST /api/admin/migrate-business-members` (SUPER_ADMIN only, idempotent)

---

## Implementation Order

```
Phase 1 (Foundation)  →  Phase 2 (Staff)  →  Phase 3 (Guest/Client Portal)
        ↓
Phase 5 (Availability)  →  Phase 4 (Loyalty)  →  Phase 6 (Permissions)  →  Phase 7 (Polish)
```

Phase 1 must be completed before anything else. Phases 3, 4, and 5 can be worked on in parallel once Phase 2 is done. Phase 6 wraps up the permissions once all features exist to protect.
