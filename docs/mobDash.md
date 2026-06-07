# Dashboard Redesign — Bento Glance

> Shared components, real data, consistent across mobile and desktop.
> Previous plan (hierarchy reorder) is superseded by this direction.

---

## Architecture Overview

```
components/dashboard/           ← NEW shared chart/widget folder
  CapacityGauge.tsx
  StatNumber.tsx
  ScheduleList.tsx
  WeekBars.tsx
  BusiestHeatmap.tsx
  TopServicesBars.tsx
  index.ts

lib/hooks/
  use-bento-dashboard.ts        ← NEW unified hook (mobile + desktop)

app/(dashboard)/dashboard/
  page.tsx                      ← Redesigned desktop layout (uses shared components)

components/mobile/screens/
  MobileDashboard.tsx           ← Redesigned mobile layout (uses shared components)
```

---

## Phase 1 — Codebase Audit & Data Layer

### 1.1 Audit existing components and identify reuse / removal

- [x] 1.1.1 Read `app/(dashboard)/dashboard/page.tsx` in full — catalogue every inline component (StatCard, Sparkline, RevenueChart, ServiceMixDonut, WeeklySessionsBar, ApptRow) and mark each as **keep**, **replace**, or **delete**
- [x] 1.1.2 Read `components/mobile/screens/MobileDashboard.tsx` — same catalogue
- [x] 1.1.3 Read `components/mobile/charts.tsx` — note which primitives (Spark, AreaChart, Donut, Bars) can be retired once shared components exist
- [x] 1.1.4 Read `lib/hooks/use-dashboard.ts` and `use-mobile-dashboard.ts` — list every field returned and map to the new Bento metrics
- [x] 1.1.5 Document the gap: which new metrics (`rebookedRate`, `noShows`, `dueBack`, `weekBars`, `busiestHeatmap`, `topServices`, `avgPerVisit`, `collectedToday`, `newClientsThisWeek`, `capacityBooked`, `capacityTotal`) are missing from existing hooks/API

### 1.2 Extend the dashboard API route

- [x] 1.2.1 Read `app/api/dashboard/route.ts` (or equivalent) to understand the current response shape
- [x] 1.2.2 Add `collectedToday` — sum of payments with `paidAt = today`
- [x] 1.2.3 Add `avgPerVisit` — `collectedToday / todayCompletedCount` (or weekly equivalent)
- [x] 1.2.4 Add `newClientsThisWeek` — clients with `createdAt >= start of current week`
- [x] 1.2.5 Add `rebookedRate` — clients who have ≥ 2 appointments in last 60 days / total unique clients seen
- [x] 1.2.6 Add `noShowsThisWeek` — appointments with `status = NO_SHOW` in current week
- [x] 1.2.7 Add `dueBack` — clients whose last visit was 28+ days ago and have no future appointment
- [x] 1.2.8 Add `weekBars` — array of `{ day: 'Mon'|…|'Sun', count: number }` for the current week
- [x] 1.2.9 Add `busiestHeatmap` — 4×7 grid: `{ slot: 'morning'|'midday'|'afternoon'|'evening', day: 0..6, density: 0..1 }[]` computed from last 8 weeks of appointments
- [x] 1.2.10 Add `topServices` — top 5 services by session count this month as `{ name: string, pct: number }[]`
- [x] 1.2.11 Add `capacityBooked` and `capacityTotal` — today's booked slots vs configured daily capacity (default 8 if not set)

### 1.3 Create the unified `useBentoDashboard` hook

