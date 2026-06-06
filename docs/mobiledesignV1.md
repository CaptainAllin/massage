# Iris Mobile App — Implementation Plan v1

> **Source:** Design bundle `Iris Mobile.html` (exported from claude.ai/design, chat sessions 1–10).
> **Target:** Next.js app at `apps/web/`, components at `apps/web/components/mobile/`.
> **Palette:** Iris violet on cool-mist grey — CSS variables in `globals.css`.
> **Font:** Sora throughout.

---

## Status key
- `[ ]` not started
- `[x]` done
- `[~]` in progress / partial

---

## Phase 1 — Foundation & CSS Audit

**Goal:** Verify the design token layer, CSS utilities, and mobile detection exactly match the Iris design spec. Everything downstream depends on this being correct.

### 1.1 Design tokens (CSS variables)
- [x] 1.1.1 `--m-bg` → `#F4F3F8` (cool-mist canvas)
- [x] 1.1.2 `--m-surface` → `#FFFFFF` (card fill)
- [x] 1.1.3 `--m-panel` → `#FBFAFD`
- [x] 1.1.4 `--m-ink` / `--m-ink2` / `--m-muted` / `--m-faint`
- [x] 1.1.5 `--m-line` / `--m-line2` / `--m-line3`
- [x] 1.1.6 `--m-primary` `#5D4AA8` / `--m-primary2` `#7665C2` / `--m-primary-dk` `#3F2F87`
- [x] 1.1.7 `--m-accent` / `--m-accent-dk` / `--m-accent-soft`
- [x] 1.1.8 `--m-soft` / `--m-soft2`
- [x] 1.1.9 `--m-ok` / `--m-ok-soft` / `--m-warn` / `--m-warn-soft` / `--m-info` / `--m-info-soft`
- [x] 1.1.10 `--m-grad`: `linear-gradient(135deg, #5D4AA8 0%, #3F2F87 100%)`
- [x] 1.1.11 `--m-grad-hero`: `linear-gradient(150deg, #6A56B8 0%, #4A3895 55%, #2E2168 100%)`

### 1.2 Global CSS utility classes (`globals.css`)
- [x] 1.2.1 `.im-scroll` — hide scrollbar, iOS momentum scroll
- [x] 1.2.2 `.im-press` — scale(0.96) on active
- [x] 1.2.3 `.im-fab` — scale(0.92) + box-shadow transition on active
- [x] 1.2.4 `.im-tab` — remove tap highlight, touch-action manipulation
- [x] 1.2.5 `.im-safe-bottom` — `padding-bottom: max(8px, env(safe-area-inset-bottom))`
- [x] 1.2.6 `@keyframes im-sheet-up` — slide-up 0.26s cubic-bezier for BottomSheet entrance

### 1.3 Mobile detection & routing
- [x] 1.3.1 `useIsMobile()` hook in `(dashboard)/layout.tsx` detects `max-width: 767px`
- [x] 1.3.2 Layout renders `<MobileShell />` on mobile, desktop sidebar layout otherwise
- [x] 1.3.3 Verify breakpoint matches design: desktop-frame at `(hover: hover) and (pointer: fine) and (min-width: 480px)`, edge-to-edge on real touch devices
- [x] 1.3.4 Hide fake status bar on real mobile (`(hover: none)` or `(pointer: coarse)`) — currently hidden via width breakpoint only

### 1.4 BottomSheet animation
- [x] 1.4.1 Backdrop blur overlay
- [x] 1.4.2 Drag handle (36×4px pill)
- [x] 1.4.3 Slide-up entrance animation matches design spec: `transform: translateY(0)` on mount, `translateY(100%)` unmounted — use CSS `@keyframes im-sheet-up` rather than a JS state toggle to avoid frame 0 stuck issue

---

## Phase 2 — Dashboard Screen

**File:** `components/mobile/screens/MobileDashboard.tsx`
**Design ref:** `iris-mobile-screens.jsx → Dashboard`

