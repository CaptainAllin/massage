# Iris Design Implementation Plan

> Source: `Iris.html` from the Claude Design handoff bundle (direction 4 — chosen by user).
> Design language: **violet on lavender-white, warm peach accent, Sora typeface, grouped sidebar, premium calm.**

---

## Design System Reference

### Color Palette (Iris)
| Token | Hex | Usage |
|---|---|---|
| `bg` | `#F1ECF5` | Page background (warm lavender) |
| `surface` | `#FFFFFF` | Card / component background |
| `panel` | `#FBF8FD` | Sidebar, topbar background |
| `ink` | `#1E1830` | Primary text |
| `ink2` | `#3D3450` | Secondary text |
| `muted` | `#7A7090` | Muted / helper text |
| `line` | `#E5DEEC` | Main borders |
| `line2` | `#EFE9F2` | Subtle borders |
| `primary` | `#5D4AA8` | Deep violet — buttons, active states |
| `primary2` | `#7665C2` | Lighter violet — gradients |
| `primaryDk` | `#3F2F87` | Darker violet — gradient ends |
| `accent` | `#E8A893` | Warm peach — CTA contrast |
| `accentDk` | `#C97E68` | Dark peach — text on peach |
| `soft1` | `#EDE5F4` | Violet tint — active row bg |
| `soft2` | `#F7E5DD` | Peach tint — AI/alert bg |

### Typography
- **Font**: `Sora` (Google Fonts) — weights 300, 400, 500, 600, 700
- **Fallback**: `Inter`, system-ui, -apple-system, sans-serif
- Letter-spacing: `-0.3` to `-0.8` on large headings
- `tabular-nums` on all numeric values

### Key UI Patterns
- **Active nav item**: `linear-gradient(90deg, #5D4AA8, #7665C2)` + white text + `box-shadow: 0 4px 12px #5D4AA833`
- **Primary button**: `linear-gradient(135deg, #5D4AA8, #3F2F87)` + `box-shadow: 0 4px 16px #5D4AA844`
- **Cards**: `border-radius: 16–22px`, `border: 1px solid #EFE9F2`, white bg
- **Radial halos**: `radial-gradient(circle, #5D4AA811, transparent 70%)` on stat cards
- **Overline labels**: uppercase, `1.4–1.6px` letter-spacing, violet, 11px
- **Badges**: peach bg on inactive, white text on active

---

## Sidebar Groups (Iris)

| Group | Items |
|---|---|
| **Practice** | Dashboard, Appointments `[6]`, Clients, Intake Forms, Messages `[3]` |
| **Operations** | Payments, Therapists, Inventory, Telehealth, Insurance |
| **Growth** | Promotions, Gift Cards, Loyalty, Analytics, Reports |
| **Tools** | Automation, Payroll, Exports, Settings |

---

## Implementation Phases

---

## Phase 1 — Design Tokens & Typography

> Update the global color palette from sage/cream → Iris violet, swap Poppins/Inter → Sora.

### 1.1 Tailwind Config & CSS Variables
- [x] **1.1.1** Add Iris color tokens to `packages/config-tailwind/tailwind.config.js` — `iris-bg`, `iris-surface`, `iris-panel`, `iris-ink`, `iris-ink2`, `iris-muted`, `iris-line`, `iris-line2`, `iris-primary`, `iris-primary2`, `iris-primary-dk`, `iris-accent`, `iris-accent-dk`, `iris-soft1`, `iris-soft2`
- [x] **1.1.2** Update CSS custom properties in `apps/web/app/globals.css` — replace sage/cream HSL values with Iris hex tokens mapped to HSL for Tailwind semantic colors (`--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--accent`, `--border`, `--input`, `--ring`)
- [x] **1.1.3** Add Iris-specific gradient utility classes: `.iris-gradient-primary`, `.iris-gradient-text`, `.iris-shadow-primary`
- [x] **1.1.4** Add `iris-soft1` and `iris-soft2` as named Tailwind colors for tint backgrounds

### 1.2 Sora Font
- [x] **1.2.1** Add `Sora` font import to `apps/web/lib/fonts.ts` via `next/font/google` (weights 300, 400, 500, 600, 700)
- [x] **1.2.2** Add `--font-sora` CSS variable to `apps/web/app/layout.tsx` root `<html>` className
- [x] **1.2.3** Update `apps/web/tailwind.config.ts` to set `sans` and `display` font families to Sora
- [x] **1.2.4** Update `packages/config-tailwind/tailwind.config.js` to register `sora` as a font family
- [x] **1.2.5** Verify font renders on dashboard (check the `font-display` and `font-body` classes site-wide)

