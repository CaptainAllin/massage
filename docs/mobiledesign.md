# Iris Mobile — Implementation Plan

> Source: `Iris Mobile.html` design file (Claude Design handoff bundle, exported 2026-06-05)
> Intent distilled from 9 chat transcripts: iOS-native feel, exact Iris violet palette, bottom tab bar + slide-up sheets, real practice data, pixel-perfect match to the prototype.

---

## Design Reference Summary

| Token | Value |
|---|---|
| Primary violet | `#5D4AA8` |
| Primary dark | `#3F2F87` |
| Gradient | `linear-gradient(135deg, #5D4AA8 0%, #3F2F87 100%)` |
| Hero gradient | `linear-gradient(150deg, #6A56B8 0%, #4A3895 55%, #2E2168 100%)` |
| App background | `#F4F3F8` |
| Surface (cards) | `#FFFFFF` |
| Panel | `#FBFAFD` |
| Accent (peach) | `#DE9277` |
| OK (green) | `#3E9E7A` |
| Font | Sora, system-ui, -apple-system, sans-serif |
| Card radius | 22px |
| Button shadow | Neutral only — no colored glows |

**Navigation pattern:** Bottom tab bar (5 tabs) + slide-up BottomSheet for "More" items + contextual FAB (+) for quick create.

**Screens:** Dashboard · Appointments (Agenda/Day/Week) · Clients · Client Profile · Messages · Thread · Payments · Settings

---

## Phase 1 — Foundation: Design Tokens & Typography

### 1.1 Font Setup
- [x] **1.1.1** Add Sora font import to `apps/web/app/globals.css` via Google Fonts (`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap')`)
- [x] **1.1.2** Add `--font-sora: 'Sora', system-ui, -apple-system, sans-serif` CSS custom property

### 1.2 Mobile Color Tokens
- [x] **1.2.1** Add CSS custom properties for the full Iris palette to `globals.css` under a `/* Mobile tokens */` comment:
  - `--m-bg`, `--m-surface`, `--m-panel`, `--m-ink`, `--m-ink2`, `--m-muted`, `--m-faint`
  - `--m-line`, `--m-line2`, `--m-line3`
  - `--m-primary`, `--m-primary2`, `--m-primary-dk`
  - `--m-accent`, `--m-accent-dk`, `--m-accent-soft`
  - `--m-soft`, `--m-soft2`
  - `--m-ok`, `--m-ok-soft`, `--m-warn`, `--m-warn-soft`, `--m-info`, `--m-info-soft`
  - `--m-grad` (primary gradient)
  - `--m-grad-hero` (hero gradient)

### 1.3 Viewport & Safe Area Meta
- [x] **1.3.1** Confirm `apps/web/app/layout.tsx` has `viewport` meta with `viewport-fit=cover` for iOS safe areas
- [x] **1.3.2** Add `env(safe-area-inset-bottom)` handling in the mobile layout CSS

### 1.4 Mobile Base Styles
- [x] **1.4.1** Add `.im-scroll` (hide scrollbars, `-webkit-overflow-scrolling: touch`), `.im-press` (scale on tap), `.im-fab` (transition on tap), `.im-tab` (remove tap highlight) utility classes to `globals.css`

---

## Phase 2 — Mobile Primitive Components

Create `apps/web/components/mobile/` directory with shared mobile primitives.

### 2.1 Core UI Primitives — `apps/web/components/mobile/primitives.tsx`
- [x] **2.1.1** `Avatar` — circular avatar with initials, coloured background tint, configurable size
- [x] **2.1.2** `Card` — white card, 22px radius, `1px solid var(--m-line2)`, soft box-shadow, configurable padding
- [x] **2.1.3** `Chip` — pill button, active state uses gradient bg + white text, inactive uses border + surface bg, supports dot color + count badge
- [x] **2.1.4** `StatusChip` — inline status pill: Scheduled (violet), Confirmed (green), In Progress (blue), Completed (grey), Cancelled (peach/warn)
- [x] **2.1.5** `SectionHead` — section title (19px, 600 weight) + optional right-aligned action link
- [x] **2.1.6** `Tag` — compact tag pill: VIP uses peach-soft bg + accent text, others use soft violet

