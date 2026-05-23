'use client';

import React, { createContext, useContext, useState } from 'react';

interface QuickCallContextValue {
  isOpen: boolean;
  initialClientId?: string;
  openQuickCall: (clientId?: string) => void;
  closeQuickCall: () => void;
}

const QuickCallContext = createContext<QuickCallContextValue | null>(null);

export function QuickCallProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialClientId, setInitialClientId] = useState<string | undefined>();

  const openQuickCall = (clientId?: string) => {
    setInitialClientId(clientId);
    setIsOpen(true);
  };

  const closeQuickCall = () => {
    setIsOpen(false);
    setInitialClientId(undefined);
  };

  return (
    <QuickCallContext.Provider value={{ isOpen, initialClientId, openQuickCall, closeQuickCall }}>
      {children}
    </QuickCallContext.Provider>
  );
}

export function useQuickCall() {
  const ctx = useContext(QuickCallContext);
  if (!ctx) throw new Error('useQuickCall must be used inside QuickCallProvider');
  return ctx;
}
