# More Section — Mobile Design Consistency Plan

> **Goal:** Bring every page reachable from the "More" tab into full visual parity with the
> Dashboard, Calendar, Messages, and Clients tabs — same design tokens, typography, data-viz
> patterns, loading states, and interaction model.

---

## Audit Summary

### Reference baseline (well-themed)
| Screen | Status |
|---|---|
| Dashboard | ✅ LargeHeader · bento stat cards · gradient hero · Sora font · mobile tokens |
| Appointments | ✅ LargeHeader · Chip filters · Card rows · mobile tokens |
| Clients | ✅ LargeHeader · Chip filters · Avatar rows · Tag badges · mobile tokens |
| Messages / Thread | ✅ LargeHeader · Card surfaces · mobile tokens |

### More section current state
| Page | Type | Issues |
|---|---|---|
| Settings (main list) | Native mobile screen | Minor — no value-previews in rows, basic group labels |
| Settings sub-views | Native mobile screen | Loading states are plain text; no skeleton cards; Security uses native `confirm()` |
| Payments | Native mobile screen | Hero stats have no skeleton; "Export →" is a no-op |
| Inventory | Desktop route overlay | Tailwind classes, `@massage/ui` Button/Card, desktop modal pattern, gray palette |
| Therapists | Desktop route overlay | Same; 939-line desktop page crammed into 390px frame |
| Promotions | Desktop route overlay | Same; desktop `Badge`/`Modal` components |
| Gift Cards | Desktop route overlay | Same |
| Loyalty | Desktop route overlay | Same; `fixed inset-0` modals break inside device frame |
| Analytics | Desktop route overlay | Same; KPICard desktop component, Tailwind grid |
| Reports | Desktop route overlay | Same; desktop `Modal`, `ReportBuilder`/`ReportViewer` components |
| Automation | Desktop route overlay | Same; 1751-line desktop page |
| Payroll | Desktop route overlay | Same |
| Exports | Desktop route overlay | Same |
| Intake Forms | Desktop route overlay | Same |
| Telehealth | Desktop route overlay | Same |
| Insurance | Desktop route overlay | Same |

### Root causes
1. **Desktop route pages injected as-is** — pages like `/inventory`, `/promotions`, etc. are built
   with Tailwind CSS classes, desktop `@massage/ui` components, and `fixed inset-0` modals. When
   rendered inside the 390px `RouteOverlay`, they look completely foreign.
2. **Missing mobile CSS vars** — route pages use `text-gray-900 bg-white border-gray-300` instead
   of `var(--m-ink)`, `var(--m-surface)`, `var(--m-line2)`.
3. **No mobile design primitives** — `LargeHeader`, `Card` (from `primitives.tsx`), `Chip`,
   `Avatar`, `SectionHead` are not used in route pages.
4. **Skeleton loading** — Settings sub-views and Payments show bare "Loading…" text; Dashboard
   uses graceful empty/loading states.
5. **Missing hero cards** — Payments has a gradient hero. None of the route pages have one.
6. **Data visualisation gap** — Dashboard has `WeekBars`, `CapacityGauge`, `TopServicesBars`. No
   More-section page uses data-viz at all.

---

## Design Tokens & Patterns to Apply Everywhere

| Token | Purpose |
|---|---|
| `var(--m-bg)` | Screen background `#F4F3F8` |
| `var(--m-surface)` | Card background `#FFFFFF` |
| `var(--m-ink)` | Primary text |
| `var(--m-muted)` | Secondary text / labels |
| `var(--m-primary)` | Iris violet `#5D4AA8` |
| `var(--m-grad)` | Violet→dark-violet gradient |
| `var(--m-grad-hero)` | Hero card gradient |
| `var(--m-line2)` | Card border |
| `var(--m-ok)` | Success green `#3E9E7A` |
| `var(--m-warn)` | Warning amber |
| `var(--font-sora)` | Sora, system-ui, sans-serif |

