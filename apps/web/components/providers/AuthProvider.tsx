'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AuthProvider as SharedAuthProvider } from '@massage/auth';

export { useAuth } from '@massage/auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();

  return (
    <SharedAuthProvider
      supabaseClient={supabase}
      onStateChange={(event, session) => {
        console.log('[AUTH PROVIDER] State change:', {
          event,
          hasSession: !!session,
          userId: session?.user?.id
        });

        // Only redirect to dashboard on an actual sign-in (not token refreshes).
        // INITIAL_SESSION fires on every page load/focus; SIGNED_IN fires on
        // actual credential-based sign-ins. TOKEN_REFRESHED must not redirect.
        if (event === 'SIGNED_IN' && typeof window !== 'undefined') {
          const isOnAuthPage =
            window.location.pathname === '/sign-in' ||
            window.location.pathname === '/sign-up' ||
            window.location.pathname === '/';
          if (isOnAuthPage) {
            console.log('[AUTH PROVIDER] Navigating to dashboard after sign-in...');
            router.push('/dashboard');
          }
        }
        // On sign-out, navigate to sign-in page
        if (event === 'SIGNED_OUT') {
          console.log('[AUTH PROVIDER] Navigating to sign-in...');
          router.push('/sign-in');
        }
      }}
      onSignOut={() => {
        router.push('/sign-in');
      }}
    >
      {children}
    </SharedAuthProvider>
  );
}
