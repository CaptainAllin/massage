# Changelog

All notable changes to the Wellness CRM Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-01-20

### 🎉 Stage 1 - Foundation & Core Architecture - COMPLETED

This is the initial release of the Wellness CRM Platform with a complete foundation ready for feature development.

### Added - Infrastructure

#### Monorepo Structure
- **Turborepo** configuration with optimized build pipeline
- **Apps**: Web (Next.js 14)
- **Services**: API (NestJS)
- **Packages**: 7 shared packages (database, ui, auth, types, config-tailwind, config-eslint, config-typescript)
- **Workspaces**: npm workspaces for efficient dependency management

#### Frontend (Next.js 14)
- **App Router** with route groups: (auth), (dashboard), (public)
- **Landing page** with hero section and feature highlights
- **Authentication pages** using Clerk components with custom styling
- **Dashboard layout** with sidebar navigation and header
- **Empty state pages** for all core features:
  - Dashboard with stats cards and quick actions
  - Appointments
  - Clients
  - Intake Forms
  - Messages (coming soon)
  - Payments (coming soon)
  - Promotions (coming soon)
  - Analytics (coming soon)
  - Therapists
  - Settings
- **Responsive design** with mobile support and collapsible sidebar
- **React Query** integration for API state management
- **API client** with axios and authentication interceptors

#### Backend (NestJS)
- **Modular architecture** with 6 core modules
- **Authentication module** with Clerk JWT strategy
- **Users module** with profile management endpoints
- **Businesses module** with CRUD operations
- **Clients module** with soft delete support
- **Therapists module** with user linking
- **Appointments module** (structure only, full implementation in Stage 2B)
- **Prisma service** for database operations
- **Swagger documentation** at `/api/docs`
- **Health check endpoint** at `/api/v1/health`
- **Global validation pipe** with class-validator
- **CORS configuration** for frontend access

#### Database (PostgreSQL + Prisma)
- **8 core tables** with complete schema:
  - User (authentication and profile)
  - Business (clinic information)
  - Therapist (professional info)
  - Client (patient data)
  - Appointment (scheduling data)
  - IntakeForm (form submissions)
  - TreatmentNote (SOAP notes)
  - AuditLog (security audit trail)
- **Enums**: UserRole, AppointmentStatus
- **Relationships** with proper foreign keys and cascades
- **Indexes** on frequently queried fields
- **Seed script** for development data
- **Migration system** for schema evolution

#### Authentication & Security
- **Clerk integration** for user authentication
- **JWT authentication** with Passport strategy
- **5 user roles**: SUPER_ADMIN, BUSINESS_OWNER, RECEPTIONIST, THERAPIST, CLIENT
- **RBAC implementation**:
  - `JwtAuthGuard` for route protection
  - `RolesGuard` for role-based access
  - `@Roles()` decorator for endpoint protection
  - `@CurrentUser()` decorator for user context
  - `@Public()` decorator for public routes
- **Webhook handler** for Clerk user sync
- **Audit logging** system for security tracking
- **useRole hook** for frontend role checks