### 2.2 Chart Primitives — `apps/web/components/mobile/charts.tsx`
- [x] **2.2.1** `Spark` — inline SVG sparkline polyline (64×24px default, configurable color, up/down direction)
- [x] **2.2.2** `AreaChart` — full-width SVG area chart with gradient fill, endpoint circle dot, `preserveAspectRatio="none"` for responsive width
- [x] **2.2.3** `Donut` — SVG donut chart with `strokeDasharray` segments, rounded caps, centred label showing total session count
- [x] **2.2.4** `Bars` — flex bar chart with accent highlight on current day, labels below bars, value labels above

### 2.3 BottomSheet — `apps/web/components/mobile/BottomSheet.tsx`
- [x] **2.3.1** Dimmed overlay (`rgba(28,20,48,0.42)`, `backdrop-filter: blur(2px)`)
- [x] **2.3.2** Sheet container: white, `border-radius: 28px 28px 0 0`, max height 86%, drag handle pill
- [x] **2.3.3** Entrance animation: `translateY(100%)` → `translateY(0)` via CSS transition (not keyframes — avoids preview freeze)
- [x] **2.3.4** Click outside to dismiss; stop propagation on sheet content
- [x] **2.3.5** `title` prop renders 18px/700 heading inside sheet

### 2.4 LargeHeader — `apps/web/components/mobile/LargeHeader.tsx`
- [x] **2.4.1** Eyebrow label: 11.5px uppercase violet, letter-spacing 1.6
- [x] **2.4.2** H1: 30px/700, letter-spacing -0.9, optional gradient accent span (violet→peach)
- [x] **2.4.3** Subtitle: 14px muted, line-height 1.45

---

## Phase 3 — Mobile Navigation Shell

Create `apps/web/components/mobile/MobileShell.tsx` and supporting nav components.

### 3.1 Status Bar — `StatusBar` component
- [x] **3.1.1** Fixed time "9:41" (or live time via `Date`) left-aligned, tabular-nums
- [x] **3.1.2** Right icons: SVG signal bars, WiFi arcs, battery outline
- [x] **3.1.3** Rendered only at ≥480px (desktop preview) or toggled via Tweaks

### 3.2 Bottom Tab Bar — `TabBar` component
- [x] **3.2.1** 5 tabs: Home (dashboard icon), Calendar (calendar icon), Clients (users icon), Inbox (chat icon + unread badge), More (ellipsis)
- [x] **3.2.2** Active tab: primary violet color + `strokeWidth: 2`; inactive: `--m-faint` color + `strokeWidth: 1.6`
- [x] **3.2.3** Tab labels below icons (toggleable): 10.5px, 700 weight when active
- [x] **3.2.4** Unread badge on Inbox tab: peach background, white text, 1.5px white border
- [x] **3.2.5** `background: rgba(255,255,255,0.86)`, `backdrop-filter: blur(18px)`, top border line
- [x] **3.2.6** Bottom padding uses `max(8px, env(safe-area-inset-bottom))`

### 3.3 FAB (Floating Action Button)
- [x] **3.3.1** 58×58px, 20px radius, gradient background, white `+` icon, positioned 18px from right, 74px + safe-area from bottom
- [x] **3.3.2** `box-shadow: 0 10px 26px rgba(63,47,135,0.5)`
- [x] **3.3.3** Active scale animation (`transform: scale(0.92)`)
- [x] **3.3.4** Visible only on: Dashboard, Appointments, Clients, Messages — hidden on detail views and when any sheet is open

