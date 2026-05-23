# Deployment Guide — Wellness CRM

## Architecture

| Layer | Service | Notes |
|-------|---------|-------|
| Frontend + API | Vercel | Next.js app + API routes |
| Database | Supabase | Postgres + Auth + Storage + RLS |
| Error monitoring | Sentry | Client + server error tracking |
| Email | Resend | Transactional emails |
| Payments | Stripe | Webhooks via Vercel endpoint |

No separate API server is needed — all backend logic runs as Next.js API routes on Vercel.

---

## Environments

| Environment | Branch | URL | Supabase project |
|-------------|--------|-----|-----------------|
| Local dev | any | `http://localhost:3000` | dev project |
| Preview (staging) | pull requests | Vercel preview URL | staging project |
| Production | `main` | `https://your-domain.vercel.app` | prod project |

---

## One-time Setup

### 1. Vercel Project

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` inside `apps/web/` and follow the prompts
3. Note down `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` (shown after linking)
4. Create a Vercel API token at **Vercel → Settings → Tokens**

### 2. Supabase Projects

Create two Supabase projects: **staging** and **production**.

For each project, run the setup steps from `SETUP_GUIDE.md`:
- Apply all Prisma migrations: `prisma migrate deploy`
- Deploy database triggers from `supabase-triggers.sql`
- Enable RLS and apply policies from `docs/supabase-rls.sql`
- Create the 4 storage buckets and apply policies from `docs/supabase-storage.sql`
- Enable Point-in-Time Recovery: **Dashboard → Settings → Add-ons → PITR**

### 3. Sentry Project

1. Create a project at [sentry.io](https://sentry.io) (platform: Next.js)
2. Copy the **DSN** → set as `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_DSN`
3. Create an **Auth Token** with `project:releases` + `org:read` scopes → set as `SENTRY_AUTH_TOKEN`
4. Set `SENTRY_ORG` to your org slug and `SENTRY_PROJECT` to the project slug

### 4. GitHub Secrets

Add the following secrets to your GitHub repository (**Settings → Secrets → Actions**):

**Vercel**
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

**Staging Supabase**
- `STAGING_SUPABASE_URL`
- `STAGING_SUPABASE_ANON_KEY`
- `STAGING_SUPABASE_SERVICE_ROLE_KEY`
- `STAGING_SUPABASE_JWT_SECRET`
- `STAGING_STRIPE_PUBLISHABLE_KEY`

**Production Supabase** (set directly in Vercel env vars — see below)

**Sentry**
- `SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`

**Tests**
- `TEST_DATABASE_URL` (a throwaway Supabase project for CI integration tests)

### 5. Vercel Environment Variables

In **Vercel → Project → Settings → Environment Variables**, add for **Production**:

```
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=<prod supabase url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<prod anon key>
SUPABASE_SERVICE_ROLE_KEY=<prod service role key>
SUPABASE_JWT_SECRET=<prod jwt secret>
DATABASE_URL=<prod database url>
NEXT_PUBLIC_API_URL=/api
FRONTEND_URL=https://your-domain.vercel.app

ENCRYPTION_KEY=<32-byte hex — generate: openssl rand -hex 32>

NEXT_PUBLIC_SENTRY_DSN=<sentry dsn>
SENTRY_DSN=<sentry dsn>
SENTRY_ORG=<org slug>
SENTRY_PROJECT=<project slug>
SENTRY_AUTH_TOKEN=<auth token>

STRIPE_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
ENABLE_STRIPE=true

RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com

OPENAI_API_KEY=sk-xxxxx
ENABLE_OPENAI=true

TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_FROM_NUMBER=+1xxxxxxxxxx
ENABLE_TWILIO=true

NEXT_PUBLIC_VAPID_PUBLIC_KEY=xxxxx
VAPID_PRIVATE_KEY=xxxxx
VAPID_EMAIL=mailto:admin@yourdomain.com
```

Add the same variables (with staging values) for the **Preview** environment.

---

## Deployment Flow

### Automatic (via GitHub Actions)

| Trigger | Action |
|---------|--------|
| Pull request opened/updated | Build + test + deploy Vercel preview |
| Push to `main` | Build + test + deploy to Vercel production + notify Sentry |

### Manual

```bash
# Deploy to preview
vercel --cwd apps/web

# Deploy to production
vercel --cwd apps/web --prod
```

---

## Stripe Webhooks

After deploying, register your webhook endpoint in the Stripe Dashboard:

- **Staging**: `https://<preview-url>/api/stripe/webhook`
- **Production**: `https://your-domain.vercel.app/api/stripe/webhook`

Events to subscribe to:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`.

---

## Database Backups

Supabase handles automated backups automatically:

- **Free / Pro tier**: Daily backups, 7-day retention
- **Point-in-Time Recovery (PITR)**: Enable in **Dashboard → Settings → Add-ons**
  - Recommended for production: PITR with 7-day window
  - Allows restore to any second within the retention window

To manually trigger a backup export:
1. Supabase Dashboard → **Database → Backups**
2. Click **Download** to export a `.sql` dump

---

## Uptime Monitoring

### Checkly (recommended)

1. Sign up at [checklyhq.com](https://www.checklyhq.com)
2. Create API checks for:
   - `GET /api/health` → expect 200
   - `GET /` → expect 200
3. Set alert channels (email, Slack, PagerDuty)
4. Set check interval: every 1 minute for production

### Manual health check endpoint

A lightweight health route is available at `/api/health` (create if missing):

```ts
// apps/web/app/api/health/route.ts
export async function GET() {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
}
```

---

## Monitoring & Alerting

### Sentry

- **Error alerts**: Auto-configured for all unhandled exceptions
- **Performance**: `tracesSampleRate: 0.1` in production (10% of requests)
- **Session replay**: 5% of sessions, 100% on error
- Set up alert rules at **Sentry → Alerts → Create Alert Rule**
  - Condition: error rate > 5% in 5 min → notify via email/Slack

### Supabase Monitoring

- **Logs**: Supabase Dashboard → **Logs** (API, database, auth, storage)
- **Metrics**: Dashboard → **Reports** (connections, query count, storage)
- Enable **email alerts** in **Dashboard → Settings → Alerts**

---

## Rollback

### Vercel

1. Go to **Vercel → Deployments**
2. Find the last known-good deployment
3. Click **...** → **Promote to Production**

### Database

If a migration caused issues:
```bash
# Check current migration status
cd packages/database && npx prisma migrate status

# Roll back by deploying a new migration that reverts changes
# (Prisma does not support automatic rollback — always write reversible migrations)
```

---

## Local → Production Checklist

Before going live:

- [ ] Supabase production project created and migrations applied
- [ ] RLS policies verified in SQL editor with test users
- [ ] PITR enabled on production Supabase project
- [ ] All production env vars set in Vercel
- [ ] `ENCRYPTION_KEY` generated and stored securely
- [ ] Stripe webhook registered for production URL
- [ ] Sentry project created and DSN configured
- [ ] Checkly uptime monitors created
- [ ] Custom domain configured in Vercel (optional)
- [ ] Verify `NODE_ENV=production` in Vercel environment
- [ ] Test sign-up, booking, and payment flows on production
