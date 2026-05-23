import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options) {
          req.cookies.set({
            name,
            value,
            ...options,
          });
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          });
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          res.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  console.log('[MIDDLEWARE]', {
    path: req.nextUrl.pathname,
    hasSession: !!session,
    sessionError: sessionError?.message,
    userId: session?.user?.id,
  });

  // Public routes - including auth clearing route
  const publicRoutes = ['/', '/sign-in', '/sign-up', '/auth/callback', '/auth/clear-session', '/api/webhooks'];
  const isPublicRoute = publicRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );

  // If there's a session error, clear it and allow access to auth pages
  if (sessionError && !isPublicRoute) {
    console.log('[MIDDLEWARE] Session error detected, redirecting to clear-session');
    return NextResponse.redirect(new URL('/auth/clear-session', req.url));
  }

  // Redirect to sign-in if not authenticated
  if (!session && !isPublicRoute) {
    console.log('[MIDDLEWARE] No session, redirecting to sign-in');
    const redirectUrl = new URL('/sign-in', req.url);
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect to dashboard if authenticated and on auth pages
  if (session && (req.nextUrl.pathname.startsWith('/sign-in') || req.nextUrl.pathname.startsWith('/sign-up'))) {
    console.log('[MIDDLEWARE] Session exists on auth page, redirecting to dashboard');
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