### 3.4 More Sheet — `MoreSheet` component
- [x] **3.4.1** ⌘K search bar row at top
- [x] **3.4.2** Three groups: **Operations** (Intake Forms, Therapists, Inventory, Telehealth, Insurance), **Growth** (Promotions, Gift Cards, Loyalty, Analytics, Reports), **Tools** (Automation, Payroll, Exports, Settings)
- [x] **3.4.3** Each item: 34×34 violet icon square, 13.5px label, 2-column grid layout per group
- [x] **3.4.4** User profile row at bottom with Settings shortcut button
- [x] **3.4.5** Tap items: navigate to corresponding existing Next.js route or close + navigate

### 3.5 Create Sheet — `CreateSheet` component
- [x] **3.5.1** Four rows: New appointment (violet icon), Add client (blue icon), New message (green icon), Take payment (peach icon)
- [x] **3.5.2** Each row: colored icon square, 15.5px bold label, chevron right, tap to navigate
- [x] **3.5.3** Icons use `color + 1A` opacity background (10% tinted)

### 3.6 Mobile Layout Wrapper — `MobileShell` component
- [x] **3.6.1** `.im-stage`: full viewport, centered, radial gradient background
- [x] **3.6.2** `.im-device`: `max-width: 420px`, `100dvh`, flex column, overflow hidden
- [x] **3.6.3** At ≥480px (desktop preview): apply device frame styles — rounded 46px corners, dark chrome ring (`box-shadow: 0 2px 0 4px #1b1530, 0 0 0 14px #2a2342, ...`)
- [x] **3.6.4** At ≤479px (real mobile): no frame, hide status bar, add `env(safe-area-inset-top)` top padding
- [x] **3.6.5** `.im-scroll`: flex 1, `overflow-y: auto`, hide scrollbar, 96px bottom padding for tab bar clearance
- [x] **3.6.6** Router state: `view` (string) + `param` (any) managed with `useState`
- [x] **3.6.7** Detail views (thread) render in flex column without scroll wrapper

### 3.7 Responsive Rendering Gate
- [x] **3.7.1** In `apps/web/app/(dashboard)/layout.tsx`, detect screen width via `useMediaQuery` or CSS container query
- [x] **3.7.2** At `max-width: 767px`: render `MobileShell` wrapping the mobile screens instead of desktop sidebar layout
- [x] **3.7.3** At `min-width: 768px`: render existing desktop sidebar layout unchanged

---

## Phase 4 — Mobile Dashboard Screen

Create `apps/web/components/mobile/screens/MobileDashboard.tsx`

### 4.1 Header
- [x] **4.1.1** `LargeHeader` with eyebrow "Practice overview", title "Good evening, " + gradient accent `{firstName}.`, subtitle with session count + date

### 4.2 Studio Status Pill
- [x] **4.2.1** Pill row: "Studio" label + green dot "Open · 8a — 7p" badge (or "Closed" variant)
- [x] **4.2.2** Pull `businessHours` from existing API/context

### 4.3 Setup Card (dismissible)
- [x] **4.3.1** Gradient background (`--m-soft2` → white), violet border
- [x] **4.3.2** Header: "Finish setup · {done}/{total}", dismiss × button
- [x] **4.3.3** Progress track: 5 equal segments, filled segments use `--m-grad`
- [x] **4.3.4** Task list: each row has unchecked circle, label, chevron right
- [x] **4.3.5** Connect to existing `onboarding` API to get real task completion state
- [x] **4.3.6** Dismissed state stored in `localStorage` (key: `iris-setup-dismissed`)

### 4.4 Stat Tiles (2×2 grid)
- [x] **4.4.1** Tile: label (11px uppercase muted), value (32px/700), delta with up/down arrow + color (green up, peach down), sparkline bottom-right
- [x] **4.4.2** **Today's sessions** — count from real appointments API, icon: calendar, tapping → navigate to Appointments
- [x] **4.4.3** **Active clients** — count from clients API, icon: users, tapping → navigate to Clients
- [x] **4.4.4** **This month** — revenue from payments API, icon: dollar, accent peach icon bg, tapping → navigate to Payments
- [x] **4.4.5** **Pending forms** — intake form count from API, icon: clipboard, tapping → navigate to More > Intake Forms

