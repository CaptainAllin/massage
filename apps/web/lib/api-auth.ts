import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

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

  return {
    id: user.id,
    authUserId: user.authUserId,
    email: user.email,
    role: user.role,
  };
}

/** Verify the authenticated user belongs to the given business (owner or therapist). */
export async function requireBusinessAccess(user: AuthUser, businessId: string): Promise<void> {
  if (user.role === 'SUPER_ADMIN') return;

  const [isOwner, isTherapist] = await Promise.all([
    prisma.business.findFirst({
      where: { id: businessId, ownerId: user.id },
      select: { id: true },
    }),
    prisma.therapist.findFirst({
      where: { businessId, userId: user.id },
      select: { id: true },
    }),
  ]);

  if (isOwner || isTherapist) return;
  throw new AuthError('You do not have access to this business');
}

export async function requireLocationAccess(
  user: AuthUser,
  businessId: string,
  locationId?: string | null
): Promise<void> {
  if (user.role === 'SUPER_ADMIN') return;

  const isOwner = await prisma.business.findFirst({
    where: { id: businessId, ownerId: user.id },
    select: { id: true },
  });
  if (isOwner) return;

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
