# Clerk to Supabase Migration Plan

## 📊 Migration Overview

**Current State**: Clerk Auth + PostgreSQL + Prisma
**Target State**: Supabase (Auth + Database + Storage + Realtime)
**Estimated Time**: 10-12 days
**Risk Level**: Medium (early enough in project lifecycle)

---

## 🎯 What We're Migrating

### Authentication Flow
- **From**: Clerk JWT → Webhook sync → PostgreSQL User table
- **To**: Supabase Auth → Database triggers → RLS policies

### Current Architecture
```
┌─────────────┐
│   Clerk     │ (External auth provider)
└──────┬──────┘
       │ Webhooks
       ▼
┌─────────────┐
│  NestJS API │ (Token verification + user sync)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ PostgreSQL  │ (User data storage)
└─────────────┘
```

### Target Architecture
```
┌────────────────────────────┐
│      Supabase Platform     │
│  ┌──────────────────────┐  │
│  │  Auth (auth.users)   │  │
│  └──────────┬───────────┘  │
│             │ Triggers     │
│             ▼              │
│  ┌──────────────────────┐  │
│  │  Database (public.*) │  │
│  └──────────────────────┘  │
│  ┌──────────────────────┐  │
│  │  Storage (files)     │  │
│  └──────────────────────┘  │
│  ┌──────────────────────┐  │
│  │  Realtime (subs)     │  │
│  └──────────────────────┘  │
└────────────────────────────┘
```

---

## 📋 Migration Phases

## Phase 1: Setup & Planning (Day 1)

### 1.1 Create Supabase Project
- [ ] Sign up at supabase.com
- [ ] Create new project (choose region close to users)
- [ ] Save credentials:
  - Project URL
  - Anon/Public key
  - Service role key (secret)
  - Database connection string

### 1.2 Install Dependencies
```bash
# Root workspace
pnpm add @supabase/supabase-js @supabase/auth-helpers-nextjs

# Remove Clerk
pnpm remove @clerk/nextjs @clerk/backend clerk svix
```

### 1.3 Environment Setup
```bash
# .env.local (Next.js)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# .env (NestJS)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
```

---

## Phase 2: Database Migration (Days 2-3)

### 2.1 Update Prisma Schema

**Changes to `schema.prisma`:**

```prisma
model User {
  id               String    @id @default(cuid())
  authProviderId   String    @unique // RENAME to: authUserId (Supabase auth.users.id)
  email            String    @unique
  firstName        String?
  lastName         String?
  role             UserRole  @default(CLIENT)
  phoneNumber      String?
  profileImageUrl  String?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  // Relations remain the same
  ownedBusiness    Business? @relation("BusinessOwner")
  therapist        Therapist?
  client           Client?
  auditLogs        AuditLog[]

  @@index([email])
  @@index([authUserId]) // Updated index name
  @@map("users")
}
```

**Migration Steps:**
```bash
# 1. Create migration to rename column
cd packages/database
npx prisma migrate dev --name rename_auth_provider_to_auth_user

# 2. Manual SQL to rename (in migration file):
ALTER TABLE users RENAME COLUMN "authProviderId" TO "authUserId";

# 3. Apply migration
npx prisma migrate deploy
```

### 2.2 Migrate Database to Supabase