---

## Phase 2 — Sidebar Redesign

> Replace the flat single-list sidebar with the Iris grouped sidebar (Practice / Operations / Growth / Tools), violet active state, gradient logo, and user profile card at bottom.

### 2.1 Sidebar Logo & Brand
- [x] **2.1.1** Replace "Wellness CRM" wordmark with "Iris" + "Care Suite" sub-label in `packages/ui/src/Sidebar.tsx`
- [x] **2.1.2** Replace green square logo `W` with gradient violet circle containing a leaf/spark SVG icon (`linear-gradient(135deg, #5D4AA8, #3F2F87)`)
- [x] **2.1.3** Style logo text: `Iris` at 15px weight 600, `Care Suite` at 10px uppercase muted letterSpacing 1.5

### 2.2 Grouped Navigation Structure
- [x] **2.2.1** Refactor `defaultMenuItems` in `packages/ui/src/Sidebar.tsx` into four groups with `label` + `items[]` matching Iris sidebar: Practice, Operations, Growth, Tools
- [x] **2.2.2** Add `badge?: number` field to MenuItem type for Appointments (6) and Messages (3)
- [x] **2.2.3** Render section header labels above each group: uppercase, 10px, muted, letterSpacing 1.4
- [x] **2.2.4** Add missing nav items: `Inventory` → `/inventory`, `Telehealth` → `/telehealth`, `Insurance` → `/insurance`, `Payroll` → `/payroll`, `Automation` → `/automation`, `Exports` → `/exports`

### 2.3 Active State & Hover Styling
- [x] **2.3.1** Replace solid `bg-primary` active state with `linear-gradient(90deg, #5D4AA8, #7665C2)` + white text + box-shadow
- [x] **2.3.2** Hover state: `bg-iris-soft1` with `text-iris-ink2`
- [x] **2.3.3** Icon opacity: 0.7 on inactive, 1.0 on active
- [x] **2.3.4** Render badges as pill with peach bg (`#E8A893`) on inactive, `rgba(255,255,255,0.22)` on active

### 2.4 User Profile Card (bottom)
- [x] **2.4.1** Add user profile card at sidebar bottom: avatar (gradient circle + initials), name, role label, settings icon
- [x] **2.4.2** Pull name/role from `useAuth()` user metadata (passed as props from layout)
- [x] **2.4.3** Style: `padding: 10px`, `border-radius: 16px`, soft1 bg, `border: 1px solid line`

### 2.5 Sidebar Width & Panel Color
- [x] **2.5.1** Change sidebar width from `w-64` (256px) to `w-[230px]`
- [x] **2.5.2** Change sidebar background from `bg-card` to `bg-iris-panel` (`#FBF8FD`)
- [x] **2.5.3** Change sidebar border from `border-border` to `border-iris-line`
- [x] **2.5.4** Update the dashboard layout's `lg:ml-64` offset to `lg:ml-[230px]`

---

## Phase 3 — TopBar / Header Redesign

> Replace the current sticky header with the Iris topbar: date/subtitle left, search bar center, "Quick call" + "New session" buttons right, avatar.

### 3.1 Date & Subtitle
- [x] **3.1.1** Replace page `title` prop usage with live date string: `"Tuesday, 25 May 2026"` (dynamic via `new Date()`)
- [x] **3.1.2** Add subtitle below date: e.g. "6 sessions today" — pulled from today's appointment count
- [x] **3.1.3** Style: date at 13.5px weight 500 ink, subtitle at 11.5px muted

### 3.2 Global Search Bar
- [x] **3.2.1** Add search pill in topbar center: magnifier icon + "Search clients, sessions…" placeholder + `⌘K` badge
- [x] **3.2.2** Style: `height: 36px`, `border-radius: 999px`, white surface, line border, 280px width
- [x] **3.2.3** Wire `⌘K` keyboard shortcut to focus the search input

### 3.3 Action Buttons
- [x] **3.3.1** Restyle "Quick Call" button: outlined pill (`border: 1px solid line`, white bg, phone icon)
- [x] **3.3.2** Restyle "New session" button: violet gradient pill (`linear-gradient(135deg, primary, primaryDk)`) + shadow
- [x] **3.3.3** Add divider between buttons and avatar

