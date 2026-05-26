# Appointments Page — Wide Screen Layout Analysis

## What's Actually Constraining Width Right Now

The constraint chain (tracing from a 2560px wide screen):

1. Sidebar: 230px → ~2330px remaining for main content
2. Main padding (`layout.tsx:136`): 28px each side → ~2274px for the content column
3. **Page container (`page.tsx:71`): `max-w-[1440px]`** — this is the primary culprit. On a 27" monitor, ~834px of horizontal space is left blank.
4. WeekView (`WeekView.tsx:78`): `minWidth: 600px` inside `overflow-x-auto` — this is fine, it just prevents collapse. The `grid-cols-8` fills whatever space it gets.

The `max-w-[1440px]` cap was probably added to prevent the page feeling too "stretched" on ultra-wide screens, but it applies to the entire page including the calendar, which is actually the one component that *benefits most* from width.

---

## Does Stretching the Calendar Actually Help?

**Week view — yes, genuinely.** A wider week grid means each day column gets more horizontal room. Appointment cards can show more text (client name, service, duration) without truncating. This directly reduces the need to click into every appointment just to identify it. Google Calendar, Outlook, and every major scheduling tool go full-width for this reason.

**Month view — yes.** More space per day cell means more appointments visible before "overflow" occurs. Currently cells are probably quite cramped.

**Day view — not straightforwardly.** A single appointment column going from 1440px to 2274px wide is just a very wide empty column. Stretching it doesn't help. The extra space needs to be used differently here (see Option D below).

---

## Options (Ranked by Value vs. Effort)

### Option A — Lift the max-w off the calendar, keep it on secondary elements (Recommended)

Remove `max-w-[1440px]` from the outer page div and let the calendar go full-width. Add a `max-w-3xl` (or similar) specifically on the booking-link card at the bottom, which looks poor when stretched to full page width.

```tsx
// page.tsx
<div className="space-y-5">              {/* removed max-w-[1440px] */}
  ...
  <AppointmentCalendar ... />
  ...
  {bookingHref && (
    <div className="max-w-2xl rounded-2xl p-5 flex items-center gap-4" ...>  {/* added max-w-2xl */}
```

**Pros:** Minimal change. Calendar fills the screen on any monitor. Other elements stay proportionate.  
**Cons:** None of substance. The utility action buttons (Time Off, Availability) at the top would stretch too, but they're right-aligned so that's fine.

---

### Option B — Increase max-w to a larger cap (Quick win, but incomplete)

Change `max-w-[1440px]` to `max-w-screen-2xl` (1536px) or `max-w-[1800px]`. This helps on 1440p and 1920px monitors but still wastes space on 2560px+ displays.

**Pros:** One-line change, safer.  
**Cons:** Doesn't solve the problem at 4K/ultra-wide. Just shifts where the cut-off is.

---

### Option C — Therapist-column "Staff View" for week view

Instead of showing 7 day-columns, add an optional view mode that shows one column per therapist for the selected day. This is how Mindbody, Vagaro, and similar spa software handle multi-therapist practices. On a wide screen with 4–6 therapists you'd have 4–6 rich columns side-by-side — that's a genuinely excellent use of horizontal space and directly relevant to the business data.

Layout sketch:
```
[Time] [Therapist A] [Therapist B] [Therapist C] [Therapist D]
7am     ███ Apt        (empty)        ███ Apt        (empty)
8am     (empty)        ███ Apt        (empty)        ███ Apt
```

**Pros:** Uses width in a way that adds real operational value — owner can see all staff at a glance. Wide screens make this genuinely better, not just "less empty."  
**Cons:** Significant development effort. New view mode. Needs `CalendarFilters` changes too.

---

### Option D — Day View: use a side panel instead of just stretching

In day view, the current `grid-cols-[120px_1fr]` layout (`DayView.tsx:76`) just makes a very wide appointment column. On lg+ screens, split the layout into `grid-cols-[1fr_320px]` where the right panel shows:
- Selected appointment details inline (no modal needed)
- Day-level stats (sessions, revenue, utilisation)
- Or a mini upcoming appointments list

This turns dead space into useful space.

**Pros:** Day view becomes genuinely more useful on large screens. Reduces reliance on the detail modal.  
**Cons:** Medium effort. Day view is not currently the default, so lower ROI than fixing week view.

---

### Option E — Dynamic column density in week view

Keep 7-day columns but on screens wider than ~1600px, show more information in each appointment card (e.g., service name on a second line, therapist avatar). Currently the `AppointmentCard` component is likely truncating aggressively.

This is complementary to Option A and can be done independently in `AppointmentCard.tsx`.

**Pros:** Uses width incrementally, doesn't change layout structure.  
**Cons:** Only helps if appointment cards are actually truncating content today.

---

## Recommendation

**Do Option A first** — it's a 3-line change that immediately unlocks the calendar for all screen sizes. Combined with capping the booking-link card width, the page will look intentional rather than constrained.

Then **consider Option C** as a medium-term improvement — the staff/therapist column view is the feature that makes wide screens genuinely more powerful for a multi-therapist practice. It's the kind of layout you'd see in professional spa software and it makes the horizontal space earn its keep.

Option D for day view is a nice refinement but lower priority since most users will default to week or month view.

---

## Note on DayView consistency

While reviewing, noticed `DayView.tsx` uses a different design system from the rest of the app — it still has old Tailwind classes like `bg-white`, `shadow-soft`, `text-sage-600` (`DayView.tsx:51-64`) while everything else uses inline styles matching the Iris design tokens. Worth aligning that at the same time as any layout work.