**Option A: Fresh Start (Recommended - you're early)**
```bash
# 1. Point DATABASE_URL to Supabase
# 2. Run migrations
npx prisma migrate deploy

# 3. Run seed if needed
npx prisma db seed
```

**Option B: Data Migration (if you have production data)**
```bash
# 1. Export from current DB
pg_dump $CURRENT_DATABASE_URL > backup.sql

# 2. Import to Supabase
psql $SUPABASE_DATABASE_URL < backup.sql

# 3. Run Prisma migrations
npx prisma migrate deploy
```

### 2.3 Create Database Triggers (Supabase SQL Editor)

This keeps `auth.users` and `public.users` in sync:

```sql
-- Function: Sync auth.users to public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    "authUserId",
    email,
    "firstName",
    "lastName",
    role,
    "phoneNumber",
    "profileImageUrl",
    "createdAt",
    "updatedAt"
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'CLIENT')::public."UserRole",
    NEW.phone,
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: On user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function: Sync user updates
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET
    email = NEW.email,
    "phoneNumber" = NEW.phone,
    "updatedAt" = NOW()
  WHERE "authUserId" = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: On user update
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_update();

-- Function: Handle user deletion
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.users WHERE "authUserId" = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: On user deletion
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_delete();
```

---

## Phase 3: Backend Migration (Days 4-6)

### 3.1 Create Supabase Service

**File**: `services/api/src/common/supabase/supabase.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get('SUPABASE_URL')!,
      this.configService.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  // Verify JWT from client
  async verifyToken(token: string) {
    const { data, error } = await this.supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new Error('Invalid token');
    }

    return data.user;
  }

  // Admin: Create user
  async createUser(email: string, password: string, metadata?: any) {
    const { data, error } = await this.supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    });

    if (error) throw error;
    return data.user;
  }

  // Admin: Update user
  async updateUser(userId: string, updates: any) {
    const { data, error } = await this.supabase.auth.admin.updateUserById(
      userId,
      updates
    );

    if (error) throw error;
    return data.user;
  }

  // Admin: Delete user
  async deleteUser(userId: string) {
    const { error } = await this.supabase.auth.admin.deleteUser(userId);
    if (error) throw error;
  }
}
```

**File**: `services/api/src/common/supabase/supabase.module.ts`

```typescript
import { Module, Global } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

@Global()
@Module({
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
```

### 3.2 Replace JWT Strategy

**File**: `services/api/src/auth/strategies/jwt.strategy.ts`

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/common/prisma/prisma.service';
import { SupabaseService } from '@/common/supabase/supabase.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private supabase: SupabaseService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: async (request, rawJwtToken, done) => {
        try {
          const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
          if (!token) {
            return done(new UnauthorizedException('No token provided'), null);
          }

          // Verify Supabase token
          await this.supabase.verifyToken(token);

          // Return dummy secret (token already verified)
          done(null, 'supabase-verified');
        } catch (error) {
          done(new UnauthorizedException('Invalid token'), null);
        }
      },
    });
  }

  async validate(payload: any) {
    // Extract user ID from Supabase token (sub claim)
    const supabaseUserId = payload.sub;

    if (!supabaseUserId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Find user in database by Supabase auth ID
    const user = await this.prisma.user.findUnique({
      where: { authUserId: supabaseUserId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Return user for request context
    return {
      id: user.id,
      authUserId: user.authUserId,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }
}
```

### 3.3 Remove Clerk Webhook

```bash
# Delete these files:
rm services/api/src/auth/webhooks/clerk-webhook.controller.ts

# Update auth.module.ts to remove webhook controller
```

### 3.4 Update Auth Module

**File**: `services/api/src/auth/auth.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { SupabaseModule } from '@/common/supabase/supabase.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    SupabaseModule,
  ],
  providers: [JwtStrategy, JwtAuthGuard, RolesGuard],
  exports: [JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
```

---

## Phase 4: Frontend Migration (Days 7-9)

### 4.1 Create Supabase Client

**File**: `apps/web/lib/supabase/client.ts`

```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

// Client component usage
export const supabase = createClientComponentClient();

// For server-side (API routes, server components)
export const createServerSupabase = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};
```

### 4.2 Update Middleware

**File**: `apps/web/middleware.ts`

```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session if expired
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Public routes
  const publicRoutes = ['/', '/sign-in', '/sign-up'];
  const isPublicRoute = publicRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );

  // Redirect to sign-in if not authenticated
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  // Redirect to dashboard if authenticated and on public route
  if (session && isPublicRoute && req.nextUrl.pathname !== '/') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

### 4.3 Update API Client

**File**: `apps/web/lib/api-client.ts`

```typescript
import axios from 'axios';
import { supabase } from './supabase/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    // Get Supabase session token
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Sign out and redirect to sign in
      await supabase.auth.signOut();
      if (typeof window !== 'undefined') {
        window.location.href = '/sign-in';
      }
    }
    return Promise.reject(error);
  }
);
```

### 4.4 Create Auth Pages

**File**: `apps/web/app/(auth)/sign-in/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button, Input, Card } from '@massage/ui';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-calm-cream">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-center mb-6">Sign In</h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSignIn} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" fullWidth loading={loading}>
            Sign In
          </Button>
        </form>

        <p className="text-center mt-4 text-sm text-gray-600">
          Don't have an account?{' '}
          <a href="/sign-up" className="text-sage-green hover:underline">
            Sign up
          </a>
        </p>
      </Card>
    </div>
  );
}
```

**File**: `apps/web/app/(auth)/sign-up/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button, Input, Card, Select } from '@massage/ui';

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'CLIENT',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: formData.role,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-calm-cream">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-center mb-6">Sign Up</h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          <Input
            placeholder="First Name"
            value={formData.firstName}
            onChange={(e) =>
              setFormData({ ...formData, firstName: e.target.value })
            }
            required
          />
          <Input
            placeholder="Last Name"
            value={formData.lastName}
            onChange={(e) =>
              setFormData({ ...formData, lastName: e.target.value })
            }
            required
          />
          <Input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            required
          />
          <Select
            value={formData.role}
            onChange={(e) =>
              setFormData({ ...formData, role: e.target.value })
            }
          >
            <option value="CLIENT">Client</option>
            <option value="THERAPIST">Therapist</option>
            <option value="RECEPTIONIST">Receptionist</option>
            <option value="BUSINESS_OWNER">Business Owner</option>
          </Select>
          <Button type="submit" fullWidth loading={loading}>
            Sign Up
          </Button>
        </form>

        <p className="text-center mt-4 text-sm text-gray-600">
          Already have an account?{' '}
          <a href="/sign-in" className="text-sage-green hover:underline">
            Sign in
          </a>
        </p>
      </Card>
    </div>
  );
}
```

### 4.5 Create Auth Provider

**File**: `apps/web/components/providers/AuthProvider.tsx`

```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      router.refresh();
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/sign-in');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### 4.6 Update Root Layout

**File**: `apps/web/app/layout.tsx`

```typescript
import { AuthProvider } from '@/components/providers/AuthProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

---

## Phase 5: Row Level Security (Days 10-11)

### 5.1 Enable RLS on All Tables

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
```

### 5.2 Create RLS Policies

```sql
-- ============================================================
-- USERS TABLE POLICIES
-- ============================================================

-- Users can read their own data
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = "authUserId");

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = "authUserId");

