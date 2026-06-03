'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@massage/auth';
import { createClient } from '@/lib/supabase/client';
import { apiClient } from '@/lib/api-client';

const LS_KEY = 'wellness-bid';

function readLocalBusinessId(): string | undefined {
  try {
    return localStorage.getItem(LS_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

function writeLocalBusinessId(id: string) {
  try {
    localStorage.setItem(LS_KEY, id);
  } catch {
    // private browsing / quota — ignore
  }
}

const BusinessIdContext = createContext<string | undefined>(undefined);

/**
 * Mount once at the top of the dashboard tree (layout.tsx).
 * All descendants call useBusinessId() to read the shared value —
 * the /businesses API is hit exactly once per session instead of once per component.
 */
export function BusinessIdProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [businessId, setBusinessId] = useState<string | undefined>(undefined);

  // Populate from localStorage after hydration to keep SSR/client HTML in sync.
  useEffect(() => {
    const cached = readLocalBusinessId();
    if (cached) setBusinessId(cached);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update from user metadata when it resolves
  useEffect(() => {
    const id = user?.user_metadata?.businessId;
    if (id) {
      setBusinessId(id);
      writeLocalBusinessId(id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.user_metadata?.businessId]);

  // Validate against the API exactly once per session when the user is known.
  // Corrects stale localStorage/metadata values (e.g. after a DB reset).
  useEffect(() => {
    if (!user) return;

    async function validate() {
      try {
        const res = await apiClient.get('/businesses');
        const businesses = res.data?.data;
        if (businesses?.length > 0) {
          const id = businesses[0].id;
          if (id && id !== readLocalBusinessId()) {
            setBusinessId(id);
            writeLocalBusinessId(id);
            const supabase = createClient();
            await supabase.auth.updateUser({ data: { businessId: id } });
          }
        } else if (!readLocalBusinessId()) {
          // No business and no cached ID — user hasn't completed setup yet
          setBusinessId(undefined);
        }
        // If businesses is empty but we have a cached ID, keep using it rather
        // than clearing — avoids wiping a valid session on a transient API hiccup.
      } catch {
        // Non-fatal — pages show empty state until backend is reachable
      }
    }

    validate();
  // Re-run only when the authenticated user changes (effectively once per session)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <BusinessIdContext.Provider value={businessId}>
      {children}
    </BusinessIdContext.Provider>
  );
}

/** Read the current business ID. Must be used inside <BusinessIdProvider>. */
export function useBusinessId(): string | undefined {
  return useContext(BusinessIdContext);
}
