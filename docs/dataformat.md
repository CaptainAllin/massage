# Data Formatting & UI Enhancement Plan

## Overview
This plan addresses data formatting inconsistencies (phone numbers, postcodes, address fields) across the app, payment detail improvements, and client/business profile enhancements — all driven by the country selected in settings.

---

## Phase 1: Payment Details Page Enhancement

### 1.1 Display Complete Payment Information
- [x] **1.1.1** Add client name to the payment details page header
- [x] **1.1.2** Display client contact info (phone, email) on payment details
- [x] **1.1.3** Add appointment/service details linked to the payment
- [x] **1.1.4** Show therapist name associated with the payment
- [x] **1.1.5** Display payment method, date/time, status, and notes in a structured layout
- [x] **1.1.6** Add a link/button to navigate to the associated client profile from the payment details page

---

## Phase 2: Country-Aware Formatting Utility

> All formatting changes across the app depend on this shared utility. Build this first.

### 2.1 Create a Country Format Configuration Module
- [x] **2.1.1** Create a `lib/countryFormats.ts` utility that maps country codes to:
  - Phone number format/mask (e.g., AU: `+61 4XX XXX XXX`, CA: `+1 (XXX) XXX-XXXX`)
  - Postcode/ZIP label and digit length (e.g., AU: 4 digits, US: 5 digits, CA: `A1A 1A1`)
  - State vs Province label per country
  - State/Province dropdown list per country
  - Currency symbol and format
- [x] **2.1.2** Create a `useCountryFormat` React hook that reads the business's selected country from settings and returns the active format config
- [x] **2.1.3** Create a reusable `<PhoneInput>` component that:
  - Renders the country dial code prefix based on selected country
  - Shows a country-appropriate placeholder in grey (e.g., `04XX XXX XXX` for AU)
  - Clears placeholder on focus/typing (controlled input, not HTML `placeholder` hack)
  - Formats digits as the user types
- [x] **2.1.4** Create a reusable `<PostcodeInput>` component with country-aware validation and placeholder
- [x] **2.1.5** Write unit tests for the format utility covering AU, CA, US, UK

### 2.2 Apply Country Format to Business Profile
- [x] **2.2.1** Replace plain phone input in Business Profile with `<PhoneInput>` component
- [x] **2.2.2** Add ability to add multiple business phone numbers (add/remove rows)
- [x] **2.2.3** Replace "Province" field with a dynamic "State / Province" label based on country
- [x] **2.2.4** Convert State/Province to a searchable dropdown (filter list as user types)
- [x] **2.2.5** Replace plain postcode input with `<PostcodeInput>` component
- [x] **2.2.6** Ensure all dummy/placeholder text in Business Profile reflects the selected country format and is grey

### 2.3 Apply Country Format to Settings — Teams Tab
- [x] **2.3.1** Replace therapist/employee phone input with `<PhoneInput>` component
- [x] **2.3.2** Add email address field for therapist/employee (add + edit support)
- [x] **2.3.3** Ensure placeholder text is grey and disappears on typing

### 2.4 Apply Country Format to Clients
- [x] **2.4.1** Replace client phone input with `<PhoneInput>` component
- [x] **2.4.2** Replace client postcode/address fields with country-aware inputs
- [x] **2.4.3** Ensure all dummy placeholder text in client forms is grey and clears on typing
- [x] **2.4.4** Audit the client list view and client detail page for any hardcoded US formatting

### 2.5 Global Audit — Remaining Pages
- [x] **2.5.1** Audit Appointments pages for any phone/address fields using US format
- [x] **2.5.2** Audit Invoices/Payments pages for phone/address fields
- [x] **2.5.3** Audit Intake Forms for any data-format fields
- [x] **2.5.4** Audit any remaining settings pages (Reminders, Scheduling, Locations) for format issues
- [x] **2.5.5** Search codebase for hardcoded US phone masks (e.g., `(XXX) XXX-XXXX`) and replace with dynamic component

---

## Phase 3: Client Profile Enhancements

### 3.1 Emergency Contact Fields
- [x] **3.1.1** Add `emergencyContactName` field to the Prisma Client model
- [x] **3.1.2** Add `emergencyContactPhone` field to the Prisma Client model (country-formatted)
- [x] **3.1.3** Add `emergencyContactRelationship` field to the Prisma Client model
- [x] **3.1.4** Run and verify Prisma migration
- [x] **3.1.5** Update the client create/edit form UI to include the three emergency contact fields
- [x] **3.1.6** Display emergency contact info on the client detail/profile page
- [x] **3.1.7** Update client API routes (`GET`, `POST`, `PUT`) to handle the new fields
- [x] **3.1.8** Use `<PhoneInput>` for the emergency contact phone field

---

## Phase 4: Settings — Teams Tab Enhancements

> Phone formatting for teams is covered in 2.3. This phase covers email.

### 4.1 Therapist / Employee Email Management
- [x] **4.1.1** Confirm `email` field exists on the Therapist/User model (add migration if missing)
- [x] **4.1.2** Add email input to the "Add Therapist / Employee" form
- [x] **4.1.3** Add email display and inline edit to the therapist detail/edit view in Teams tab
- [x] **4.1.4** Update therapist API routes to accept and persist the email field
- [x] **4.1.5** Add basic email format validation on the input

---

## Phase 5: Business Profile — Address & Region Fields

> Phone and postcode formatting handled in Phase 2. This phase covers the state/province dropdown.

### 5.1 Dynamic State / Province Dropdown
- [x] **5.1.1** Define a `statesByCountry` map in `lib/countryFormats.ts` (AU states, CA provinces, US states, etc.)
- [x] **5.1.2** Replace the free-text "Province" field with a searchable `<Combobox>` / `<Select>` component
- [x] **5.1.3** Label updates dynamically: "State" (AU, US), "Province" (CA), "County" (UK), etc.
- [x] **5.1.4** Narrow the dropdown list as the user types (filter by name or abbreviation)
- [x] **5.1.5** Persist selected state/province value to the business settings API and database

---

## Implementation Order

| Priority | Phase | Reason |
|----------|-------|--------|
| 1 | Phase 2.1 — Format utility + components | Blocks all formatting changes |
| 2 | Phase 1 — Payment details | Standalone, high visibility |
| 3 | Phase 2.2–2.4 — Apply formats | Depends on 2.1 |
| 4 | Phase 3 — Emergency contacts | Schema change, needs migration |
| 5 | Phase 4 — Teams email | Smaller addition |
| 6 | Phase 5 — State/Province dropdown | Depends on 2.1 statesByCountry map |
| 7 | Phase 2.5 — Global audit | Catch-all sweep after targeted changes |