-- ============================================================
-- BUSINESSES TABLE POLICIES
-- ============================================================

-- Business owners can read their business
CREATE POLICY "Business owners can view their business"
  ON businesses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users."authUserId" = auth.uid()
      AND users.id = businesses."ownerId"
    )
  );

-- Business staff can read business they work for
CREATE POLICY "Staff can view their business"
  ON businesses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      LEFT JOIN therapists t ON t."userId" = u.id
      WHERE u."authUserId" = auth.uid()
      AND (t."businessId" = businesses.id OR u.id = businesses."ownerId")
    )
  );

-- Business owners can update their business
CREATE POLICY "Business owners can update their business"
  ON businesses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users."authUserId" = auth.uid()
      AND users.id = businesses."ownerId"
    )
  );

-- ============================================================
-- CLIENTS TABLE POLICIES
-- ============================================================

-- Staff can view clients in their business
CREATE POLICY "Staff can view business clients"
  ON clients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      LEFT JOIN therapists t ON t."userId" = u.id
      LEFT JOIN businesses b ON b.id = clients."businessId"
      WHERE u."authUserId" = auth.uid()
      AND (
        t."businessId" = clients."businessId"
        OR b."ownerId" = u.id
        OR u.role IN ('RECEPTIONIST', 'BUSINESS_OWNER')
      )
    )
  );

-- Clients can view their own profile
CREATE POLICY "Clients can view own profile"
  ON clients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users."authUserId" = auth.uid()
      AND users.id = clients."userId"
    )
  );