**Primitives to use:** `LargeHeader`, `Card`, `Chip`, `Avatar`, `SectionHead`, `StatusChip`, `Tag`
from `components/mobile/primitives.tsx` and `components/mobile/LargeHeader.tsx`.

**Patterns to copy:**
- Gradient hero card (see `MobilePayments` `HeroCard`)
- Chip filter bar (see `MobileClients`)
- Section row with Avatar + two-line label + right chevron (see `MobileClients`, `MobileSettings`)
- Skeleton card: `Card` with pulsing `var(--m-soft)` placeholder rects
- BottomSheet for create/edit forms (instead of `fixed inset-0` desktop modals)

---

## Phase 1 — MobileSettings Polish

> Fastest wins on the already-native settings screen.

### 1.1 Skeleton loading states
- [x] **1.1.1** Replace `<div>Loading…</div>` in `BusinessSubView` with a skeleton card (3–4 input placeholder rects using `var(--m-soft)`)
- [x] **1.1.2** Replace `<div>Loading…</div>` in `TeamSubView` with 3 skeleton member rows (Avatar placeholder + two text bars)
- [x] **1.1.3** Replace `<div>Loading…</div>` in `HoursSubView` with 7 skeleton day rows
- [x] **1.1.4** Replace `<div>Loading…</div>` in `BookingSubView` with skeleton URL bar + 3 option rows
- [x] **1.1.5** Replace `<div>Loading…</div>` in `NotificationsSubView` with 4 skeleton toggle rows

### 1.2 Settings row value-previews
- [x] **1.2.1** Pass current booking mode as `value` prop to "Booking page" `SettingsRow` (e.g. "Public")
- [x] **1.2.2** Pass notification count as `value` to "Notifications" row (e.g. "Email · SMS")
- [x] **1.2.3** Pass open/closed status as `value` to "Hours & availability" row (e.g. "Mon–Fri")
- [x] **1.2.4** Pass team member count as `value` to "Team & therapists" row (e.g. "3 members")

### 1.3 Sub-view header upgrade
- [x] **1.3.1** Refactor `SubViewHeader` to use `LargeHeader` component with smaller `fontSize` override (22px) so it matches the app-wide header pattern instead of the current ad-hoc div
- [x] **1.3.2** Add eyebrow prop to `SubViewHeader` that passes the group name (e.g. "Practice", "Account") matching `LargeHeader` eyebrow style

### 1.4 Security sub-view — replace native `confirm()`
- [x] **1.4.1** Add an inline `confirmingRevoke` state (stores `factorId | null`)
- [x] **1.4.2** Replace `if (!confirm('Remove this passkey?'))` with a two-step confirmation row that expands inline (shows "Are you sure?" + "Yes, remove" / "Cancel" buttons styled with `var(--m-warn)`)

### 1.5 Billing & Preferences sub-view deduplication
- [x] **1.5.1** Create a `BillingSubView` component showing plan name, renewal date, and a "Manage on web" CTA card instead of routing both "Billing" and "Preferences" to `AccountSubView`
- [x] **1.5.2** Create a `PreferencesSubView` with basic display settings (date format, currency display) using the existing `ToggleRow` + `FieldLabel` primitives
- [x] **1.5.3** Wire `SettingsRow` for "Billing & plan" → `BillingSubView` and "Preferences" → `PreferencesSubView`

---

## Phase 2 — MobilePayments Polish

### 2.1 Hero card skeleton
- [x] **2.1.1** While `statsToday` or `statsWeek` are loading, show `HeroSkeleton` with animated placeholders to prevent layout shift

### 2.2 Stats mini-trend
- [ ] **2.2.1** Add a 7-day sparkline bar chart inside `HeroCard` below the three stats row, using `WeekBars` component (already exists in `@/components/dashboard`) with the week's daily revenue data from `statsWeek`

### 2.3 Export action
- [x] **2.3.1** Wired "Exports →" button to navigate to payments view (will be replaced with native MobileExports in Phase 5)

### 2.4 Empty state
- [x] **2.4.1** Replace "No transactions yet" plain text with an emoji + title + subtitle illustrated empty state card; skeleton rows for loading state

