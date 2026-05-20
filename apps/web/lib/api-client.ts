import axios from 'axios';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    // Get Supabase session token
    if (typeof window !== 'undefined') {
      const supabase = createClientComponentClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Sign out and redirect to sign in
      if (typeof window !== 'undefined') {
        const supabase = createClientComponentClient();
        await supabase.auth.signOut();
        window.location.href = '/sign-in';
      }
    }
    return Promise.reject(error);
  }
);