-- Staff can create clients
CREATE POLICY "Staff can create clients"
  ON clients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      LEFT JOIN therapists t ON t."userId" = u.id
      LEFT JOIN businesses b ON b.id = clients."businessId"
      WHERE u."authUserId" = auth.uid()
      AND (
        t."businessId" = clients."businessId"
        OR b."ownerId" = u.id
        OR u.role IN ('RECEPTIONIST', 'BUSINESS_OWNER')
      )
    )
  );

-- ============================================================
-- TREATMENT NOTES POLICIES
-- ============================================================

-- Therapists can view notes they created
CREATE POLICY "Therapists can view own notes"
  ON treatment_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN therapists t ON t."userId" = u.id
      WHERE u."authUserId" = auth.uid()
      AND t.id = treatment_notes."therapistId"
    )
  );

-- Business owners can view all notes in their business
CREATE POLICY "Business owners can view business notes"
  ON treatment_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN businesses b ON b."ownerId" = u.id
      WHERE u."authUserId" = auth.uid()
      AND b.id = treatment_notes."businessId"
    )
  );

-- Therapists can create notes
CREATE POLICY "Therapists can create notes"
  ON treatment_notes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      JOIN therapists t ON t."userId" = u.id
      WHERE u."authUserId" = auth.uid()
      AND t.id = treatment_notes."therapistId"
    )
  );

-- ============================================================
-- THERAPIST NOTES POLICIES (Private)
-- ============================================================

-- Only the therapist who created can view
CREATE POLICY "Therapists can view only their private notes"
  ON therapist_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN therapists t ON t."userId" = u.id
      WHERE u."authUserId" = auth.uid()
      AND t.id = therapist_notes."therapistId"
    )
  );

-- Only the therapist can create their notes
CREATE POLICY "Therapists can create private notes"
  ON therapist_notes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      JOIN therapists t ON t."userId" = u.id
      WHERE u."authUserId" = auth.uid()
      AND t.id = therapist_notes."therapistId"
    )
  );

-- ============================================================
-- APPOINTMENTS POLICIES
-- ============================================================

-- Staff can view appointments in their business
CREATE POLICY "Staff can view business appointments"
  ON appointments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      LEFT JOIN therapists t ON t."userId" = u.id
      LEFT JOIN businesses b ON b.id = appointments."businessId"
      WHERE u."authUserId" = auth.uid()
      AND (
        t."businessId" = appointments."businessId"
        OR b."ownerId" = u.id
      )
    )
  );

-- Clients can view their appointments
CREATE POLICY "Clients can view own appointments"
  ON appointments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN clients c ON c."userId" = u.id
      WHERE u."authUserId" = auth.uid()
      AND c.id = appointments."clientId"
    )
  );

-- Staff can create appointments
CREATE POLICY "Staff can create appointments"
  ON appointments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      LEFT JOIN therapists t ON t."userId" = u.id
      LEFT JOIN businesses b ON b.id = appointments."businessId"
      WHERE u."authUserId" = auth.uid()
      AND (
        t."businessId" = appointments."businessId"
        OR b."ownerId" = u.id
        OR u.role IN ('RECEPTIONIST', 'BUSINESS_OWNER')
      )
    )
  );
```

---

## Phase 6: Testing & Validation (Day 12)

### 6.1 Test Checklist

- [ ] **Authentication**
  - [ ] Sign up new user
  - [ ] Sign in existing user
  - [ ] Sign out
  - [ ] Password reset
  - [ ] Session persistence

- [ ] **Authorization**
  - [ ] Business owner can access their data
  - [ ] Therapist can only see their business clients
  - [ ] Receptionist can see business data
  - [ ] Client can only see their own data
  - [ ] RLS policies block unauthorized access

- [ ] **API Integration**
  - [ ] Bearer token passed correctly
  - [ ] 401 errors trigger sign out
  - [ ] API requests work with Supabase JWT

- [ ] **Data Sync**
  - [ ] New user creates record in public.users
  - [ ] User updates sync from auth to public
  - [ ] User deletion cascades properly

### 6.2 Test Script

```typescript
// Test file: services/api/src/auth/auth.e2e.spec.ts

