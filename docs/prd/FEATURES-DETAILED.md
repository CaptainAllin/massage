# MVP Core Features - Detailed Specifications

---

## Table of Contents
- [FEATURE 1 — Promotions Module](#feature-1--promotions-module)
- [FEATURE 2 — Client Intake & Health Form](#feature-2--client-intake--health-form)
- [FEATURE 3 — Quick Call Intake Screen](#feature-3--quick-call-intake-screen)
- [FEATURE 4 — Messaging & Intake Links](#feature-4--messaging--intake-links)
- [FEATURE 5 — Calling System](#feature-5--calling-system)
- [FEATURE 6 — Payments](#feature-6--payments)
- [FEATURE 7 — Appointment Scheduling](#feature-7--appointment-scheduling)
- [FEATURE 8 — Business Analytics Dashboard](#feature-8--business-analytics-dashboard)
- [FEATURE 9 — Therapist Performance Dashboard](#feature-9--therapist-performance-dashboard)
- [FEATURE 10 — Client Profile Page](#feature-10--client-profile-page)
- [FEATURE 11 — Settings](#feature-11--settings)
- [Extra Features](#highly-recommended-extra-features)

---

# FEATURE 1 — Promotions Module

## Status: NOT STARTED (0%)

## Purpose
Allow clinics to create and send promotions quickly to engage clients and drive bookings.

---

## Features

### Promotion Types
- Weekly promotions (e.g., "Monday Massage Special")
- Seasonal promotions (e.g., "Summer Wellness Package")
- Clinical promotions (e.g., "Sports Injury Recovery Special")
- Custom ad-hoc promotions

### Promotion Templates
- Pre-built promotion templates
- Custom template creation
- Variable replacement (client name, offer details, expiry date)
- Image/banner support
- Call-to-action buttons

### Delivery Channels
- SMS promotions via Twilio
- Email promotions via SendGrid
- WhatsApp promotions via WhatsApp Business API
- Multi-channel campaigns

### Scheduling
- Schedule promotions for future sending
- Recurring promotions (weekly, monthly)
- Time zone handling
- Send immediately or schedule

### Analytics
- Open rates (email)
- Click-through rates
- Conversion tracking (bookings from promotion)
- Revenue attribution
- A/B testing (future)

### Targeting
- Send to all clients
- Send to active clients only
- Send to clients who haven't booked in X days
- Send to clients with specific preferences
- Exclude clients (opt-out list)

---

## Tasks

- [ ] Build promotions dashboard
- [ ] Build promotion template system
- [ ] Build send workflow (select clients, choose channel, schedule)
- [ ] Add analytics tracking (opens, clicks, conversions)
- [ ] Add scheduling (cron jobs for scheduled sends)
- [ ] Add preview mode (test before sending)

---

## Priority

**Medium** - Nice to have but not critical for MVP. Can be deferred to post-launch.

---

# FEATURE 2 — Client Intake & Health Form

## Status: 50% COMPLETE (Backend + Body Map + Notes DONE, AI + Consent + Stats TODO)

## Purpose
Collect comprehensive client information before appointments to provide better treatment and track health history.

---

## Features

### Personal Details ✅ COMPLETED
- Full name
- Date of birth
- Gender
- Phone number
- Email address
- Home address
- Emergency contact name and phone

### Medical Information ✅ COMPLETED (via MedicalCondition model)
- Medical history (conditions, diagnoses)
- Allergies
- Current medications
- Past surgeries
- Previous injuries
- Pregnancy status
- Pain level scale (0-10)

### Body Mapping ✅ COMPLETED
Interactive body diagram:
- Front body view
- Back body view
- Select pain areas visually by clicking
- Pain intensity per area (0-10 scale)
- Color-coded visualization (green → yellow → red)
- 40+ anatomical regions

### Searchable Body Areas ✅ COMPLETED
Search functionality:
- Lower back → highlights lumbar regions
- Neck → highlights cervical region
- Traps → highlights trapezius/upper back
- Hamstrings → highlights posterior thigh
- Rotator cuff → highlights shoulder
- Synonym support for common terms

### Session Goals
Client selects goals:
- Relaxation
- Injury recovery
- Mobility improvement
- Sports recovery
- Stress relief
- Pain management
- Posture correction

### Notes ✅ COMPLETED
- Free text area for client notes
- Therapist can add additional notes
- History of all notes

### Consent (NOT STARTED - Deferred)
Digital consent forms:
- Terms acceptance
- Treatment consent
- Privacy policy acknowledgment
- Photo/video release (optional)
- Digital signature capture

### AI Processing ⚠️ PARTIALLY COMPLETE (Database ready, needs API integration)
System should summarize intake:
- Main pain points identified
- Recommended focus areas
- Risk alerts (contraindications)
- Treatment recommendations
- Pattern detection across clients

### Quick Stats (NOT STARTED - Deferred to Analytics)
Dashboard for therapists:
- "38% of clients report lower back pain"
- "Most common issue this month: neck tension"
- "Average pain level: 6.2/10"
- "Top 5 pain areas"

---

## Tasks

- [x] Build intake form UI ✅ **COMPLETED (Backend + Basic Frontend)**
- [x] Build body map selector ✅ **COMPLETED**
- [x] Build searchable anatomy system ✅ **COMPLETED**
- [x] Build note system ✅ **COMPLETED**
- [ ] Build consent module (Deferred to future stage)
- [ ] Build AI processing engine (Schema ready, needs API integration)
- [ ] Build therapist summary dashboard (Deferred to analytics stage)
- [ ] Build quick stats engine (Deferred to analytics stage)

---

## Priority

**CRITICAL** - Core CRM feature. ✅ Mostly complete.

---

## See Also

- [STAGE-2-CRM.md](./STAGE-2-CRM.md) - Implementation details
- [STAGE-7-AI.md](./STAGE-7-AI.md) - AI integration plans

---

# FEATURE 3 — Quick Call Intake Screen

## Status: NOT STARTED (0%)

## Purpose
Fast client capture during incoming phone calls to reduce data entry time and improve receptionist efficiency.

---

## Features

### Incoming Call Popup
- Automatic caller ID detection (if integrated with phone system)
- Display client info if existing
- Quick search if not auto-detected
- Popup overlay on current screen

### Detect Existing Client
- Search by phone number (automatic if caller ID)
- Search by name
- Search by email
- Display client profile if found

### Quick Create Client
If new client:
- Minimal form (name, phone, email)
- Add more details later
- Auto-save to database
- Link to call record

### Quick Edit Client
If existing client:
- Update phone/email
- Add quick notes
- Update preferences

### Add Appointment Instantly
- One-click "Book Appointment" button
- Pre-fill client info
- Select therapist and time
- Quick slot availability check
- Confirm and save

### Add Quick Notes
- Call reason field
- Notes from conversation
- Follow-up tasks
- Tag call (e.g., "booking", "inquiry", "complaint")

### Call Tagging
- Tag call type for analytics
- Track call outcomes
- Call duration tracking
- Call history per client

---

## Tasks

- [ ] Build call popup (triggered by phone integration or manual)
- [ ] Build quick-save client workflow
- [ ] Build existing client detection (search by phone)
- [ ] Build call notes interface
- [ ] Build quick appointment flow (from call screen)

---

## Priority

**Medium** - Useful for receptionists but not critical for MVP. Can be built post-launch based on user feedback.

---

# FEATURE 4 — Messaging & Intake Links

## Status: 100% COMPLETE ✅ (Stage 4)

## Purpose
Send intake forms, reminders, and messages to clients via SMS, WhatsApp, and email.

---

## Features ✅ ALL COMPLETED

### Send Intake Form Links
- Generate unique intake form link per client
- Send via:
  - SMS (Twilio)
  - WhatsApp (Meta Business API)
  - Email (SendGrid)
- Track form completion status

### Auto Reminders ✅ COMPLETED
- Appointment reminders (24 hours before)
- Configurable reminder timing
- Multi-channel support
- Automatic scheduling on appointment creation
- Cron job processes pending reminders

### Follow-ups
- Post-appointment follow-up messages
- Request feedback
- Encourage rebooking
- Send wellness tips

### One-click Resend
- Resend intake form if not completed
- Resend appointment reminder
- Resend confirmation

---

## Tasks

- [x] Build messaging center ✅ COMPLETED
- [x] Integrate Twilio ✅ COMPLETED
- [x] Integrate WhatsApp API ✅ COMPLETED
- [x] Build email templates ✅ COMPLETED
- [x] Build smart reminders ✅ COMPLETED

---

## Priority

**CRITICAL** - ✅ COMPLETED in Stage 4.

---

## See Also

- [STAGE-4-MESSAGING.md](./STAGE-4-MESSAGING.md) - Full implementation details

---

# FEATURE 5 — Calling System

## Status: NOT STARTED (0%)

## Purpose
Integrated calling functionality to make and receive calls from within the platform.

---

## Features

### Make Calls
- Click-to-call from client profile
- Click-to-call from appointment details
- Dial pad for manual dialing
- Recent calls quick access

### Receive Calls
- Incoming call notifications
- Automatic client lookup by caller ID
- Call forwarding to therapist's mobile
- Voicemail transcription

### Call History
- Log all calls automatically
- Call duration tracking
- Call recordings (optional, with consent)
- Notes from call
- Link calls to clients

### Client Linking
- Auto-link calls to client records
- View all calls per client
- Call timeline in client profile

### Optional Call Recording
- Record calls with consent
- Store recordings securely
- Playback in platform
- Auto-delete after X days (compliance)

---

## Tasks

- [ ] Integrate calling provider (Twilio Voice recommended)
- [ ] Build call UI (dial pad, incoming call screen)
- [ ] Build call history (log all calls)
- [ ] Build client linking (auto-match by phone number)
- [ ] Add optional recording system (with consent workflow)

---

## Priority

**Low-Medium** - Nice to have but can be deferred. Most clinics use regular phones. Integrate if specifically requested by customers.

---

## Technical Notes

**Twilio Voice API**:
- Programmable voice calls
- Caller ID
- Call recording
- Voicemail
- Call forwarding
- SIP integration

**Alternative**: Native device calling (simpler but less integrated)

---

# FEATURE 6 — Payments

## Status: NOT STARTED (0%) - NEXT UP (Stage 5)

## Purpose
Accept payments, generate invoices, track revenue, and manage memberships.

---

## Features

### Accept Payments
- Credit/debit card payments
- Apple Pay
- Google Pay
- Cash payments (manual entry)
- Check payments (manual entry)

### Stripe Integration
- Stripe Elements for card input
- Stripe Connect for multi-business
- Saved payment methods
- Automatic receipt emails

### Square Integration (Optional)
- Alternative to Stripe
- Better for in-person payments
- Square Terminal integration

### Invoices
- Generate invoices from appointments
- Customizable invoice templates
- Email invoices to clients
- PDF download
- Payment tracking

### Refunds
- Full refunds
- Partial refunds
- Refund reasons tracking
- Automatic Stripe refund processing

### Tips
- Add tip to payment
- Tip suggestions (15%, 20%, 25%)
- Custom tip amount
- Tip distribution (if multiple therapists)

### Memberships
- Monthly/annual memberships
- Automatic billing
- Membership benefits (discounts, included sessions)
- Usage tracking

---

## Tasks

- [ ] Build payments dashboard
- [ ] Integrate Stripe
- [ ] Build invoices
- [ ] Build refund system
- [ ] Build payment history

---

## Priority

**HIGH** - Critical for Stage 5. Enables full clinic operations.

---

## See Also

- [STAGE-5-PAYMENTS.md](./STAGE-5-PAYMENTS.md) - Detailed implementation plan

---

# FEATURE 7 — Appointment Scheduling

## Status: 60% COMPLETE ✅ (Calendar, Scheduling, Reminders DONE, Waitlist + Booking Frontend TODO)

## Purpose
Manage appointments, therapist schedules, and automate reminders.

---

## Features

### Calendar ✅ COMPLETED
- Week view (7-day grid)
- Day view (hourly timeline)
- Month view (future)
- Color-coded by status
- Filter by therapist
- Filter by status

### Drag/Drop Bookings (Deferred)
- Drag to reschedule appointments
- Drag to assign different therapist
- Real-time conflict checking

### Therapist Availability ✅ COMPLETED
- Set weekly schedule (different hours per day)
- Mark days unavailable
- Request time off
- Block specific time slots

### Repeat Appointments ✅ COMPLETED
- Daily recurrence
- Weekly recurrence (specific days)
- Monthly recurrence
- End by date or after N occurrences

### Waitlist (NOT STARTED - Post-MVP)
- Add clients to waitlist
- Auto-notify when slot opens
- Priority ordering
- Waitlist analytics

### Auto Reminders ✅ COMPLETED
- 24-hour reminder (configurable)
- SMS/WhatsApp/Email
- Template-based
- Automatic scheduling

### Booking Conflicts ✅ COMPLETED
- 4-layer conflict detection
- Prevent double-booking
- Check therapist availability
- Check time-off periods

### Online Booking Portal (API COMPLETE, Frontend TODO)
- Public booking page
- Available slots display
- Client registration
- Self-service booking
- Calendar sync

---

## Tasks

- [x] Build calendar UI ✅ COMPLETED
- [x] Build scheduling logic ✅ COMPLETED (includes recurring appointments)
- [x] Build reminder system ✅ COMPLETED (Infrastructure ready for Stage 4)
- [ ] Build waitlist (Post-MVP - not critical)
- [ ] Build online booking (API complete, optional frontend)

---

## Priority

**CRITICAL** - ✅ 60% complete (Stage 3). Remaining features are post-MVP.

---

## See Also

- [STAGE-3-SCHEDULING.md](./STAGE-3-SCHEDULING.md) - Full implementation details

---

# FEATURE 8 — Business Analytics Dashboard

## Status: NOT STARTED (0%)

## Purpose
Provide business owners with insights into revenue, bookings, and clinic performance.

---

## Features

### Revenue Analytics
- Total revenue (daily, weekly, monthly, yearly)
- Revenue by therapist
- Revenue by service type
- Revenue trends (line chart)
- Revenue growth %

### Bookings Analytics
- Total appointments
- Completed vs. cancelled
- No-show rate
- Booking trends
- Peak booking times

### Client Retention
- New clients vs. returning clients
- Retention rate %
- Client lifetime value
- Churn rate
- Inactive clients (no appointment in 90 days)

### Repeat Bookings
- Rebooking rate
- Average days between visits
- Clients who book regularly
- One-time clients

### Therapist Performance
- Revenue per therapist
- Sessions per therapist
- Client ratings (if enabled)
- Utilization rate
- Rebooking rate per therapist

### Popular Treatments
- Most booked services
- Service revenue breakdown
- Service trends
- Average duration per service

### Peak Hours
- Busiest days of week
- Busiest times of day
- Heatmap visualization
- Utilization by hour

### Conversion Rates
- Intake form completion rate
- Booking conversion rate
- Promotion conversion rate

---

## Tasks

- [ ] Build analytics dashboard
- [ ] Build reporting engine
- [ ] Build charts (revenue, bookings, retention)
- [ ] Build exports (CSV, PDF)
- [ ] Build KPI cards

---

## Priority

**HIGH** - Stage 6. Important for business owners to make data-driven decisions.

---

## See Also

- [STAGE-6-ANALYTICS.md](./STAGE-6-ANALYTICS.md) - Detailed implementation plan

---

# FEATURE 9 — Therapist Performance Dashboard

## Status: NOT STARTED (0%)

## Purpose
Provide therapists with insights into their own performance and client outcomes.

---

## Features

### Sessions Completed
- Total sessions (all time, this month, this week)
- Sessions trend chart
- Session goals (optional)

### Client Ratings (Optional)
- Average rating
- Rating distribution
- Recent feedback
- Improvement suggestions

### Retention Rate
- Clients who rebook with this therapist
- Retention rate %
- Comparison to clinic average

### Revenue Generated
- Total revenue attributed to this therapist
- Revenue trend
- Average per session
- Commission earned

### Rebooking %
- % of clients who book again
- Comparison to clinic average
- Rebooking time (days between visits)

### Average Session Length
- Actual vs. scheduled duration
- Overtime analysis
- On-time performance

### Notes Quality Score (Optional, AI-based)
- Completeness of SOAP notes
- AI quality assessment
- Improvement suggestions

---

## Tasks

- [ ] Build therapist dashboard
- [ ] Build performance metrics
- [ ] Build charts (revenue, sessions, retention)
- [ ] Build comparison system (vs. clinic average)

---

## Priority

**Medium** - Part of Stage 6 (Analytics). Can be built after business analytics.

---

## See Also

- [STAGE-6-ANALYTICS.md](./STAGE-6-ANALYTICS.md) - Analytics implementation

---

# FEATURE 10 — Client Profile Page

## Status: 50% COMPLETE ✅ (Profile, Timeline DONE, Documents + Progress TODO)

## Purpose
Comprehensive view of client information, history, and progress.

---

## Features

### Full Treatment History ✅ COMPLETED
- All past appointments
- Chronological timeline
- Filter by date range
- Filter by therapist

### Notes ✅ COMPLETED
- All treatment notes (SOAP)
- Therapist private notes
- Searchable
- Sortable

### Session Summaries ✅ COMPLETED (AI pending)
- AI-generated summaries (when AI integrated)
- Key takeaways from each session
- Treatment effectiveness

### Payments
- Payment history
- Outstanding invoices
- Payment methods saved
- Total spent

### Injuries ✅ COMPLETED
- Medical conditions tracked
- Injury history
- Current conditions
- Resolved conditions

### Preferences
- Preferred therapist
- Preferred time slots
- Pressure preference
- Temperature preference
- Music preference

### Communication History ✅ COMPLETED
- All messages sent/received
- Email history
- SMS history
- WhatsApp history

### Documents (NOT STARTED - Deferred)
- Upload insurance cards
- Upload medical documents
- Upload consent forms
- Upload before/after photos

### Progress Tracking (NOT STARTED - Deferred)
- Pain level trends
- Mobility improvements
- Range of motion tracking
- Before/after comparisons
- Progress photos
- Progress charts

---

## Tasks

- [x] Build client profile page ✅ **COMPLETED**
- [x] Build session timeline ✅ **COMPLETED**
- [ ] Build document uploads (Deferred to future stage)
- [ ] Build progress tracking (Deferred to analytics stage)

---

## Priority

**CRITICAL** - ✅ 50% complete (Stage 2). Core features done, enhancements deferred.

---

## See Also

- [STAGE-2-CRM.md](./STAGE-2-CRM.md) - Client profile implementation

---

# FEATURE 11 — Settings

## Status: NOT STARTED (0%)

## Purpose
Configure clinic settings, branding, notifications, and permissions.

---

## Features

### Clinic Settings
- Business name, address, phone
- Operating hours
- Time zone
- Currency
- Tax rate
- Cancellation policy
- Deposit requirements

### Branding
- Upload logo
- Color scheme customization
- Email template branding
- Invoice template branding

### Notifications
- Email notification preferences
- SMS notification preferences
- WhatsApp notification preferences
- Reminder timing configuration
- Notification templates

### Permissions
- Manage user roles
- Assign permissions
- Create custom roles (enterprise)
- View audit logs

### Intake Fields
- Customize intake form fields
- Add custom questions
- Required vs. optional fields
- Field ordering

### Templates
- Manage message templates
- Manage email templates
- Manage invoice templates
- Default templates

### Subscription Billing
- View current plan
- Upgrade/downgrade
- Payment method
- Billing history
- Usage statistics

### Staff Management
- Add/remove staff
- Assign roles
- Manage therapist profiles
- Deactivate users

---

## Tasks

- [ ] Build settings UI (tabbed interface)
- [ ] Build permissions system (role management)
- [ ] Build notification settings (configure channels and timing)
- [ ] Build branding controls (logo, colors, templates)

---

## Priority

**Medium** - Important but not MVP-critical. Can be built incrementally.

---

# HIGHLY RECOMMENDED EXTRA FEATURES

These are strongly recommended for competitive advantage.

---

# SOAP Notes System

## Status: 50% COMPLETE ✅ (Template DONE, AI assistance TODO)

## Purpose
Structured treatment notes following the industry-standard SOAP format.

---

## Features

### SOAP Template ✅ COMPLETED
- **S**ubjective - Client's description of symptoms
- **O**bjective - Therapist's observations
- **A**ssessment - Professional evaluation
- **P**lan - Treatment plan and recommendations

### AI Note Assistance (NOT STARTED)
- AI suggestions while typing
- Autocomplete medical terminology
- Format improvements
- Grammar checking
- Template suggestions

---

## Tasks

- [x] Build SOAP template ✅ COMPLETED (Stage 2)
- [ ] Build AI note assistance (Stage 7)

---

## Priority

**CRITICAL** - ✅ 50% complete. Template done, AI enhancement in Stage 7.

---

# AI Session Summary

## Status: 10% COMPLETE (Database ready, API integration TODO)

## Purpose
AI-powered summaries and treatment suggestions to reduce therapist workload.

---

## Features

### AI Summarizer ⚠️ PARTIALLY COMPLETE
- Auto-generate summary from SOAP notes
- 2-3 sentence concise summary
- Key takeaways
- Regenerate option

### Treatment Suggestions
- AI analyzes client history
- Suggests focus areas
- Recommends techniques
- Alerts for contraindications

### Follow-up Suggestions
- Recommended follow-up timing
- Home care instructions
- Exercise suggestions

### Rebooking Suggestions
- Optimal rebooking interval
- Suggested services
- Package recommendations

---

## Tasks

- [ ] Build AI summarizer ⚠️ **SCHEMA READY (Needs OpenAI/Claude integration)**
- [ ] Build treatment suggestions (Deferred - depends on AI summarizer)

---

## Priority

**HIGH** - Major differentiator. Complete in Stage 7.

---

## See Also

- [STAGE-2-CRM.md](./STAGE-2-CRM.md) - Database schema (10% complete)
- [STAGE-7-AI.md](./STAGE-7-AI.md) - AI integration plans

---

# Memberships & Packages

## Status: NOT STARTED (0%)

## Purpose
Offer memberships and session packages to improve revenue and client retention.

---

## Features

### Memberships
- Monthly memberships
- Annual memberships
- Membership tiers (Bronze, Silver, Gold)
- Included sessions per month
- Member-only discounts
- Auto-billing via Stripe

### Packages
- 5-pack, 10-pack, 20-pack
- One-time purchase
- Session tracking
- Expiry dates
- Package balance display

---

## Tasks

- [ ] Build memberships (Stage 5 - Payments)
- [ ] Build package tracking (Stage 5 - Payments)

---

## Priority

**MEDIUM-HIGH** - Part of Stage 5 (Payments).

---

## See Also

- [STAGE-5-PAYMENTS.md](./STAGE-5-PAYMENTS.md) - Memberships and packages implementation

---

# Consent & Legal Forms

## Status: NOT STARTED (0%)

## Purpose
Digital consent forms and liability waivers with electronic signatures.

---

## Features

### Digital Signatures
- Canvas for signature capture
- Save signature as image
- Timestamp and IP logging
- Legal validity

### Waiver Storage
- Store consent forms
- Store liability waivers
- Store privacy policy acceptance
- Secure storage
- Retrieve for audit

---

## Tasks

- [ ] Build digital signatures
- [ ] Build waiver storage

---

## Priority

**MEDIUM** - Important for legal compliance but can be deferred to post-MVP.

---

# Before/After Tracking

## Status: NOT STARTED (0%)

## Purpose
Track client progress over time to demonstrate treatment effectiveness.

---

## Features

### Pain Scale Tracking
- Track pain level at each visit
- Chart pain trends
- Before/after comparison
- Multiple pain areas tracking

### Mobility Tracking
- Range of motion measurements
- Flexibility tests
- Functional movements
- Progress photos

### Progress Charts
- Line charts (pain over time)
- Before/after comparison
- Multiple metrics on one chart
- Export charts as images

---

## Tasks

- [ ] Build progress tracking
- [ ] Build chart system

---

## Priority

**MEDIUM** - Part of Stage 6 (Analytics). Valuable for demonstrating treatment outcomes.

---

## See Also

- [INDEX.md](./INDEX.md) - Complete project index
- [00-PROJECT-OVERVIEW.md](./00-PROJECT-OVERVIEW.md) - Project vision
- Stage files for implementation details

---

**Last Updated**: May 2026
