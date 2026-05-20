# Contributing to Wellness CRM

Thank you for contributing to the Wellness CRM platform! This guide will help you maintain code quality and consistency.

## 🎯 Development Principles

1. **Build for the stage** - Only implement features planned for the current stage
2. **Keep it simple** - Avoid over-engineering and premature abstractions
3. **Type safety first** - Leverage TypeScript's type system
4. **Test critical paths** - Focus on auth, RBAC, and data integrity
5. **Document as you go** - Clear code comments and inline documentation

## 📁 Project Structure

### Monorepo Layout

```
massage/
├── apps/           # User-facing applications
├── services/       # Backend services
└── packages/       # Shared libraries
```

### Import Rules

**DO**:
```typescript
// Use workspace aliases
import { Button } from '@massage/ui';
import { UserRole } from '@massage/types';
import { prisma } from '@massage/database';

// Use relative imports within same package
import { helper } from './utils/helper';
```

**DON'T**:
```typescript
// Avoid deep imports across packages
import { Button } from '../../packages/ui/src/Button';

// Avoid circular dependencies
// packages/auth importing from apps/web
```

## 🎨 Code Style

### TypeScript

- **Always use TypeScript** - No `.js` files in source
- **Enable strict mode** - All packages use strict TypeScript
- **Explicit types for exports** - Always type function returns and props
- **Avoid `any`** - Use `unknown` or proper types instead

```typescript
// Good
export function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Bad
export function calculateTotal(items: any): any {
  return items.reduce((sum: any, item: any) => sum + item.price, 0);
}
```

### React Components

- **Functional components only** - No class components
- **Use TypeScript for props** - Always define prop interfaces
- **Prefer named exports** - Easier to refactor

```typescript
// Good
export interface ButtonProps {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ variant = 'primary', children, onClick }: ButtonProps) {
  return <button className={variant} onClick={onClick}>{children}</button>;
}

// Bad
export default ({ variant, children, onClick }: any) => {
  return <button className={variant} onClick={onClick}>{children}</button>;
};
```

### NestJS Services

- **Use dependency injection** - Inject services via constructor
- **Keep controllers thin** - Business logic in services
- **One responsibility per service** - Small, focused services

```typescript
// Good
@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateClientDto) {
    return this.prisma.client.create({ data });
  }
}

// Bad
@Controller('clients')
export class ClientsController {
  async create(@Body() data: any) {
    // Business logic in controller ❌
    const client = await prisma.client.create({ data });
    return client;
  }
}
```

## 🛡️ Security Best Practices

### Authentication

- **Always use guards** - Apply `JwtAuthGuard` to protected routes
- **Verify user context** - Check user ID from JWT, not request body
- **Use RBAC** - Apply `@Roles()` decorator for role-based access

```typescript
// Good
@Controller('businesses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BusinessesController {
  @Post()
  @Roles(UserRole.BUSINESS_OWNER)
  create(@CurrentUser('id') userId: string, @Body() data: CreateBusinessDto) {
    return this.businessesService.create(userId, data);
  }
}

// Bad
@Controller('businesses')
export class BusinessesController {
  @Post()
  create(@Body() data: { userId: string; name: string }) {
    // userId from request body - insecure! ❌
    return this.businessesService.create(data.userId, data);
  }
}
```

### Input Validation

- **Use DTOs** - Define Data Transfer Objects with validation
- **Sanitize inputs** - Never trust user input
- **Validate at boundaries** - API endpoints, webhooks

```typescript
// Good
import { IsString, IsEmail, IsOptional } from 'class-validator';

export class CreateClientDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}

@Post()
create(@Body() data: CreateClientDto) {
  // Validation happens automatically
}
```

### Database Security

- **Use parameterized queries** - Prisma handles this
- **Implement soft deletes** - Set `isActive: false` instead of hard delete
- **Create audit logs** - Track important actions

```typescript
// Good
async delete(id: string, userId: string) {
  await this.prisma.client.update({
    where: { id },
    data: { isActive: false },
  });

  await this.prisma.auditLog.create({
    data: {
      userId,
      action: 'CLIENT_DELETED',
      entityType: 'Client',
      entityId: id,
    },
  });
}

// Bad
async delete(id: string) {
  await this.prisma.client.delete({ where: { id } });
}
```

## 🧪 Testing

### What to Test

**Priority 1** (must have):
- Authentication and authorization logic
- RBAC guards and decorators
- Critical business logic (payments, appointments)
- Database operations with complex logic

**Priority 2** (should have):
- API endpoints (integration tests)
- React hooks with complex state
- Utility functions

**Priority 3** (nice to have):
- UI components
- Simple CRUD operations

### Testing Patterns

