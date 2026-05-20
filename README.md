# Wellness CRM Platform

A complete practice management platform designed for massage therapists, chiropractors, physiotherapists, and wellness clinics. Built with modern technologies to provide a seamless experience for managing appointments, clients, intake forms, and treatment notes.

## 🚀 Current Status: Stage 1 (Foundation)

This is the **Stage 1 Foundation** release. It includes:

- ✅ Monorepo structure (Turborepo)
- ✅ Authentication system (Clerk)
- ✅ Role-based access control (RBAC)
- ✅ PostgreSQL database with Prisma ORM
- ✅ Next.js 14 frontend with wellness-focused design
- ✅ NestJS backend API
- ✅ Core navigation and empty state pages
- ✅ Local development environment

**What's NOT included yet** (coming in later stages):
- Appointment booking and calendar
- Intake form builder
- Body mapping
- Messaging (SMS/Email)
- Payment processing
- Analytics dashboards
- AI features

See `/docs/prd.md` for the complete product roadmap.

## 📋 Prerequisites

- **Node.js**: >= 20.0.0
- **npm**: >= 10.0.0
- **Docker**: Latest (for PostgreSQL)
- **Clerk Account**: Sign up at [clerk.com](https://clerk.com)

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
# Navigate to project directory
cd /Users/amit/Desktop/Apps/massage

# Install all dependencies
npm install
```

### 2. Setup Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/wellness_crm_dev?schema=public"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# API URLs
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
FRONTEND_URL=http://localhost:3000

# JWT Secret (generate a random 32+ character string)
JWT_SECRET=your_jwt_secret_min_32_characters
```

**Getting Clerk Keys:**
1. Sign up at [clerk.com](https://clerk.com)
2. Create a new application
3. Go to **API Keys** to find your publishable and secret keys
4. Go to **Webhooks** → Create Endpoint → Use `http://localhost:3001/api/v1/webhooks/clerk`
5. Subscribe to events: `user.created`, `user.updated`, `user.deleted`
6. Copy the webhook signing secret

### 3. Start PostgreSQL

```bash
# Start PostgreSQL with Docker Compose
docker-compose up -d

# Verify it's running
docker ps
```

### 4. Initialize Database

```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# (Optional) Seed database with sample data
npm run db:seed
```

### 5. Start Development Servers

```bash
# Start both web and API servers
npm run dev
```

This will start:
- **Frontend (Next.js)**: http://localhost:3000
- **API (NestJS)**: http://localhost:3001/api/v1
- **API Docs (Swagger)**: http://localhost:3001/api/docs

## 📁 Project Structure

```
/Users/amit/Desktop/Apps/massage/
├── apps/
│   └── web/                 # Next.js 14 frontend
│       ├── app/
│       │   ├── (auth)/      # Sign in/up pages
│       │   ├── (dashboard)/ # Protected dashboard routes
│       │   └── (public)/    # Landing page
│       ├── components/      # React components
│       └── lib/             # Utilities and API client
├── services/
│   └── api/                 # NestJS backend
│       └── src/
│           ├── auth/        # JWT strategy, guards, webhooks
│           ├── users/       # User management endpoints
│           ├── businesses/  # Business CRUD endpoints
│           ├── clients/     # Client management endpoints
│           └── therapists/  # Therapist management endpoints
├── packages/
│   ├── database/            # Prisma schema and migrations
│   ├── ui/                  # Shared React components
│   ├── auth/                # Auth utilities (useRole hook)
│   ├── types/               # Shared TypeScript types
│   ├── config-tailwind/     # TailwindCSS wellness theme
│   ├── config-eslint/       # ESLint configs
│   └── config-typescript/   # TypeScript configs
├── docs/
│   └── prd.md              # Product Requirements Document
├── docker-compose.yml       # PostgreSQL setup
├── turbo.json              # Turborepo configuration
└── package.json            # Root workspace config
```

## 🎨 Design System

The platform uses a wellness-focused color palette:

- **Sage Green** (#A8C3A0) - Primary actions
- **Warm Sand** (#E7D8C9) - Secondary backgrounds
- **Calm Cream** (#F7F4EE) - Page backgrounds
- **Dusty Eucalyptus** (#7C9A92) - Accents
- **Deep Charcoal** (#2F3437) - Text
- **Soft Lavender** (#C9BEDD) - Highlights
- **Muted Teal** (#6FA7A1) - Links

Typography:
- **Display/Headings**: Poppins
- **Body Text**: Inter

## 🔐 Authentication & Roles

The platform uses Clerk for authentication with 5 user roles:

1. **SUPER_ADMIN** - Platform administrators
2. **BUSINESS_OWNER** - Clinic owners (full access to their business)
3. **RECEPTIONIST** - Front desk staff (scheduling, clients, messages)
4. **THERAPIST** - Practitioners (appointments, clients, treatment notes)
5. **CLIENT** - Patients (view appointments, complete intake forms)

### Setting User Roles in Clerk

After a user signs up, set their role in Clerk:
1. Go to Clerk Dashboard → Users
2. Select the user
3. Edit **Public metadata**
4. Add: `{ "role": "BUSINESS_OWNER" }`

## 📚 API Documentation

Once the API server is running, visit:
- **Swagger UI**: http://localhost:3001/api/docs

### Core Endpoints

**Users**
- `GET /api/v1/users/me` - Get current user profile
- `PATCH /api/v1/users/me` - Update profile

**Businesses**
- `POST /api/v1/businesses` - Create business (BUSINESS_OWNER only)
- `GET /api/v1/businesses` - List businesses
- `GET /api/v1/businesses/:id` - Get business details
- `PATCH /api/v1/businesses/:id` - Update business

**Clients**
- `POST /api/v1/clients` - Create client
- `GET /api/v1/clients` - List clients
- `GET /api/v1/clients/:id` - Get client details
- `PATCH /api/v1/clients/:id` - Update client
- `DELETE /api/v1/clients/:id` - Soft delete client

**Therapists**
- `POST /api/v1/therapists` - Create therapist (BUSINESS_OWNER only)
- `GET /api/v1/therapists` - List therapists
- `GET /api/v1/therapists/:id` - Get therapist details
- `PATCH /api/v1/therapists/:id` - Update therapist

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov
```

## 🔨 Development Commands

```bash
# Install dependencies
npm install

# Start development servers (web + api)
npm run dev

# Build all packages
npm run build

# Run linter
npm run lint

# Run type check
npm run type-check

# Format code
npm run format

# Database commands
npm run db:generate    # Generate Prisma Client
npm run db:migrate     # Run migrations
npm run db:studio      # Open Prisma Studio
npm run db:push        # Push schema changes (dev only)
npm run db:seed        # Seed database

# Clean all build artifacts
npm run clean
```

## 🐳 Docker Commands

```bash
# Start PostgreSQL
docker-compose up -d

# Stop PostgreSQL
docker-compose down

# View logs
docker-compose logs -f postgres

# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d
npm run db:migrate
```

## 🚢 Deployment

Deployment instructions will be added in a future stage. For now, the platform is designed for local development.

## 🤝 Contributing

This is a private project. For the full product roadmap, see `/docs/prd.md`.

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured with recommended rules
- **Prettier**: Automatic code formatting
- **Commit Messages**: Use conventional commits format

### Branching Strategy

- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - Feature branches
- `fix/*` - Bug fix branches

## 📝 License

Private project. All rights reserved.

## 🆘 Troubleshooting

### PostgreSQL connection errors

```bash
# Check if PostgreSQL is running
docker ps

# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### Prisma Client errors

```bash
# Regenerate Prisma Client
npm run db:generate

# If migrations are out of sync
npm run db:push
```

### Port already in use

```bash
# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001 (API)
lsof -ti:3001 | xargs kill -9
```

### Clerk webhook not receiving events

1. Make sure your API server is running on port 3001
2. For local development, use a tool like [ngrok](https://ngrok.com) or [localtunnel](https://localtunnel.github.io/www/) to expose your local server
3. Update the webhook URL in Clerk Dashboard with the public URL

## 📞 Support

For questions or issues, refer to the PRD at `/docs/prd.md` or check the inline code documentation.

---

**Stage 1 Foundation Complete** ✅

Next up: **Stage 2A - Client Profiles + Intake Forms** 🎯