### 4.5 SMS Credits Bar
- [x] **4.5.1** Card with chat icon, "SMS credits · this period" label, progress bar, `{used} / {total}` value
- [x] **4.5.2** Bar fill uses `--m-grad`, track uses `--m-line2`
- [x] **4.5.3** Connect to SMS credits API data

### 4.6 Revenue Card
- [x] **4.6.1** Large revenue value (30px/700) + delta badge
- [x] **4.6.2** Period toggle: 30d / 90d / 1y — pill-style segmented control
- [x] **4.6.3** `AreaChart` component spanning full card width
- [x] **4.6.4** Date range labels below chart (start / mid / "Today")
- [x] **4.6.5** Pull from existing payments/analytics API, keyed by selected range

### 4.7 Service Mix Card
- [x] **4.7.1** `Donut` chart (132px, 20px thick) left + legend list right
- [x] **4.7.2** Legend: color dot (9×9px, 3px radius) + label + percentage
- [x] **4.7.3** Subtitle: "Last 30 days · {N} sessions"
- [x] **4.7.4** Pull from analytics API

### 4.8 Today's Sessions List
- [x] **4.8.1** `SectionHead` "Today's sessions" + "View all →" action
- [x] **4.8.2** `SessionRow`: therapist-coloured avatar, client name, service + therapist (subtitle), time right-aligned, `StatusChip`
- [x] **4.8.3** Show up to 4 rows; "View all" and row taps → Appointments
- [x] **4.8.4** Fill-in offer strip below list: accent-soft background, star icon, "N open slots today. Send a fill-in offer to your waitlist?" + "Send" button

### 4.9 This Week Bars Card
- [x] **4.9.1** `Bars` chart with day labels (M T W T F S S)
- [x] **4.9.2** Today's bar accent highlighted in gradient, others in `--m-soft`
- [x] **4.9.3** Header: "This week" + "Week {N}" right label, subtitle "N sessions · N therapists"

---

## Phase 5 — Mobile Appointments Screen

Create `apps/web/components/mobile/screens/MobileAppointments.tsx`

### 5.1 Header
- [x] **5.1.1** `LargeHeader` eyebrow "Calendar · Week {N}", title "Appointments", subtitle "{N} sessions this week · {N} therapists · ${k} booked"

### 5.2 View Toggle
- [x] **5.2.1** Segmented control: Agenda / Day / Week
- [x] **5.2.2** Active segment uses gradient background + white text; inactive transparent + muted
- [x] **5.2.3** Container: white surface, `1px solid --m-line`, 14px border-radius

### 5.3 Horizontal Day Strip
- [x] **5.3.1** Horizontally scrollable, hidden scrollbar
- [x] **5.3.2** Day button: 52px wide, day abbreviation + date number, today gets gradient bg
- [x] **5.3.3** Selected day: gradient background; unselected: white surface + border
- [x] **5.3.4** Tapping a day updates the displayed sessions

### 5.4 Therapist Filter Chips
- [x] **5.4.1** Horizontally scrollable chip row: "All therapists" + each therapist name
- [x] **5.4.2** Each therapist chip has their colour dot when inactive
- [x] **5.4.3** Active chip: gradient bg + white text; inactive: border + surface

### 5.5 Agenda View — `AgendaCard`
- [x] **5.5.1** Left: time + vertical coloured spine + duration
- [x] **5.5.2** Right: card with left coloured border (3px, therapist colour)
- [x] **5.5.3** Card content: client name + `StatusChip`, service name, therapist dot + name + room

### 5.6 Day Column View — `DayColumn`
- [x] **5.6.1** Hours 9a–6p, 64px per hour
- [x] **5.6.2** Hour label (11px faint, top-left) + horizontal divider line
- [x] **5.6.3** Now line: accent colour, left dot, positioned by current time
- [x] **5.6.4** Session blocks: `top` and `height` calculated from start time + duration, therapist colour tint bg + left border, client name + service text

