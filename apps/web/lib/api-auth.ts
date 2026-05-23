import { NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export type AuthUser = {
  id: string;
  authUserId: string;
  email: string;
  role: string;
};

export async function requireAuth(req: NextRequest): Promise<AuthUser> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
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
  }

  return {
    id: user.id,
    authUserId: user.authUserId,
    email: user.email,
    role: user.role,
  };
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
