# Client Booking Page — Brand Theming Fix Plan

## Root Cause Diagnosis

The client-facing pages (public booking at `/book/[businessId]` and the client portal at `/client-portal/*`) do not visually reflect the business's brand. Here is why:

### Problem 1 — Booking page uses hardcoded Tailwind grays
`/app/book/[businessId]/page.tsx` does fetch `business.primaryColor` from the API and stores it in a local variable `accent`. However, `accent` is only wired to a handful of interactive elements (progress bar, buttons, selection borders) via inline styles. Every structural element — page background, header, cards, text, dividers — uses hardcoded Tailwind utility classes (`bg-gray-50`, `bg-white`, `border-gray-100`, `text-gray-400`, `text-gray-800`) that are completely detached from the brand.

### Problem 2 — Client portal uses hardcoded Iris app colors
`/app/client-portal/components/PortalShell.tsx` fetches `client.business.primaryColor` but never uses it. Instead the shell is hardcoded to the internal Iris palette (`#5D4AA8`, `#F3F4F7`, `#EFE9F2`) — so every business that uses the platform gets a purple header, not their own brand.

### Problem 3 — No CSS variable injection layer
The app's design system in `globals.css` defines the Iris palette as static CSS variables (`--primary: 258 38% 47%`). Neither the booking page nor the portal layout overrides these variables with the business's actual brand colors, so there's no mechanism for Tailwind utility classes to be brand-aware at runtime.

### Problem 4 — Wrong default fallback color
When no `primaryColor` is set, the booking page defaults to `#A8C3A0` (sage green) — a random colour that matches neither the Iris app palette nor any consistent brand identity.

---

## Solution Architecture

Inject per-business brand colors as CSS custom properties on the root element of each client-facing page. This lets both inline styles and Tailwind classes resolve to brand-specific values without per-component changes.

```
business.primaryColor  →  CSS var --brand-primary  →  used across booking + portal
business.secondaryColor →  CSS var --brand-secondary →  used for backgrounds + accents
```

---

## Phase 1 — Foundation: Brand Token System

> Define the brand token interface and utility that both the booking page and portal will share.

- [x] **1.1** Create `/apps/web/lib/brandTokens.ts`
  - [x] **1.1.1** Export a `BrandTokens` interface: `{ primary: string; secondary: string; primaryLight: string; primaryDark: string; onPrimary: string }`
  - [x] **1.1.2** Export `deriveBrandTokens(primaryColor: string | null, secondaryColor: string | null): BrandTokens` — computes light/dark variants and a contrasting foreground color
  - [x] **1.1.3** Set the default fallback to `#5D4AA8` (Iris primary) so unbranded businesses still look consistent with the app
  - [x] **1.1.4** Export `brandTokensToCssVars(tokens: BrandTokens): React.CSSProperties` — returns an object of `--brand-*` CSS custom properties ready to spread onto a `style` prop

- [x] **1.2** Add brand token CSS variable definitions to `globals.css`
  - [x] **1.2.1** Add default `--brand-primary`, `--brand-secondary`, `--brand-primary-light`, `--brand-primary-dark`, `--brand-on-primary` vars defaulting to Iris values so the variables are always defined
  - [x] **1.2.2** Document that these vars are overridden at runtime by client-facing page wrappers

---

## Phase 2 — Public Booking Page (`/book/[businessId]`)

> Wire brand tokens into every visual layer of the booking page.

- [ ] **2.1** Inject brand CSS variables at the page root
  - [ ] **2.1.1** After `business` data loads, call `deriveBrandTokens(business.primaryColor, business.secondaryColor)` to get `tokens`
  - [ ] **2.1.2** Spread `brandTokensToCssVars(tokens)` onto the outermost `<div>` of the page — this makes all `--brand-*` vars available to every child element
  - [ ] **2.1.3** Remove the local `accent` variable — replace all `accent` references with `var(--brand-primary)` in inline styles, or use the `tokens` object directly

