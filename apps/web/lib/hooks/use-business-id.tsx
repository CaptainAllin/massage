'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useAuth } from '@massage/auth';
import { createClient } from '@/lib/supabase/client';
import { apiClient } from '@/lib/api-client';

const LS_KEY = 'wellness-bid';

export interface BusinessSummary { id: string; name: string; logo: string | null; }

interface BusinessContextValue {
  businessId: string | undefined;
  businesses: BusinessSummary[];
  switchBusiness: (id: string) => Promise<void>;
}

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

const BusinessIdContext = createContext<BusinessContextValue>({
  businessId: undefined,
  businesses: [],
  switchBusiness: async () => {},
});

/**
 * Mount once at the top of the dashboard tree (layout.tsx).
 * All descendants call useBusinessId() to read the shared value.
 * Also exposes useBusinessSwitcher() for multi-business users.
 */
export function BusinessIdProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [businessId, setBusinessId] = useState<string | undefined>(undefined);
  const [businesses, setBusinesses] = useState<BusinessSummary[]>([]);

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
        const apiRes = await apiClient.get('/businesses');
        const biz: BusinessSummary[] = apiRes.data?.data ?? [];
        setBusinesses(biz);

        if (biz.length > 0) {
          // Prefer the stored business if it's still in the list; otherwise use first.
          const stored = readLocalBusinessId();
          const preferred = biz.find((b) => b.id === stored) ?? biz[0];
          if (preferred.id !== stored) {
            setBusinessId(preferred.id);
            writeLocalBusinessId(preferred.id);
            const supabase = createClient();
            await supabase.auth.updateUser({ data: { businessId: preferred.id } });
          } else {
            setBusinessId(preferred.id);
          }
        } else if (!readLocalBusinessId()) {
          setBusinessId(undefined);
        }
      } catch {
        // Non-fatal — pages show empty state until backend is reachable
      }
    }

    validate();
  // Re-run only when the authenticated user changes (effectively once per session)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const switchBusiness = useCallback(async (id: string) => {
    setBusinessId(id);
    writeLocalBusinessId(id);
    try {
      const supabase = createClient();
      await supabase.auth.updateUser({ data: { businessId: id } });
    } catch {
      // best-effort metadata update
    }
  }, []);

  return (
    <BusinessIdContext.Provider value={{ businessId, businesses, switchBusiness }}>
      {children}
    </BusinessIdContext.Provider>
  );
}

/** Read the current business ID. Must be used inside <BusinessIdProvider>. */
export function useBusinessId(): string | undefined {
  return useContext(BusinessIdContext).businessId;
}

/** Returns the full list of businesses and a function to switch between them. */
export function useBusinessSwitcher() {
  const { businessId, businesses, switchBusiness } = useContext(BusinessIdContext);
  return { businessId, businesses, switchBusiness };
}
