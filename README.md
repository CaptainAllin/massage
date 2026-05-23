# Wellness CRM Platform

A complete practice management platform for massage therapists, chiropractors, physiotherapists, and wellness clinics. Manage appointments, clients, intake forms, treatment notes, payments, and analytics — all in one place.

## Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, TailwindCSS
- **Auth**: Supabase Auth (email/password, JWT, RLS)
- **Database**: Supabase PostgreSQL + Prisma ORM
- **Payments**: Stripe (subscriptions, saved methods, webhooks)
- **Messaging**: Twilio SMS, SendGrid email, WhatsApp Business
- **AI**: Anthropic Claude (SOAP assist, treatment suggestions, note summaries)
- **Telehealth**: Twilio Video
- **Storage**: Supabase Storage (4 buckets with RLS)
- **Monitoring**: Sentry, Supabase built-in logs

## Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **Supabase account** — [supabase.com](https://supabase.com)
- **Stripe account** (for payments)
- **Twilio account** (for SMS/WhatsApp/Video)
- **SendGrid account** (for email)
- **Anthropic API key** (for AI features)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. Note your **Project URL**, **anon key**, and **service role key** from Project Settings → API
3. Note your **JWT secret** from Project Settings → API → JWT Settings
4. Note your **database connection string** from Project Settings → Database

### 3. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example apps/web/.env.local
```

Required variables in `apps/web/.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Database (Supabase connection string)
DATABASE_URL=postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Twilio (SMS + WhatsApp + Video)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
TWILIO_WHATSAPP_FROM=whatsapp:+1...

# SendGrid (email)
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Anthropic (AI features)
ANTHROPIC_API_KEY=sk-ant-...

# Encryption (32-byte hex key for field-level encryption)
ENCRYPTION_KEY=your-32-byte-hex-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=/api
```

See `.env.example` for the full list of optional variables.

### 4. Run database migrations

```bash
cd packages/database
npx prisma migrate deploy
npx prisma generate
```

### 5. Apply Supabase security setup

Run these SQL files **in order** in the Supabase SQL Editor (Dashboard → SQL Editor):

1. `supabase-triggers.sql` — Auth→public.users sync triggers
2. `docs/supabase-rls.sql` — Row Level Security helper functions and policies
3. `docs/supabase-storage.sql` — Storage buckets and access policies

### 6. (Optional) Seed sample data

```bash
cd packages/database
npx prisma db seed
```

### 7. Start the development server

```bash
npm run dev
```

App runs at **http://localhost:3000**

## Authentication

This project uses **Supabase Auth** with email/password sign-in.

- Sign up at `/sign-up` — creates a Supabase auth user and a business record
- Sign in at `/sign-in`
- Sessions are cookie-based, managed by `@supabase/ssr` middleware
- API routes authenticate via `Authorization: Bearer <jwt>` headers
- `apps/web/middleware.ts` protects all non-public routes

**User roles:** `BUSINESS_OWNER`, `THERAPIST`, `RECEPTIONIST`, `CLIENT`

Auth helper functions in `apps/web/lib/api-auth.ts`:
- `requireAuth(req)` — validates JWT, auto-creates `public.users` row on first login
- `requireBusinessAccess(user, businessId)` — verifies the user belongs to the business

## Project Structure

```
/
├── apps/
│   └── web/                    # Next.js 14 app
│       ├── app/
│       │   ├── (auth)/         # /sign-in, /sign-up
│       │   ├── (dashboard)/    # Protected dashboard pages
│       │   ├── (public)/       # Public-facing pages (landing, booking)
│       │   └── api/            # API route handlers (~100 endpoints)
│       ├── components/         # React components
│       └── lib/
│           ├── api-auth.ts     # Server-side auth helpers
│           ├── api-client.ts   # Axios client with JWT interceptor
│           ├── encryption.ts   # AES-256-GCM field encryption
│           ├── storage.ts      # Supabase Storage utilities
│           └── supabase/       # Supabase client factories (browser + server)
├── packages/
│   ├── database/               # Prisma schema + migrations
│   ├── auth/                   # AuthProvider React context
│   ├── ui/                     # Shared UI components
│   ├── types/                  # Shared TypeScript types
│   └── config-*/               # ESLint, TypeScript, Tailwind configs
├── docs/
│   ├── api.md                  # API reference (all endpoints)
│   ├── pending.md              # Task backlog
│   ├── supabase-rls.sql        # RLS policies
│   └── supabase-storage.sql    # Storage bucket setup
├── supabase-triggers.sql       # Auth sync triggers
├── DEPLOYMENT.md               # Production deployment guide
└── CONTRIBUTING.md             # Development guidelines
```

## API

All endpoints are Next.js Route Handlers under `apps/web/app/api/`. See `docs/api.md` for the full reference.

Authentication: `Authorization: Bearer <supabase-jwt>` header on all protected endpoints.

## Design System

Wellness-focused color palette defined in `packages/config-tailwind`:

| Token | Hex | Use |
|-------|-----|-----|
| Sage Green | `#A8C3A0` | Primary actions |
| Warm Sand | `#E7D8C9` | Secondary backgrounds |
| Calm Cream | `#F7F4EE` | Page backgrounds |
| Dusty Eucalyptus | `#7C9A92` | Accents |
| Deep Charcoal | `#2F3437` | Text |
| Soft Lavender | `#C9BEDD` | Highlights |
| Muted Teal | `#6FA7A1` | Links |

Typography: **Poppins** (headings) · **Inter** (body)

## Development Commands

```bash
# Start dev server
npm run dev

# Build all packages
npm run build

# Lint
npm run lint

# Type check
npm run type-check

# Format
npm run format

# Database
cd packages/database
npx prisma migrate dev     # Create and apply migration
npx prisma migrate deploy  # Apply pending migrations
npx prisma generate        # Regenerate Prisma Client
npx prisma studio          # Open Prisma Studio
npx prisma db seed         # Seed database
```

## Testing

```bash
# Unit + integration tests (Jest)
npm run test

# E2E tests (Playwright)
npx playwright test

# Load tests (k6 — requires k6 installed)
k6 run __tests__/load/analytics-load.js
```

Test files:
- `__tests__/integration/` — Auth, appointments, payments (real DB)
- `__tests__/security/` — SQL injection, XSS, IDOR, RBAC bypass
- `e2e/` — Playwright: auth, booking, payments (desktop + mobile)
- `__tests__/load/` — k6 analytics load test

## Deployment

See `DEPLOYMENT.md` for full production deployment instructions (Vercel + Supabase).

## Troubleshooting

**Prisma Client errors**
```bash
cd packages/database && npx prisma generate
```

**Auth not working / session lost**
- Check that `SUPABASE_JWT_SECRET` matches your project's JWT secret
- Verify Supabase triggers are applied (`supabase-triggers.sql`)
- Check `apps/web/middleware.ts` — public routes must be listed in `publicRoutes`

**Port already in use**
```bash
lsof -ti:3000 | xargs kill -9
```

**Stripe webhooks not received locally**
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Contributing

See `CONTRIBUTING.md` for coding standards, git workflow, and PR process.

## License

Private project. All rights reserved.