- [x] 1.3.1 Create `lib/hooks/use-bento-dashboard.ts`
- [x] 1.3.2 Fetch from the extended `/api/dashboard` endpoint using React Query (`queryKey: ['bentoDashboard', businessId]`, `staleTime: 2 * 60 * 1000`)
- [x] 1.3.3 Return a single `BentoDashboardData` object — one hook used by both mobile and desktop
- [x] 1.3.4 Export `isLoading`, `error`, and all metric fields so consumers need only import one hook
- [x] 1.3.5 Keep `useDashboard` and `useMobileDashboard` intact (don't break existing consumers) — the new hook is additive

### 1.4 TypeScript types

- [x] 1.4.1 Add `BentoDashboardData` interface to `packages/types/src/index.ts` (or a local `lib/types/dashboard.ts` if preferred)
- [x] 1.4.2 Add `HeatmapCell` type: `{ slot: 'morning'|'midday'|'afternoon'|'evening'; day: 0|1|2|3|4|5|6; density: number }`
- [x] 1.4.3 Add `WeekBar` type: `{ day: string; count: number; isToday: boolean }`
- [x] 1.4.4 Add `ServiceShare` type: `{ name: string; pct: number }`
- [x] 1.4.5 Ensure all new API response fields are reflected in the type — no `any`

---

## Phase 2 — Shared Chart Components

> All components live in `components/dashboard/`. They are pure presentational — they receive props and render SVG/HTML. No data fetching inside.

### 2.1 `CapacityGauge`

- [x] 2.1.1 Create `components/dashboard/CapacityGauge.tsx`
- [x] 2.1.2 Render a 270° arc ("C-shape") using SVG `<path>` with `stroke-dasharray` / `stroke-dashoffset` — track arc in `hairline` (#F1EEF6), fill arc in brand gradient (`linear-gradient(135deg,#5D4AA8,#3F2F87)`)
- [x] 2.1.3 Accept props: `booked: number`, `capacity: number`, `size?: number` (default 96), `stroke?: number` (default 10), `color?: string`, `track?: string`, `light?: string`
- [x] 2.1.4 Center label: render `booked`/`capacity` in two lines (large `booked`, small `/capacity`)
- [x] 2.1.5 Below gauge: render `"N open · X% booked"` in `muted` color (13px)
- [x] 2.1.6 Handle edge cases: `capacity = 0` renders an empty grey arc, never divides by zero
- [x] 2.1.7 Export from `components/dashboard/index.ts`

### 2.2 `StatNumber`

- [x] 2.2.1 Create `components/dashboard/StatNumber.tsx`
- [x] 2.2.2 Accept props: `label: string`, `value: string | number`, `sub?: string`, `accent?: string` (color for sub-line)
- [x] 2.2.3 Render: label in `muted` (11px uppercase tracking), value in `ink` bold tabular (22–28px), optional sub-line in `accent` or `muted` (12px)
- [x] 2.2.4 Apply `fontVariantNumeric: 'tabular-nums'` on the value
- [x] 2.2.5 No chart, no sparkline — numbers only
- [x] 2.2.6 Export from `components/dashboard/index.ts`

### 2.3 `ScheduleList`

- [x] 2.3.1 Create `components/dashboard/ScheduleList.tsx`
- [x] 2.3.2 Accept props: `appointments: DashboardAppointment[]`, `onViewAll?: () => void`, `maxVisible?: number` (default 5)
- [x] 2.3.3 Header row: title "Today's Schedule" + count chip (e.g. "4") on the left, "View all →" button on the right — count appears **once only** here
- [x] 2.3.4 Each row: left = colored dot (status color) or client avatar initials; center = `HH:MM` time, client full name, `"service · room"` in muted; right = status chip (`StatusChip` from mobile primitives or equivalent)
- [x] 2.3.5 Status color map: `SCHEDULED` → muted, `CONFIRMED` → primary, `COMPLETED` → success, `CANCELLED` → faint/strikethrough, `NO_SHOW` → accent/warn
- [x] 2.3.6 Empty state: show "No sessions today — tap to book" with a subtle icon
- [x] 2.3.7 Export from `components/dashboard/index.ts`

### 2.4 `WeekBars`

- [x] 2.4.1 Create `components/dashboard/WeekBars.tsx`
- [x] 2.4.2 Accept props: `bars: WeekBar[]` (7 items Mon–Sun), `height?: number` (default 80)
- [x] 2.4.3 Render 7 vertical bars using `<div>` flex column — bar height proportional to `count / max(counts)`
- [x] 2.4.4 Busiest day bar uses brand gradient (`linear-gradient(135deg,#5D4AA8,#3F2F87)`); other bars use `#B4A6E0`; today's bar (if not busiest) uses `#7C6AC9`
- [x] 2.4.5 Day label below each bar (Mon/Tue/…/Sun, 11px muted); value label above each bar (count, 11px ink, hidden if 0)
- [x] 2.4.6 All-zero state: renders bars at a minimum 2px height with a "No data yet" note below
- [x] 2.4.7 Export from `components/dashboard/index.ts`

### 2.5 `BusiestHeatmap`

- [x] 2.5.1 Create `components/dashboard/BusiestHeatmap.tsx`
- [x] 2.5.2 Accept props: `cells: HeatmapCell[]`, `todayDayIndex: number` (0=Mon … 6=Sun)
- [x] 2.5.3 Render a 4-row (Morning / Midday / Afternoon / Evening) × 7-column (Mon–Sun) grid using CSS Grid
- [x] 2.5.4 Each cell: background opacity driven by `density` (0 = `#F4F3F8`, 1 = `#5D4AA8`); use `rgba(93,74,168, density)` blended over surface
- [x] 2.5.5 Today's column: outline with a 1.5px solid `#5D4AA8` border around the column group
- [x] 2.5.6 Row labels on the left (12px muted): Morning / Midday / Afternoon / Evening
- [x] 2.5.7 Column labels on top (11px muted): M / T / W / T / F / S / S, today's label in primary color
- [x] 2.5.8 Legend below: "Quiet" (lightest swatch) → "Busy" (darkest swatch), left-aligned, 11px muted
- [x] 2.5.9 Empty state (all density = 0): show "Patterns appear after a few weeks of appointments"
- [x] 2.5.10 Export from `components/dashboard/index.ts`

### 2.6 `TopServicesBars`

- [x] 2.6.1 Create `components/dashboard/TopServicesBars.tsx`
- [x] 2.6.2 Accept props: `services: ServiceShare[]` (up to 5), `palette?: string[]`
- [x] 2.6.3 Render horizontal bars: label on the left (service name, 13px ink), bar in the center (flex-grow), pct label on the right (13px muted tabular)
- [x] 2.6.4 Bar fill uses `palette` series colors cycling: `['#5D4AA8','#7C6AC9','#6E83C9','#DE9277','#B4A6E0']`
- [x] 2.6.5 Bar width = `pct%` of container; minimum visible bar at 4px even if pct < 1
- [x] 2.6.6 Empty state: "No services recorded this month"
- [x] 2.6.7 Export from `components/dashboard/index.ts`

### 2.7 Barrel export

- [x] 2.7.1 Create `components/dashboard/index.ts` exporting all six components

---

## Phase 3 — Mobile Dashboard Redesign

> Replaces the current `MobileDashboard.tsx` layout. All chart components come from Phase 2.

### 3.1 Greeting header

- [x] 3.1.1 Keep the existing greeting row pattern (name, date, open/closed pill, avatar/settings icon)
- [x] 3.1.2 Verify it uses real `business.name` or `user.firstName`, current date, and business hours open status
- [x] 3.1.3 No changes needed if already correct — just confirm it survives the file rewrite

### 3.2 Bento row (CapacityGauge tile + StatNumber pair)

- [x] 3.2.1 Create a 2-column `flex` row below the greeting
- [x] 3.2.2 Left tile: `Card` wrapping `<CapacityGauge booked={capacityBooked} capacity={capacityTotal} />` — include "N open · X% booked" sub-text from the component itself
- [x] 3.2.3 Right tile: `Card` wrapping two stacked `StatNumber` components:
  - Top: label "Collected today", value `$collectedToday`, sub `avg $avgPerVisit / visit`
  - Bottom: label "New clients", value `newClientsThisWeek`, sub `this week`
- [x] 3.2.4 Both tiles equal height; left tile slightly wider (55/45 split) to give the gauge room
- [x] 3.2.5 Cards: ~22px border-radius, hairline border (`#F1EEF6`), `soft` shadow

### 3.3 KPI strip

- [x] 3.3.1 Single `Card` with 3 equal columns separated by vertical hairline dividers
- [x] 3.3.2 Column 1: `StatNumber` label "Rebooked", value `{rebookedRate}%`
- [x] 3.3.3 Column 2: `StatNumber` label "No-shows", value `{noShowsThisWeek}`
- [x] 3.3.4 Column 3: `StatNumber` label "Due back", value `{dueBack}`
- [x] 3.3.5 All three use the same font size (20px value, 11px label) — no accent colors for neutral KPIs

### 3.4 Schedule section

- [x] 3.4.1 Drop `<ScheduleList appointments={todayAppointments} onViewAll={...} />` directly — no wrapper card needed (ScheduleList is self-contained)
- [x] 3.4.2 Wire `onViewAll` to navigate to `/appointments`
- [x] 3.4.3 Confirm session count does **not** appear anywhere else on the screen (only in ScheduleList header)

### 3.5 WeekBars section

- [x] 3.5.1 `Card` wrapping `<WeekBars bars={weekBars} />`
- [x] 3.5.2 Section header: "This week" (left) — no count, no period toggle
- [x] 3.5.3 Height: 100px for bars area

### 3.6 BusiestHeatmap section

- [x] 3.6.1 `Card` wrapping `<BusiestHeatmap cells={busiestHeatmap} todayDayIndex={todayDayIndex} />`
- [x] 3.6.2 Section header: "When it's busy"
- [x] 3.6.3 Ensure the grid doesn't overflow on narrow (320px) screens — test at minimum width

### 3.7 TopServicesBars section

- [x] 3.7.1 `Card` wrapping `<TopServicesBars services={topServices} />`
- [x] 3.7.2 Section header: "Service mix"
- [x] 3.7.3 No donut, no legend — horizontal bars only

### 3.8 Assemble mobile layout

- [x] 3.8.1 Replace body of `MobileDashboard.tsx` with the new render order:
  ```
  Greeting header
  Bento row (gauge tile + stat tile)
  KPI strip
  ScheduleList
  WeekBars card
  BusiestHeatmap card
  TopServicesBars card
  ```
- [x] 3.8.2 Remove all old inline chart components (RevenueCard, ServiceMixDonut, AreaChart, etc.) that are no longer used
- [x] 3.8.3 Remove sparkline imports from mobile charts.tsx if they become unused
- [x] 3.8.4 Preserve `SetupCard` and `InstallCard` at the bottom (below TopServicesBars) — they stay but are de-emphasized
- [x] 3.8.5 Wrap entire layout in `useBentoDashboard` — replace `useMobileDashboard` call
- [x] 3.8.6 Loading state: render skeleton cards (`animate-pulse` divs) matching the tile heights for each section

---

## Phase 4 — Desktop Dashboard Redesign

> Same shared components, larger sizes, multi-column grid. Desktop layout uses the `(dashboard)` layout with sidebar.

### 4.1 Top band

- [x] 4.1.1 Full-width row with `display: grid; grid-template-columns: auto 1fr`: left = `CapacityGauge` card (compact, `size={80}`), right = clustered metrics
- [x] 4.1.2 Right cluster: two sub-rows
  - Row A: `StatNumber` "Collected today" + `StatNumber` "Avg per visit" + `StatNumber` "New clients (week)" — 3 columns
  - Row B: `StatNumber` "Rebooked %" + `StatNumber` "No-shows" + `StatNumber` "Due back" — 3 columns
- [x] 4.1.3 Keep the gauge compact — `size={80}`, never a hero element; it's informational
- [x] 4.1.4 Top band uses a `Card` container with `padding: 20px 24px`

### 4.2 Two-column region

- [x] 4.2.1 Below the top band: `display: grid; grid-template-columns: minmax(0,1.7fr) minmax(0,1fr); gap: 20px`
- [x] 4.2.2 Left column (wider): `<ScheduleList appointments={todayAppointments} onViewAll={...} maxVisible={8} />` in a `Card`
- [x] 4.2.3 Right column: stacked `Card`s — top: `<WeekBars bars={weekBars} height={100} />`, bottom: `<BusiestHeatmap cells={busiestHeatmap} todayDayIndex={todayDayIndex} />`
- [x] 4.2.4 Session count appears only in `ScheduleList` header — not in any other card header

### 4.3 Full-width row

- [x] 4.3.1 Below the two-column region: single `Card` spanning full width
- [x] 4.3.2 Contains `<TopServicesBars services={topServices} />` with a header "Service mix — this month"

### 4.4 Assemble desktop layout

- [x] 4.4.1 Replace the body of `app/(dashboard)/dashboard/page.tsx` with the new layout (top band → two-column → full-width)
- [x] 4.4.2 Remove old inline components: `StatCard`, `Sparkline`, `RevenueChart`, `ServiceMixDonut`, `WeeklySessionsBar`, `ApptRow` — they are no longer rendered
- [x] 4.4.3 Replace `useDashboard` hook call with `useBentoDashboard`
- [x] 4.4.4 Preserve `SetupCardSlim` (onboarding widget) and `SmsCreditWidget` — move them to a sidebar or bottom section rather than deleting
- [x] 4.4.5 Loading state: skeleton placeholders matching top band height and two-column region height

---

## Phase 5 — Polish, Empty States & QA

### 5.1 Empty and zero states

- [x] 5.1.1 `CapacityGauge`: `capacity = 0` → grey arc + "Set capacity in settings" hint
- [x] 5.1.2 `ScheduleList`: empty → "No sessions today — go to Appointments to book"
- [x] 5.1.3 `WeekBars`: all zeros → bars at min height + "No appointments this week"
- [x] 5.1.4 `BusiestHeatmap`: all density 0 → faint grid + "Patterns appear after a few weeks"
- [x] 5.1.5 `TopServicesBars`: empty → "No services recorded this month"
- [x] 5.1.6 `StatNumber`: `undefined` / `null` values → render "—" not 0 or blank

### 5.2 Loading skeletons

- [x] 5.2.1 Mobile: while `isLoading`, render 7 skeleton blocks matching the section heights (use `animate-pulse bg-[#F1EEF6] rounded-[22px]`)
- [x] 5.2.2 Desktop: skeleton for top band (single block) + two-column skeleton (two tall blocks) + full-width block
- [x] 5.2.3 Skeletons should not cause layout shift when data loads

### 5.3 Responsive edge cases

- [x] 5.3.1 Test mobile at 320px width — `BusiestHeatmap` grid must not overflow (use `font-size: 10px` for labels at small widths or truncate to single letter)
- [x] 5.3.2 Test `CapacityGauge` at `size={56}` (smallest variant) — arc math must still be correct
- [x] 5.3.3 Test `TopServicesBars` with a long service name (e.g. "Hot Stone Full Body") — truncate with `text-ellipsis`
- [x] 5.3.4 Test `ScheduleList` with 0, 1, and 10+ appointments

### 5.4 Data validation & graceful degradation

- [x] 5.4.1 All percentage values clamped to 0–100 before passed to gauge / bars
- [x] 5.4.2 `weekBars` array: if API returns fewer than 7 entries, fill missing days with `count: 0`
- [x] 5.4.3 `busiestHeatmap` array: if any cells missing, fill with `density: 0` — never crash on incomplete data
- [x] 5.4.4 Currency values: use existing `formatCurrency` utility (or Intl.NumberFormat) — no raw `.toFixed(2)`

### 5.5 Cleanup

- [x] 5.5.1 Delete or archive old inline chart functions from `dashboard/page.tsx` that are no longer called
- [x] 5.5.2 Remove sparkline-only imports from `components/mobile/charts.tsx` if the file becomes empty — delete the file if all exports are unused
- [x] 5.5.3 Run `tsc --noEmit` and fix all new type errors before considering the phase done
- [x] 5.5.4 Run ESLint and fix any lint errors introduced by the new files
- [x] 5.5.5 Verify no `console.log` statements left in new files

### 5.6 Manual verification checklist

- [x] 5.6.1 Mobile: all 7 sections visible and scroll naturally
- [x] 5.6.2 Desktop: top band, two-column, and full-width row render without overlap or overflow
- [x] 5.6.3 Both views use the same `useBentoDashboard` hook (confirm by checking React Query devtools — only one `bentoDashboard` query fires)
- [x] 5.6.4 Session count appears exactly once per view (in `ScheduleList` header only)
- [x] 5.6.5 No sparklines, area charts, or revenue trend lines anywhere on the dashboard
- [x] 5.6.6 `CapacityGauge` is never larger than ~120px — never a hero/banner element
- [x] 5.6.7 All numbers use tabular-nums (no jitter when values update)
- [x] 5.6.8 New deps: zero — no chart library added (SVG and div-based only)

---

## Token Reference (adapt to existing `--m-*` vars where already defined)

| Purpose | Value | CSS var |
|---------|-------|---------|
| Primary | `#5D4AA8` | `--m-primary` |
| Light primary | `#7C6AC9` | `--m-light` (or inline) |
| Deep primary | `#3F2F87` | `--m-deep` (or inline) |
| Gradient | `linear-gradient(135deg,#5D4AA8,#3F2F87)` | `--m-grad` |
| Ink (text) | `#1E1830` | `--m-ink` |
| Muted | `#7E748F` | `--m-muted` |
| Faint | `#A79FB5` | — |
| Surface | `#FFFFFF` | `--m-surface` |
| Background | `#F4F3F8` | `--m-bg` |
| Hairline | `#F1EEF6` | — |
| Success | `#3E9E7A` | `--m-ok` |
| Accent warm | `#C2724F` | `--m-accent` |
| Series 1–5 | `#5D4AA8 #7C6AC9 #6E83C9 #DE9277 #B4A6E0` | — |

---

## File Change Summary

| File | Action |
|------|--------|
| `components/dashboard/CapacityGauge.tsx` | **CREATE** |
| `components/dashboard/StatNumber.tsx` | **CREATE** |
| `components/dashboard/ScheduleList.tsx` | **CREATE** |
| `components/dashboard/WeekBars.tsx` | **CREATE** |
| `components/dashboard/BusiestHeatmap.tsx` | **CREATE** |
| `components/dashboard/TopServicesBars.tsx` | **CREATE** |
| `components/dashboard/index.ts` | **CREATE** |
| `lib/hooks/use-bento-dashboard.ts` | **CREATE** |
| `app/api/dashboard/route.ts` | **EXTEND** (new fields) |
| `packages/types/src/index.ts` | **EXTEND** (new types) |
| `components/mobile/screens/MobileDashboard.tsx` | **REWRITE layout** |
| `app/(dashboard)/dashboard/page.tsx` | **REWRITE layout** |
| `lib/hooks/use-dashboard.ts` | **KEEP** (untouched) |
| `lib/hooks/use-mobile-dashboard.ts` | **KEEP** (untouched) |
| `components/mobile/charts.tsx` | **TRIM** (remove unused exports after Phase 3) |