import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import request from 'supertest';

describe('Supabase Auth (e2e)', () => {
  let app: INestApplication;
  let supabase: any;
  let userToken: string;

  beforeAll(async () => {
    supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    const moduleRef = await Test.createTestingModule({
      // Import your AppModule
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it('should create user and sync to database', async () => {
    const { data, error } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'Test123456!',
      options: {
        data: {
          first_name: 'Test',
          last_name: 'User',
          role: 'CLIENT',
        },
      },
    });

    expect(error).toBeNull();
    expect(data.user).toBeDefined();

    // Wait for trigger to sync
    await new Promise((r) => setTimeout(r, 1000));

    // Check database
    const response = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${data.session.access_token}`)
      .expect(200);

    expect(response.body.email).toBe('test@example.com');
    expect(response.body.role).toBe('CLIENT');
  });

  it('should authenticate and access protected route', async () => {
    const { data } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'Test123456!',
    });

    const response = await request(app.getHttpServer())
      .get('/api/v1/clients')
      .set('Authorization', `Bearer ${data.session.access_token}`)
      .expect(200);

    expect(response.body).toBeDefined();
  });

  afterAll(async () => {
    await app.close();
  });
});
```

---

## 🚨 Rollback Plan (If Things Go Wrong)

### Quick Rollback Steps

1. **Revert Git**
```bash
git checkout main
git reset --hard <commit-before-migration>
```

2. **Restore Database**
```bash
# Restore from backup
psql $DATABASE_URL < backup-before-migration.sql
```

3. **Reinstall Clerk**
```bash
pnpm add @clerk/nextjs @clerk/backend clerk
```

4. **Restore .env**
```bash
# Copy from .env.backup
cp .env.backup .env
```

---

## 📦 What Gets Removed

### NPM Packages
- `@clerk/nextjs`
- `@clerk/backend`
- `clerk`
- `svix` (webhook verification)

### Files to Delete
- `apps/web/middleware.ts` (replace)
- `apps/web/app/(auth)/sign-in/[[...sign-in]]/page.tsx` (replace)
- `apps/web/app/(auth)/sign-up/[[...sign-up]]/page.tsx` (replace)
- `services/api/src/auth/webhooks/clerk-webhook.controller.ts`
- `services/api/src/auth/strategies/jwt.strategy.ts` (replace)

### Environment Variables to Remove
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET`

---

## 🎁 What You Get with Supabase

### Included Features

1. **Authentication** ✅
   - Email/password
   - OAuth (Google, GitHub, etc.)
   - Magic links
   - Phone auth (SMS OTP)

2. **Database** ✅
   - Managed PostgreSQL
   - Connection pooling
   - Automatic backups
   - Point-in-time recovery

3. **Storage** ✅
   - File uploads (images, PDFs)
   - CDN delivery
   - Image transformations
   - Access control via RLS

4. **Realtime** ✅
   - Database subscriptions
   - Presence (who's online)
   - Broadcast channels
   - Perfect for calendar/appointments

5. **Edge Functions** ✅
   - Serverless functions
   - Webhooks
   - Background jobs

---

## 📊 Migration Success Metrics

### How to Know Migration Succeeded

- [ ] All tests pass
- [ ] Sign up/sign in works
- [ ] Role-based access works
- [ ] API calls authenticated
- [ ] RLS policies enforced
- [ ] No console errors
- [ ] Session persistence works
- [ ] User data syncs correctly

---

## 🆘 Troubleshooting

### Common Issues

**Issue**: "JWT expired" errors
**Fix**: Refresh token in middleware

**Issue**: RLS blocks all queries
**Fix**: Check policies use `auth.uid()` correctly

**Issue**: User not found after signup
**Fix**: Check database triggers fired

**Issue**: CORS errors with Supabase
**Fix**: Configure Supabase project URL in CORS settings

---

## 📞 Support Resources

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Auth Helpers: https://supabase.com/docs/guides/auth/auth-helpers/nextjs

---

**Next Step**: Read FILE_STORAGE.md for cost-effective file storage strategy
