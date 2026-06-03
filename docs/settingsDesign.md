# Settings Page — Design Review Document

> Prepared for design review. Covers every tab in `/settings` plus all linked sub-pages.  
> Color tokens are referenced in hex as they appear in the code. Brand purple = `#5D4AA8`.

---

## Page Shell

### Page Header
- **Layout:** Stacked text block, max-width `4xl` container.
- **Eyebrow label:** `"TOOLS"` — `text-xs font-semibold uppercase tracking-widest`, color `#5D4AA8`, letter-spacing `1.4px`.
- **Page title:** `"Settings"` — `text-2xl font-semibold font-display`, color `#1E1830`, letter-spacing `-0.4px`.
- **Subtitle:** `"Manage your practice, team, notifications, and branding."` — `text-sm`, color `#7A7090`.

### Tab Navigation Bar
- **Layout:** Horizontal scrollable `<nav>` with `-mb-px` overlap trick. Bottom border `1px solid #EFE9F2` on the container.
- **Each tab button:** icon (16×16) + label, `text-sm font-medium`, `py-3`, `whitespace-nowrap`, `gap-6` between tabs.
- **Active tab:** `border-bottom: 2px solid #5D4AA8`, color `#5D4AA8`.
- **Inactive tab:** `border-bottom: 2px solid transparent`, color `#7A7090`.
- **Tabs (in order):** Business (Building2), Team (Users), Notifications (Bell), Branding (Palette), Booking (CalendarCheck), Clinical Notes (FileText), Security (ShieldCheck), Client Portal (LayoutDashboard).
- **Issues:** No hover state defined. Overflow scroll has no visual indicator on mobile.

### Tab Content Card
- Wrapped in a `Card` > `CardContent` with `p-6` padding.
- White background, standard card border-radius.

### "More Settings" Links Grid (below the card)
- **Eyebrow:** `"MORE SETTINGS"` — same style as page eyebrow.
- **Grid:** `grid-cols-1 sm:grid-cols-2 gap-3`.
- **Each link card:** `flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:bg-muted transition-colors`.
- **Icon container:** `h-10 w-10 bg-[#EDE5F4] rounded-lg flex items-center justify-center` with icon color `#5D4AA8`.
- **Title:** `font-medium text-foreground`.
- **Subtitle:** `text-sm text-muted-foreground`.
- **Links present:** Reminders & Notifications, Locations & Rooms, Availability Rules, Communications, Integrations.
- **Issues:** These cards are styled differently from the tab-nav items above; inconsistent navigation pattern (tabs vs. grid cards). No visual indication these open separate pages vs. in-page sections.

---

## Tab 1 — Business

### Section Header
- Title: `"Business Profile"` (`text-xl font-semibold text-foreground`).
- Description: `"Update your clinic or practice information displayed to clients."` (`text-sm text-muted-foreground mt-1`).

### Form Layout
- `space-y-5` wrapper, `<form>`.
- Inner fields use a `grid grid-cols-1 md:grid-cols-2 gap-4`.

### Fields

| Field | Width | Component | Notes |
|---|---|---|---|
| Business Name | Full (md:col-span-2) | `<Input>` with `label` prop | Required |
| Email | Half | `<Input type="email">` | — |
| Phone Number (primary) | Half | `<PhoneInput>` with country flag | Country-aware format |
| Additional Phone rows | Full (md:col-span-2) | `<PhoneInput>` + red `<Trash2>` remove button | Dynamically added |
| Add another phone | Full (md:col-span-2) | Text button, color `#5D4AA8`, `<Plus>` icon | — |
| Street Address | Full (md:col-span-2) | `<Input>` | — |
| City | Half | `<Input>` | — |
| State/Province | Half | Custom searchable dropdown | Text input + floating list panel; selected item highlighted `bg-[#F3EFFD] text-[#5D4AA8]` |
| Postcode | Half | `<PostcodeInput>` | Country-aware validation |
| Country | Half | Native `<select>` | Auto-updates currency on change |
| Currency | Half | Native `<select>` | Tied to country selection |
| Website | Full (md:col-span-2) | `<Input type="url">` | — |

