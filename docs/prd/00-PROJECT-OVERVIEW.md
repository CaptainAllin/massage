# Wellness CRM & Practice Management Platform
## Project Overview & Strategic Vision

---

## Table of Contents
- [Project Goal](#project-goal)
- [Product Vision](#product-vision)
- [Suggested Tech Stack](#suggested-tech-stack)
- [Design System](#design-system)
- [User Roles](#user-roles)
- [Success Metrics](#success-metrics)
- [Business Strategy](#business-strategy)
- [Competitive Advantages](#competitive-advantages)
- [Monetization Model](#monetization-model)
- [What NOT To Build Early](#what-not-to-build-early)
- [Development Roadmap](#development-roadmap)
- [Long-Term Vision](#long-term-vision)

---

# 1. Project Goal

Build a modern cross-platform CRM and practice management platform for:

- Massage Clinics
- Massage Therapists
- Chiropractors
- Physiotherapists
- Osteopaths
- Wellness Clinics
- Rehabilitation Clinics

The platform must work on:

- Web Browser (Desktop/Laptop)
- iOS App
- Android App
- Tablet Responsive Layout

The platform should feel:

- Calm
- Modern
- Minimal
- Nurturing
- Relaxing
- Easy to use
- Fast
- Professional
- Non-overwhelming

---

# 2. Product Vision

Most clinic software feels:

- Old
- Complicated
- Corporate
- Medical
- Stressful
- Hard to navigate

This platform should instead feel like:

- Apple-level simplicity
- Calm wellness atmosphere
- Fast workflow
- Beautiful UI
- Easy for older therapists to use
- Easy for receptionists
- Easy for patients

Core focus:

- Reduce admin work
- Improve therapist workflow
- Improve patient experience
- Increase bookings and retention
- Centralize clinic operations

---

# 3. Suggested Tech Stack

## Frontend

### Web
- Next.js
- React
- TailwindCSS
- TypeScript

### Mobile
- React Native Expo
OR
- Flutter

Recommendation:
Use React Native Expo for faster shared codebase.

---

## Backend
- Node.js
- NestJS OR Express
- PostgreSQL
- Prisma ORM

---

## Authentication
- Firebase Auth
OR
- Auth0

---

## Cloud / Hosting
- Vercel (Frontend)
- Railway / Render / AWS (Backend)
- Supabase optional

---

## Payments
- Stripe
- Square
- Apple Pay
- Google Pay

---

## Messaging
- Twilio
- WhatsApp API
- SendGrid

---

## Calls
- Twilio Voice API
OR
- Native device dialer integration

---

# 4. Design System

## Color Scheme

### Primary Colors

#### Soft Sage Green
HEX: #A8C3A0

#### Warm Sand
HEX: #E7D8C9

#### Calm Cream
HEX: #F7F4EE

#### Dusty Eucalyptus
HEX: #7C9A92

#### Deep Charcoal
HEX: #2F3437

---

### Accent Colors

#### Soft Lavender
HEX: #C9BEDD

#### Muted Teal
HEX: #6FA7A1

---

## Typography

### Recommended Fonts

#### Headings
- Poppins
OR
- Nunito

#### Body
- Inter
OR
- DM Sans

---

## UI/UX Design Principles

### Design Rules

- Large touch targets
- Minimal clicks
- Simple navigation
- Clean whitespace
- Rounded corners
- Soft shadows
- Calm animations
- Fast loading
- Easy readability
- Avoid clutter
- Avoid medical-looking UI

---

### UX Philosophy

#### Core Rule

The app should reduce stress.

Every interaction should feel:
- smooth
- fast
- calming
- intentional

#### Every screen should answer:

1. What is this?
2. What do I do next?
3. Can I finish this quickly?

#### Avoid:
- Clutter
- Tiny buttons
- Complex workflows
- Too many menus

#### Target:
- Max 3 clicks for major actions

---

# 5. User Roles

## Roles

### Super Admin
Platform owner access.

### Business Owner
Clinic owner access.

### Receptionist
Front desk staff.

### Therapist
Massage therapist / physio / chiropractor.

### Client / Patient
End user.

---

# 6. Success Metrics

## Business KPIs

- Daily active clinics
- Monthly recurring revenue
- Booking increase %
- Retention increase %
- Reduced admin time
- Therapist satisfaction

---

# 7. Business Strategy

## Main Market Opportunity

Current clinic software is:
- ugly
- outdated
- hard to use
- too clinical
- slow
- overwhelming

This platform should focus on:
- calm design
- easy workflows
- therapist-first UX
- emotional experience
- automation
- simplicity

---

# 8. Main Competitive Advantages

## DIFFERENTIATORS

### 1. Wellness-first UI
Most competitors look like accounting software.

This should feel:
- calming
- modern
- luxurious
- nurturing

---

### 2. Body Mapping
Visual pain selection is a huge opportunity.

This should become a core feature.

---

### 3. AI Assistance
Most clinics spend large time on notes.

AI can:
- summarize
- recommend
- organize
- automate

---

### 4. Simplicity
Many competitors are overloaded.

Goal:
Maximum power with minimum complexity.

---

# 9. Monetization Model

## SaaS Subscription

### Suggested Pricing

#### Solo Therapist
$29/month

#### Small Clinic
$99/month

#### Multi-location Clinic
$299+/month

---

## Additional Revenue Streams

### Future Add-ons

- SMS usage fees
- AI credits
- Telehealth add-on
- Premium analytics
- Marketing automation
- Payroll
- Insurance integrations

---

# 10. What NOT To Build Early

## DO NOT OVERBUILD THE MVP

Avoid building:

- Payroll
- Insurance claims
- Inventory management
- Enterprise reporting
- Complex automation
- Marketplace systems
- Wearable integrations

These can massively slow development.

---

# 11. Development Roadmap

## MVP BUILD ORDER

Focus on building a stable MVP first.

Goal:
Launch early → get clinics using it → collect feedback → improve gradually.

### Build Priority (Stages)

1. **STAGE 1**: Foundation & Core Architecture ✅ COMPLETED
2. **STAGE 2**: Core CRM System ✅ ~90% COMPLETED
3. **STAGE 3**: Scheduling & Calendar ✅ COMPLETED
4. **STAGE 4**: Messaging & Communication ✅ COMPLETED
5. **STAGE 5**: Payments & Billing (NEXT)
6. **STAGE 6**: Analytics & Business Intelligence
7. **STAGE 7**: AI & Smart Features
8. **STAGE 8**: Advanced Features

See [INDEX.md](./INDEX.md) for detailed task tracking.

---

# 12. Recommended Navigation Structure

## Main Sidebar

- Dashboard
- Appointments
- Clients
- Intake Forms
- Messages
- Payments
- Promotions
- Analytics
- Therapists
- Settings

---

## Mobile Navigation

- Home
- Calendar
- Clients
- Messages
- More

---

# 13. Suggested Core Screens

## IMPORTANT FIRST SCREENS

### Reception Dashboard
Quick actions:
- New booking
- Incoming calls
- Client search
- Calendar
- Payments

---

### Therapist Dashboard
- Today's appointments
- Client notes
- Quick SOAP notes
- AI recommendations

---

### Client Intake Screen
- Body map
- Symptoms
- History
- Goals
- Consent

---

### Business Analytics Dashboard
- Revenue
- Retention
- Therapist KPIs
- Growth metrics

---

# 14. Technical Architecture Advice

## VERY IMPORTANT

Build:
- modular architecture
- reusable components
- scalable APIs

DO NOT tightly couple:
- frontend
- backend
- AI services
- payment services

Use service layers everywhere.

---

## Recommended Folder Structure

```
/apps
  /web
  /mobile

/packages
  /ui
  /api
  /database
  /types

/services
  /payments
  /messaging
  /analytics
  /ai
```

---

# 15. AI Features For Future Versions

## Future AI Possibilities

- Voice-to-SOAP notes
- AI receptionist
- AI appointment booking
- AI treatment suggestions
- AI client retention predictions
- AI therapist productivity scoring
- AI-generated home exercises

---

# 16. Long-Term Vision

Goal:
Become the "modern wellness operating system" for clinics.

Not just:
- bookings
- payments
- notes

But:
- clinic operations
- therapist productivity
- client wellness tracking
- automation
- AI wellness assistance

---

# 17. Important Notes for Developers

## MUST PRIORITIZE

- Performance
- Simple UX
- Fast workflows
- Mobile-first responsiveness
- Accessibility
- Security
- Scalability

## NEVER

- Overcomplicate forms
- Add unnecessary clicks
- Use harsh colors
- Use overwhelming dashboards

---

# 18. Recommended Immediate Next Steps

## BEFORE CODING

### STEP 1
Finalize:
- App name
- Branding
- Colors
- Fonts

### STEP 2
Design:
- Navigation structure
- Main screens
- User flow
- Mobile layouts

### STEP 3
Design database schema.

### STEP 4
Design API architecture.

### STEP 5
Build reusable UI system.

### STEP 6
Start MVP development.

---

# 19. Future Expansion Ideas

## Potential Features

- AI treatment recommendations
- Voice-to-notes
- Insurance claims
- Payroll
- Therapist marketplace
- Telehealth/video consultations
- Smart wearable integrations
- Apple Health integration
- Google Fit integration
- Multi-location clinics
- Inventory management
- Gift cards
- Loyalty program

---

**See Also:**
- [INDEX.md](./INDEX.md) - Complete task index and progress tracking
- [INFRASTRUCTURE.md](./INFRASTRUCTURE.md) - Security, database, API, DevOps requirements
- Stage-specific files for detailed implementation plans
