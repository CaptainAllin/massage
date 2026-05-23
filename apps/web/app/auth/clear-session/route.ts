import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle error
          }
        },
        remove(name: string, options) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Handle error
          }
        },
      },
    }
  );

  // Sign out from Supabase
  await supabase.auth.signOut();

  // Create response with redirect
  const response = NextResponse.redirect(new URL('/sign-in', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'));

  // Clear all Supabase cookies
  const allCookies = cookieStore.getAll();
  allCookies.forEach((cookie) => {
    if (cookie.name.includes('supabase') || cookie.name.includes('auth')) {
      response.cookies.delete(cookie.name);
    }
  });

  return response;
}