### State Dropdown Details
- **Trigger:** Text input with focus/type to filter.
- **Dropdown panel:** `absolute z-20 mt-1 w-full rounded-xl border border-[#EFE9F2] bg-white shadow-lg max-h-52 overflow-y-auto`.
- **Row:** State code in `font-medium` + state name in `text-gray-500 ml-2`. Hover: `bg-[#F3EFFD]`. Selected: `bg-[#F3EFFD] font-medium text-[#5D4AA8]`.

### Field Labels
- Styled inline: `text-sm font-medium`, color `#3D3450` (via `FieldRow` component). Not all fields use `FieldRow` — some use Tailwind classes directly (`text-gray-700 dark:text-gray-300`) — **inconsistency**.

### Select Element Styling
- `rounded-xl border-2 border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary` — custom class applied inline.
- **Issue:** Uses `border-2` but `<Input>` component styling may differ; possible visual inconsistency.

### Save Button
- `Button variant="primary"` right-aligned (`flex justify-end pt-2`).
- States: default ("Save Changes" + Save icon), saving ("Saving…" + animated Loader2), saved ("Saved" + Check icon, resets after 2 s).

---

## Tab 2 — Team

### Section Header + Action Button
- `flex items-start justify-between` — header left, "Add Team Member" button right.
- Button: `variant="primary"`, `<Plus>` icon.

### Roles Callout Panel
- Background `#F3EFFD`, border `1px solid rgba(93,74,168,0.15)`, `rounded-xl p-4`.
- Title `"Understanding roles"` — `text-sm font-semibold`, color `#3D3450`.
- Inner grid: `grid-cols-1 sm:grid-cols-2 gap-3`. Each role card: white bg, `border: 1px solid rgba(93,74,168,0.1)`, `rounded-lg p-3`.
  - Role name: `text-xs font-semibold`, color `#5D4AA8`.
  - Description: `text-xs leading-relaxed`, color `#7A7090`.
- Roles shown: Therapist, Receptionist (Admin not shown in callout).

### Team Member Cards (list)
- `space-y-3`.
- Empty state: dashed border `border-2 border-dashed border-gray-200`, centered icon (Users, gray-300), text "No team members yet.", link "Add your first team member" in `#5D4AA8`.
- **Each card:** `Card > CardContent p-4`.
  - Left: Avatar circle (`h-10 w-10 rounded-full bg-[#EDE5F4] text-[#5D4AA8] font-semibold`) + name/email/phone stack.
  - Right: Active/Inactive `<Badge>`, Edit button (outline, Pencil icon), Activate/Deactivate `<Button>`.
  - Specialization tags below: `text-xs bg-gray-100 rounded px-2 py-0.5`.
- **Edit button styling:** `border border-[#D1D5DB] text-[#374151] hover:bg-gray-50`.
- **Active badge:** `variant="success"`. Inactive: `variant="default"`.

### Add Team Member Modal
- Full-screen overlay `bg-black/50`, centered dialog `max-w-lg max-h-[90vh] overflow-y-auto`, `rounded-2xl shadow-xl`.
- **Header (sticky):** Title + subtitle + X close button. Border `#EFE9F2`.
- **Step 1 — Find team member:**
  - Info callout: `bg-[#F3EFFD]`, `border: 1px solid rgba(93,74,168,0.15)`, Info icon `#5D4AA8`. Text: user must sign up first.
  - Email input + Search button (gradient `linear-gradient(135deg, #5D4AA8, #3F2F87)`, white text).
  - Search error: `text-xs mt-2 text-red-600`.
  - Found user confirmation: green panel `bg-[#F0FDF4] border rgba(22,163,74,0.2)`. Avatar (green bg + initials) + name/email + UserCheck icon.
- **Step 2 — Profile details (appears after user found):**
  - Specializations: `<TagInput>` (tag pills + free-text input, tags styled `bg-[#EDE5F4] text-[#5D4AA8] rounded-full`).
  - Bio: `<textarea>` rows=2.
  - Credentials & Rate panel: `bg-[#FAFAFA] border-[#EFE9F2] rounded-xl p-4`. Section label in `text-xs font-semibold uppercase text-[#5D4AA8]`. Grid 2-col: License Number, License Expiry (date input), Hourly Rate, Location (if locations exist).
  - Footer: Cancel (outline) + Add Team Member (primary) buttons right-aligned.

