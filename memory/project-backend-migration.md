---
name: project-backend-migration
description: NestJS backend replaced with Next.js API routes — no separate backend server needed
metadata:
  type: project
---

The separate NestJS backend (`services/api/`) has been fully replaced with Next.js App Router API routes at `apps/web/app/api/`.

**Why:** Simplify deployment to Vercel + Supabase only, eliminating the need to run/deploy a separate NestJS server.

**Approach:** Next.js API routes + Prisma (Option B — server validates Supabase JWT, no RLS changes needed).

**Key infrastructure files:**
- `apps/web/lib/prisma.ts` — Prisma singleton
- `apps/web/lib/supabase/server.ts` — Service role Supabase client
- `apps/web/lib/api-auth.ts` — `requireAuth`, `withAuth`, `res` helpers
- `apps/web/lib/api-client.ts` — base URL changed from `localhost:3001/api/v1` to `/api`

**Env vars updated:** `NEXT_PUBLIC_API_URL=/api` in `.env`, `.env.local`, `.env.example`

**External services (require feature flags):**
- Stripe: `ENABLE_STRIPE=true` + `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`
- Video (Daily.co): `ENABLE_DAILY=true` + `DAILY_API_KEY`
- SMS (Twilio REST API, no SDK): `ENABLE_TWILIO=true` + Twilio credentials
- AI (Claude): `ANTHROPIC_API_KEY` (was disabled in original backend)

**How to apply:** The NestJS backend (`services/api/`) can be deleted — it's no longer used. All 92 API endpoints are now in `apps/web/app/api/`.