### 2.1 Large Header
- [x] 2.1.1 Eyebrow label: "Practice overview" in `--m-primary`, uppercase, letter-spacing 1.6
- [x] 2.1.2 Title: "Good [time of day], [firstName]." with accent gradient on first name
- [x] 2.1.3 Subtitle: "{N} sessions today · {weekday}, {date}"
- [x] 2.1.4 Wire subtitle to real session count from `useMobileDashboard`

### 2.2 Studio status pill
- [x] 2.2.1 "Studio" label + Open/Closed pill with green/red dot
- [x] 2.2.2 Show real hours from business settings (currently hardcoded 8a–7p)

### 2.3 Install banner
- [x] 2.3.1 `<PWAInstallBanner />` renders above setup card on Dashboard
- [x] 2.3.2 Dismissible with localStorage persistence
- [x] 2.3.3 Auto-hides when app is already installed (standalone mode)

### 2.4 Finish Setup card
- [x] 2.4.1 Setup progress bar (5 steps)
- [x] 2.4.2 Each step as tappable row with chevron
- [x] 2.4.3 Dismissible (×) button
- [x] 2.4.4 Wire step completion states to real onboarding context (`useOnboarding`)
- [x] 2.4.5 Hide card when all 5 steps are done

### 2.5 Stat tiles (2×2 grid)
- [x] 2.5.1 Today's sessions tile → Appointments screen
- [x] 2.5.2 Active clients tile → Clients screen
- [x] 2.5.3 This month revenue tile → Payments screen
- [x] 2.5.4 Pending forms tile → More sheet
- [x] 2.5.5 Each tile has: label (uppercase, `--m-muted`), large value, delta with ↑/↓ trend, Spark chart
- [x] 2.5.6 Wire sparkline data — using decorative `SPARK_UP`/`SPARK_DOWN` mocks (no time-series API available)
- [x] 2.5.7 Sessions delta label shows "vs last week" tooltip on tap

### 2.6 SMS credits bar
- [x] 2.6.1 Card with chat icon, "SMS credits · this period" label
- [x] 2.6.2 Progress bar fills to `creditsUsed / creditsIncluded`
- [x] 2.6.3 Wired to `smsUsed` / `smsTotal` from `useMobileDashboard`

### 2.7 Revenue card
- [x] 2.7.1 Section label, large dollar value, growth delta
- [x] 2.7.2 `AreaChart` component renders
- [x] 2.7.3 30d / 90d / 1y segmented toggle
- [x] 2.7.4 Wire real revenue data per range (30d value+delta real; 90d/1y use mock shape — no time-series API yet)
- [x] 2.7.5 Date range labels below chart update with selected period (e.g. "Apr 26 · May 10 · Today")

### 2.8 Service mix card
- [x] 2.8.1 `Donut` chart renders with service slices
- [x] 2.8.2 Legend list with colored dots, label, percentage
- [x] 2.8.3 Center value shows total session count
- [x] 2.8.4 Wire to real `serviceMix` array from `useMobileDashboard`
- [x] 2.8.5 Show "No data yet" empty state when `serviceMix` is empty

### 2.9 Today's sessions card
- [x] 2.9.1 Section header "Today's sessions" with "View all →" link to Appointments
- [x] 2.9.2 SessionRow with avatar (therapist-colour coded), client name, service, therapist, time, status chip
- [x] 2.9.3 Shows first 4 sessions, "View all" links to full list
- [x] 2.9.4 Wire to real `sessions` from `useMobileDashboard`
- [x] 2.9.5 Empty state: "No sessions today. Book a new session →"

### 2.10 Fill-in offer nudge
- [x] 2.10.1 Peach background card: "N open slots today. Send a fill-in offer to your waitlist?" with Send button
- [x] 2.10.2 Show only when `sessions.length < capacityTotal` (stubbed: threshold = 8 slots)