### 5.7 Week Mini Grid — `WeekMini`
- [x] **5.7.1** Horizontally scrollable, `minWidth: 620px` inner
- [x] **5.7.2** Header row: 7 day columns, each with day abbreviation + date circle (today gets gradient)
- [x] **5.7.3** Time rows at 2h intervals: 9/11/13/15/17, 48px per row
- [x] **5.7.4** Session blocks positioned absolutely within day column

### 5.8 Booking Page CTA Card
- [x] **5.8.1** `--m-soft2` background + `--m-soft` border
- [x] **5.8.2** Link icon, "Client booking page" label, "Share so clients can self-book" subtitle, "Copy link" button (gradient)
- [x] **5.8.3** Tapping "Copy link" copies the public booking URL to clipboard

---

## Phase 6 — Mobile Clients Screen

Create `apps/web/components/mobile/screens/MobileClients.tsx`

### 6.1 Header
- [x] **6.1.1** `LargeHeader` eyebrow "Clients · {N} active", title "Your people", subtitle with new-this-month and due-for-follow-up counts

### 6.2 Sticky Search + Filter Row
- [x] **6.2.1** `position: sticky; top: 0; z-index: 5`, bg matches `--m-bg`
- [x] **6.2.2** Search bar: search icon + placeholder "Search clients…", white surface, border
- [x] **6.2.3** Filter chips (horizontally scrollable): All ({N}), VIP ({N}), New this month ({N}), Due for visit ({N}), Inactive 60d+ ({N})
- [x] **6.2.4** Connect chip counts to real API data

### 6.3 Client List
- [x] **6.3.1** Rows inside a card, separated by `--m-line2` borders
- [x] **6.3.2** Row: 44px avatar (therapist colour), name + `Tag` pills, therapist + last visit subtitle, visit count right-aligned
- [x] **6.3.3** Tap row → navigate to Client Profile passing the client object as param
- [x] **6.3.4** Filter logic: VIP (has `vip: true`), Due for visit (has `due: true`), Inactive 60d+ (visit count ≤ 7), New this month (filter by `createdAt` within current month)

---

## Phase 7 — Mobile Client Profile Screen

Create `apps/web/components/mobile/screens/MobileClientProfile.tsx`

### 7.1 Navigation
- [x] **7.1.1** Back button "← Clients" (violet, no border, inline-flex)

### 7.2 Profile Header
- [x] **7.2.1** Centred layout: 84px avatar, name (26px/700), tags row, "Sees {therapist}" line with colour dot

### 7.3 Quick Actions Row
- [x] **7.3.1** Three equal buttons: Message (gradient primary), Book (border surface), Call (border surface)
- [x] **7.3.2** Each: icon above label (12px/600), 16px border-radius, 13px tap height

### 7.4 Stats Card
- [x] **7.4.1** 3-column grid: Visits, Lifetime ($visits × $115), Last visit
- [x] **7.4.2** Separated by `--m-line2` vertical borders
- [x] **7.4.3** Value: 21px/700; label: 11px muted uppercase

### 7.5 Allergy Alert Card (conditional)
- [x] **7.5.1** Shown only when client has `Allergies` tag
- [x] **7.5.2** `--m-warn-soft` background, `--m-accent` border tint, shield icon, "ALLERGY ALERT" uppercase, alert text

### 7.6 Upcoming Appointment
- [x] **7.6.1** `SectionHead` "Upcoming"
- [x] **7.6.2** Single card row: day abbreviation + date (violet), time + service, duration + therapist, `StatusChip`
- [x] **7.6.3** Pull from appointments API filtered by client

### 7.7 Recent Visits List
- [x] **7.7.1** `SectionHead` "Recent visits"
- [x] **7.7.2** Rows: service name + date, amount right-aligned
- [x] **7.7.3** Pull from appointment history API

---

## Phase 8 — Mobile Messages Screen

Create `apps/web/components/mobile/screens/MobileMessages.tsx` + `MobileThread.tsx`