### Edit Team Member Modal
- Simpler than Add modal (`max-w-md`).
- Fields: First Name / Last Name (2-col grid), Email, Mobile Number (PhoneInput), Role (select: Therapist/Receptionist), Services/Massage Types (TagInput).
- Role note: role select uses standard `<select>` with `rounded-xl border-2` styling.
- Error display: `bg-[#F5E5E5] text-[#922020] border-[#F5CECE] rounded-xl p-3`.
- Footer: Cancel + Save Changes (primary).

---

## Tab 3 — Notifications

### Section Header
- Title: `"Notification Settings"`, description about channels for reminders/messages.

### Toggle Rows (channel toggles)
- Each is a `<label>` wrapping the toggle — entire row is clickable.
- **Layout:** `flex items-start justify-between gap-4 p-4 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors`.
- Left: label `text-sm font-medium` + description `text-xs text-muted-foreground mt-0.5`.
- Right: custom CSS toggle switch — `w-11 h-6 rounded-full`. On: bg `#5D4AA8`. Off: bg `#D1D5DB`. Thumb: `w-5 h-5 bg-white rounded-full shadow`.
- **Toggles:** Email Notifications, SMS Notifications, WhatsApp Notifications, Auto-Send Reminders.

### SMS Credits Panel
- Background `bg-violet-50 dark:bg-violet-900/20`, border `border-violet-100 dark:border-violet-900/40`, `rounded-lg p-4`.
- Title: `"SMS Credits — Overage Handling"` — `text-sm font-semibold text-violet-800`.
- Two toggle rows inside: Auto-purchase overage credits, Hard stop when credits exhausted.
- **Issue:** These toggles have the same hover style as above but sit inside a colored panel — may look out of place.

### Reminder Lead Time
- `<Input type="number">` labeled "Reminder Lead Time (hours)" using `FieldRow` component.
- Help text: `"Send reminders this many hours before the appointment (1–168)."` — `text-xs text-muted-foreground mt-1`.

### Communications Link Callout
- `bg-[#F3EFFD] border rgba(93,74,168,0.15) rounded-xl p-3.5`.
- Info icon `#5D4AA8` + text pointing to `/settings/communications` with an `underline font-medium` link.

### Save Button
- Same `SaveButton` component, right-aligned.

### Browser Push Notifications Section
- Conditionally rendered (only if browser supports push).
- **Container:** `rounded-xl p-5 border-[#EFE9F2]`.
- Icon: `<BellRing>` color `#5D4AA8`. Title `"Browser Push Notifications"` — `text-sm font-semibold color-[#1E1830]`.
- Description: `text-xs text-muted-foreground`.
- If permission denied: `text-xs text-red-600` message.
- Toggle button: `variant="outline"`. When subscribed: `border-red-300 text-red-700 hover:bg-red-50`.
- **Issue:** `variant` prop is hardcoded `'outline'` in both branches — the conditional class override for the "subscribed" (danger) state works but is fragile.

---

## Tab 4 — Branding

### Section Header
- Title: `"Branding"`, description: `"Customize how your business appears to clients."`

### Logo Upload
- Label: `"Business Logo"` — `text-sm font-medium text-gray-700`.
- Preview box: `h-20 w-20 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50`. Shows spinner while uploading, logo image (object-contain), or Upload icon placeholder.
- Upload button: `variant="outline"`, Upload icon + "Upload Logo" / "Replace Logo".
- Help text: `"PNG, JPG or SVG. Max 2 MB."` — `text-xs text-muted-foreground mt-1`.
- **Interaction:** Hidden `<input type="file" accept="image/*">`, triggered by button click.