### 2.11 This week bar chart
- [x] 2.11.1 `Bars` chart with 7 day labels (M–S)
- [x] 2.11.2 Today's bar highlighted with gradient
- [x] 2.11.3 Wire to real weekly session counts (via `useAppointments` for current week)
- [x] 2.11.4 Section subtitle: "{total} sessions · {n} therapists · Week {week#}"

---

## Phase 3 — Appointments Screen

**File:** `components/mobile/screens/MobileAppointments.tsx`
**Design ref:** `iris-mobile-screens.jsx → Appointments`

### 3.1 Large Header
- [x] 3.1.1 Eyebrow: "Calendar · Week {N}"
- [x] 3.1.2 Title: "Appointments"
- [x] 3.1.3 Subtitle: real session count, therapist count, booked $ for the week (currently static)

### 3.2 View toggle
- [x] 3.2.1 Segmented control: Agenda / Day / Week
- [x] 3.2.2 Active tab uses `--m-grad` background, white text

### 3.3 Day strip
- [x] 3.3.1 Horizontally scrollable 7-day (or 14-day) strip
- [x] 3.3.2 Today highlighted with gradient pill
- [x] 3.3.3 Tapping a day switches context of Agenda/Day views
- [x] 3.3.4 Auto-scroll so today is centered on mount

### 3.4 Therapist filter chips
- [x] 3.4.1 "All therapists" chip + one per therapist with their color dot
- [x] 3.4.2 Wire chip list to real therapists from API (currently hardcoded `THERAPISTS` array)
- [x] 3.4.3 Filtering persists when switching between day strip dates

### 3.5 Agenda view
- [x] 3.5.1 Each appointment: time column + colored connector line + Card with left-border accent
- [x] 3.5.2 Card shows: client name, StatusChip, service, therapist dot + name, room
- [x] 3.5.3 Wire to real appointments from API (currently uses `MOCK_APPTS`)
- [x] 3.5.4 Group by day when showing multi-day range; show date label above each group
- [x] 3.5.5 Empty state: "No appointments — tap + to add one"

### 3.6 Day view (time-column grid)
- [x] 3.6.1 Hour rows from 9 AM to 6 PM (or business hours)
- [x] 3.6.2 Events positioned absolutely by `startHour` + `duration`
- [x] 3.6.3 Now-line: horizontal line + left dot in `--m-accent` at current time
- [x] 3.6.4 Event blocks: translucent therapist-color background + left border + client/service text
- [x] 3.6.5 Wire to real appointments filtered to selected day
- [ ] 3.6.6 Tapping an event navigates to a detail/edit sheet (Phase 9 stretch)

### 3.7 Week view (mini grid)
- [x] 3.7.1 Horizontal-scroll grid: time labels column + 7 day columns
- [x] 3.7.2 Day header row with day abbreviation + date number; today circled with gradient
- [x] 3.7.3 Events as positioned absolute blocks with therapist color
- [x] 3.7.4 Wire to real appointments for the current week
- [x] 3.7.5 Auto-scroll to current time on mount

### 3.8 Booking page link card
- [x] 3.8.1 Card at bottom: "Client booking page · Share so clients can self-book, no login" + Copy link button
- [x] 3.8.2 Wire Copy link to real booking URL (`/booking/[businessId]`)

---

## Phase 4 — Clients Screen

**File:** `components/mobile/screens/MobileClients.tsx`
**Design ref:** `iris-mobile-screens2.jsx → Clients`

### 4.1 Large Header
- [x] 4.1.1 Eyebrow: "Clients · {N} active"
- [x] 4.1.2 Title: "Your people"
- [x] 4.1.3 Subtitle: real counts — new clients this month, # due for follow-up

### 4.2 Sticky search bar
- [x] 4.2.1 Search input visually rendered (search icon + placeholder)
- [x] 4.2.2 Wire to real text search — filter `CLIENTS` list on `name` as user types

### 4.3 Filter chips
- [x] 4.3.1 Chips: All / VIP / New this month / Due for visit / Inactive 60d+
- [x] 4.3.2 Each chip shows count badge
- [x] 4.3.3 Wire filters to real API: `filter` param on `useClientsWithMeta` hook
- [x] 4.3.4 Update count badges from real `counts` object returned by API