### 8.1 Messages List
- [x] **8.1.1** `LargeHeader` eyebrow "Communications", title "Messages", subtitle "SMS, Email & WhatsApp — all in one inbox."
- [x] **8.1.2** Sticky search bar: "Search conversations…"
- [x] **8.1.3** Conversation rows inside a card:
  - 46px avatar with channel icon badge (20px circle, `box-shadow` ring)
  - Name (bold if unread), timestamp right-aligned
  - Preview text (2 lines), unread count badge (gradient bg)
  - Unread row gets `--m-line3` background tint
- [x] **8.1.4** Tapping a row → navigate to Thread view passing conversation as param

### 8.2 Thread View — `MobileThread`
- [x] **8.2.1** Thread header: back button, avatar, name + channel label, call button
- [x] **8.2.2** Scrollable message area: date header, message bubbles
  - Sent (right): gradient bg, white text, bottom-right 5px corner
  - Received (left): white surface, border, bottom-left 5px corner, ink text
  - Timestamp below each bubble, 10.5px faint
- [x] **8.2.3** Composer footer: text input "Message {firstName}…" + circular send button (gradient)

---

## Phase 9 — Mobile Payments Screen

Create `apps/web/components/mobile/screens/MobilePayments.tsx`

### 9.1 Header
- [x] **9.1.1** `LargeHeader` eyebrow "Finance", title "Payments", subtitle

### 9.2 Hero Card
- [x] **9.2.1** `--m-grad-hero` background, white text, no border
- [x] **9.2.2** Decorative radial gradient circle (peach, top-right, `position: absolute`)
- [x] **9.2.3** "Collected today" label + large amount (38px/700)
- [x] **9.2.4** Three stats row: This week, Pending, Refunds

### 9.3 Transaction List
- [x] **9.3.1** `SectionHead` "Recent transactions" + "Export →" action
- [x] **9.3.2** Rows: avatar, client name, service + timestamp, amount right-aligned, status label
- [x] **9.3.3** Refunded transactions: strikethrough amount, muted text
- [x] **9.3.4** Status colours: Paid → green, Pending → peach/warn, Refunded → muted

---

## Phase 10 — Mobile Settings Screen

Create `apps/web/components/mobile/screens/MobileSettings.tsx`

### 10.1 Header
- [x] **10.1.1** `LargeHeader` eyebrow "You", title "Settings"

### 10.2 User Profile Card
- [x] **10.2.1** 56px avatar, name (17px/700), email + role (muted), chevron right
- [x] **10.2.2** Tap → navigate to profile edit

### 10.3 Settings Groups
- [x] **10.3.1** Group label: 11.5px muted uppercase with letter-spacing
- [x] **10.3.2** **Practice** group: Business profile, Team & therapists, Hours & availability, Booking page
- [x] **10.3.3** **Account** group: Notifications, Privacy & security, Billing & plan, Preferences
- [x] **10.3.4** Row: 32×32 icon square (violet soft bg), label, optional value text right, chevron
- [x] **10.3.5** Tap each row → navigate to corresponding settings sub-page

### 10.4 Sign Out Button
- [x] **10.4.1** Full-width button, `--m-warn` text colour, border, white bg
- [x] **10.4.2** Wire to existing auth sign-out handler

---

## Phase 11 — Data Integration

### 11.1 Mobile Data Hooks
- [x] **11.1.1** Create `apps/web/lib/hooks/use-mobile-dashboard.ts` — aggregates data for dashboard tiles from existing `useDashboard`, `useAppointments`, `useClients`, `usePayments` hooks
- [x] **11.1.2** Pass real `businessId` + `userId` from auth context to all mobile screens
- [x] **11.1.3** Replace all mock data arrays (`SESSIONS_TODAY`, `CLIENTS`, `CONVERSATIONS`, `REVENUE`, etc.) with real API-sourced data via existing hooks

