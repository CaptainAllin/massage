'use client';

import { QueryClient, QueryClientProvider, dehydrate, hydrate } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';

const CACHE_KEY = 'wellness-rq-cache';
const MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

const PERSIST_KEYS = new Set(['dashboard', 'appointments', 'clients', 'clients-meta', 'business']);

function restoreCache(client: QueryClient) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return;
    const { timestamp, data } = JSON.parse(raw);
    if (Date.now() - timestamp > MAX_AGE_MS) return;
    hydrate(client, data);
  } catch {
    // ignore corrupt cache
  }
}

function createQueryClient() {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        placeholderData: (prev: unknown) => prev,
      },
    },
  });
  // Hydrate synchronously so the very first render sees cached data —
  // avoids the flash of loading state caused by useEffect running too late.
  restoreCache(client);
  return client;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist cache to localStorage, debounced to avoid thrashing on rapid updates
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
      persistTimer.current = setTimeout(() => {
        try {
          const dehydrated = dehydrate(queryClient, {
            shouldDehydrateQuery: (q) =>
              q.state.status === 'success' && PERSIST_KEYS.has(String(q.queryKey[0])),
          });
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ timestamp: Date.now(), data: dehydrated })
          );
        } catch {
          // quota exceeded or private browsing — ignore
        }
      }, 2000);
    });

    return () => {
      unsubscribe();
      if (persistTimer.current) clearTimeout(persistTimer.current);
    };
  }, [queryClient]);

  // Register service worker early so all users benefit from caching, not just push-enabled ones
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
