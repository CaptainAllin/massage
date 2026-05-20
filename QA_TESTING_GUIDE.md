# Stage 2 QA Testing Guide

## Prerequisites

Before testing, ensure:
- ✅ npm permissions fixed: `sudo chown -R 501:20 "/Users/amit/.npm"`
- ✅ Dependencies installed: `npm install`
- ✅ Database migrated: `npm run db:migrate`
- ✅ Prisma client generated: `npm run db:generate`
- ✅ Backend running: `cd services/api && npm run start:dev`
- ✅ Frontend running: `cd apps/web && npm run dev`

---

## Testing Checklist

### 1. Authentication & Authorization (15 min)

#### Setup Test Users
Create test accounts for each role:
- [ ] SUPER_ADMIN user
- [ ] BUSINESS_OWNER user (Business A)
- [ ] BUSINESS_OWNER user (Business B)
- [ ] THERAPIST user (Business A)
- [ ] RECEPTIONIST user (Business A)
- [ ] CLIENT user

#### RBAC Testing
- [ ] BUSINESS_OWNER can access all features for their business
- [ ] THERAPIST can create treatment notes and therapist notes
- [ ] THERAPIST cannot manage intake form templates
- [ ] RECEPTIONIST can create clients but not treatment notes
- [ ] CLIENT can only view their own data
- [ ] Therapists cannot see other therapists' private notes

#### Business Isolation Testing
- [ ] Create clients in Business A
- [ ] Create clients in Business B
- [ ] Verify Business A owner cannot see Business B clients
- [ ] Verify API calls filter by businessId correctly
- [ ] Check all list endpoints respect business boundaries

**Pass Criteria:** All role restrictions enforced, no cross-business data leaks

---

### 2. Client Management (20 min)

#### Create Client
- [ ] Navigate to `/clients`
- [ ] Click "Add Client" button
- [ ] Fill all required fields (First Name, Last Name)
- [ ] Fill optional fields (email, phone, address)
- [ ] Add emergency contact information
- [ ] Add insurance information
- [ ] Set wellness goals
- [ ] Submit form
- [ ] Verify client appears in list
- [ ] Verify audit log created

#### View Client Profile
- [ ] Click on client from list
- [ ] Verify all tabs load (Overview, Medical, Timeline, Forms, Notes)
- [ ] Check Overview tab shows all information correctly
- [ ] Verify statistics cards display (Total Visits, Last Visit, etc.)
- [ ] Check contact information section
- [ ] Verify emergency contact displayed
- [ ] Check insurance information section

#### Edit Client
- [ ] Click "Edit Client" button
- [ ] Modify client information
- [ ] Save changes
- [ ] Verify changes reflected immediately
- [ ] Check audit log for update

#### Search & Filter
- [ ] Test search by name (full and partial)
- [ ] Test search by email
- [ ] Test search by phone number
- [ ] Test filter by active/inactive status
- [ ] Verify pagination works correctly
- [ ] Test sorting by different columns

**Pass Criteria:** All CRUD operations work, data persists correctly, search/filter functional

---

### 3. Medical History (15 min)

#### Add Medical Condition
- [ ] Go to client profile > Medical History tab
- [ ] Click "Add Condition"
- [ ] Enter condition name (e.g., "Chronic lower back pain")
- [ ] Set diagnosis date
- [ ] Select status (Active/Managed/Resolved)
- [ ] Select severity (Mild/Moderate/Severe)
- [ ] Add notes
- [ ] Add treatment plan
- [ ] Save condition
- [ ] Verify condition appears in list

#### Update Medical Condition
- [ ] Edit existing condition
- [ ] Change status from "Active" to "Resolved"
- [ ] Verify resolvedAt date set automatically
- [ ] Update treatment plan
- [ ] Save changes
- [ ] Verify updates persist

#### Display & Organization
- [ ] Verify conditions sorted by status (active first)
- [ ] Check severity badges display correctly
- [ ] Verify status badges use correct colors
- [ ] Test with multiple conditions (5+)
- [ ] Verify dates display in correct format

**Pass Criteria:** Conditions CRUD works, automatic resolution date, proper display

---

### 4. Body Mapping System (25 min)

#### Body Map Selector - Front View
- [ ] Open body map modal
- [ ] Select "Front View" tab
- [ ] Click on shoulder region
- [ ] Verify region highlights
- [ ] Set pain level (try 0, 5, 10)
- [ ] Verify color changes based on pain level:
  - 0 = Green
  - 1-3 = Yellow
  - 4-6 = Orange
  - 7-10 = Red
- [ ] Select multiple regions (5+)
- [ ] Verify all selections shown as tags below map

#### Body Map Selector - Back View
- [ ] Switch to "Back View" tab
- [ ] Select lower back region
- [ ] Set pain level to 8
- [ ] Verify red color applied
- [ ] Add neck and shoulder regions
- [ ] Test deselection by clicking again