### Color Pickers (2-column grid `sm:grid-cols-2`)
Each color has:
- Label `text-sm font-medium text-gray-700`.
- Row: native `<input type="color">` (`h-10 w-14 rounded-lg border cursor-pointer p-0.5`) + `<Input>` for hex code (`flex-1`). Synced bidirectionally.
- Preview swatch: `mt-2 h-8 rounded-lg border` with `backgroundColor` set to current value.
- **Primary color default:** `#A8C3A0` (sage green).
- **Secondary color default:** `#E7D8C9` (warm beige).
- **Issue:** These are the client-facing brand colors but the app UI itself uses `#5D4AA8` purple. No live preview of how colors apply to emails or booking page.

### Email Footer / Signature
- Label: `"Email Footer / Signature"` — `text-sm font-medium text-gray-700`.
- `<textarea>` rows=4, placeholder showing example signature.
- Help text: `"Appended to the bottom of all outbound emails."`.

### Save Button
- Right-aligned, same SaveButton component.

---

## Tab 5 — Booking

### Section Header
- Title: `"Online Booking Access"`, description about controlling who can book.

### Booking Mode Selection (radio-style cards)
Three mutually exclusive option buttons:

| Option | Icon | Description |
|---|---|---|
| Public | Globe | Anyone can discover and book |
| Existing clients only | UserCheck | Must verify email/phone first |
| Invite only | Lock | Only clients with personal invite link |

**Each card button:**
- `w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all`.
- **Selected:** `borderColor: #5D4AA8`, `backgroundColor: #F4F0FB`.
- **Unselected:** `borderColor: #E5E7EB`, `backgroundColor: transparent`.
- Icon container: `w-9 h-9 rounded-lg`. Selected: `bg-[#EDE5F4] text-[#5D4AA8]`. Unselected: `bg-[#F3F4F6] text-[#6B7280]`.
- Label: `text-sm font-medium`. Selected: `#5D4AA8`. Unselected: `#111827`.
- Description: `text-xs mt-0.5`, color `#7A7090`.
- Radio indicator (right): `w-4 h-4 rounded-full border-2`. Selected border `#5D4AA8` with inner `w-2 h-2 rounded-full bg-[#5D4AA8]`. Unselected border `#D1D5DB`.

### Save Button
- Right-aligned, standard.

---

## Tab 6 — Clinical Notes

### Section Header
- Title: `"Draft Note Visibility"`, long description about the business owner always seeing drafts.

### Info Callout
- `bg-[#F3EFFD] border rgba(93,74,168,0.15) rounded-xl p-4`.
- Title `"What counts as a draft?"` — `font-medium`, color `#3D3450`.
- Body: explains Draft vs. Approved status — color `#7A7090`.

### Visibility Option Cards (identical pattern to Booking tab)
Three options:

| Option | Icon | Description |
|---|---|---|
| All therapists | Users | Every therapist sees colleague drafts |
| Only the author | Lock | Therapists see own drafts only |
| Business owner only | ShieldCheck | Drafts hidden until approved |

- Exact same selected/unselected styling as Booking tab cards.

### Save Button
- Right-aligned, standard.

---

## Tab 7 — Security

### Section Header
- Title: `"Security"`, description: `"Manage passkeys and two-factor authentication for your account."`

### Status Messages
- Error: `bg-[#F5E5E5] color-[#922020] border-[#F5CECE] rounded-xl p-3 text-sm`.
- Success: `bg-[#E8F5E9] color-[#1B5E20] border-[#C8E6C9] rounded-xl p-3 text-sm`.

### Passkeys Section
- Container: `rounded-xl border border-border p-5 space-y-4`.
- Header row: KeyRound icon `#5D4AA8` + `"Passkeys"` title + "Add passkey" button (outline, `border-[#5D4AA8] text-[#5D4AA8]`, Plus icon).
- Description: `text-xs text-muted-foreground` explaining Face ID, Touch ID, etc.
- **Add passkey flow (inline):** Shows input row when "Add passkey" is clicked — `<Input>` for friendly name + Register button (primary) + Cancel button (outline).
- **Empty state:** Dashed panel `bg-[#F9F8FF] border: 1px dashed rgba(93,74,168,0.3) rounded-lg p-4 text-center`, color `#7A7090`.
- **Passkey list:** Each row: `flex items-center justify-between p-3 rounded-lg`, border `#E5DEEC`, bg `#FDFCFF`. Left: icon box `bg-[#EDE5F4]` with KeyRound `#5D4AA8` + name + creation date. Right: red trash button `text-red-500 hover:bg-red-50`.
- Revoke triggers a browser `confirm()` dialog.