### 3.4 Avatar
- [x] **3.4.1** Replace green avatar with violet gradient avatar (`linear-gradient(135deg, primary2, primary)`) + initials, 36×36px circle
- [x] **3.4.2** Remove the text name + role from the topbar (moved to sidebar bottom)

### 3.5 TopBar Panel Color & Border
- [x] **3.5.1** Change header `bg-card` to `bg-iris-panel` (`#FBF8FD`)
- [x] **3.5.2** Change border to `border-iris-line2`
- [x] **3.5.3** Remove `shadow-soft` (replaced with subtle iris shadow)

---

## Phase 4 — Dashboard Redesign

> Rebuild the dashboard page with the Iris layout: greeting, 4-col stat cards with sparklines, today's sessions panel, revenue chart, service mix.

### 4.1 Page Header (Greeting)
- [x] **4.1.1** Add overline label: day/date — violet, 11px, uppercase, letterSpacing 1.4
- [x] **4.1.2** Render `h1` greeting banner with violet gradient background
- [x] **4.1.3** Add sub-text: appointment count / loading state
- [x] **4.1.4** Add "Studio" status pill (right-aligned): "Open · 8a — 7p" with green dot and soft1 bg

### 4.2 Stats Row (4 Cards)
- [x] **4.2.1** Build 4-column stats grid: Sessions today, Active clients, Revenue · month, Pending Forms
- [x] **4.2.2** Each card: white surface, `border-radius: 16px`, `border: 1px solid line2`, radial violet halo (top-right corner)
- [x] **4.2.3** Value: 30px weight 500, tabular-nums; label: 11px violet overline uppercase
- [x] **4.2.4** Add sparkline SVG (7 data points, gradient stroke `primary2→primary`) + delta text in violet with ↑ arrow
- [x] **4.2.5** Wire stats to real API data (appointments count, clients count)

### 4.3 Today's Sessions Panel
- [x] **4.3.1** Replace current appointment list with Iris-styled session rows: avatar initials + client name + service + time + status badge
- [x] **4.3.2** Active "now" row: `bg-soft1`, `border: 1px solid primary33`
- [x] **4.3.3** Completed rows: `opacity: 0.5`
- [x] **4.3.4** NOW badge: violet gradient pill label
- [x] **4.3.5** Add "Open slots" AI suggestion card at bottom: peach bg, spark icon, "Send" button
- [x] **4.3.6** "View all →" link top-right of panel

### 4.4 Revenue Chart
- [x] **4.4.1** Add 30-day revenue sparkline chart card (right column): line chart with gradient fill underneath
- [x] **4.4.2** Header: `$14,280` large value + `↑ 18.4%` delta + 30d/90d/1y toggle pills
- [x] **4.4.3** X-axis labels: "Apr 26", "May 10", "Today"
- [x] **4.4.4** Wire to real revenue data from `/api/analytics/revenue`

### 4.5 Service Mix
- [x] **4.5.1** Add service mix horizontal bar chart card below revenue chart
- [x] **4.5.2** Services: Deep Tissue (32%), Swedish (24%), Hot Stone (18%), Sports (14%), Prenatal (12%)
- [x] **4.5.3** Each row: service name + pct + colored bar (`height: 5px`, `border-radius: 3px`)
- [x] **4.5.4** Wire to real service breakdown from API (`/api/reports/revenue` byServiceType)

### 4.6 Layout Grid
- [x] **4.6.1** Main area: `padding: 24px 28px 32px`; background `bg-iris-bg`
- [x] **4.6.2** Two-column lower grid: `1.55fr 1fr` (sessions left, charts right)
- [x] **4.6.3** Chart area stacked vertically with `gap: 14px`

---

## Phase 5 — Calendar / Appointments Page Redesign

> Update the week view calendar to match Iris: violet "today" circle, glowing now-line, appointment blocks with colored left borders.

### 5.1 Calendar Header
- [x] **5.1.1** Update page title to "Calendar" with week range + week number subtitle
- [x] **5.1.2** Add session/therapist/revenue summary: "32 sessions · 4 therapists · $4,210 booked"
- [x] **5.1.3** Add Day/Week/Month toggle: active pill = violet gradient, inactive = transparent