---

## Phase 3 — High-Priority Route Pages → Native Mobile Screens

> Convert the most-visited "More" destinations into native `Mobile*.tsx` screen files
> (same pattern as `MobileSettings`, `MobilePayments`). Register each in `SCREENS` in
> `MobileShell.tsx` and route to `view` instead of `router.push(route)`.

### 3.1 MobileAnalytics
- [x] **3.1.1** Create `components/mobile/screens/MobileAnalytics.tsx`
  - [x] `LargeHeader` eyebrow "Growth" · title "Analytics"
  - [x] `Chip` filter bar: 7d / 30d / 90d / 1yr (replaces date-range inputs)
  - [x] Hero card with total revenue (gradient, matches `MobilePayments` pattern)
  - [x] Metric section cards: Clients, Retention, Appointments, No-shows, Therapists
  - [x] Skeleton loading via placeholder card rects
- [x] **3.1.2** Add `analytics: MobileAnalytics` to `SCREENS` in `MobileShell.tsx`
- [x] **3.1.3** Update `MORE_GROUPS` Analytics item: add `view: 'analytics'`
- [x] **3.1.4** Add `'analytics'` to `MobileView` type in `MobileShell.tsx`

### 3.2 MobileLoyalty
- [x] **3.2.1** Create `components/mobile/screens/MobileLoyalty.tsx`
  - [x] `LargeHeader` eyebrow "Growth" · title "Loyalty"
  - [x] Hero card: total active members, total pts, pts/dollar
  - [x] `Chip` filter bar: All tiers / Platinum / Gold / Silver / Bronze
  - [x] Member list rows: `Avatar` + name + tier badge + points balance
  - [x] Settings info row at bottom (read-only preview, "Edit on web" hint)
  - [x] Skeleton loading
- [x] **3.2.2** Register in `SCREENS`, add to `MobileView`, wire `MORE_GROUPS`

### 3.3 MobileInventory
- [x] **3.3.1** Create `components/mobile/screens/MobileInventory.tsx`
  - [x] `LargeHeader` eyebrow "Operations" · title "Inventory"
  - [x] Hero stat card: total SKUs + low-stock count (warning colour when > 0)
  - [x] `Chip` filter bar: All / Oils / Lotions / Tools / Retail / Supplies / Other
  - [x] Product list rows: category emoji + name + stock count (warning colour if low)
  - [x] "Adjust stock" inline expand on row tap (+ Add / − Use buttons, no modal)
  - [x] FAB for "Add product" → bottom-sheet form (name, category, stock, unit price)
  - [x] Skeleton loading
- [x] **3.3.2** Register in `SCREENS`, add to `MobileView`, wire `MORE_GROUPS`

### 3.4 MobilePromotions
- [x] **3.4.1** Create `components/mobile/screens/MobilePromotions.tsx`
  - [x] `LargeHeader` eyebrow "Growth" · title "Promotions"
  - [x] Hero stat card: sent count, total msgs delivered, draft count
  - [x] `Chip` filter bar: All / Draft / Scheduled / Sent / Cancelled
  - [x] Promotion list rows: channel emoji + name + `StatusChip` + date
  - [x] Tap row → expand inline analytics (sent, open%, click%, convert%) for sent campaigns
  - [x] Skeleton loading
- [x] **3.4.2** Register in `SCREENS`, add to `MobileView`, wire `MORE_GROUPS`

### 3.5 MobileGiftCards
- [x] **3.5.1** Create `components/mobile/screens/MobileGiftCards.tsx`
  - [x] `LargeHeader` eyebrow "Growth" · title "Gift Cards"
  - [x] Hero card: outstanding value, active cards, total issued, redeemed count
  - [x] `Chip` filter bar: All / Active / Redeemed / Expired
  - [x] Gift card list rows: 💳 emoji + recipient + masked code + balance + status badge
  - [x] Skeleton loading
- [x] **3.5.2** Register in `SCREENS`, add to `MobileView`, wire `MORE_GROUPS`