### Supabase Info Callout
- `bg-[#F3EFFD] border rgba(93,74,168,0.15) rounded-lg p-4 text-sm`.
- Title `"Enabling passkeys in Supabase"` + instructions.
- **Issue:** This is developer-facing content shown to all users, not just admins.

---

## Tab 8 — Client Portal

### Section Header
- Title: `"Client Portal"`, description: self-service portal for clients.

### Enable Toggle Row
- Container: `bg-[#FAFAFA] border-[#EFE9F2] rounded-xl p-4 flex items-start justify-between`.
- Title `"Enable Client Portal"` (`text-sm font-semibold color-[#1E1830]`) + description (`text-xs color-[#7A7090]`).
- Toggle: same CSS toggle pattern as Notifications tab. On: `#5D4AA8`. Off: `#D1D5DB`.

### Portal URL (visible when enabled)
- Label: `"Portal URL"`.
- URL display: `rounded-xl bg-[#F8F7FF] border-[#D9D3E8] text-[#5D4AA8] px-3 py-2 text-sm truncate`.
- Copy button: `bg-[#EDE5F4] text-[#5D4AA8] rounded-xl`. Shows CheckCheck icon + "Copied" for 2 s.
- External link button: same style, ExternalLink icon, opens `/client-portal/sign-in` in new tab.

### Visible to Clients Checkboxes
- Section title: `"Visible to Clients"` — `text-sm font-semibold color-[#1E1830]`.
- Three checkboxes (standard `<input type="checkbox" accent-[#5D4AA8]>`):
  - Invoices & payment history (default on)
  - Intake forms (default on)
  - Approved treatment summaries / documents (default off)
- Note: `"Appointments are always visible to clients."` — `text-xs color-[#9E96B0]`.

### Invite Callout
- `bg-[#F3EFFD] border rgba(93,74,168,0.15) rounded-xl p-3.5`.
- LayoutDashboard icon + instructions to go to client profile and click "Send Portal Invite".

### Save Button
- Right-aligned, standard.

---

## Sub-page: Reminders & Notifications (`/settings/reminders`)

### Page Header
- Same eyebrow/title/subtitle pattern as all sub-pages.
- Back arrow (`<ArrowLeft>`) linking to `/settings`.

### Rule Cards (grouped by trigger)
- Grouped under section headings: `text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2`.
- Trigger groups: Booking Confirmation, 24-Hour Reminder, 2-Hour Reminder, Post-Visit Follow-Up, Cancellation Confirmation, No-Show Follow-Up, Birthday Messages, Re-engagement, Overdue Invoice, Package Running Low.

**Each Rule Card:**
- `Card > CardContent p-4`, `border border-border`.
- Header row: rule name (`font-medium text-foreground`) + trigger label badge (`text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono`) + toggle (right).
- Toggle: `<ToggleRight>` (green, h-7 w-7) when active; `<ToggleLeft>` (muted) when inactive.
- Description below name: `text-sm text-muted-foreground`.
- **Editable actions section** (for SEND_EMAIL / SEND_SMS actions):
  - Appears below a `border-t border-border pt-3`.
  - Section label: `text-xs font-semibold text-muted-foreground uppercase tracking-wide`. "Email" or "SMS".
  - View mode: truncated preview in `text-sm bg-muted/40 rounded px-2 py-1.5 line-clamp-2` + "Edit message" link (`text-xs text-primary hover:underline`).
  - Edit mode: subject `<input>` + body `<textarea>` rows=4 for email; `<textarea>` rows=2 for SMS. Both: `border border-border rounded px-2 py-1.5 bg-background text-foreground focus:ring-1 focus:ring-primary`.
  - Footer in edit mode: Save (primary, small) + Cancel (outline, small).

### Footer Note
- `text-xs text-muted-foreground` explaining template variables like `{{client.firstName}}`.
- Link to `/automation` page.

### Empty State
- Card with Bell icon, "No reminder rules found" + link to Automation page.

---