### 4.4 Client list
- [x] 4.4.1 Row: avatar (therapist-color), name + tags (VIP/Allergies), therapist + last visit, visit count
- [x] 4.4.2 Tap row → navigates to Client Profile
- [x] 4.4.3 Wire to real `clients` array (currently uses mock data)
- [x] 4.4.4 Infinite scroll or "Load more" pagination
- [x] 4.4.5 Empty state per filter: "No VIP clients yet"

---

## Phase 5 — Client Profile Screen

**File:** `components/mobile/screens/MobileClientProfile.tsx`
**Design ref:** `iris-mobile-screens2.jsx → Profile`

### 5.1 Navigation
- [x] 5.1.1 "← Clients" back button in `--m-primary` at top left
- [x] 5.1.2 Back action calls `router.goBack()`

### 5.2 Profile hero
- [x] 5.2.1 Large avatar (84px), therapist-color ring
- [x] 5.2.2 Client name (h1, 26px, Sora 700)
- [x] 5.2.3 Tags (VIP peach chip, Allergies violet chip)
- [x] 5.2.4 "Sees {therapist}" indicator with therapist color dot

### 5.3 Quick actions row
- [x] 5.3.1 Message button (primary gradient) → navigates to Thread
- [x] 5.3.2 Book button (outline) → navigates to Appointments
- [x] 5.3.3 Call button (outline) — tap-to-call `tel:` link
- [x] 5.3.4 Wire Message button to pass client context to Thread screen
- [x] 5.3.5 Wire real phone number to Call button (if available in client data)

### 5.4 KPI stats card
- [x] 5.4.1 Three columns: Visits / Lifetime ($) / Last visit
- [x] 5.4.2 Wire to real client data from API

### 5.5 Allergy alert card
- [x] 5.5.1 Warm peach card with shield icon, "Allergy alert" label, allergy note text
- [x] 5.5.2 Shown conditionally when client has allergy notes
- [x] 5.5.3 Wire to real `client.allergyNotes` or `client.medicalNotes` field

### 5.6 Upcoming session
- [x] 5.6.1 Next scheduled appointment card: date number, day name, time + service, therapist, StatusChip
- [x] 5.6.2 Wire to real upcoming appointments for this client

### 5.7 Recent visits list
- [x] 5.7.1 Visit rows: service name, date, amount
- [x] 5.7.2 Wire to real appointment history for this client (last 10)
- [x] 5.7.3 Empty state: "No past visits yet"

---

## Phase 6 — Messages Screen

**File:** `components/mobile/screens/MobileMessages.tsx`
**Design ref:** `iris-mobile-screens2.jsx → Messages`

### 6.1 Large Header
- [x] 6.1.1 Eyebrow: "Communications"
- [x] 6.1.2 Title: "Messages"
- [x] 6.1.3 Subtitle: "SMS, Email & WhatsApp — all in one inbox."

### 6.2 Sticky search bar
- [x] 6.2.1 Search input visually rendered
- [x] 6.2.2 Wire to filter conversations by client name

### 6.3 Conversation list
- [x] 6.3.1 Row: avatar with channel icon badge (SMS/Email/WhatsApp), name, timestamp, preview text
- [x] 6.3.2 Unread rows have bold text + unread count bubble
- [x] 6.3.3 Channel icons: SMS (chat bubble), Email (envelope), WhatsApp (speech bubble)
- [x] 6.3.4 Tap row → navigates to Thread with conversation param
- [x] 6.3.5 Wire to real `useConversations` hook (currently may use mock or real — verify)
- [x] 6.3.6 Empty state: "No messages yet"

---

## Phase 7 — Thread Screen

**File:** `components/mobile/screens/MobileThread.tsx`
**Design ref:** `iris-mobile-screens2.jsx → Thread`

