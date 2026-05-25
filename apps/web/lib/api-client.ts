import axios from 'axios';
import { createClient } from '@/lib/supabase/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// In-memory session cache — avoids calling getSession() on every request.
// A fresh Supabase client + getSession() on each of N parallel requests is
// the single biggest source of page-load latency.
let _cachedToken: string | null = null;
let _tokenExpiresAt: number = 0;

async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  // Serve from cache until 60 s before expiry
  if (_cachedToken && Date.now() < _tokenExpiresAt - 60_000) {
    return _cachedToken;
  }
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    _cachedToken = session.access_token;
    _tokenExpiresAt = (session.expires_at ?? 0) * 1000;
    return _cachedToken;
  }
  _cachedToken = null;
  _tokenExpiresAt = 0;
  return null;
}

export function clearAuthTokenCache() {
  _cachedToken = null;
  _tokenExpiresAt = 0;
}

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Clear the cache on 401 so the next request re-fetches a fresh token
    if (error.response?.status === 401) {
      clearAuthTokenCache();
    }
    console.error('[API CLIENT] Request failed:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
    });
    return Promise.reject(error);
  }
);