## Sub-page: Locations & Rooms (`/settings/locations`)

### Page Header
- `h1 text-2xl font-bold text-foreground font-display` — **inconsistent** with other sub-pages which use `text-2xl font-semibold`.
- Back arrow to `/settings`.

### Tab Navigation (Locations / Rooms)
- Same tab pattern as main Settings. Two tabs: Locations (MapPin icon), Rooms (DoorOpen icon).

### Locations Tab

**Info Callout:**
- `bg-[#F3EFFD] border rgba(93,74,168,0.15) rounded-xl p-4`.
- Bold "Multi-location support" explanation.

**Add Location Button:** `variant="primary"`, right-aligned.

**Location Cards Grid:** `grid-cols-1 md:grid-cols-2 gap-4`.

Each card:
- `Card > CardContent p-6 space-y-4`.
- Header: purple icon container (MapPin) + name + status badges (Primary = yellow star badge, Inactive = gray badge).
- Edit (Edit2) + Delete (Trash2) buttons — both `variant="outline" size="sm"`.
- Address lines: `text-sm text-gray-600 space-y-1`.
- Assigned Therapists sub-panel: `bg-[#FAFAFA] border-[#EFE9F2] rounded-lg p-3`. Shows therapist avatar pills `bg-[#EDE5F4] text-[#5D4AA8]`. "Manage" link in `#5D4AA8 underline`.

**Empty State:** Centered MapPin icon (gray-300, h-12), text.

**Location Form Modal (`max-w-lg`):**
- Fields: Name (required), Street Address, City + State (3-col, City=2 cols), Postal Code + Phone (2-col), Email, Timezone (select with preset AU/NZ/US/UK timezones), Primary location checkbox, Active checkbox.
- Modal title `text-xl font-bold text-gray-900` — inconsistent font-weight vs. other modals.
- Input styling: `border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#5D4AA8]` — **inconsistent** with main form style (`rounded-xl border-2`).

**Assign Therapists Modal (`max-w-md`):**
- Checkbox list of therapists. Each row: `rounded-xl p-3 cursor-pointer`. Selected: `bg-[#F3EFFD] border rgba(93,74,168,0.25)`. Unselected: `bg-[#FAFAFA] border-[#EFE9F2]`. Checkbox `accent-[#5D4AA8]`.
- Avatar: `bg-[#EDE5F4] text-[#5D4AA8] rounded-full`.
- Footer: Cancel (outline, flex-1) + Save Assignment (primary, flex-1).

### Rooms Tab

**Header:** "Rooms" title + "Add Room" button (primary, sm).

