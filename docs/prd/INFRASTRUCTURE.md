# Infrastructure & Technical Requirements

---

## Table of Contents
- [Security Requirements](#security-requirements)
- [Database Planning](#database-planning)
- [API Architecture](#api-architecture)
- [Mobile App Requirements](#mobile-app-requirements)
- [Web Dashboard Requirements](#web-dashboard-requirements)
- [DevOps & Deployment](#devops--deployment)
- [QA & Testing](#qa--testing)

---

# Security Requirements

## Overview

The platform must maintain HIPAA-inspired security practices and comply with privacy regulations (GDPR, Australian Privacy Act).

---

## Requirements

### 1. RBAC Permissions ✅ **COMPLETED (Stage 1)**

**What Was Built**:
- Role-based access control with 5 roles
- JWT authentication with Clerk
- Route-level guards
- Business data isolation
- Permission decorators

**Roles**:
- SUPER_ADMIN - Platform owner
- BUSINESS_OWNER - Clinic owner
- RECEPTIONIST - Front desk staff
- THERAPIST - Treatment provider
- CLIENT - End user

**Implementation**:
- `@Roles()` decorator on API endpoints
- `RolesGuard` validates permissions
- `BusinessGuard` enforces data isolation

---

### 2. Encrypted Sensitive Data (Deferred to Production)

**What To Build**:
- Encrypt PII at rest
- Encrypt sensitive fields (SSN, payment info)
- Encryption key management
- Field-level encryption

**Fields To Encrypt**:
- Social security numbers
- Payment card data (use Stripe, don't store)
- Medical record numbers
- Bank account information

**Technical Approach**:
- Use PostgreSQL pgcrypto extension
- Or application-level encryption (AES-256)
- Store encryption keys in secure vault (AWS KMS, Azure Key Vault)

**Status**: ⏸️ Deferred to production hardening

---

### 3. Audit Logs ✅ **COMPLETED (Stage 1)**

**What Was Built**:
- Comprehensive audit trail
- Logs all CRUD operations
- User action tracking
- Timestamp and user tracking

**What's Logged**:
- User login/logout
- Data creation
- Data updates
- Data deletion
- Permission changes
- Failed auth attempts

**Implementation**:
- Database triggers for automatic logging
- Audit table with JSON metadata
- Searchable audit log UI (future)

---

### 4. Secure Backups (Deferred to Production)

**What To Build**:
- Automated daily backups
- Encrypted backup storage
- Point-in-time recovery
- Backup testing/restoration
- Offsite backup storage

**Technical Approach**:
- PostgreSQL pg_dump automated
- Store in S3 with encryption
- Retention policy (30 days, then archive)
- Regular restoration tests

**Status**: ⏸️ Deferred to production deployment

---

## Additional Security Measures

### Authentication
- ✅ JWT tokens with short expiration (Stage 1)
- ✅ Refresh token rotation (Clerk)
- ⏸️ Multi-factor authentication (MFA) - Future
- ⏸️ Biometric login (mobile) - Future

### Network Security
- ⏸️ HTTPS only (enforce in production)
- ⏸️ Rate limiting on API endpoints
- ⏸️ DDoS protection (Cloudflare)
- ⏸️ WAF (Web Application Firewall)

### Data Privacy
- ✅ Business data isolation (Stage 1)
- ⏸️ Data retention policies
- ⏸️ Right to erasure (GDPR)
- ⏸️ Data export (GDPR)

---

## Tasks

- [x] Build RBAC permissions
- [ ] Encrypt sensitive data (Deferred to production)
- [x] Add audit logs
- [ ] Add secure backups (Deferred to production)

---

# Database Planning

## ✅ STATUS: COMPLETED (Stage 1)

---

## Database: PostgreSQL

**Why PostgreSQL?**:
- ACID compliant
- JSON support (flexible data)
- Full-text search
- Mature ecosystem
- Excellent performance

---

## ORM: Prisma

**Why Prisma?**:
- Type-safe queries
- Auto-generated types
- Migration system
- Great DX (Developer Experience)
- Next.js integration

---

## Schema Design ✅ **COMPLETED**

**Core Tables** (8 tables from Stage 1):
- User
- Business
- Client
- Therapist
- Appointment
- TreatmentNote
- TherapistNote
- MedicalCondition

**Additional Tables** (Stages 2-4):
- TherapistAvailability
- TherapistTimeOff
- AppointmentCancellation
- AppointmentReminder
- Conversation
- Message
- MessageTemplate
- CommunicationSettings
- IntakeFormTemplate
- IntakeForm

**See Stage Files** for complete schema details.

---

## Database Indexes

**Indexes Created**:
- `businessId` on all tables (data isolation)
- `userId`, `clientId`, `therapistId` (foreign keys)
- `createdAt`, `updatedAt` (sorting)
- `status` on Appointment (filtering)
- `email`, `phone` (searching)

**Future Indexes**:
- Full-text search on client names
- Composite indexes for common queries
- GiST index for location search (multi-location)

---

## Migrations ✅ **COMPLETED**

**Migration System**: Prisma Migrate

**Migrations Created**:
1. Initial schema (Stage 1)
2. CRM enhancements (Stage 2)
3. Scheduling schema (Stage 3)
4. Messaging schema (Stage 4)

**Best Practices**:
- Never edit existing migrations
- Always create new migration for changes
- Test migrations on staging first
- Backup before production migrations

---

## Seed Data ✅ **COMPLETED**

**Development Seeds**:
- Sample business
- Sample users (all roles)
- Sample clients
- Sample therapists
- Sample appointments

**Production Seeds**:
- Default message templates
- Default intake form templates
- System configuration

---

## Tasks

- [x] Design schema
- [x] Build migrations
- [x] Seed development data

---

# API Architecture

## ✅ STATUS: COMPLETED (Stage 1 Core)

---

## Backend: NestJS

**Why NestJS?**:
- Built on Express
- TypeScript native
- Modular architecture
- Built-in validation
- Swagger integration
- Dependency injection

---

## API Style: RESTful

**Endpoints Follow REST Conventions**:
- `GET /resource` - List
- `GET /resource/:id` - Get one
- `POST /resource` - Create
- `PATCH /resource/:id` - Update
- `DELETE /resource/:id` - Delete

---

## Validation ✅ **COMPLETED**

**DTOs with class-validator**:
```typescript
export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;
}
```

**Benefits**:
- Type-safe validation
- Auto-generated error messages
- Swagger documentation
- Reusable validators

---

## API Documentation ✅ **COMPLETED**

**Swagger at `/api/docs`**:
- Interactive API explorer
- Auto-generated from code
- Try requests in browser
- Schema definitions

**Example**:
```typescript
@ApiTags('clients')
@ApiBearerAuth()
@Controller('clients')
export class ClientsController {
  @Get()
  @ApiOperation({ summary: 'List clients' })
  @ApiResponse({ status: 200, type: [ClientDto] })
  async findAll() { ... }
}
```

---

## Error Handling

**Standardized Error Responses**:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "email must be a valid email address"
    }
  ]
}
```

**HTTP Status Codes**:
- 200 - Success
- 201 - Created
- 400 - Bad Request (validation error)
- 401 - Unauthorized
- 403 - Forbidden (RBAC)
- 404 - Not Found
- 500 - Internal Server Error

---

## Pagination

**Standard Pagination**:
```typescript
GET /clients?page=1&limit=20

Response:
{
  "data": [...],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

---

## Filtering & Sorting

**Query Parameters**:
```typescript
GET /appointments?therapistId=123&status=COMPLETED&sortBy=startTime&order=desc
```

---

## Tasks

- [x] Build REST APIs
- [x] Build validation
- [x] Build API docs

---

# Mobile App Requirements

## STATUS: NOT STARTED (0%)

---

## Platform Options

### Option 1: React Native Expo (Recommended)
- ✅ Shared codebase with web
- ✅ TypeScript
- ✅ Fast development
- ✅ OTA updates
- ❌ Some native features limited

### Option 2: Flutter
- ✅ High performance
- ✅ Beautiful UI
- ❌ Separate codebase (Dart)
- ❌ Larger team needed

**Recommendation**: React Native Expo for faster development and code sharing

---

## Requirements

### 1. Responsive Layouts (Not Started)

**What To Build**:
- Mobile-optimized screens
- Touch-friendly UI
- Adaptive layouts (phone/tablet)
- Dark mode support (optional)

---

### 2. Push Notifications (Not Started)

**What To Build**:
- Appointment reminders
- New message notifications
- Payment confirmations
- System alerts

**Technical Approach**:
- Firebase Cloud Messaging (FCM)
- OR Apple Push Notification Service (APNS)
- Notification permission handling
- Badge counters

---

### 3. Offline Caching (Not Started)

**What To Build**:
- Cache appointment schedule
- Cache client data
- Sync when online
- Conflict resolution

**Technical Approach**:
- AsyncStorage for React Native
- Redux Persist
- Background sync
- Optimistic updates

---

## Tasks

- [ ] Build responsive layouts
- [ ] Build push notifications
- [ ] Build offline caching

---

# Web Dashboard Requirements

## ✅ STATUS: COMPLETED (Stage 1)

---

## Platform: Next.js 14

**Why Next.js?**:
- React framework
- Server-side rendering
- App Router (latest)
- TypeScript support
- Vercel deployment

---

## Requirements

### 1. Dashboard Layouts ✅ **COMPLETED**

**What Was Built**:
- Role-based sidebar navigation
- Responsive layout
- Collapsible sidebar
- Breadcrumbs
- Page headers

**Layouts**:
- `DashboardLayout` - Main layout with sidebar
- `AuthLayout` - Login/register pages
- `PublicLayout` - Landing page (future)

---

### 2. Responsive Sidebar ✅ **COMPLETED**

**Features**:
- Role-based menu items
- Active state highlighting
- Mobile hamburger menu
- Icons for all menu items
- Collapsible on desktop

**Navigation Items**:
- Dashboard
- Appointments
- Clients
- Messages
- Payments (future)
- Analytics (future)
- Settings

---

### 3. Quick Actions ✅ **COMPLETED**

**Dashboard Quick Actions**:
- New Appointment
- New Client
- Send Message
- View Schedule

**Keyboard Shortcuts** (Future):
- `Ctrl/Cmd + K` - Quick search
- `Ctrl/Cmd + N` - New appointment
- `Ctrl/Cmd + /` - Show shortcuts

---

## Tasks

- [x] Build dashboard layouts
- [x] Build responsive sidebar
- [x] Build quick actions

---

# DevOps & Deployment

## STATUS: PARTIAL (43% Complete)

---

## Version Control ✅ **COMPLETED**

**Git Repository**: GitHub

**Branch Strategy**:
- `main` - Production
- `develop` - Development
- `feature/*` - Feature branches
- `hotfix/*` - Urgent fixes

**Commit Conventions**:
- `feat: Add new feature`
- `fix: Fix bug`
- `docs: Update documentation`
- `refactor: Refactor code`
- `test: Add tests`

---

## CI/CD ✅ **COMPLETED**

**GitHub Actions**:
- ✅ Run tests on push
- ✅ Lint code
- ✅ Build verification
- ⏸️ Deploy to staging (future)
- ⏸️ Deploy to production (future)

**Workflows**:
- `.github/workflows/test.yml`
- `.github/workflows/lint.yml`
- `.github/workflows/build.yml`

---

## Environments ✅ **COMPLETED**

**Environment Files**:
- `.env.local` - Local development
- `.env.staging` - Staging server (future)
- `.env.production` - Production server (future)

**Environment Variables**:
- Database URLs
- API keys (Stripe, Twilio, etc.)
- JWT secrets
- Feature flags

---

## Deployment (Future)

### Frontend Deployment
**Option 1: Vercel (Recommended)**:
- ✅ Zero config
- ✅ Auto preview deploys
- ✅ Edge caching
- ✅ Next.js optimized

**Option 2: Netlify**:
- ✅ Easy setup
- ✅ Form handling
- ❌ Less Next.js specific

### Backend Deployment
**Option 1: Railway**:
- ✅ Easy PostgreSQL
- ✅ Auto deploys
- ✅ Fair pricing

**Option 2: Render**:
- ✅ Free tier
- ✅ PostgreSQL included
- ❌ Slower cold starts

**Option 3: AWS/DigitalOcean**:
- ✅ Full control
- ❌ More complex setup

---

## Monitoring (Future)

**Error Tracking**:
- Sentry for error monitoring
- Log aggregation (Papertrail, Logtail)
- Performance monitoring (New Relic, Datadog)

**Uptime Monitoring**:
- UptimeRobot
- Pingdom
- StatusPage for status updates

---

## Tasks

- [x] Setup Git repository
- [x] Setup CI/CD
- [x] Setup environments
- [ ] Setup staging server (Deferred)
- [ ] Setup production server (Deferred)
- [ ] Setup backups (Deferred)
- [ ] Setup monitoring (Deferred)

---

# QA & Testing

## STATUS: MINIMAL (17% Complete)

---

## Unit Tests ✅ **PARTIAL**

**What Was Built**:
- Auth guard tests
- React hook tests
- Test setup with Jest

**What's Needed**:
- Service layer tests
- Controller tests
- Component tests
- Utility function tests

**Target Coverage**: 70%+

---

## Integration Tests (Not Started)

**What To Build**:
- API endpoint tests
- Database integration tests
- Authentication flow tests
- RBAC tests

**Tools**:
- Supertest for API testing
- Test database setup/teardown
- Fixtures and factories

---

## UI Testing (Not Started)

**What To Build**:
- Component tests (React Testing Library)
- Integration tests (Cypress/Playwright)
- Visual regression tests (Percy)

**Critical Flows To Test**:
- Login/logout
- Create appointment
- Create client
- Send message
- Process payment

---

## E2E Testing (Not Started)

**What To Build**:
- Full user journeys
- Multi-user scenarios
- Edge cases

**Tools**:
- Playwright (recommended)
- OR Cypress

---

## Security Testing (Not Started)

**What To Test**:
- SQL injection
- XSS attacks
- CSRF protection
- Authentication bypass
- RBAC violations

**Tools**:
- OWASP ZAP
- Burp Suite
- Security linters

---

## Load Testing (Not Started)

**What To Test**:
- API performance under load
- Database query performance
- Concurrent user handling

**Tools**:
- k6
- Apache JMeter
- Artillery

**Target**:
- 1000 concurrent users
- < 500ms average response time
- 99th percentile < 2s

---

## Tasks

- [x] Unit tests (Partial - auth guards and hooks)
- [ ] Integration tests (Deferred)
- [ ] UI testing (Deferred)
- [ ] Mobile testing (Deferred)
- [ ] Security testing (Deferred)
- [ ] Load testing (Deferred)

---

## See Also

- [INDEX.md](./INDEX.md) - Complete project index
- [00-PROJECT-OVERVIEW.md](./00-PROJECT-OVERVIEW.md) - Project vision
- Stage files for implementation details

---

**Last Updated**: May 2026
