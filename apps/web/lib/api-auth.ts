import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { resolvePermissions, type Permission } from '@/lib/permissions';

// Server-side auth cache — eliminates redundant Supabase network calls and DB user lookups.
// Keyed by SHA-256(token). TTL is 4 min; Supabase tokens live ~1 hour so this is safe.
const AUTH_CACHE_TTL_MS = 4 * 60 * 1000;
const _authCache = new Map<string, { user: AuthUser; expiresAt: number }>();

/** Create an audit log entry, automatically capturing IP and user-agent from the request. */
export async function logAudit(
  req: NextRequest,
  data: {
    userId: string;
    businessId?: string | null;
    action: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  const ipAddress =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    null;
  const userAgent = req.headers.get('user-agent') ?? null;

  await prisma.auditLog.create({
    data: {
      ...data,
      ipAddress,
      userAgent,
    } as any,
  });
}

export type AuthUser = {
  id: string;
  authUserId: string;
  email: string;
  role: string;
  apiKeyId?: string;
  apiKeyPermissions?: string[];
};

/** Returns the BusinessMember role for a user within a specific business, or null if not a member. */
export async function getBusinessRole(
  userId: string,
  businessId: string
): Promise<string | null> {
  const member = await prisma.businessMember.findUnique({
    where: { userId_businessId: { userId, businessId } },
    select: { role: true, status: true },
  });
  if (!member || member.status === 'INACTIVE') return null;
  return member.role;
}

/**
 * Asserts the authenticated user has one of the allowed roles within the given business.
 * SUPER_ADMIN and the business owner always pass. Falls back to BusinessMember role check.
 */
export async function requireBusinessRole(
  user: AuthUser,
  businessId: string,
  allowedRoles: string[]
): Promise<void> {
  if (user.role === 'SUPER_ADMIN') return;

  const isOwner = await prisma.business.findFirst({
    where: { id: businessId, ownerId: user.id },
    select: { id: true },
  });
  if (isOwner) return;

  const memberRole = await getBusinessRole(user.id, businessId);
  if (memberRole && allowedRoles.includes(memberRole)) return;

  throw new AuthError('You do not have permission to perform this action');
}

/**
 * 6.3.2 — Asserts the user has a specific permission within the given business.
 * Resolves effective permissions (role defaults + business overrides + member overrides).
 * SUPER_ADMIN and the business owner always pass.
 */
export async function requirePermission(
  user: AuthUser,
  businessId: string,
  permission: Permission
): Promise<void> {
  if (user.role === 'SUPER_ADMIN') return;

  const isOwner = await prisma.business.findFirst({
    where: { id: businessId, ownerId: user.id },
    select: { id: true },
  });
  if (isOwner) return;

  const [member, business] = await Promise.all([
    prisma.businessMember.findUnique({
      where: { userId_businessId: { userId: user.id, businessId } },
      select: { role: true, status: true, permissions: true },
    }),
    prisma.business.findUnique({
      where: { id: businessId },
      select: { rolePermissions: true },
    }),
  ]);

  if (!member || member.status === 'INACTIVE') {
    throw new AuthError('You do not have permission to perform this action');
  }

  const roleOverrides = (business?.rolePermissions as Record<string, { grant: string[]; revoke: string[] }> | null)?.[member.role] ?? null;
  const resolved = resolvePermissions(member.role, member.permissions as any, roleOverrides);

  if (!resolved.has(permission)) {
    throw new AuthError('You do not have permission to perform this action');
  }
}

export async function requireAuth(req: NextRequest): Promise<AuthUser> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthError('No token provided');

  // Support ApiKey authentication: Authorization: ApiKey <key>
  if (authHeader.startsWith('ApiKey ')) {
    const rawKey = authHeader.substring(7);
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const apiKey = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: { business: { select: { ownerId: true } } },
    });
    if (!apiKey || !apiKey.isActive) throw new AuthError('Invalid or revoked API key');
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) throw new AuthError('API key has expired');
    // Update lastUsedAt without blocking
    prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
    const owner = await prisma.user.findUnique({ where: { id: apiKey.business.ownerId } });
    if (!owner) throw new AuthError('API key owner not found');
    return { id: owner.id, authUserId: owner.authUserId, email: owner.email, role: owner.role, apiKeyId: apiKey.id, apiKeyPermissions: apiKey.permissions as string[] };
  }

  if (!authHeader.startsWith('Bearer ')) {
    throw new AuthError('No token provided');
  }

  const token = authHeader.substring(7);
  const cacheKey = createHash('sha256').update(token).digest('hex');

  const cached = _authCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) return cached.user;

  // Evict stale entries if the cache grows large
  if (_authCache.size > 500) {
    const now = Date.now();
    for (const [k, v] of _authCache) if (now >= v.expiresAt) _authCache.delete(k);
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new AuthError('Invalid or expired token');
  }

  let user = await prisma.user.findUnique({
    where: { authUserId: data.user.id },
  });

  if (!user) {
    const meta = data.user.user_metadata || {};
    user = await prisma.user.create({
      data: {
        authUserId: data.user.id,
        email: data.user.email!,
        firstName: meta.first_name || '',
        lastName: meta.last_name || '',
        role: (meta.role as any) || 'CLIENT',
      },
    });
    // Log first-time registration so auth events are traceable
    await logAudit(req, {
      userId: user.id,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: user.id,
      metadata: { email: user.email, role: user.role },
    });
  }

  const authUser: AuthUser = {
    id: user.id,
    authUserId: user.authUserId,
    email: user.email,
    role: user.role,
  };
  _authCache.set(cacheKey, { user: authUser, expiresAt: Date.now() + AUTH_CACHE_TTL_MS });
  return authUser;
}