### 7.1 Header bar
- [x] 7.1.1 Back button (← chevron) → navigates to Messages
- [x] 7.1.2 Avatar + client name + channel indicator
- [x] 7.1.3 Phone call button (right side)

### 7.2 Message bubbles
- [x] 7.2.1 Incoming: white card with border, bottom-left radius flattened
- [x] 7.2.2 Outgoing: gradient background, white text, bottom-right radius flattened
- [x] 7.2.3 Timestamp below each bubble
- [x] 7.2.4 Date separator ("Saturday, May 31") between message groups
- [x] 7.2.5 Wire to real message history from `useConversationMessages` hook
- [x] 7.2.6 Auto-scroll to bottom on mount and on new message

### 7.3 Compose bar
- [x] 7.3.1 Input field: rounded pill, placeholder "Message {firstName}…"
- [x] 7.3.2 Send button: gradient circle with arrow icon
- [x] 7.3.3 Wire send action to real message API
- [x] 7.3.4 Optimistic UI: message appears immediately, confirmed on API success

---

## Phase 8 — Payments Screen

**File:** `components/mobile/screens/MobilePayments.tsx`
**Design ref:** `iris-mobile-screens2.jsx → Payments`

### 8.1 Large Header
- [x] 8.1.1 Eyebrow: "Finance"
- [x] 8.1.2 Title: "Payments"
- [x] 8.1.3 Subtitle: "Take payments, track revenue & refunds."

### 8.2 Hero gradient card
- [x] 8.2.1 `--m-grad-hero` background, decorative radial glow (top-right)
- [x] 8.2.2 "Collected today" label + large dollar amount
- [x] 8.2.3 Three sub-stats: This week / Pending / Refunds
- [x] 8.2.4 Wire to real payment stats from `usePaymentStats`

### 8.3 Recent transactions list
- [x] 8.3.1 Row: avatar, client name, service + timestamp, amount, status label
- [x] 8.3.2 Paid → `--m-ok`, Pending → `--m-warn`, Refunded → strikethrough + `--m-muted`
- [x] 8.3.3 Section header "Recent transactions" + "Export →" action
- [x] 8.3.4 Wire to real transactions from `usePayments` hook (verify wiring is complete)
- [x] 8.3.5 Empty state: "No transactions yet"

---

## Phase 9 — Settings Screen

**File:** `components/mobile/screens/MobileSettings.tsx`
**Design ref:** `iris-mobile-screens2.jsx → Settings`

### 9.1 Large Header
- [x] 9.1.1 Eyebrow: "You"
- [x] 9.1.2 Title: "Settings"

### 9.2 Profile card
- [x] 9.2.1 Avatar (56px) + full name + email + role label
- [x] 9.2.2 Wired to real user data via `useAuth`
- [x] 9.2.3 Chevron → editable (links to profile edit page)

### 9.3 App section — Install row
- [x] 9.3.1 "App" section label
- [x] 9.3.2 Install Iris row: icon, "Install Iris app" / "Iris is installed" label, sub-label, chevron / "Done" badge
- [x] 9.3.3 Tap row: if `canInstall`, triggers PWA native prompt; otherwise shows manual instructions
- [x] 9.3.4 Row reads "Done · Running as a standalone app" when `isStandalone()`

### 9.4 Practice section
- [x] 9.4.1 Business profile row → `/settings?tab=business`
- [x] 9.4.2 Team & therapists row → `/therapists`
- [x] 9.4.3 Hours & availability row → `/settings?tab=availability`
- [x] 9.4.4 Booking page row → `/settings?tab=booking`

### 9.5 Account section
- [x] 9.5.1 Notifications / Privacy & security / Billing & plan / Preferences rows
- [x] 9.5.2 Each row navigates to the corresponding settings tab

### 9.6 Sign out
- [x] 9.6.1 Full-width sign out button in `--m-warn`
- [x] 9.6.2 Calls `signOut()` from `useAuth`

---

## Phase 10 — Navigation & Sheets