**Room Card Grid:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3`.

Each room card:
- `rounded-xl border-[#EFE9F2] p-4 flex items-center justify-between`.
- Icon box: `h-9 w-9 rounded-lg`, bg = room color at 12% opacity, icon in full room color.
- Name: `text-sm font-medium`. Active: `#1E1830`. Inactive: `#9CA3AF`.
- Capacity + archived note: `text-xs color-[#9E96B0]`.
- Edit (Edit2) + Archive (Trash2) icon buttons.

**Room Form Modal (`max-w-md`):**
- Fields: Room Name (required), Color (8-circle palette: purple, pink, amber, green, blue, red, gray, teal), Capacity (number).
- Color circle: `w-8 h-8 rounded-full border-2`. Selected: dark `#1E1830` border, scale 1.15. Unselected: transparent border.
- Help text under capacity: `"Max number of clients in this room at once."`.

---

## Sub-page: Availability Rules (`/settings/scheduling`)

### Page Header
- Standard pattern. Title: `"Availability Rules"`.

### Info Callout
- AlertCircle icon + `bg-[#F3EFFD] border rgba(93,74,168,0.15) rounded-xl p-4`.
- Explains how rules complement therapist working hours.

### Rule Cards (list, `space-y-3`)
Each rule card:
- `rounded-xl border-[#EFE9F2] bg-white p-4 flex items-start justify-between`.
- Purple clock icon box `bg-[#EDE5F4]`.
- Target string: "Therapist Name + Room Name + Service" or "All therapists / rooms".
- Detail line: days of week + time range + priority (if > 0). `text-xs color-[#7A7090]`.
- Edit + Delete icon buttons (outline, sm).

### Rule Form Modal
- `max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl`. Sticky header.
- **Target section:** three selects (Therapist, Room, Service Type). Each has `<option value="">Any …</option>` fallback.
- **Days of week:** 7 toggle buttons (Sun–Sat). `w-11 h-10 rounded-lg text-sm font-medium`. Selected: `bg-[#5D4AA8] text-white border-[#5D4AA8]`. Unselected: `bg-[#F9FAFB] text-[#374151] border-[#E5E7EB]`.
- **Time range:** 2-col grid, native `<input type="time">` fields.
- **Priority:** number input, `0` default.
- **Validation errors:** `text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2` with AlertCircle icon.
- Footer: Cancel + Create Rule / Update Rule buttons.

---

## Sub-page: Communications (`/settings/communications`)

### Page Header
- Standard pattern. Title: `"Communications"`.
- Info callout: links back to Settings → Notifications for toggling on/off.

### Three Provider Cards (Twilio, SendGrid, WhatsApp)
Each uses `Card > CardContent p-6 space-y-4`:

**Twilio SMS:**
- Section header `"Twilio SMS"`.
- Fields: Account SID, Auth Token (password), Phone Number.
- Test Connection button (outline, sm) + inline result: green Check "Connected" or red X "Failed".

**SendGrid Email:**
- Fields: API Key (password), From Email, From Name.
- Same test connection pattern.

**WhatsApp Business API:**
- Fields: Phone Number ID, Access Token (password).
- Same test connection pattern.

**Label styling:** `text-sm font-medium mb-1.5 color-[#3D3450]`.
**Input styling:** Standard `<Input>` component.

### Save Changes Button
- Single right-aligned primary button covering all three sections.

---

## Sub-page: Integrations (`/settings/integrations`)

### Page Header
- Standard pattern. Title: `"Integrations"`.

### Conflicts Banner (conditional)
- `rounded-xl border-amber-200 bg-amber-50 p-4 flex items-start gap-3`.
- AlertTriangle icon + message explaining count of conflicts needing attention.

### Sections (each with `<h2 text-sm font-semibold text-foreground>` heading)

**Accounting** (Xero, QuickBooks):
Each `ProviderCard`:
- Logo box `w-10 h-10 rounded-xl bg-muted` (text: "X" or "QB").
- Name + status badge. Badge bg: connected=`#dcfce7`, error=`#fef2f2`, disconnected=`#f3f4f6`. Color dot.
- Description `text-xs text-muted-foreground`.
- Buttons (right): Connected state → "Force sync" (RefreshCw) + "Disconnect" (Link2Off). Disconnected → "Connect" (Link2, primary).
- Connected details (below divider): Organisation name + Last synced time in 2-col grid.

**Messaging** (Slack):
- Same card pattern. Hash icon. Channel name shown when connected (`font-mono`).

**Automation** (Google Sheets, Mailchimp, HubSpot CRM):
- Same card pattern with Sheet / Users / Building2 icons respectively.
- Mailchimp has inline API key form (shows when Connect clicked): password input + audience ID input + Save/Cancel.

**Developer Tools** (2-col grid):
- Webhooks card → `/settings/integrations/webhooks`.
- API Keys card → `/settings/api`.
- Each: `Card cursor-pointer hover:bg-muted/40 p-5 flex items-center gap-3`. Icon box `w-10 h-10 bg-muted rounded-xl`.

### Pending Conflicts List (conditional)
- Section heading with GitMerge icon (amber-500).
- Each conflict row: `rounded-xl border-amber-200 p-4 flex items-center justify-between`. Entity + provider + timestamp. "Resolve" button.

### Conflict Resolution Modal (`max-w-2xl`)
- 2-col split: Local vs. Provider versions.
- Each side: title + "Keep this" button + `<pre>` JSON diff.
- Local version: primary button. External: outline button.

### Sync Logs (collapsible)
- Toggle button with ArrowUpDown icon + ChevronDown/Up.
- When expanded: table with columns Entity, Provider, Direction, Status, Time.
- Status badge with color-coded background (SUCCESS=green, FAILED=red, CONFLICT=amber, RESOLVED=blue).

---

## Sub-page: Developer API (`/settings/api`)

### Page Header
- Standard pattern. Title: `"Developer API"`.
- Right-side action buttons: "OpenAPI Spec" (outline + ExternalLink icon) + "New API Key" (primary).

### New Key Banner (one-time reveal)
- `Card border-green-200 bg-green-50`.
- AlertTriangle icon (green) + "API key created — copy it now" warning.
- `<code>` block with key + Copy button. Dismiss button below.

### Create API Key Form (collapsible panel)
- `Card > CardContent p-6`.
- Fields: Key name, Permissions (2-col checkbox grid of 8 scopes), Expires in days (optional).
- Scope labels: Read/Write Appointments, Clients, Invoices, Treatment Notes.
- Help text: `"Leave empty to grant read-only access to all resources."`.
- Create Key + Cancel buttons.

### API Keys Table
- `Card > CardContent p-0`.
- Full-width table. Columns: Name, Permissions, Last used, Expires, Status, (delete).
- Row hover: `hover:bg-muted/30`.
- Status badge: active=`bg-green-100 text-green-800`, revoked=`bg-red-100 text-red-800`.
- Delete: ghost button with `text-red-500 hover:text-red-700`.
- Empty state: centered Key icon + message.

### Authentication Code Card
- `Card > CardContent p-6`.
- Heading "Authentication".
- `<pre>` block with curl example. Copy button (absolute top-right).
- Rate limit note + link to OpenAPI spec.

---

## Design Issues & Inconsistencies Summary

| # | Location | Issue |
|---|---|---|
| 1 | All sub-pages | `font-bold` vs `font-semibold` used inconsistently for page titles |
| 2 | Locations modal | Input border-radius `rounded-lg` vs. app standard `rounded-xl` |
| 3 | Locations modal | Title uses `text-xl font-bold text-gray-900` vs `text-lg font-semibold color-[#1E1830]` pattern |
| 4 | Field labels | Mix of `FieldRow` (color `#3D3450`) and direct Tailwind `text-gray-700 dark:text-gray-300` |
| 5 | Branding tab | No live preview of brand colors on templates or booking page |
| 6 | Security tab | Supabase developer note visible to all users, not just devs |
| 7 | Notifications tab | SMS Credits toggles inside colored panel — hover style visible but awkward |
| 8 | More Settings grid | Mixing navigation patterns (in-page tabs above + separate-page cards below) without clear visual hierarchy |
| 9 | Booking / Clinical tabs | Identical radio-card UI — strong candidate for a shared component |
| 10 | Integrations | No loading skeletons — integrations cards appear empty while fetching |
| 11 | Tab nav | No hover state on inactive tab buttons |
| 12 | All modals | Confirm dialogs use `window.confirm()` (browser native) — inconsistent with app style |
| 13 | Team tab | Edit button uses raw border/color styles instead of a `variant` |
| 14 | Reminders page | Toggle uses `<ToggleLeft>`/`<ToggleRight>` Lucide icons rather than consistent CSS toggle |

---

## Color Reference

| Token | Hex | Usage |
|---|---|---|
| Brand purple | `#5D4AA8` | Primary actions, active states, icons |
| Deep purple | `#3F2F87` | Gradient endpoint for primary buttons |
| Dark text | `#1E1830` | Page titles, modal headings |
| Body text | `#3D3450` | Field labels, card titles |
| Muted text | `#7A7090` | Descriptions, subtitles |
| Placeholder text | `#9E96B0` | Input placeholders, helper text |
| Light purple bg | `#F3EFFD` | Info callouts, hover states |
| Light purple bg 2 | `#EDE5F4` | Icon containers, tag pills |
| Active card border | `#F4F0FB` | Selected booking mode cards |
| Border light | `#EFE9F2` | Card/modal borders |
| Input border | `#D9D3E8` | Portal URL display |
| Error red | `#922020` | Error messages |
| Error bg | `#F5E5E5` | Error message background |
| Success green | `#1B5E20` | Success messages |
| Success bg | `#E8F5E9` | Success message background |