#### Design System
- **Wellness color palette**:
  - Sage Green (#A8C3A0) - Primary
  - Warm Sand (#E7D8C9) - Secondary
  - Calm Cream (#F7F4EE) - Background
  - Dusty Eucalyptus (#7C9A92) - Accent
  - Deep Charcoal (#2F3437) - Text
  - Soft Lavender (#C9BEDD) - Highlights
  - Muted Teal (#6FA7A1) - Links
- **Typography**:
  - Poppins for headings
  - Inter for body text
- **TailwindCSS configuration** package
- **UI component library** with 8 components:
  - Button (4 variants, 3 sizes, loading state)
  - Input (with label and error support)
  - Card (with header, title, content, footer)
  - Badge (5 variants)
  - Avatar (with fallback)
  - EmptyState (with icon, title, description, action)
  - Sidebar (role-based filtering, responsive)
  - Header (with title, actions, user menu)

#### DevOps & Quality
- **Docker Compose** for PostgreSQL 16
- **GitHub Actions** CI/CD pipeline:
  - Lint check
  - Type check
  - Build verification
  - Unit tests
- **Environment variable** templates
- **ESLint configuration** with TypeScript rules
- **Prettier configuration** for consistent formatting
- **Unit tests** for:
  - RolesGuard (RBAC enforcement)
  - useRole hook (frontend role checks)

### Added - Documentation

- **README.md** - Complete setup instructions and usage guide
- **SETUP_GUIDE.md** - Step-by-step verification with 10 comprehensive tests
- **CONTRIBUTING.md** - Code standards, best practices, and development guidelines
- **CHANGELOG.md** - This file
- **.env.example** - Environment variable template

### API Endpoints

#### Users
- `GET /api/v1/users/me` - Get current user profile
- `PATCH /api/v1/users/me` - Update user profile

#### Businesses
- `POST /api/v1/businesses` - Create business (BUSINESS_OWNER only)
- `GET /api/v1/businesses` - List businesses (role-filtered)
- `GET /api/v1/businesses/:id` - Get business details
- `PATCH /api/v1/businesses/:id` - Update business

#### Clients
- `POST /api/v1/clients` - Create client
- `GET /api/v1/clients` - List clients (business-filtered)
- `GET /api/v1/clients/:id` - Get client details
- `PATCH /api/v1/clients/:id` - Update client
- `DELETE /api/v1/clients/:id` - Soft delete client

#### Therapists
- `POST /api/v1/therapists` - Create therapist (BUSINESS_OWNER only)
- `GET /api/v1/therapists` - List therapists
- `GET /api/v1/therapists/:id` - Get therapist details
- `PATCH /api/v1/therapists/:id` - Update therapist

#### Appointments
- `GET /api/v1/appointments` - List appointments (placeholder)

#### Auth
- `POST /api/v1/webhooks/clerk` - Clerk webhook for user sync

### Technical Stack

- **Frontend**: Next.js 14.1.0, React 18.2.0, TypeScript 5.3.3
- **Backend**: NestJS 10.3.0, Node.js 20+
- **Database**: PostgreSQL 16, Prisma 5.8.1
- **Authentication**: Clerk 4.29.3
- **Styling**: TailwindCSS 3.4.1
- **State Management**: React Query 5.17.19
- **Build Tool**: Turborepo 1.12.4
- **Validation**: class-validator 0.14.0
- **API Documentation**: Swagger 7.1.17

### Infrastructure

- **Monorepo**: 3 apps/services + 7 shared packages
- **Total Files Created**: 100+
- **Lines of Code**: ~10,000+
- **Test Coverage**: Auth guards and hooks

### Known Limitations (By Design)

The following features are intentionally NOT included in Stage 1 and will be built in later stages:

- ❌ Appointment booking/calendar functionality (Stage 2B)
- ❌ Intake form builder and filling (Stage 2A)
- ❌ Body mapping interactive UI (Stage 2A)
- ❌ Messaging (SMS/WhatsApp/Email) (Stage 4)
- ❌ Payment processing (Stripe/Square) (Stage 5)
- ❌ Analytics dashboards (Stage 6)
- ❌ AI features (OpenAI integration) (Stage 7)
- ❌ SOAP notes system (Stage 2)
- ❌ Mobile app (React Native) (Future)
- ❌ Production deployment (Future)

### Getting Started

1. Install dependencies: `npm install`
2. Setup Clerk account and get API keys
3. Configure `.env` file
4. Start PostgreSQL: `docker-compose up -d`
5. Run migrations: `npm run db:migrate`
6. Start dev servers: `npm run dev`

See `README.md` for detailed setup instructions and `SETUP_GUIDE.md` for verification steps.

### Next Steps

**Recommended**: Proceed to **Stage 2A - Client Profiles + Intake Forms**

This stage will build the main competitive differentiator:
- Interactive body mapping
- Modern intake workflows
- Medical history capture
- Client timeline view

See `/docs/prd.md` for complete roadmap and feature planning.

---

## Release Notes Format

Future releases will follow this format:

### [Version] - YYYY-MM-DD

#### Added
- New features

#### Changed
- Changes to existing functionality

#### Deprecated
- Soon-to-be removed features

#### Removed
- Removed features

#### Fixed
- Bug fixes

#### Security
- Security updates

---

**Stage 1 Complete** ✅ | **Foundation Ready** 🚀 | **Next: Stage 2A** 🎯
