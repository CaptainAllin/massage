# STAGE 8 — Advanced Features

## STATUS: IN PROGRESS (8% - 1/12 features complete)

**Started**: May 21, 2026
**Last Updated**: May 21, 2026

---

## Overview

This stage contains advanced features that go beyond MVP scope. These features provide additional value for established clinics and enterprise customers. Most are post-MVP and should only be built after core features are validated with users.

**Priority Level**: MEDIUM (Post-MVP)

---

## Goals

- Provide enterprise-level features
- Enable multi-location clinic management
- Add telehealth capabilities
- Support advanced workflows
- Differentiate from competitors at scale

---

## Features (Post-MVP)

### 1. Voice Notes / Voice-to-Text ✅ **COMPLETED**

**Status**: ✅ IMPLEMENTED (May 21, 2026)

**What Was Built**:
- ✅ Record voice notes during sessions
- ✅ Convert voice to text using speech recognition
- ✅ Generate SOAP notes from voice recordings
- ✅ Search voice notes by content

**Use Case**:
- Therapist records observations during treatment
- AI transcribes and formats into SOAP structure
- Saves time vs. typing notes

**Technical Implementation**:
- ✅ Audio recording in browser (Web Audio API)
- ✅ OpenAI Whisper API for speech-to-text
- ✅ Supabase Storage for audio files
- ✅ AI-powered voice-to-SOAP conversion
- ✅ Full-text search in transcriptions
- ✅ Automated cleanup (90-day retention)
- ✅ Cost tracking and usage limits ($50/month)

**Actual Effort**: 6 days (within estimate)

**Files Created**: 27 files (15 backend, 9 frontend, 3 docs/tests)

**See Also**:
- Implementation details: `/TESTING_REPORT.md`
- Testing checklist: `/VOICE_NOTES_TESTING_CHECKLIST.md`

---

### 2. Telehealth / Video Consultations

**What To Build**:
- Video call integration for consultations
- Screen sharing
- Session recording (with consent)
- Post-consultation notes
- Payment integration

**Use Cases**:
- Initial consultations
- Follow-up check-ins
- Remote wellness coaching
- Exercise guidance

**Technical Requirements**:
- WebRTC for video calls
- OR integrate Zoom/Twilio Video
- HIPAA-compliant video platform
- Session recording storage
- Consent management

**Estimated Effort**: 10-14 days

---

### 3. Insurance Claims Management

**What To Build**:
- Insurance provider database
- Claim form generation
- Claim submission tracking
- Reimbursement tracking
- EOB (Explanation of Benefits) parsing

**Use Cases**:
- Clinics that accept insurance
- Automated claim filing
- Track claim status
- Manage reimbursements

**Technical Requirements**:
- Insurance provider API integrations
- Claim form templates (CMS-1500, etc.)
- OCR for EOB parsing
- Claim status tracking

**Estimated Effort**: 14-21 days (complex)

**Note**: This is complex and region-specific. Low priority unless targeting medical clinics.

---

### 4. Payroll System

**What To Build**:
- Track therapist hours
- Commission calculation
- Payroll reports
- Integration with accounting software
- Tax reporting

**Use Cases**:
- Automatic commission calculation
- Track therapist earnings
- Generate pay stubs
- Export to QuickBooks/Xero

**Technical Requirements**:
- Time tracking
- Commission rules engine
- Tax calculation
- Payroll report generation
- Accounting software integration

**Estimated Effort**: 10-14 days

**Note**: Consider integrating with existing payroll services (Gusto, ADP) instead of building custom.

---

### 5. Inventory Management

**What To Build**:
- Product catalog (oils, lotions, supplies)
- Stock tracking
- Low stock alerts
- Purchase orders
- Supplier management
- Retail sales integration

**Use Cases**:
- Track massage oils, lotions
- Manage retail products
- Auto-reorder when low
- Link products to treatments

**Technical Requirements**:
- Inventory model
- Stock adjustment tracking
- Purchase order workflow
- Barcode scanning (optional)
- Retail POS integration

**Estimated Effort**: 7-10 days