#### Anatomy Search
- [ ] Test search: "shoulder"
- [ ] Verify shoulder regions appear in dropdown
- [ ] Click search result
- [ ] Verify region auto-selected on map
- [ ] Test synonyms:
  - "trap" → finds "trapezius"
  - "low back" → finds "lumbar"
  - "quad" → finds "quadriceps"
- [ ] Test partial matches
- [ ] Verify search clears after selection

#### Body Map in Context
- [ ] Add body map to intake form
- [ ] Verify body map saved with form data
- [ ] Add body map to treatment note
- [ ] View saved body maps (read-only)
- [ ] Verify BodyMapViewer shows regions correctly
- [ ] Check pain levels displayed properly

**Pass Criteria:** All views work, pain levels color-coded correctly, search finds regions, saves/loads correctly

---

### 5. Intake Forms (20 min)

#### View Templates (BUSINESS_OWNER)
- [ ] Navigate to `/intake-forms/templates`
- [ ] Verify templates list displays
- [ ] Check default template marked
- [ ] View template details

#### Submit Intake Form
- [ ] Navigate to `/intake-forms/new`
- [ ] Select client from dropdown
- [ ] Fill chief complaint
- [ ] Set pain level
- [ ] Enter duration
- [ ] Click "Add Body Map"
- [ ] Select regions and pain levels
- [ ] Add notes to body map
- [ ] Save body map
- [ ] Fill previous treatment
- [ ] Set treatment goals
- [ ] Submit form
- [ ] Verify redirect to forms list
- [ ] Verify form appears in list

#### View Submitted Form
- [ ] Click on form from list
- [ ] Verify all data displays correctly
- [ ] Check client name shown
- [ ] Verify template name (if used)
- [ ] Check submitted date
- [ ] Verify body map rendered correctly
- [ ] Check all form responses displayed

#### Template Management (BUSINESS_OWNER only)
- [ ] Try to access `/intake-forms/templates` as THERAPIST
- [ ] Verify access denied or restricted
- [ ] Switch to BUSINESS_OWNER
- [ ] Access templates page successfully
- [ ] Verify can create/edit/delete templates

**Pass Criteria:** Forms submit correctly, body maps integrate, RBAC enforced on templates

---

### 6. Treatment Notes (SOAP) (30 min)

#### Create SOAP Note
- [ ] Navigate to `/treatment-notes/new`
- [ ] Select appointment from dropdown
- [ ] Fill Subjective findings
  - Test with multi-line text
  - Include pain descriptions
- [ ] Fill Objective findings
  - Add palpation notes
  - Include ROM observations
- [ ] Add body map to Objective section
  - Select problem areas
  - Set pain levels
  - Add notes
- [ ] Fill Assessment
  - Clinical impressions
  - Progress notes
- [ ] Fill Plan
  - Treatment recommendations
  - Home care instructions
- [ ] Set session duration (e.g., 60 minutes)
- [ ] Set follow-up date (2 weeks from now)
- [ ] Save SOAP note
- [ ] Verify redirect to notes list

#### View SOAP Note
- [ ] Click on note from list
- [ ] Verify all 4 sections display correctly
- [ ] Check body map rendered
- [ ] Verify session duration shown
- [ ] Check follow-up date displayed
- [ ] Verify therapist and client names shown
- [ ] Check appointment date correct

#### Edit SOAP Note
- [ ] Click "Edit" button
- [ ] Modify Assessment section
- [ ] Change follow-up date
- [ ] Update body map
- [ ] Save changes
- [ ] Verify updates persist
- [ ] Check audit log created

#### List & Filter
- [ ] Test sorting by date
- [ ] Filter by client
- [ ] Filter by therapist
- [ ] Filter by date range
- [ ] Test pagination with 20+ notes
- [ ] Search functionality

