import { useEffect, useState } from 'react';
import { useAuth } from '@massage/auth';
import { createClient } from '@/lib/supabase/client';
import { apiClient } from '@/lib/api-client';

/**
 * Returns the current user's businessId, auto-resolving it from the backend
 * when it's absent from Supabase user metadata (e.g. existing users who signed up
 * before the metadata-patching flow was added).
 */
export function useBusinessId(): string | undefined {
  const { user } = useAuth();
  const [businessId, setBusinessId] = useState<string | undefined>(
    user?.user_metadata?.businessId
  );

  // Sync when Supabase refreshes user metadata (e.g. after sign-up patches it)
  useEffect(() => {
    if (user?.user_metadata?.businessId) {
      setBusinessId(user.user_metadata.businessId);
    }
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