---

### 6. Multi-Location Support

**What To Build**:
- Multiple clinic locations per business
- Location-specific settings
- Cross-location reporting
- Staff assignment by location
- Location-specific availability
- Client preferred location

**Use Cases**:
- Clinic chains with multiple locations
- Franchise management
- Regional reporting
- Transfer clients between locations

**Database Schema**:
```typescript
Location {
  id: string
  businessId: string
  name: string
  address: string
  phone: string
  email: string
  timezone: string
  isActive: boolean
  createdAt: DateTime
  updatedAt: DateTime
}

// Add locationId to relevant tables:
- Therapist (can work at multiple locations)
- Appointment
- Client (preferred location)
- Payment
```

**Estimated Effort**: 7-10 days

---

### 7. Advanced Automation

**What To Build**:
- Workflow automation builder
- Trigger-based actions
- Custom automation rules
- Multi-step workflows

**Examples**:
- When appointment is booked → Send confirmation → Add to calendar → Send reminder 24h before
- When client hasn't booked in 30 days → Send re-engagement email
- When therapist completes 10 sessions → Send performance review notification

**Technical Requirements**:
- Workflow engine
- Trigger system
- Action system
- Visual workflow builder (drag-and-drop)

**Estimated Effort**: 14-21 days (complex)

**Note**: This is advanced. Consider using tools like Zapier integration instead.

---

### 8. Enterprise Features

**What To Build**:

**1. White-Label Solution**:
- Custom branding (logo, colors, domain)
- Remove platform branding
- Custom email templates
- Custom mobile app (optional)

**2. API Access**:
- RESTful API for integrations
- Webhooks for events
- API documentation (Swagger)
- API keys and rate limiting

**3. SSO (Single Sign-On)**:
- SAML integration
- Azure AD integration
- Google Workspace integration
- Custom identity providers

**4. Advanced RBAC**:
- Custom roles
- Permission groups
- Department-based access
- Audit logs for compliance

**5. SLA & Support**:
- Priority support
- Dedicated account manager
- Custom SLA agreements
- 24/7 support (for enterprise tier)

**Estimated Effort**: 21-30 days (varies by feature)

---

### 9. Gift Cards

**What To Build**:
- Gift card purchase
- Gift card redemption
- Balance tracking
- Expiry handling
- Gift card reports

**Technical Requirements**:
- GiftCard model
- Unique code generation
- Stripe integration for purchases
- Redemption at checkout
- Email delivery

**Estimated Effort**: 3-5 days

---

### 10. Loyalty Program

**What To Build**:
- Points system
- Rewards tiers
- Point accumulation rules
- Reward redemption
- Loyalty dashboard for clients

**Examples**:
- Earn 1 point per $1 spent
- 100 points = $10 discount
- Tiers: Bronze, Silver, Gold (increasing benefits)

**Technical Requirements**:
- Loyalty model
- Points calculation engine
- Redemption workflow
- Client loyalty dashboard

**Estimated Effort**: 5-7 days

---

### 11. Therapist Marketplace

**What To Build**:
- Independent therapists can list services
- Clients can book from marketplace
- Revenue sharing model
- Therapist verification
- Reviews and ratings

**Use Cases**:
- Platform model (like Uber for massage)
- Independent contractors
- Find therapists in your area

**Technical Requirements**:
- Marketplace discovery
- Therapist profiles
- Rating/review system
- Revenue split calculation
- Payment routing (Stripe Connect)

**Estimated Effort**: 21-30 days (very complex)

**Note**: This changes the entire business model. Only pursue if pivoting to marketplace.

---

### 12. Wearable Integrations

**What To Build**:
- Apple Health integration
- Google Fit integration
- Fitbit integration
- Garmin integration
- View client's health data (with consent)

**Use Cases**:
- See client's sleep patterns
- View activity levels
- Track heart rate
- Correlate with treatment effectiveness

**Technical Requirements**:
- OAuth integrations with each platform
- Health data APIs
- Data visualization
- Privacy/consent management

