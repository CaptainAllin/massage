import { useEffect, useState } from 'react';
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

/**
 * Returns the current user's businessId.
 *
 * Priority order:
 *  1. Supabase user metadata (authoritative, synced on sign-in)
 *  2. localStorage (fast path on subsequent page loads — available before auth resolves)
 *  3. Backend /businesses fetch (fallback for legacy accounts missing metadata)
 */
export function useBusinessId(): string | undefined {
  const { user } = useAuth();

  const [businessId, setBusinessId] = useState<string | undefined>(undefined);

  // Hydrate from user metadata or localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    const id = user?.user_metadata?.businessId ?? readLocalBusinessId();
    if (id) {
      setBusinessId(id);
      if (user?.user_metadata?.businessId) writeLocalBusinessId(user.user_metadata.businessId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.user_metadata?.businessId]);

  // If still missing, fetch from backend and persist back into user metadata
  useEffect(() => {
    if (businessId || !user) return;

    async function resolve() {
      try {
        const res = await apiClient.get('/businesses');
        const businesses = res.data?.data;
        if (businesses?.length > 0) {
          const id = businesses[0].id;
          setBusinessId(id);
          writeLocalBusinessId(id);
          const supabase = createClient();
          await supabase.auth.updateUser({ data: { businessId: id } });
        }
      } catch {
        // Non-fatal — pages show empty state until backend is reachable
      }
    }

    resolve();
  }, [user, businessId]);

  return businessId;
}