### 5.2 Therapist Filter Strip
- [x] **5.2.1** Add horizontal therapist filter row below header: "All" (active gradient) + individual therapist chips with color dots
- [x] **5.2.2** Color-code therapists: Marcus (violet `#5D4AA8`), Sofía (slate `#7A92D2`), Naomi (peach `#C97E68`), Hana (lavender `#8A6FBE`)

### 5.3 Week Grid
- [x] **5.3.1** Today column header: date number in violet gradient circle (`30px`, `linear-gradient(135deg, primary, primaryDk)`)
- [x] **5.3.2** "Now" line: 1.5px violet line + left dot + `box-shadow: 0 0 8px primary88`
- [x] **5.3.3** Hour grid lines: `line2` color, 56px per hour
- [x] **5.3.4** Appointment blocks: `background: aptSoft[col]`, `border-left: 2.5px solid apt[col]`, `border-radius: 8px`

### 5.4 Calendar Panel Colors
- [x] **5.4.1** Calendar surface: white
- [x] **5.4.2** Calendar page background: `bg-iris-bg`
- [x] **5.4.3** Header bar: `bg-iris-panel`, `border-bottom: 1px solid line2`

---

## Phase 6 — Clients Page Redesign

> Update the clients list page with Iris header, filter tabs, and styled table.

### 6.1 Clients Page Header
- [ ] **6.1.1** Add overline: "Clients · 142 active" — violet uppercase
- [ ] **6.1.2** Render `h1`: "Your people" + subtitle "8 new clients this month · 4 are due for a follow-up."
- [ ] **6.1.3** Add Export button (outlined) + Add client button (violet gradient)

### 6.2 Filter Tabs
- [ ] **6.2.1** Add filter bar card: search input pill + filter chips: All (142), VIP (12), New this month (8), Due for visit (24), Inactive 60d+ (18)
- [ ] **6.2.2** Active filter: violet gradient background; inactive: outlined
- [ ] **6.2.3** Add "More filters" button (right-aligned, outlined, filter icon)
- [ ] **6.2.4** Wire filter counts to real API data

### 6.3 Clients Table
- [ ] **6.3.1** Table columns: Client (avatar + name + therapist), Tags, Last visit, Lifetime $, Visits, Next session, chevron
- [ ] **6.3.2** Avatar: colored initials circle (`aptSoft` bg, `apt` text color)
- [ ] **6.3.3** Tags: VIP → peach `soft2` bg; other tags → violet `soft1` bg
- [ ] **6.3.4** Table header: 10.5px uppercase muted letterSpacing 1
- [ ] **6.3.5** Pagination: Previous (outlined) + page indicator + Next (violet gradient)
- [ ] **6.3.6** Table `border-radius: 18px`, overflow hidden, white surface

---

## Phase 7 — Client Profile Page Redesign

> Update the client profile page with Iris header card, KPI row, tabs, session timeline, notes, and recurring booking.

### 7.1 Profile Header Card
- [ ] **7.1.1** Add breadcrumb: `← Clients / Priya Raman` with violet chevron
- [ ] **7.1.2** Large avatar (72px circle, aptSoft bg, large initials)
- [ ] **7.1.3** Name `h1` + active status pill: "In Room 2 · started 11:32" with violet dot
- [ ] **7.1.4** Contact row: phone, email, pronouns, age/condition in muted text
- [ ] **7.1.5** Tags: condition tags (`soft1`/`soft2` bg), allergy tag in peach
- [ ] **7.1.6** Action buttons: Message (outlined) + Book session (violet gradient)
- [ ] **7.1.7** Radial violet halo in top-right corner of card

### 7.2 KPI Row
- [ ] **7.2.1** 4-column KPI grid inside header card (below border): Sessions, Lifetime spent, Cadence, Retention
- [ ] **7.2.2** Value at 22px weight 500; label uppercase 10.5px muted; sub-text 11px muted

### 7.3 Profile Tabs
- [ ] **7.3.1** Tabs: Overview, Sessions, Notes `[3]`, Intake forms, Payments, Files
- [ ] **7.3.2** Active tab: violet underline `2px solid primary`, violet text weight 500
- [ ] **7.3.3** Notes badge: `accent33` bg + `accentDk` text

### 7.4 Session History Timeline
- [ ] **7.4.1** Vertical timeline: 2px `line2` line, dot markers (`14px` circles)
- [ ] **7.4.2** Active dot: filled violet + `box-shadow: 0 0 0 4px primary22`
- [ ] **7.4.3** Past dots: white fill, `primary2` border
- [ ] **7.4.4** Row grid: dot col + service/therapist/date + price right

