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

        // On sign-in, navigate to dashboard (client-side navigation with cookies)
        if (event === 'SIGNED_IN') {
          console.log('[AUTH PROVIDER] Navigating to dashboard...');
          router.push('/dashboard');
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