```typescript
// Unit test for guard
describe('RolesGuard', () => {
  it('should allow access when user has required role', () => {
    const user = { role: UserRole.BUSINESS_OWNER };
    expect(guard.canActivate(mockContext(user, [UserRole.BUSINESS_OWNER]))).toBe(true);
  });

  it('should deny access when user lacks required role', () => {
    const user = { role: UserRole.CLIENT };
    expect(() => guard.canActivate(mockContext(user, [UserRole.BUSINESS_OWNER])))
      .toThrow(ForbiddenException);
  });
});
```

## 📦 Package Management

### Adding Dependencies

```bash
# Add to specific workspace
npm install --workspace=apps/web package-name

# Add to root (dev tools only)
npm install -D package-name

# Add to multiple packages
npm install --workspace=@massage/ui --workspace=apps/web package-name
```

### Creating New Packages

```bash
# Create directory
mkdir -p packages/new-package/src

# Add package.json
cat > packages/new-package/package.json << 'EOF'
{
  "name": "@massage/new-package",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
EOF
```

## 🔄 Git Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates

### Commit Messages

Use conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting, missing semi-colons, etc.
- `refactor` - Code restructuring
- `test` - Adding tests
- `chore` - Updating build tasks, package manager configs, etc.

**Examples**:
```
feat(auth): add role-based navigation filtering

Implement useRole hook in sidebar component to filter menu items based on user role. Business owners see all items, therapists see limited items.

Closes #123
```

```
fix(api): prevent duplicate business creation

Add check in BusinessesService.create() to prevent users from creating multiple businesses.

Fixes #456
```

### Pull Request Process

1. **Create feature branch** from `develop`
2. **Write code** following these guidelines
3. **Write tests** for new functionality
4. **Run checks** locally:
   ```bash
   npm run lint
   npm run type-check
   npm run test
   npm run build
   ```
5. **Commit changes** with conventional commits
6. **Push branch** and create PR to `develop`
7. **Address review feedback**
8. **Squash and merge** once approved

## 🎨 UI/UX Guidelines

### Design System

- **Use wellness colors** - Defined in `@massage/config-tailwind`
- **Consistent spacing** - Use Tailwind's spacing scale
- **Rounded corners** - Use `rounded-xl` or `rounded-2xl` for cards
- **Soft shadows** - Use `shadow-soft` utilities

### Accessibility

- **Semantic HTML** - Use proper HTML5 elements
- **ARIA labels** - Add labels for screen readers
- **Keyboard navigation** - Support tab and arrow keys
- **Color contrast** - Ensure WCAG AA compliance

```tsx
// Good
<button
  aria-label="Close dialog"
  className="rounded-xl bg-primary text-white hover:bg-primary/90"
  onClick={onClose}
>
  <X className="h-5 w-5" />
</button>

// Bad
<div onClick={onClose}>
  <X />
</div>
```

## 📊 Database Guidelines

### Prisma Best Practices

- **Use transactions** for related operations
- **Include only what you need** - Don't over-fetch
- **Add indexes** for frequently queried fields
- **Use Prisma Studio** for data inspection

```typescript
// Good - Transaction for related operations
async createAppointment(data: CreateAppointmentDto) {
  return this.prisma.$transaction(async (tx) => {
    const appointment = await tx.appointment.create({ data });
    await tx.auditLog.create({
      data: {
        action: 'APPOINTMENT_CREATED',
        entityId: appointment.id,
      },
    });
    return appointment;
  });
}

// Good - Select only needed fields
async findAll() {
  return this.prisma.client.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  });
}
```

### Migrations

- **Never edit migration files** - Always create new ones
- **Test migrations** in development first
- **Backup data** before production migrations
- **Use descriptive names** for migrations

```bash
# Create migration
npm run db:migrate

# Name it descriptively
# ✅ "add_body_map_to_intake_forms"
# ❌ "update_schema"
```

## 🚀 Performance

### Frontend Optimization

- **Use React.memo** for expensive components
- **Lazy load routes** with Next.js dynamic imports
- **Optimize images** with Next.js Image component
- **Debounce search inputs** to reduce API calls

### Backend Optimization

- **Cache frequently accessed data** (future: Redis)
- **Paginate large datasets** - Use `take` and `skip`
- **Use database indexes** - Check slow query logs
- **Batch operations** when possible

## 📝 Documentation

### Code Comments

```typescript
/**
 * Creates a new appointment and sends confirmation email
 *
 * @param data - Appointment details including client, therapist, and time
 * @param userId - ID of the user creating the appointment (for audit log)
 * @returns The created appointment with related client and therapist data
 * @throws NotFoundException if client or therapist doesn't exist
 * @throws ConflictException if time slot is already booked
 */
async createAppointment(data: CreateAppointmentDto, userId: string): Promise<Appointment> {
  // Implementation
}
```

### README Files

- **Each package** should have a README
- **Explain purpose** and usage
- **Provide examples** of common use cases

## ❓ Questions?

- Check `/docs/prd.md` for product requirements
- Review `README.md` for setup instructions
- See `SETUP_GUIDE.md` for verification steps
- Open an issue for discussions

---

**Keep building great software!** 🚀