/**
 * Verify the authenticated user belongs to the given business.
 * Accepts: SUPER_ADMIN, business owner, any active BusinessMember, or a legacy Therapist record.
 */
export async function requireBusinessAccess(user: AuthUser, businessId: string): Promise<void> {
  if (user.role === 'SUPER_ADMIN') return;

  const [isOwner, isMember, isTherapist] = await Promise.all([
    prisma.business.findFirst({
      where: { id: businessId, ownerId: user.id },
      select: { id: true },
    }),
    prisma.businessMember.findUnique({
      where: { userId_businessId: { userId: user.id, businessId } },
      select: { id: true, status: true },
    }),
    prisma.therapist.findFirst({
      where: { businessId, userId: user.id },
      select: { id: true },
    }),
  ]);

  if (isOwner) return;
  if (isMember && isMember.status !== 'INACTIVE') return;
  if (isTherapist) return;
  throw new AuthError('You do not have access to this business');
}

export async function requireLocationAccess(
  user: AuthUser,
  businessId: string,
  locationId?: string | null
): Promise<void> {
  if (user.role === 'SUPER_ADMIN') return;

  const [isOwner, isMember] = await Promise.all([
    prisma.business.findFirst({
      where: { id: businessId, ownerId: user.id },
      select: { id: true },
    }),
    prisma.businessMember.findUnique({
      where: { userId_businessId: { userId: user.id, businessId } },
      select: { role: true, status: true },
    }),
  ]);
  if (isOwner) return;
  if (isMember && isMember.status !== 'INACTIVE') return;

  if (user.role === 'LOCATION_MANAGER' && locationId) {
    const therapist = await prisma.therapist.findFirst({
      where: { businessId, userId: user.id },
      select: { locationId: true },
    });
    if (therapist?.locationId === locationId) return;
    throw new AuthError('You do not have access to this location');
  }

  const isTherapist = await prisma.therapist.findFirst({
    where: { businessId, userId: user.id },
    select: { id: true },
  });
  if (isTherapist) return;

  throw new AuthError('You do not have access to this business');
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

// Standard JSON response helpers
export const res = {
  ok: (data: unknown, message?: string) =>
    Response.json({ success: true, data, ...(message && { message }) }),

  created: (data: unknown, message?: string) =>
    Response.json({ success: true, data, ...(message && { message }) }, { status: 201 }),

  unauthorized: (message = 'Unauthorized') =>
    Response.json({ error: message }, { status: 401 }),

  forbidden: (message = 'Forbidden') =>
    Response.json({ error: message }, { status: 403 }),

  notFound: (message = 'Not found') =>
    Response.json({ error: message }, { status: 404 }),

  badRequest: (message: string) =>
    Response.json({ error: message }, { status: 400 }),

  error: (message = 'Internal server error') =>
    Response.json({ error: message }, { status: 500 }),
};

// Wrap a route handler with auth — returns 401 on auth failure, 500 on unexpected errors
export function withAuth(
  handler: (req: NextRequest, user: AuthUser, ctx?: any) => Promise<Response>
) {
  return async (req: NextRequest, ctx?: any): Promise<Response> => {
    try {
      const user = await requireAuth(req);
      return await handler(req, user, ctx);
    } catch (err) {
      if (err instanceof AuthError) return res.unauthorized(err.message);
      console.error('[API]', err);
      return res.error();
    }
  };
}
