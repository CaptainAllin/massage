# Memory Index

- [Project: Auth Setup Gap](project-auth-setup-gap.md) — Clerk→Supabase migration left missing businessId in user metadata and no Prisma user auto-creation; fixed with useBusinessId hook + JWT auto-create
- [Project: Backend Migration](project-backend-migration.md) — NestJS backend replaced with 92 Next.js API routes; no separate backend server needed; deploy as Vercel + Supabase only
- [Project: Phase 1.4 Recurring Appointments](project-phase14-recurring.md) — Recurring series generates appointments atomically; generateOccurrenceDates() exported from recurring-appointments/route.ts; cancel/edit modals have scope pickers
- [Project: Phase 1.6 Availability Rules](project-phase16-availability-rules.md) — Room + AvailabilityRule models, room management UI in Settings → Locations, rule builder in Settings → Scheduling, room picker on appointment modals