---

## Phase 4 — Medium-Priority Route Pages → Native Mobile Screens

### 4.1 MobileIntakeForms
- [ ] **4.1.1** Create `components/mobile/screens/MobileIntakeForms.tsx`
  - [ ] `LargeHeader` eyebrow "Operations" · title "Intake Forms"
  - [ ] Hero stat: total forms, responses this month
  - [ ] Form list rows: form name + response count badge + last-sent date
  - [ ] Tap row → expand with "Preview" and "Send to client" action buttons
  - [ ] Skeleton loading
- [ ] **4.1.2** Register in `SCREENS`, add to `MobileView`, wire `MORE_GROUPS`

### 4.2 MobileTherapists
- [ ] **4.2.1** Create `components/mobile/screens/MobileTherapists.tsx`
  - [ ] `LargeHeader` eyebrow "Operations" · title "Therapists"
  - [ ] Hero card: active count, total appointments this month
  - [ ] Therapist list rows: `Avatar` + name + role `Tag` + appointment count
  - [ ] Status indicator (available / on leave) using coloured dot
  - [ ] Tap row → expand with schedule summary and "Message" action
  - [ ] Skeleton loading
- [ ] **4.2.2** Register in `SCREENS`, add to `MobileView`, wire `MORE_GROUPS`

### 4.3 MobileReports
- [ ] **4.3.1** Create `components/mobile/screens/MobileReports.tsx`
  - [ ] `LargeHeader` eyebrow "Growth" · title "Reports"
  - [ ] Report type picker using `Chip` pills (Revenue / Clients / Appointments / Staff)
  - [ ] Date range picker using `Chip` pills (7d / 30d / 90d / Custom)
  - [ ] Generated report preview card: key number + breakdown list
  - [ ] "Export as CSV" CTA button (wired to existing export endpoint)
  - [ ] Skeleton loading
- [ ] **4.3.2** Register in `SCREENS`, add to `MobileView`, wire `MORE_GROUPS`

### 4.4 MobilePayroll
- [ ] **4.4.1** Create `components/mobile/screens/MobilePayroll.tsx`
  - [ ] `LargeHeader` eyebrow "Tools" · title "Payroll"
  - [ ] Hero card: current period total payout, period dates
  - [ ] Staff payout list: `Avatar` + name + hours + amount (right-aligned, bold)
  - [ ] Past period list below `SectionHead` divider
  - [ ] Skeleton loading
- [ ] **4.4.2** Register in `SCREENS`, add to `MobileView`, wire `MORE_GROUPS`

---

## Phase 5 — Complex Route Pages → Native Mobile Screens

### 5.1 MobileAutomation
- [ ] **5.1.1** Create `components/mobile/screens/MobileAutomation.tsx`
  - [ ] `LargeHeader` eyebrow "Tools" · title "Automation"
  - [ ] Hero card: active rules count, messages sent this month
  - [ ] Rule list rows: trigger icon + rule name + status toggle (`Toggle` primitive, no desktop switch)
  - [ ] Tap to expand rule details (trigger, action, last-run timestamp)
  - [ ] FAB "Add rule" → BottomSheet with trigger/action picker
  - [ ] Skeleton loading
- [ ] **5.1.2** Register in `SCREENS`, add to `MobileView`, wire `MORE_GROUPS`

### 5.2 MobileExports
- [ ] **5.2.1** Create `components/mobile/screens/MobileExports.tsx`
  - [ ] `LargeHeader` eyebrow "Tools" · title "Exports"
  - [ ] Export type grid (2-col): Clients / Appointments / Payments / Inventory — matching `MoreSheet` grid pattern
  - [ ] Recent exports list with status badge (Queued / Ready / Failed) and download button
  - [ ] Skeleton loading
- [ ] **5.2.2** Register in `SCREENS`, add to `MobileView`, wire `MORE_GROUPS`

