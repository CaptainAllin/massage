# Mobile Dashboard Redesign Plan

## Overview

The current dashboard front-loads raw number tiles before any visuals, buries charts below the fold, and has no priority gradient between cards. This plan restructures the dashboard into a clear visual hierarchy: orient → trend → operate.

---

## Phase 1 — Restructure Layout & Hierarchy

### 1.1 Remove the 2×2 stat tile grid
- [ ] 1.1.1 Delete the `StatTile` component and its 2×2 grid section
- [ ] 1.1.2 Audit where each tile's data (sessions, clients, revenue, pending forms) moves to in the new layout
- [ ] 1.1.3 Remove the `StatTile` type and interface

### 1.2 Build a "Today at a Glance" hero card
- [ ] 1.2.1 Design a single hero card that sits immediately after the greeting header
- [ ] 1.2.2 Show today's session count + revenue inline (compact, not large dominating numbers)
- [ ] 1.2.3 Add a horizontal timeline strip showing booked vs open slots across the day
- [ ] 1.2.4 Add a "next session" callout (client name, time, service) if one exists
- [ ] 1.2.5 Link the card to the appointments screen on tap

### 1.3 Reorder cards into priority tiers
- [ ] 1.3.1 Tier 1 (above the fold): Greeting → Hero card → Revenue chart
- [ ] 1.3.2 Tier 2 (one scroll): This Week bars → Service Mix donut → Today's Sessions list
- [ ] 1.3.3 Tier 3 (bottom): SMS Credits → Setup checklist → Install card
- [ ] 1.3.4 Move `InstallCard` and `SetupCard` to the bottom of the render order

---

## Phase 2 — Elevate Charts & Remove Number Duplication

### 2.1 Merge revenue stat tile into the Revenue Card
- [ ] 2.1.1 Remove "This month" stat tile (data already shown in `RevenueCard`)
- [ ] 2.1.2 Ensure `RevenueCard` shows the current month total + delta badge prominently at the top (already does — verify it reads well without the tile above it)
- [ ] 2.1.3 Move `RevenueCard` up to immediately follow the hero card

### 2.2 Merge session count into the hero card
- [ ] 2.2.1 Remove "Today's sessions" stat tile (count moves to hero card)
- [ ] 2.2.2 Confirm `TodaysSessionsCard` list still shows below — it provides the detail, hero provides the summary

### 2.3 Relocate "This Week" bars card
- [ ] 2.3.1 Move `ThisWeekCard` directly after `RevenueCard` so the user sees revenue trend → week breakdown in sequence
- [ ] 2.3.2 Consider adding a total revenue label to the week bars card header

### 2.4 Relocate Service Mix donut
- [ ] 2.4.1 Move `ServiceMixCard` after `ThisWeekCard` — completes the analytics block
- [ ] 2.4.2 Verify the donut + legend layout still works visually in new position

### 2.5 Keep remaining stat data accessible
- [ ] 2.5.1 "Active clients" count — add as a compact inline stat inside the hero card or the session list header
- [ ] 2.5.2 "Pending forms" count — add as a badge/chip on the Today's Sessions card header, or remove if no real data yet

---

## Phase 3 — Hero Card Detail

### 3.1 Day timeline strip
- [ ] 3.1.1 Create a `DayTimeline` sub-component that renders a horizontal bar for business hours
- [ ] 3.1.2 Mark booked session blocks in primary color
- [ ] 3.1.3 Mark open slots in a faint/muted color
- [ ] 3.1.4 Mark current time with a thin vertical indicator line
- [ ] 3.1.5 Make the strip non-interactive (display only) — tap on the hero card routes to appointments

### 3.2 Next session callout
- [ ] 3.2.1 Pull the next upcoming session from the sessions list (first session with status `scheduled` and time > now)
- [ ] 3.2.2 Display: client avatar, name, service, time remaining (e.g. "in 45 min")
- [ ] 3.2.3 Show "No more sessions today" state when none remain

### 3.3 Hero card stats row
- [ ] 3.3.1 Add a compact 3-column stats row at the bottom of the hero card: Sessions · Revenue · Clients
- [ ] 3.3.2 Use small font size (13–14px) with muted labels — not the current 30px dominating style
- [ ] 3.3.3 Apply `fontVariantNumeric: 'tabular-nums'` for alignment

---

## Phase 4 — Polish & Consistency

### 4.1 Visual weight calibration
- [ ] 4.1.1 Audit all card header font sizes — standardise section titles at 15–17px
- [ ] 4.1.2 Ensure no standalone number larger than 24px exists outside the Revenue Card header
- [ ] 4.1.3 Confirm `AreaChart`, `Bars`, and `Donut` are all visible without scrolling past more than one card

### 4.2 SMS Credits card
- [ ] 4.2.1 Move to bottom of dashboard (Tier 3)
- [ ] 4.2.2 Reduce visual weight — it's operational info, not a key metric

### 4.3 Empty states
- [ ] 4.3.1 Hero card: handle 0 sessions today gracefully (show "No sessions — tap to book")
- [ ] 4.3.2 Revenue chart: already has mock data, label it as estimated/demo until real time-series API exists
- [ ] 4.3.3 Service mix: existing empty state is fine — keep it

### 4.4 Scroll performance
- [ ] 4.4.1 Verify no layout jank when cards load asynchronously (sessions, revenue, service mix are all async)
- [ ] 4.4.2 Add a subtle skeleton/placeholder for the hero card while `useMobileDashboard` is loading

---

## Render Order After Redesign

```
Greeting header (name, date, studio pill, settings)
│
├── [Hero card] Today at a glance
│     ├── Day timeline strip
│     ├── Next session callout
│     └── Compact stats row (sessions · revenue · clients)
│
├── [Revenue card] Area chart + period toggle        ← moved up
├── [This week card] Bar chart                       ← moved up
├── [Service mix card] Donut chart                   ← moved up
│
├── [Today's sessions list]
│
├── [SMS Credits card]                               ← moved down
├── [Setup checklist card]                           ← moved down
└── [Install card]                                   ← moved down
```
