'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { SupabaseClient, User } from '@supabase/supabase-js';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
  supabaseClient: SupabaseClient;
  onSignOut?: () => void;
  onStateChange?: (event: string, session: any) => void;
}

export function AuthProvider({ children, supabaseClient, onSignOut, onStateChange }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (onStateChange) {
        onStateChange(event, session);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabaseClient, onStateChange]);

  const signOut = async () => {
    await supabaseClient.auth.signOut();
    if (onSignOut) {
      onSignOut();
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