- [ ] **2.2** Replace hardcoded page-level backgrounds
  - [ ] **2.2.1** `min-h-screen bg-gray-50` → apply `background: var(--brand-secondary)` (or a very light tint derived from it) via inline style or a new Tailwind-compatible CSS var
  - [ ] **2.2.2** Loading and error screens (`lines 488, 496`) — same background treatment
  - [ ] **2.2.3** Confirmation screen (`line 510`) — same background treatment

- [ ] **2.3** Replace hardcoded header styling
  - [ ] **2.3.1** `bg-white border-b border-gray-100` header (`line 686`) → use `background: #fff` (keep white) but change the border to `var(--brand-primary)` at low opacity or `var(--brand-secondary)`
  - [ ] **2.3.2** Business name / logo area — ensure text color uses `var(--brand-primary)` for the business name

- [ ] **2.4** Replace hardcoded card / panel styling
  - [ ] **2.4.1** Summary/confirmation card (`bg-gray-50 rounded-xl p-5`, line 527) — use a brand-tinted background (`var(--brand-secondary)` or white with a brand border)
  - [ ] **2.4.2** Service cards, therapist cards, time slot pills — use brand-aware border/background on selected state (already partially done with `accent`; complete the replacement)
  - [ ] **2.4.3** Calendar grid — selected date cell should use `--brand-primary` background with `--brand-on-primary` text

- [ ] **2.5** Replace hardcoded text colors
  - [ ] **2.5.1** Heading text currently `text-gray-900` / `text-gray-800` — keep as-is (neutral is fine for readability)
  - [ ] **2.5.2** Labels and overline text currently `text-gray-400` / `text-gray-500` — keep neutral
  - [ ] **2.5.3** Interactive link-style text and icon colors currently `text-gray-400` — change to `var(--brand-primary)` where it represents an action

- [ ] **2.6** Progress stepper — already partially branded; complete it
  - [ ] **2.6.1** Active step circles: `background: var(--brand-primary)`
  - [ ] **2.6.2** Completed step connectors: `background: var(--brand-primary)`
  - [ ] **2.6.3** Inactive steps: use a light tint of `--brand-secondary`

- [ ] **2.7** Primary CTA button
  - [ ] **2.7.1** Replace hardcoded button color with `background: var(--brand-primary)`, `color: var(--brand-on-primary)`
  - [ ] **2.7.2** Hover state: use `var(--brand-primary-dark)`
  - [ ] **2.7.3** Disabled state: reduce opacity, do not change hue

- [ ] **2.8** Update loading/error spinner color
  - [ ] **2.8.1** `text-gray-400` spinner on loading screen → `color: var(--brand-primary)` (already has `accent` logic on the page; apply it here too)

---

## Phase 3 — Client Portal Shell (`/client-portal/*`)

> Replace hardcoded Iris colors in PortalShell with business brand colors.

- [ ] **3.1** Wire `client.business.primaryColor` into brand tokens
  - [ ] **3.1.1** After client data loads in `PortalShell`, call `deriveBrandTokens(client.business.primaryColor, null)`
  - [ ] **3.1.2** Spread `brandTokensToCssVars(tokens)` onto the outermost `<div>` (currently `style={{ background: '#F3F4F7' }}`)