#### RBAC for Treatment Notes
- [ ] THERAPIST can create/edit their own notes
- [ ] THERAPIST can view all notes in business (read-only for others')
- [ ] BUSINESS_OWNER can view/edit all notes
- [ ] RECEPTIONIST cannot access treatment notes
- [ ] CLIENT can only see their own notes

**Pass Criteria:** Full SOAP note workflow, body maps integrate, RBAC enforced, data persists

---

### 7. Therapist Notes (Private) (15 min)

#### Create Private Note
- [ ] Go to client profile > Notes tab
- [ ] Add therapist note
- [ ] Enter note content
- [ ] Set as pinned (optional)
- [ ] Save note
- [ ] Verify note appears in list

#### Pin/Unpin Notes
- [ ] Click pin icon on note
- [ ] Verify note moves to top
- [ ] Unpin note
- [ ] Verify note moves back to chronological order
- [ ] Test with multiple pinned notes

#### Privacy Testing (CRITICAL)
- [ ] Create note as Therapist A
- [ ] Log in as Therapist B
- [ ] Go to same client profile
- [ ] Verify Therapist A's notes NOT visible
- [ ] Verify only own notes visible
- [ ] Log in as BUSINESS_OWNER
- [ ] Verify can see all therapist notes
- [ ] Check therapist name shown on each note

#### Note Management
- [ ] Edit therapist note
- [ ] Verify changes save
- [ ] Delete therapist note
- [ ] Verify deletion confirmation
- [ ] Confirm delete
- [ ] Verify note removed

**Pass Criteria:** Privacy enforced (therapists can't see each other's notes), pin functionality works, BUSINESS_OWNER has full access

---

### 8. UI/UX Testing (15 min)

#### Loading States
- [ ] Verify skeleton loaders show while data loads
- [ ] Check loading spinners on buttons during submit
- [ ] Test slow network (throttle to 3G)
- [ ] Verify no flash of empty state

#### Error Handling
- [ ] Test with invalid data
- [ ] Verify error messages display clearly
- [ ] Check field-level validation errors
- [ ] Test network error handling
- [ ] Verify error recovery (retry)

#### Empty States
- [ ] View clients list with no clients
- [ ] Verify empty state message and CTA
- [ ] Check empty medical history
- [ ] Test empty intake forms list
- [ ] Verify empty treatment notes

#### Responsive Design
- [ ] Test on mobile (375px width)
- [ ] Test on tablet (768px width)
- [ ] Test on desktop (1920px width)
- [ ] Verify tables scroll horizontally on mobile
- [ ] Check modals fit on mobile screens
- [ ] Test body map on touch devices

#### Accessibility
- [ ] Tab through forms (keyboard navigation)
- [ ] Verify focus indicators visible
- [ ] Check color contrast (WCAG AA)
- [ ] Test with screen reader (if available)
- [ ] Verify ARIA labels on interactive elements

**Pass Criteria:** Smooth UX, clear errors, responsive on all devices, keyboard accessible

---

### 9. Data Persistence & Consistency (10 min)

#### Create Full Client Record
- [ ] Create new client with all fields filled
- [ ] Add 3 medical conditions
- [ ] Submit 2 intake forms
- [ ] Create 3 treatment notes with body maps
- [ ] Add 2 therapist notes (1 pinned)
- [ ] Close browser
- [ ] Reopen and navigate to client
- [ ] Verify all data persists correctly

#### Audit Logging
- [ ] Check database for audit logs
- [ ] Verify all mutations logged
- [ ] Check audit logs contain:
  - User ID
  - Business ID
  - Action type
  - Entity type and ID
  - Timestamp

#### Statistics Updates
- [ ] Create client
- [ ] Verify totalVisits = 0
- [ ] Create appointment and mark completed
- [ ] Verify totalVisits increments
- [ ] Check lastVisitDate updated
- [ ] Verify statistics card reflects changes

**Pass Criteria:** All data persists, audit logs complete, statistics accurate

---

### 10. Performance Testing (10 min)

#### Load Testing
- [ ] Create 50+ clients
- [ ] Verify list loads in <2 seconds
- [ ] Test pagination performance
- [ ] Create 100+ intake forms
- [ ] Check list performance
- [ ] Test search with large dataset

#### Body Map Performance
- [ ] Add body map with 20+ regions
- [ ] Verify rendering smooth
- [ ] Test switching views (front/back)
- [ ] Check no lag when selecting regions

#### Database Queries
- [ ] Open browser DevTools Network tab
- [ ] Monitor API calls
- [ ] Verify single query for lists (not N+1)
- [ ] Check response times <500ms
- [ ] Verify proper use of includes/select

**Pass Criteria:** App responsive with 50+ records, no N+1 queries, <2s page loads

---

## Bug Reporting Template

When you find a bug, report it with:

```markdown
**Title:** [Brief description]

**Priority:** Critical / High / Medium / Low

**Steps to Reproduce:**
1. Go to...
2. Click on...
3. Enter...
4. See error

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Environment:**
- Browser: Chrome 120
- OS: macOS 14
- User Role: THERAPIST
- Business ID: [if relevant]

**Screenshots:**
[Attach screenshots if applicable]

**Console Errors:**
[Copy any errors from browser console]
```

---

## Test Results Summary

After completing all tests, fill out:

### Passed Tests
- [ ] Authentication & Authorization (X/Y tests)
- [ ] Client Management (X/Y tests)
- [ ] Medical History (X/Y tests)
- [ ] Body Mapping (X/Y tests)
- [ ] Intake Forms (X/Y tests)
- [ ] Treatment Notes (X/Y tests)
- [ ] Therapist Notes (X/Y tests)
- [ ] UI/UX (X/Y tests)
- [ ] Data Persistence (X/Y tests)
- [ ] Performance (X/Y tests)

### Critical Issues Found
1. [Issue description]
2. [Issue description]

### Medium/Low Issues Found
1. [Issue description]
2. [Issue description]

### Overall Status
- **Pass Rate:** X%
- **Ready for Production:** Yes/No
- **Blockers:** [List any blockers]

---

## Sign-off

**Tested By:** _______________
**Date:** _______________
**Signature:** _______________

**Stage 2 QA Status:** ✅ PASSED / ⚠️ PASSED WITH ISSUES / ❌ FAILED