### 7.5 Notes & Recurring Booking Cards
- [ ] **7.5.1** Latest notes card: date header + note body text + therapist avatar credit
- [ ] **7.5.2** Recurring booking card: calendar icon + schedule text + "Until birth" pill
- [ ] **7.5.3** AI upsell banner: peach bg + spark icon + postpartum package copy

---

## Phase 8 — Global Polish & Remaining Components

> System-wide polish: update all shared UI components to use Iris tokens; ensure consistency across all pages.

### 8.1 Shared UI Component Updates
- [ ] **8.1.1** Update `Button` variants in `packages/ui/src/Button.tsx`: primary → violet gradient, secondary → soft1 bg + violet text
- [ ] **8.1.2** Update `Card` component: border → `line2`, radius → 18px, shadow none (use border only)
- [ ] **8.1.3** Update `Input` / `Select`: border → `line`, focus ring → `primary`, radius → 12px
- [ ] **8.1.4** Update `Badge` / `Tag`: default → soft1/primary, warning → soft2/accentDk
- [ ] **8.1.5** Update `Modal`: backdrop tint, header border `line2`, content padding
- [ ] **8.1.6** Update `Checkbox` / `Radio`: checked color → `primary`

### 8.2 Page Background & Main Area
- [ ] **8.2.1** Change `main` background from `bg-background` to `bg-iris-bg` (`#F1ECF5`) on dashboard layout
- [ ] **8.2.2** Ensure `bg-iris-bg` applied to all dashboard route pages
- [ ] **8.2.3** Update page padding from `p-4 md:p-6` to `px-7 py-6` to match Iris 28px horizontal

### 8.3 Sign-In / Sign-Up Pages
- [ ] **8.3.1** Update auth pages background to `bg-iris-bg`
- [ ] **8.3.2** Update form card to white surface with `line2` border, `border-radius: 22px`
- [ ] **8.3.3** Update submit button to violet gradient
- [ ] **8.3.4** Update "Iris" branding on auth pages (logo + wordmark)

### 8.4 Empty States & Loading Skeletons
- [ ] **8.4.1** Update `EmptyState` component: icon color → muted violet
- [ ] **8.4.2** Update `Skeleton` pulse color from cream to `soft1`

### 8.5 Appointment Color System
- [ ] **8.5.1** Define 4-color appointment palette matching Iris: `apt[0]=#5D4AA8`, `apt[1]=#7A92D2`, `apt[2]=#C97E68`, `apt[3]=#8A6FBE`
- [ ] **8.5.2** Map each therapist to a color slot
- [ ] **8.5.3** Apply appointment colors consistently in calendar blocks, dashboard session rows, and client table avatars

### 8.6 Notification & Status Badges
- [ ] **8.6.1** Replace green "Active" badges with violet `soft1` pills
- [ ] **8.6.2** Replace green appointment status indicators with Iris color-coded dots
- [ ] **8.6.3** Update notification dots to use `accent` (peach) for new items

---

## Phase Index (Quick Reference)