- [ ] **3.2** Update page background
  - [ ] **3.2.1** Replace hardcoded `background: '#F3F4F7'` with `background: var(--brand-secondary)` (will resolve to a light tint of the business's brand)

- [ ] **3.3** Update header / top nav
  - [ ] **3.3.1** Logo badge gradient `linear-gradient(135deg, #5D4AA8, #3F2F87)` → `linear-gradient(135deg, var(--brand-primary), var(--brand-primary-dark))`
  - [ ] **3.3.2** Spinner color `#5D4AA8` on loading screen → `var(--brand-primary)`
  - [ ] **3.3.3** Header border `#EFE9F2` → use a brand-tinted border or keep neutral (`#EFE9F2` is fine as a soft separator)

- [ ] **3.4** Update bottom navigation (mobile)
  - [ ] **3.4.1** Active nav item indicator → `var(--brand-primary)`
  - [ ] **3.4.2** Active icon color → `var(--brand-primary)`

- [ ] **3.5** Update sign-in page (`/client-portal/sign-in`)
  - [ ] **3.5.1** Check whether the sign-in page has access to `businessId` (may be passed via URL param)
  - [ ] **3.5.2** If so, fetch `primaryColor` from the public API and inject brand tokens the same way as the booking page
  - [ ] **3.5.3** If not, leave default Iris styling on the sign-in page (acceptable fallback)

---

## Phase 4 — API & Data Layer Verification

> Ensure brand color data is reliably available on every client-facing request.

- [ ] **4.1** Verify public booking API returns brand colors
  - [ ] **4.1.1** Check `/api/public/booking/[businessId]/route.ts` — confirm `primaryColor` and `secondaryColor` are in the response (already confirmed; just validate format: should be a valid hex string or null)
  - [ ] **4.1.2** Add a guard: if `primaryColor` is not a valid hex color string, treat it as null and fall back to the default

- [ ] **4.2** Verify client portal auth API returns brand colors
  - [ ] **4.2.1** Check `/api/client-portal/auth/route.ts` — confirm `business.primaryColor` is included in the response payload (already confirmed in PortalShell interface; validate the DB query selects it)

- [ ] **4.3** Update the default fallback color in the DB / settings UI
  - [ ] **4.3.1** The settings page (`/settings`) currently seeds `#A8C3A0` as the color picker placeholder — change this to `#5D4AA8` so new businesses that haven't customized get the Iris primary as a sane default
  - [ ] **4.3.2** Optionally seed `primaryColor = '#5D4AA8'` in the business record if it is null, via a DB migration or an upsert on first load

---

## Phase 5 — Testing & QA

> Validate brand theming visually across different business color configurations.

- [ ] **5.1** Test with a business that has a custom `primaryColor` set
  - [ ] **5.1.1** Booking page: all backgrounds, buttons, progress bar, selected states reflect the custom color
  - [ ] **5.1.2** Client portal: header badge, nav active state, page background reflect the custom color
  - [ ] **5.1.3** No Iris purple (`#5D4AA8`) or sage green (`#A8C3A0`) leaks through on client-facing pages

- [ ] **5.2** Test with a business that has NO `primaryColor` set (null)
  - [ ] **5.2.1** Default falls back to Iris primary (`#5D4AA8`) — page looks consistent with the app identity
  - [ ] **5.2.2** No broken styles, no black/transparent elements

- [ ] **5.3** Test color contrast / accessibility
  - [ ] **5.3.1** Run button text contrast check for brand-colored buttons (WCAG AA: 4.5:1 minimum)
  - [ ] **5.3.2** Verify `deriveBrandTokens` correctly detects whether `--brand-on-primary` should be white or dark based on luminance of `primaryColor`

- [ ] **5.4** Test on mobile viewport
  - [ ] **5.4.1** Booking page is responsive — verify brand colors render correctly at mobile width
  - [ ] **5.4.2** Client portal bottom nav active state visible at mobile width

- [ ] **5.5** Regression — verify the internal dashboard is unaffected
  - [ ] **5.5.1** The Iris CSS variables in `globals.css` should remain unchanged for dashboard routes
  - [ ] **5.5.2** Brand token overrides only apply within the booking and portal page trees

---

## File Change Summary

| File | Change |
|------|--------|
| `apps/web/lib/brandTokens.ts` | **New** — brand token derivation utility |
| `apps/web/app/globals.css` | Add `--brand-*` default CSS variable declarations |
| `apps/web/app/book/[businessId]/page.tsx` | Inject CSS vars at root; replace ~15 hardcoded gray values with brand tokens |
| `apps/web/app/client-portal/components/PortalShell.tsx` | Wire `business.primaryColor` into brand tokens; replace 4 hardcoded Iris color literals |
| `apps/web/app/(dashboard)/settings/page.tsx` | Update default color placeholder from `#A8C3A0` to `#5D4AA8` |
| `apps/web/api/public/booking/[businessId]/route.ts` | Add hex validation guard on color fields |