### 5.3 MobileTelehealth
- [ ] **5.3.1** Create `components/mobile/screens/MobileTelehealth.tsx`
  - [ ] `LargeHeader` eyebrow "Operations" · title "Telehealth"
  - [ ] Upcoming telehealth appointments list: `Avatar` + client name + time + "Join" CTA button
  - [ ] "Join" button uses `var(--m-grad)` background matching FAB style
  - [ ] Past session list with `StatusChip`
  - [ ] Skeleton loading
- [ ] **5.3.2** Register in `SCREENS`, add to `MobileView`, wire `MORE_GROUPS`

### 5.4 MobileInsurance
- [ ] **5.4.1** Create `components/mobile/screens/MobileInsurance.tsx`
  - [ ] `LargeHeader` eyebrow "Operations" · title "Insurance"
  - [ ] Hero card: claims submitted, claims approved, total value
  - [ ] Claims list rows: client name + provider + amount + `StatusChip` (Submitted / Approved / Rejected)
  - [ ] Tap row → expand with claim details and "Resubmit" action
  - [ ] FAB "New claim" → BottomSheet
  - [ ] Skeleton loading
- [ ] **5.4.2** Register in `SCREENS`, add to `MobileView`, wire `MORE_GROUPS`

---

## Phase 6 — Cross-Cutting Polish

### 6.1 Empty states
- [ ] **6.1.1** Create a shared `MobileEmptyState` primitive in `primitives.tsx`: icon prop (SVG or emoji) + title + subtitle + optional CTA button — styled with `var(--m-soft)` background, centered
- [ ] **6.1.2** Replace all "No X yet" plain text across Settings, Payments, and every Phase 3–5 screen with `MobileEmptyState`

### 6.2 Skeleton card primitive
- [ ] **6.2.1** Add `SkeletonCard` and `SkeletonRow` exports to `primitives.tsx`: pulsing placeholder blocks using `var(--m-soft)` + CSS `@keyframes im-pulse`
- [ ] **6.2.2** Use `SkeletonRow` consistently across all loading states in every screen

### 6.3 Hero card primitive
- [ ] **6.3.1** Extract `MobileHeroCard` into `primitives.tsx` from the pattern in `MobilePayments` `HeroCard` — accepts `eyebrow`, `headline`, `subheadline`, and a `stats` array of `{ label, value }` objects
- [ ] **6.3.2** Replace the inline `HeroCard` in `MobilePayments` with the new shared primitive
- [ ] **6.3.3** Use `MobileHeroCard` as the first element in every Phase 3–5 screen

### 6.4 MobileView registry cleanup
- [ ] **6.4.1** After all phases are done, audit `MORE_GROUPS` in `MobileShell.tsx` — every item should have `view` set to a registered native screen; no item should fall through to `router.push`
- [ ] **6.4.2** Remove or comment out `warmMoreData` prefetch calls for routes that no longer exist (replaced by native screen data hooks that prefetch on their own)

### 6.5 Data visualisation parity
- [ ] **6.5.1** `MobileAnalytics` must use `WeekBars`, `TopServicesBars`, `StatNumber` from `@/components/dashboard` (same components Dashboard uses) — do not re-implement charts from scratch
- [ ] **6.5.2** `MobilePayments` should add `WeekBars` for 7-day revenue trend (Phase 2.2 already captures this)

---

## Checklist summary by priority

| Priority | Phase | Effort |
|---|---|---|
| 🔴 High | Phase 1 — Settings polish | Small (~1–2 hrs) |
| 🔴 High | Phase 2 — Payments polish | Small (~1 hr) |
| 🔴 High | Phase 3 — Analytics, Loyalty, Inventory, Promotions, Gift Cards | Medium (~3–4 hrs each) |
| 🟡 Medium | Phase 4 — Intake Forms, Therapists, Reports, Payroll | Medium (~2–3 hrs each) |
| 🟢 Lower | Phase 5 — Automation, Exports, Telehealth, Insurance | Large (~3–5 hrs each) |
| 🟢 Lower | Phase 6 — Cross-cutting primitives | Small (~2 hrs total) |