| ID | Task | Phase | Status |
|---|---|---|---|
| 1.1.1 | Add Iris tokens to Tailwind config | 1 | ✅ |
| 1.1.2 | Update CSS custom properties (globals.css) | 1 | ✅ |
| 1.1.3 | Add gradient utility classes | 1 | ✅ |
| 1.1.4 | Add soft1/soft2 Tailwind colors | 1 | ✅ |
| 1.2.1 | Add Sora font to fonts.ts | 1 | ✅ |
| 1.2.2 | Add --font-sora variable to layout | 1 | ✅ |
| 1.2.3 | Update tailwind.config.ts font families | 1 | ✅ |
| 1.2.4 | Register sora in config-tailwind | 1 | ✅ |
| 1.2.5 | Verify Sora renders on dashboard | 1 | ✅ |
| 2.1.1 | Replace "Wellness CRM" with "Iris" wordmark | 2 | ✅ |
| 2.1.2 | Replace logo icon with violet gradient leaf | 2 | ✅ |
| 2.1.3 | Style logo text | 2 | ✅ |
| 2.2.1 | Refactor nav items into 4 groups | 2 | ✅ |
| 2.2.2 | Add badge field to MenuItem type | 2 | ✅ |
| 2.2.3 | Render section group labels | 2 | ✅ |
| 2.2.4 | Add missing nav items (Inventory, Telehealth, etc.) | 2 | ✅ |
| 2.3.1 | Active state → violet gradient | 2 | ✅ |
| 2.3.2 | Hover state → soft1 bg | 2 | ✅ |
| 2.3.3 | Icon opacity on inactive/active | 2 | ✅ |
| 2.3.4 | Badge pill styling | 2 | ✅ |
| 2.4.1 | User profile card at bottom | 2 | ✅ |
| 2.4.2 | Pull name/role from useAuth() | 2 | ✅ |
| 2.4.3 | Profile card styling | 2 | ✅ |
| 2.5.1 | Sidebar width → 230px | 2 | ✅ |
| 2.5.2 | Sidebar bg → iris-panel | 2 | ✅ |
| 2.5.3 | Sidebar border → iris-line | 2 | ✅ |
| 2.5.4 | Layout offset → lg:ml-[230px] | 2 | ✅ |
| 3.1.1 | Date string in topbar | 3 | ✅ |
| 3.1.2 | Session count subtitle | 3 | ✅ |
| 3.1.3 | Date/subtitle styling | 3 | ✅ |
| 3.2.1 | Search pill component | 3 | ✅ |
| 3.2.2 | Search pill styling | 3 | ✅ |
| 3.2.3 | ⌘K shortcut | 3 | ✅ |
| 3.3.1 | Restyle Quick Call button | 3 | ✅ |
| 3.3.2 | Restyle New session button | 3 | ✅ |
| 3.3.3 | Divider between buttons and avatar | 3 | ✅ |
| 3.4.1 | Violet gradient avatar | 3 | ✅ |
| 3.4.2 | Remove name+role from topbar | 3 | ✅ |

