import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: { headers: req.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: { headers: req.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — getUser() validates the JWT server-side
  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser();
  console.log('[MIDDLEWARE]', {
    path: req.nextUrl.pathname,
    hasSession: !!user,
    sessionError: sessionError?.message,
    userId: user?.id,
  });

  // Public routes — API routes and client portal handle their own auth
  const publicRoutes = ['/', '/sign-in', '/sign-up', '/auth/callback', '/auth/clear-session', '/api', '/intake', '/forms', '/book', '/client-portal'];
  const isPublicRoute = publicRoutes.some((route) =>
    route === '/' ? req.nextUrl.pathname === '/' : req.nextUrl.pathname.startsWith(route)
  );

  // If there's a session error, clear it and allow access to auth pages
  if (sessionError && !isPublicRoute) {
    console.log('[MIDDLEWARE] Session error detected, redirecting to clear-session');
    return NextResponse.redirect(new URL('/auth/clear-session', req.url));
  }

  // Redirect to sign-in if not authenticated
  if (!user && !isPublicRoute) {
    console.log('[MIDDLEWARE] No session, redirecting to sign-in');
    const redirectUrl = new URL('/sign-in', req.url);
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect to dashboard if authenticated and on auth pages
  if (user && (req.nextUrl.pathname.startsWith('/sign-in') || req.nextUrl.pathname.startsWith('/sign-up'))) {
    console.log('[MIDDLEWARE] Session exists on auth page, redirecting to dashboard');
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