**Estimated Effort**: 10-14 days (varies by platform)

**Note**: High privacy concerns. Ensure HIPAA compliance.

---

## Tasks

These tasks are deferred to post-MVP:

### 1. Voice & Telehealth Features
- [x] 1.1 Build voice-to-text notes ✅ **COMPLETED** (May 21, 2026)
- [ ] 1.2 Integrate telehealth/video consultations

### 2. Financial Features
- [ ] 2.1 Build insurance claims system
- [ ] 2.2 Integrate payroll
- [ ] 2.3 Build gift cards
- [ ] 2.4 Build loyalty program

### 3. Operations Features
- [ ] 3.1 Build inventory management
- [ ] 3.2 Add multi-location support
- [ ] 3.3 Build automation engine

### 4. Enterprise Features
- [ ] 4.1 White-label solution
- [ ] 4.2 SSO (Single Sign-On)
- [ ] 4.3 API access for integrations
- [ ] 4.4 Advanced RBAC with custom roles

### 5. Platform Expansion
- [ ] 5.1 Build therapist marketplace (if pivoting)
- [ ] 5.2 Integrate wearables (Apple Health, Fitbit, etc.)

**Total**: 5 main categories, 14 subtasks (all deferred to post-MVP)

---

## Prioritization

**IF building post-MVP features, build in this order:**

### Tier 1 (Moderate Priority - Consider for v2)
1. **Multi-location support** - For growing clinic chains
2. **Gift cards** - Easy revenue generator
3. **Loyalty program** - Improves retention
4. **Inventory management** - Requested by many clinics

### Tier 2 (Lower Priority - Build if requested)
5. **Telehealth** - Useful but not core
6. **Voice notes** - Nice-to-have for therapists
7. **Payroll** - Consider integration instead
8. **Advanced automation** - Consider Zapier integration instead

### Tier 3 (Only if Specifically Needed)
9. **White-label** - For enterprise deals
10. **SSO** - For enterprise deals
11. **Insurance claims** - Region-specific, complex
12. **Wearables** - Privacy concerns, niche

### Tier 4 (Pivot Required)
13. **Therapist marketplace** - Changes entire business model

---

## Integration with MVP Stages

### Stage 5 Integration (Payments)
- 🔜 Gift cards integrate with payment system
- 🔜 Loyalty points affect invoice totals

### Stage 6 Integration (Analytics)
- 🔜 Multi-location reports
- 🔜 Inventory analytics
- 🔜 Loyalty program effectiveness

### Stage 7 Integration (AI)
- 🔜 AI with voice-to-text notes
- 🔜 AI analyzes wearable data
- 🔜 AI optimizes automation workflows

---

## RBAC Considerations

Most advanced features require new permissions:

**Location Manager** (new role):
- Manage single location
- View location-specific reports
- Cannot see other locations

**Enterprise Admin** (new role):
- Manage white-label settings
- Configure SSO
- Manage API keys
- View all locations

---

## Success Criteria

Advanced features should only be built if:

- [ ] MVP is stable and validated
- [ ] Core features are being used regularly
- [ ] Customers specifically request the feature
- [ ] Feature aligns with product vision
- [ ] ROI is positive (feature pays for itself)

---

## See Also

- [INDEX.md](./INDEX.md) - Complete project index
- [STAGE-7-AI.md](./STAGE-7-AI.md) - Previous stage (AI)
- [00-PROJECT-OVERVIEW.md](./00-PROJECT-OVERVIEW.md) - Project vision (lists future ideas)

---

**Stage 8 Status**: IN PROGRESS (8% complete - 1/12 features done)
**Completed Features**: Voice-to-Text Notes (Task 1.1)
**Priority**: MEDIUM (build selectively based on customer demand)
**Recommendation**: Voice notes feature ready for testing; other features await customer feedback

**Latest Update** (May 21, 2026):
- ✅ Voice-to-Text Notes fully implemented
- 📊 Comprehensive testing report created
- 🧪 Unit tests written
- 📋 100+ point testing checklist provided
- ⏭️ Ready for runtime testing and deployment