| 3.5.1 | Topbar bg → iris-panel | 3 | ✅ |
| 3.5.2 | Topbar border → iris-line2 | 3 | ✅ |
| 3.5.3 | Remove shadow-soft from topbar | 3 | ✅ |
| 4.1.1 | Greeting banner with day/date overline | 4 | ✅ |
| 4.1.2 | Gradient greeting h1 | 4 | ✅ |
| 4.1.3 | Dashboard sub-text | 4 | ✅ |
| 4.1.4 | Studio status pill | 4 | ✅ |
| 4.2.1 | 4-col stats grid | 4 | ✅ |
| 4.2.2 | Stats card styling (halo, border) | 4 | ✅ |
| 4.2.3 | Value + label typography | 4 | ✅ |
| 4.2.4 | Sparkline SVGs + delta | 4 | ✅ |
| 4.2.5 | Wire stats to API | 4 | ✅ |
| 4.3.1 | Iris-styled session rows | 4 | ✅ |
| 4.3.2 | Active "now" row styling | 4 | ✅ |
| 4.3.3 | Completed rows opacity | 4 | ✅ |
| 4.3.4 | NOW badge | 4 | ✅ |
| 4.3.5 | Open slots AI suggestion card | 4 | ✅ |
| 4.3.6 | "View all →" link | 4 | ✅ |
| 4.4.1 | Revenue sparkline chart | 4 | ✅ |
| 4.4.2 | Revenue card header + toggle | 4 | ✅ |
| 4.4.3 | X-axis labels | 4 | ✅ |
| 4.4.4 | Wire to real revenue API | 4 | ✅ |
| 4.5.1 | Service mix bar chart card | 4 | ✅ |
| 4.5.2 | 5 service rows with bars | 4 | ✅ |
| 4.5.3 | Bar styling (5px, colored) | 4 | ✅ |
| 4.5.4 | Wire to real service data | 4 | ✅ |
| 4.6.1 | Page padding | 4 | ✅ |
| 4.6.2 | Two-column lower grid | 4 | ✅ |
| 4.6.3 | Chart area gap | 4 | ✅ |
| 5.1.1 | Calendar page title + week range | 5 | ✅ |
| 5.1.2 | Session/therapist/revenue summary | 5 | ✅ |
| 5.1.3 | Day/Week/Month toggle | 5 | ✅ |
| 5.2.1 | Therapist filter chip strip | 5 | ✅ |
| 5.2.2 | Therapist color assignments | 5 | ✅ |
| 5.3.1 | Today header circle → violet gradient | 5 | ✅ |
| 5.3.2 | "Now" line with glow | 5 | ✅ |
| 5.3.3 | Hour grid spacing (56px) | 5 | ✅ |
| 5.3.4 | Appointment block left-border style | 5 | ✅ |
| 5.4.1 | Calendar surface white | 5 | ✅ |
| 5.4.2 | Calendar page bg iris-bg | 5 | ✅ |
| 5.4.3 | Calendar header panel color | 5 | ✅ |
| 6.1.1 | Clients overline | 6 | ☐ |
| 6.1.2 | Clients h1 + subtitle | 6 | ☐ |
| 6.1.3 | Export + Add client buttons | 6 | ☐ |
| 6.2.1 | Filter bar card | 6 | ☐ |
| 6.2.2 | Active/inactive filter styling | 6 | ☐ |
| 6.2.3 | More filters button | 6 | ☐ |
| 6.2.4 | Wire filter counts | 6 | ☐ |
| 6.3.1 | Table columns | 6 | ☐ |
| 6.3.2 | Avatar initials | 6 | ☐ |
| 6.3.3 | Tag styling (VIP peach, others violet) | 6 | ☐ |
| 6.3.4 | Table header style | 6 | ☐ |
| 6.3.5 | Pagination styling | 6 | ☐ |
| 6.3.6 | Table border-radius + overflow | 6 | ☐ |
| 7.1.1 | Profile breadcrumb | 7 | ☐ |
| 7.1.2 | Large avatar | 7 | ☐ |
| 7.1.3 | Name + status pill | 7 | ☐ |
| 7.1.4 | Contact row | 7 | ☐ |
| 7.1.5 | Profile tags | 7 | ☐ |
| 7.1.6 | Action buttons | 7 | ☐ |
| 7.1.7 | Radial halo in header card | 7 | ☐ |
| 7.2.1 | KPI 4-col grid | 7 | ☐ |
| 7.2.2 | KPI typography | 7 | ☐ |
| 7.3.1 | Profile tabs | 7 | ☐ |
| 7.3.2 | Active tab styling | 7 | ☐ |
| 7.3.3 | Notes count badge | 7 | ☐ |
| 7.4.1 | Session timeline vertical line | 7 | ☐ |
| 7.4.2 | Active dot (filled violet + ring) | 7 | ☐ |
| 7.4.3 | Past dot (white + primary2 border) | 7 | ☐ |
| 7.4.4 | Timeline row grid | 7 | ☐ |
| 7.5.1 | Latest notes card | 7 | ☐ |
| 7.5.2 | Recurring booking card | 7 | ☐ |
| 7.5.3 | AI upsell banner | 7 | ☐ |
| 8.1.1 | Button variants → violet | 8 | ☐ |
| 8.1.2 | Card radius + border | 8 | ☐ |
| 8.1.3 | Input/Select Iris styling | 8 | ☐ |
| 8.1.4 | Badge/Tag Iris styling | 8 | ☐ |
| 8.1.5 | Modal Iris styling | 8 | ☐ |
| 8.1.6 | Checkbox/Radio → violet | 8 | ☐ |
| 8.2.1 | Main bg → iris-bg | 8 | ☐ |
| 8.2.2 | All page bgs updated | 8 | ☐ |
| 8.2.3 | Page padding standardised | 8 | ☐ |
| 8.3.1 | Auth pages bg | 8 | ☐ |
| 8.3.2 | Auth form card styling | 8 | ☐ |
| 8.3.3 | Auth submit button | 8 | ☐ |
| 8.3.4 | Iris branding on auth pages | 8 | ☐ |
| 8.4.1 | EmptyState violet icon | 8 | ☐ |
| 8.4.2 | Skeleton soft1 pulse | 8 | ☐ |
| 8.5.1 | 4-color appointment palette | 8 | ☐ |
| 8.5.2 | Therapist → color mapping | 8 | ☐ |
| 8.5.3 | Appointment colors in calendar/dashboard | 8 | ☐ |
| 8.6.1 | Replace green badges with violet | 8 | ☐ |
| 8.6.2 | Appointment status indicators | 8 | ☐ |
| 8.6.3 | Notification dots → accent peach | 8 | ☐ |

---

## Implementation Order

```
Phase 1 (tokens + font) → Phase 2 (sidebar) → Phase 3 (topbar)
    → Phase 8.1 (shared components) → Phase 4 (dashboard)
    → Phase 5 (calendar) → Phase 6 (clients) → Phase 7 (profile)
    → Phase 8.2–8.6 (polish)
```

Phases 1–3 are foundational — complete them first as everything else builds on the token and layout layer.
