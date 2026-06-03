# Settings Page Improvement Plan

## Context

The settings section (`/settings` and its sub-pages) had accumulated several issues across feature phases:

1. **Broken functionality** — `communications/page.tsx` read `businessId` from URL query params instead of the `useBusinessId` hook (form always empty), and used `useState` instead of `useEffect` for hydration.
2. **Duplicate settings** — `emailEnabled`, `smsEnabled`, `whatsappEnabled`, `autoSendReminders`, `defaultReminderHours`, and `emailSignature` each appeared in two separate places.
3. **Missing nav entry** — `/settings/communications` was only reachable via a small hyperlink inside the Notifications tab. No nav card existed for it.
4. **Theme inconsistencies** — several components used raw Tailwind grey/blue colours instead of the app's purple/ink design tokens.
5. **Layout inconsistencies** — sub-pages used different max-widths, padding, title sizes, and back-button patterns.

---

## Phase 1 — Fix Broken Functionality
- [x] **Phase 1 complete**

### 1.1 Fix `communications/page.tsx` businessId
- [x] **1.1.1** Replaced `useSearchParams()` businessId extraction with `useBusinessId()` hook.

### 1.2 Fix `communications/page.tsx` form hydration bug
- [x] **1.2.1** Replaced the erroneous `useState(() => { if (settings) setFormData(...) })` call with `useEffect(() => { if (settings) setFormData(...) }, [settings])`.

### 1.3 Add Communications nav card on main settings page
- [x] **1.3.1** Added a `<Link>` card pointing to `/settings/communications` with `MessageSquare` icon in the "More Settings" grid.

---

## Phase 2 — Remove Duplicate Settings
- [x] **Phase 2 complete**

### 2.1 Strip duplicates from Communications page
- [x] **2.1.1** Removed the "General Settings" `<Card>` section (`defaultReminderHours`, `autoSendReminders`).
- [x] **2.1.2** Removed the `emailSignature` field (owned by Branding tab).
- [x] **2.1.3** Removed the `emailEnabled` / `smsEnabled` / `whatsappEnabled` toggle rows (owned by Notifications tab).
- [x] **2.1.4** Cleaned up the now-unused `formData` keys from form state and mutation call.

### 2.2 Add a contextual link back to Notifications tab
- [x] **2.2.1** Added a purple info callout: *"To toggle email/SMS/WhatsApp on or off, go to Settings → Notifications."*

---

## Phase 3 — Theme Consistency in Main Settings Page (`page.tsx`)
- [x] **Phase 3 complete**

### 3.1 Fix Notifications tab info box colour
- [x] **3.1.1** Replaced `border-blue-100 bg-blue-50 text-blue-800` with purple info callout: `background: '#F3EFFD'`, `border: '1px solid rgba(93,74,168,0.15)'`, `color: '#5D4AA8'`.

### 3.2 Fix BrowserPushSection styling
- [x] **3.2.1** Replaced `border-gray-200 dark:border-gray-700` with `border: '1px solid #EFE9F2'`.
- [x] **3.2.2** Replaced the hand-rolled outline button with `<Button variant="outline">`.

### 3.3 Fix FieldRow label colour
- [x] **3.3.1** Replaced `text-gray-700 dark:text-gray-300` with `style={{ color: '#3D3450' }}`.

### 3.4 Fix Toggle unchecked colour
- [x] **3.4.1** Replaced `bg-gray-300 dark:bg-gray-600` with `bg-[#D1D5DB]`.

### 3.5 Fix Booking tab text grey
- [x] **3.5.1** Replaced `text-gray-500` description text with `style={{ color: '#7A7090' }}`.

---

## Phase 4 — Consistent Sub-page Headers & Layout
- [x] **Phase 4 complete**

Standard header anatomy applied to all sub-pages:
```
<p>  TOOLS  (11px, #5D4AA8, tracking-widest)
<h1> Page Title  (text-2xl, font-semibold, font-display, #1E1830)
<p>  Short description  (text-sm, #7A7090)
```
Plus `← Back` link (`p-2 rounded-xl hover:bg-muted`) and `max-w-4xl space-y-5` container.

### 4.1 Reminders page (`reminders/page.tsx`)
- [x] **4.1.1** Changed `max-w-2xl mx-auto p-6` to `max-w-4xl space-y-5`.
- [x] **4.1.2** Applied standard header with TOOLS label + text-2xl title.
- [x] **4.1.3** Styled `← Back` link as ghost icon button.

### 4.2 Scheduling page (`scheduling/page.tsx`)
- [x] **4.2.1** Applied standard page header (TOOLS label + h1 + description).
- [x] **4.2.2** Normalised container to `max-w-4xl space-y-5`.

### 4.3 Integrations page (`integrations/page.tsx`)
- [x] **4.3.1** Changed `font-bold` → `font-semibold` on page title.
- [x] **4.3.2** Added TOOLS label above title.

### 4.4 Communications page (`communications/page.tsx`)
- [x] **4.4.1** Added `← Back` link to `/settings`.
- [x] **4.4.2** Applied standard page header with TOOLS label + title + description.
- [x] **4.4.3** Removed duplicate checkbox toggles (not needed after Phase 2 strip).
- [x] **4.4.4** Replaced `<Button size="lg">` with `<Button variant="primary">`.
- [x] **4.4.5** Replaced `CardHeader / CardTitle / CardDescription` with plain `SectionHeader` helper.

### 4.5 API page (`api/page.tsx`)
- [x] **4.5.1** Added `← Back` link to `/settings` + `ArrowLeft` / `Link` imports.
- [x] **4.5.2** Applied standard page header (TOOLS label + h1 + description, `font-semibold`).

---

## Phase 5 — Settings Navigation Reorganisation
- [x] **Phase 5 complete**

### 5.1 Add Communications card
- [x] **5.1.1** Card added: *"Communications" / "Configure Twilio, SendGrid, and WhatsApp credentials"* with `MessageSquare` icon.

### 5.2 Add section label above nav cards
- [x] **5.2.1** Added `MORE SETTINGS` label (11px, #5D4AA8, tracking-widest) above the card grid.

### 5.3 Consistent card grid layout
- [x] **5.3.1** Wrapped all five link cards in `grid grid-cols-1 sm:grid-cols-2 gap-3`.

---

## Files Modified

| File | Phases |
|------|--------|
| `apps/web/app/(dashboard)/settings/page.tsx` | 1.3, 3.1–3.5, 5.1–5.3 |
| `apps/web/app/(dashboard)/settings/communications/page.tsx` | 1.1, 1.2, 2.1–2.2, 4.4 |
| `apps/web/app/(dashboard)/settings/reminders/page.tsx` | 4.1 |
| `apps/web/app/(dashboard)/settings/scheduling/page.tsx` | 4.2 |
| `apps/web/app/(dashboard)/settings/integrations/page.tsx` | 4.3 |
| `apps/web/app/(dashboard)/settings/api/page.tsx` | 4.5 |

---

## Verification Checklist

- [ ] Navigate to `/settings` — all 5 nav cards visible in 2-col grid, "MORE SETTINGS" label present.
- [ ] Click **Communications** card — page opens with correct data loaded (no empty form), back button works, no duplicate toggles/fields.
- [ ] Click **Notifications** tab — info box is purple not blue; toggles and save work.
- [ ] Open **Reminders**, **Scheduling**, **Integrations**, **API** sub-pages — all share TOOLS label + text-2xl title + description header; back button returns to `/settings`.
- [ ] Save settings on Communications page (credentials only) — no errors, saved confirmation shown.
