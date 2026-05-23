# Contributing to Wellness CRM

## Development Principles

1. **Build for the stage** — only implement features planned for the current stage
2. **Type safety first** — leverage TypeScript's strict mode throughout
3. **No over-engineering** — three similar lines beats a premature abstraction
4. **Test critical paths** — auth, RBAC, payments, and data integrity
5. **Security at every boundary** — validate all external input; never trust request bodies for identity

## Dev Environment Setup

### Prerequisites

- Node.js >= 20, npm >= 10
- Supabase project (see README for setup)
- `.env.local` configured in `apps/web/`

### Start developing

```bash
npm install
npm run dev          # starts Next.js on http://localhost:3000
```

### Useful commands

```bash
npm run lint         # ESLint across all packages
npm run type-check   # TypeScript check across all packages
npm run test         # Jest integration + security tests
npx playwright test  # E2E tests

# Database
cd packages/database
npx prisma migrate dev      # create + apply migration
npx prisma generate         # regenerate Prisma Client after schema change
npx prisma studio           # browse data
```

## Project Structure

```
massage/
├── apps/web/
│   ├── app/
│   │   ├── (auth)/         # /sign-in, /sign-up
│   │   ├── (dashboard)/    # Protected pages (one folder per feature)
│   │   ├── (public)/       # Landing page, public booking
│   │   └── api/            # Next.js Route Handlers
│   ├── components/         # Shared React components
│   └── lib/
│       ├── api-auth.ts     # requireAuth(), requireBusinessAccess()
│       ├── api-client.ts   # Axios instance with JWT interceptor
│       ├── encryption.ts   # AES-256-GCM field encryption
│       └── supabase/       # createBrowserClient(), createServerClient()
├── packages/
│   ├── database/           # Prisma schema + migrations
│   ├── auth/               # AuthProvider (React context)
│   ├── ui/                 # Shared UI components
│   └── types/              # Shared TypeScript types
└── docs/
    ├── api.md              # API reference
    └── pending.md          # Task backlog
```

## Import Rules

```typescript
// Use workspace aliases
import { prisma } from '@massage/database';
import { Button } from '@massage/ui';
import { UserRole } from '@massage/types';

// Use relative imports within the same package
import { formatDate } from '../../lib/utils';
```

Never import across packages via deep relative paths.

## Code Style

### TypeScript

- Strict mode everywhere — no `any`; use `unknown` or proper types
- Always type function return values and exported interfaces
- Functional components only for React

### API routes

Every protected Route Handler must start with auth:

```typescript
export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  const { business, error: bizError } = await requireBusinessAccess(user, businessId);
  if (bizError) return bizError;

  // handler logic
}
```

Never trust `userId` or `businessId` from request bodies — always derive from the validated JWT via `requireAuth`.

### Prisma

- Use transactions for operations that touch multiple tables
- Select only the fields you need — avoid `findMany` without `select`
- Never combine `select` and `include` at the same relation level — use nested `select` instead

```typescript
// Good
const client = await prisma.client.findUnique({
  where: { id },
  select: {
    id: true,
    firstName: true,
    appointments: {
      select: { id: true, scheduledAt: true, status: true },
    },
  },
});

// Bad — mixing select + include
const client = await prisma.client.findUnique({
  where: { id },
  select: { id: true },
  include: { appointments: true },  // ❌ runtime error
});
```

When using `$queryRaw`, use the `@@map` snake_case table name, not the Prisma model name:

```typescript
// Good
await prisma.$queryRaw`SELECT * FROM "clients" WHERE ...`

// Bad
await prisma.$queryRaw`SELECT * FROM "Client" WHERE ...`  // ❌
```

### Encryption

Fields containing PHI (protected health information) or credentials must be encrypted at rest using `lib/encryption.ts`:

```typescript
import { encrypt, decrypt } from '@/lib/encryption';

// Store
data.twilioAuthToken = encrypt(plaintext);

// Read
const plaintext = decrypt(data.twilioAuthToken);
```

Requires `ENCRYPTION_KEY` env var (32-byte hex string).

## Security

### Authentication

- Use `requireAuth(req)` from `lib/api-auth.ts` — never hand-roll JWT validation
- Check `businessId` scoping via `requireBusinessAccess` on every endpoint that touches business data
- Never expose internal IDs or error stack traces in API responses

### Input validation

Validate at the API boundary. For structured data, check required fields before using them. For AI endpoints, enforce input length limits (the existing endpoints cap at 1k–3k chars) and strip or reject suspicious prompt-injection patterns.

### Database

Prisma parameterizes all queries — never concatenate user input into query strings. Raw SQL (`$queryRaw`) is acceptable for complex reporting queries but must use tagged template literals, never string interpolation.

## Testing

### Priorities

1. Auth + RBAC — must be tested with a real DB connection (no mocks)
2. Appointment conflict detection
3. Payment flows and webhook handling
4. Security: SQL injection, XSS, IDOR

Integration tests live in `__tests__/integration/`. They expect a real Supabase test instance pointed to by `DATABASE_URL`. Do not mock the database — past experience showed mock/prod divergence masking real bugs.

### Running tests

```bash
npm run test                   # all Jest tests
npx playwright test            # E2E (requires dev server running)
npx playwright test --project=mobile-safari   # iOS Safari
npx playwright test --project=mobile-chrome   # Android Chrome
```

## Git Workflow

### Branch naming

- `feature/description` — new features
- `fix/description` — bug fixes
- `refactor/description` — code restructuring
- `docs/description` — documentation

### Commit messages (Conventional Commits)

```
<type>(<scope>): <subject>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
```
feat(appointments): add conflict detection on booking
fix(payments): handle Stripe webhook duplicate events
docs(api): add treatment-notes endpoint reference
```

### Pull request process

1. Branch from `main`
2. Write code following these guidelines
3. Write or update tests for the changed paths
4. Run locally:
   ```bash
   npm run lint && npm run type-check && npm run test && npm run build
   ```
5. Push and open PR to `main`
6. Address review feedback
7. Squash and merge when approved

## UI/UX

### Design system

- Use wellness tokens from `@massage/config-tailwind` (sage green, warm sand, calm cream, etc.)
- Consistent spacing via Tailwind's scale
- Cards: `rounded-xl` or `rounded-2xl`, `shadow-soft`

### Accessibility

- Semantic HTML5 elements
- ARIA labels on icon-only buttons
- Keyboard navigation support
- WCAG AA color contrast

## Adding a new API endpoint

1. Create the route file at the correct path under `apps/web/app/api/`
2. Call `requireAuth` + `requireBusinessAccess` at the top
3. Add the endpoint to `docs/api.md`
4. Add audit logging for state-changing operations via `logAudit(req, ...)`

## Questions?

- Product requirements: `docs/prd/`
- Task backlog: `docs/pending.md`
- API reference: `docs/api.md`
- Deployment: `DEPLOYMENT.md`