### 11.2 Navigation Wiring
- [x] **11.2.1** Tab bar "Home" → `view: 'dashboard'`
- [x] **11.2.2** Tab bar "Calendar" → `view: 'appts'`
- [x] **11.2.3** Tab bar "Clients" → `view: 'clients'`
- [x] **11.2.4** Tab bar "Inbox" → `view: 'messages'`
- [x] **11.2.5** Tab bar "More" → open `MoreSheet`
- [x] **11.2.6** More sheet items → navigate to matching existing Next.js route within the shell
- [x] **11.2.7** FAB "+" → open `CreateSheet`
- [x] **11.2.8** Create sheet items → navigate to relevant view (appts for new appointment, etc.)

### 11.3 Unread Badge
- [x] **11.3.1** Pull unread message count from existing messages API
- [x] **11.3.2** Pass to `TabBar` as `badge` prop on Inbox tab

---

## Phase 12 — Desktop Visual Refinements (from design system)

These apply globally, not only to mobile.

### 12.1 Button Shadow Refinement
- [x] **12.1.1** Remove all `0 4px 16px ${primary}44` colored-glow shadows from existing desktop buttons in `packages/ui/src/Button.tsx`
- [x] **12.1.2** Replace primary CTA shadow with `0 1px 2px rgba(28,20,54,0.12), 0 1px 1px rgba(28,20,54,0.06)`
- [x] **12.1.3** Add `inset 0 1px 0 rgba(255,255,255,0.18)` to hero CTAs for subtle top-edge highlight
- [x] **12.1.4** Hover: add 1px lift (`translateY(-1px)`) + slightly stronger shadow
- [x] **12.1.5** Active: press-in inset shadow

### 12.2 Background Token
- [x] **12.2.1** Apply cool mist `#F3F4F7` as the main content area background (was `#F1ECF5` lavender)
- [x] **12.2.2** Sidebar panel background stays `#FBF8FD` (warm off-white) — do not change
- [x] **12.2.3** Confirm violet primary (`#5D4AA8`) and soft lavender accents (`#EDE5F4`) are unchanged

---

## Phase 13 — QA & Polish

### 13.1 Device Testing
- [x] **13.1.1** Test on iPhone Safari — verify safe area insets, no content behind home indicator
- [x] **13.1.2** Test on Android Chrome — verify tab bar clearance, no scroll-to-hide behaviour breaking layout
- [x] **13.1.3** Test at 375px (iPhone SE), 390px (iPhone 14), 420px (iPhone Pro Max)

### 13.2 Animation & Interaction
- [x] **13.2.1** Verify BottomSheet slide-up works on real device (no animation freeze)
- [x] **13.2.2** Verify FAB scale animation on tap
- [x] **13.2.3** Verify tab bar active-state colour updates immediately (no transition delay bug)

### 13.3 Accessibility
- [x] **13.3.1** All tappable elements ≥ 44×44px hit target
- [x] **13.3.2** Tab bar buttons have `aria-label`
- [x] **13.3.3** Bottom sheets have `role="dialog"` and `aria-modal="true"`

### 13.4 Desktop Preview Frame
- [x] **13.4.1** At ≥480px desktop, the mobile shell shows inside the dark device frame (46px rounded corners, double ring)
- [x] **13.4.2** Stage background: `radial-gradient(circle at 30% 20%, #E9E5F2, #DAD6E6 70%)`

---

## Implementation Order (recommended)

1. Phase 1 (tokens + font) — no UI changes, just CSS groundwork
2. Phase 2 (primitives + charts) — build the atoms before screens
3. Phase 3 (shell + navigation) — get the frame and routing working with placeholders
4. Phase 4 (Dashboard) — hero screen, should look great immediately
5. Phase 5 (Appointments) — second most-used screen
6. Phase 6+7 (Clients + Profile) — single data source, implement together
7. Phase 8 (Messages + Thread) — implement together
8. Phase 9+10 (Payments + Settings) — simpler screens, quick wins
9. Phase 11 (Data integration) — swap mocks for real API calls last
10. Phase 12 (Desktop refinements) — apply global visual polish
11. Phase 13 (QA) — test on real devices