**File:** `components/mobile/MobileShell.tsx`
**Design ref:** `iris-mobile-app.jsx → App shell`

### 10.1 Tab bar
- [x] 10.1.1 Five tabs: Home / Calendar / Clients / Inbox / More
- [x] 10.1.2 Active tab: `--m-primary` color, bolder stroke weight
- [x] 10.1.3 Inbox badge: unread count in `--m-accent` bubble
- [x] 10.1.4 Tab labels visible beneath icons

### 10.2 FAB (floating action button)
- [x] 10.2.1 58px circular button, gradient background, + icon
- [x] 10.2.2 Positioned `right: 18px, bottom: 74px` above tab bar
- [x] 10.2.3 Opens Create sheet; suppressed on detail views and when any sheet is open
- [x] 10.2.4 Verify FAB `bottom` accounts for `env(safe-area-inset-bottom)` on iPhone X+

### 10.3 More sheet
- [x] 10.3.1 "Install Iris" gradient card at top
- [x] 10.3.2 Search/jump bar (⌘K hint)
- [x] 10.3.3 Operations group: Intake Forms / Therapists / Inventory / Telehealth / Insurance (2-col grid)
- [x] 10.3.4 Growth group: Promotions / Gift Cards / Loyalty / Analytics / Reports
- [x] 10.3.5 Tools group: Automation / Payroll / Exports / Settings
- [x] 10.3.6 Footer: user avatar + name + email + settings gear button
- [x] 10.3.7 Each grid item navigates to the correct route when tapped

### 10.4 Create sheet
- [x] 10.4.1 Four action rows: New appointment / Add client / New message / Take payment
- [x] 10.4.2 Each row has colored icon bg, label, chevron
- [x] 10.4.3 Tap navigates to the correct screen and closes sheet
- [x] 10.4.4 "New appointment" should open a new-session modal (wire to `openNewSession` if accessible)

### 10.5 Sheet polish
- [x] 10.5.1 Both sheets slide up with `@keyframes im-sheet-up` (currently uses animation, may have frame-0 stuck bug — fix per Phase 1.4)
- [x] 10.5.2 Swipe-down to dismiss (touch gesture — optional stretch)
- [x] 10.5.3 Sheet content scrolls independently; backdrop does not scroll

---

## Phase 11 — PWA & Install

**Files:** `components/pwa/`, `public/sw.js`, `public/manifest.json`
**Design ref:** `iris-mobile-app.jsx → useInstall, InstallCard, InstallBanner, InstallRow`

### 11.1 Manifest
- [x] 11.1.1 `name: "Iris"`, `short_name: "Iris"`
- [x] 11.1.2 `display: "standalone"`
- [x] 11.1.3 `theme_color: "#3F2F87"` (matches `--m-primary-dk`)
- [x] 11.1.4 `background_color: "#F4F3F8"` (matches `--m-bg`)
- [x] 11.1.5 Icons: 192×192, 512×512

### 11.2 Service worker
- [x] 11.2.1 Registered on HTTPS or localhost
- [x] 11.2.2 Precaches shell and critical routes
- [x] 11.2.3 Offline fallback page

### 11.3 Install hook (`use-pwa-install.ts`)
- [x] 11.3.1 Captures `beforeinstallprompt` event
- [x] 11.3.2 Detects iOS for manual instructions
- [x] 11.3.3 Detects standalone mode (`isInstalled`)
- [x] 11.3.4 `triggerInstall()` fires native prompt

### 11.4 Install surfaces
- [x] 11.4.1 `<PWAInstallBanner />` on Dashboard — dismissible, peach gradient variant
- [x] 11.4.2 `<PWAFirstLoginModal />` — shown on first login to prompt install
- [x] 11.4.3 Install card in More sheet (matches design: gradient card, "Install Iris" title, chevron)
- [x] 11.4.4 Install row in Settings → App section
- [x] 11.4.5 All three surfaces share same `usePWAInstall` hook — no duplicate logic

---

