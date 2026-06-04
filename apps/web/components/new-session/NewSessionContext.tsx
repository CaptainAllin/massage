'use client';

import React, { createContext, useContext, useState } from 'react';

interface NewSessionContextValue {
  isOpen: boolean;
  openNewSession: () => void;
  closeNewSession: () => void;
}

const NewSessionContext = createContext<NewSessionContextValue | null>(null);

export function NewSessionProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <NewSessionContext.Provider value={{
      isOpen,
      openNewSession: () => setIsOpen(true),
      closeNewSession: () => setIsOpen(false),
    }}>
      {children}
    </NewSessionContext.Provider>
  );
}

export function useNewSession() {
  const ctx = useContext(NewSessionContext);
  if (!ctx) throw new Error('useNewSession must be used inside NewSessionProvider');
  return ctx;
}
