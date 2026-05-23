'use client';

import { QueryClient, QueryClientProvider, dehydrate, hydrate } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';

const CACHE_KEY = 'wellness-rq-cache';
const MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
        // Show stale cached data while revalidating (good for offline)
        placeholderData: (prev: unknown) => prev,
      },
    },
  });
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  const hydrated = useRef(false);

  // Restore cache from localStorage on mount
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return;
      const { timestamp, data } = JSON.parse(raw);
      if (Date.now() - timestamp > MAX_AGE_MS) return;
      hydrate(queryClient, data);
    } catch {
      // ignore corrupt cache
    }
  }, [queryClient]);

  // Persist cache to localStorage on every cache change
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      try {
        // Only persist successful queries to avoid storing error states
        const dehydrated = dehydrate(queryClient, {
          shouldDehydrateQuery: (q) =>
            q.state.status === 'success' &&
            // Only cache appointment and client data for offline use
            (String(q.queryKey[0]).includes('appointments') ||
              String(q.queryKey[0]).includes('clients')),
        });
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ timestamp: Date.now(), data: dehydrated })
        );
      } catch {
        // quota exceeded or private browsing — ignore
      }
    });

    return unsubscribe;
  }, [queryClient]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