## Phase 12 — Charts & Data Visualisation

**File:** `components/mobile/charts.tsx`
**Design ref:** `iris-mobile-kit.jsx → Spark, AreaChart, Donut, Bars`

### 12.1 Spark (mini sparkline)
- [x] 12.1.1 Polyline chart, `width=64 height=24`, no axes
- [x] 12.1.2 Uses `--m-primary` color by default
- [x] 12.1.3 Support `up` prop: green when trending up, `--m-accent-dk` when down (matches design's `Spark` component)

### 12.2 AreaChart (revenue line)
- [x] 12.2.1 SVG viewBox `0 0 300 h`, preserveAspectRatio="none" (full-width stretch)
- [x] 12.2.2 Gradient fill beneath line
- [x] 12.2.3 Last point dot (circle with stroke)
- [x] 12.2.4 Ensure dot does not clip at edges — use `overflow="visible"` on SVG

### 12.3 Donut (service mix)
- [x] 12.3.1 SVG circle with `strokeDasharray` segments
- [x] 12.3.2 Center text: session count + "sessions" label
- [x] 12.3.3 Segments use `C.series` palette: `['#5D4AA8','#7665C2','#6E83C9','#DE9277','#B4A6E0']`
- [x] 12.3.4 Add 3px gap between segments (strokeDasharray gap) to match design

### 12.4 Bars (weekly chart)
- [x] 12.4.1 7 bars with day labels, today highlighted with gradient
- [x] 12.4.2 Value label above each bar
- [x] 12.4.3 Highlight today's bar index dynamically using `new Date().getDay()` (0=Sun)

---

## Phase 13 — Primitives Polish

**File:** `components/mobile/primitives.tsx`

### 13.1 Avatar
- [x] 13.1.1 Initials from name, stable color hash
- [x] 13.1.2 Add optional `square` prop variant (rounded rect, used in stat tile icons — `borderRadius: size * 0.3`)

### 13.2 Card
- [x] 13.2.1 `background: --m-surface`, `borderRadius: 22`, `border: 1px solid --m-line2`
- [x] 13.2.2 Ensure shadow matches design: `0 1px 2px rgba(30,24,48,0.04)` (very subtle)

### 13.3 StatusChip
- [x] 13.3.1 Scheduled (violet soft) / Confirmed (green soft) / In Progress (info soft) / Completed (muted) / Cancelled (warm soft)
- [x] 13.3.2 Add "completed" → "Completed" label mapping (API may return lowercase)

### 13.4 SectionHead
- [x] 13.4.1 Title (19px 600) + optional action link in `--m-primary`
- [x] 13.4.2 Ensure `onAction` click does not bubble to parent scroll container

### 13.5 Chip
- [x] 13.5.1 Active state: gradient background, white text
- [x] 13.5.2 Inactive: outline, dot color
- [x] 13.5.3 Minimum touch target 44px height (already set to `minHeight: 44` — verify)

---

## Phase 14 — Real-Data Wiring Summary

This phase is a checklist of all API connections that need to be verified or completed. Each item references the screen phase above.

- [x] 14.1 Dashboard sessions count → subtitle (Phase 2.1.4)
- [x] 14.2 Dashboard business hours → Studio pill (Phase 2.2.2)
- [x] 14.3 Dashboard setup steps → Finish Setup card (Phase 2.4.4–5)
- [x] 14.4 Dashboard revenue by range → AreaChart (Phase 2.7.4)
- [x] 14.5 Dashboard service mix → Donut (Phase 2.8.4)
- [x] 14.6 Dashboard today's sessions → SessionRows (Phase 2.9.4)
- [x] 14.7 Dashboard weekly sessions → Bars (Phase 2.11.3)
- [x] 14.8 Appointments real data → all three views (Phase 3.5.3, 3.6.5, 3.7.4)
- [x] 14.9 Appointments therapist list → filter chips (Phase 3.4.2)
- [x] 14.10 Clients real list + filter counts (Phase 4.3.3, 4.4.3)
- [x] 14.11 Client profile real data (Phase 5.2–5.7)
- [x] 14.12 Messages real conversations (Phase 6.3.5)
- [x] 14.13 Thread real messages + send (Phase 7.2.5, 7.3.3)
- [x] 14.14 Payments hero stats real data (Phase 8.2.4)
- [x] 14.15 Payments transaction list wiring verification (Phase 8.3.4)

---

## Appendix A — Design Token Reference

| Token | Value | Used in |
|---|---|---|
| `--m-bg` | `#F4F3F8` | App background, stage |
| `--m-surface` | `#FFFFFF` | Cards, sheets |
| `--m-panel` | `#FBFAFD` | Tab bar tint, thread header |
| `--m-ink` | `#1C1430` | Primary text |
| `--m-ink2` | `#3D3454` | Secondary text |
| `--m-muted` | `#7A7090` | Labels, metadata |
| `--m-faint` | `#A89EC4` | Chevrons, placeholders |
| `--m-primary` | `#5D4AA8` | Active states, eyebrows, links |
| `--m-primary-dk` | `#3F2F87` | Gradient end, theme-color |
| `--m-accent` | `#DE9277` | Warm accents, now-line |
| `--m-ok` | `#3E9E7A` | Confirmed, Paid status |
| `--m-warn` | `#D4783A` | Pending, alert states |
| `--m-grad` | `135deg #5D4AA8→#3F2F87` | Active tabs, FAB, CTAs |
| `--m-grad-hero` | `150deg #6A56B8→#4A3895→#2E2168` | Payments hero card |

## Appendix B — Screen Inventory

| Screen | Component | Route trigger |
|---|---|---|
| Dashboard | `MobileDashboard` | Tab: Home |
| Appointments | `MobileAppointments` | Tab: Calendar |
| Clients | `MobileClients` | Tab: Clients |
| Client Profile | `MobileClientProfile` | Tap client row |
| Messages | `MobileMessages` | Tab: Inbox |
| Thread | `MobileThread` | Tap conversation row |
| Payments | `MobilePayments` | More → Payroll/Exports |
| Settings | `MobileSettings` | More → Settings |

## Appendix C — Files Changed

| File | Purpose |
|---|---|
| `apps/web/app/globals.css` | CSS variables, `.im-*` utilities |
| `apps/web/components/mobile/MobileShell.tsx` | Shell, tabs, FAB, sheets, routing |
| `apps/web/components/mobile/BottomSheet.tsx` | Slide-up sheet animation |
| `apps/web/components/mobile/LargeHeader.tsx` | Screen title component |
| `apps/web/components/mobile/primitives.tsx` | Avatar, Card, Chip, StatusChip, SectionHead |
| `apps/web/components/mobile/charts.tsx` | Spark, AreaChart, Donut, Bars |
| `apps/web/components/mobile/screens/MobileDashboard.tsx` | Dashboard screen |
| `apps/web/components/mobile/screens/MobileAppointments.tsx` | Calendar screen (3 views) |
| `apps/web/components/mobile/screens/MobileClients.tsx` | Clients list screen |
| `apps/web/components/mobile/screens/MobileClientProfile.tsx` | Client detail screen |
| `apps/web/components/mobile/screens/MobileMessages.tsx` | Messages inbox screen |
| `apps/web/components/mobile/screens/MobileThread.tsx` | Chat thread screen |
| `apps/web/components/mobile/screens/MobilePayments.tsx` | Payments screen |
| `apps/web/components/mobile/screens/MobileSettings.tsx` | Settings screen |
| `apps/web/components/pwa/PWAInstallBanner.tsx` | Dashboard install banner |
| `apps/web/lib/hooks/use-pwa-install.ts` | PWA install hook |
| `apps/web/lib/hooks/use-mobile-dashboard.ts` | Dashboard data hook |
| `apps/web/public/manifest.json` | PWA manifest |
| `apps/web/public/sw.js` | Service worker |
