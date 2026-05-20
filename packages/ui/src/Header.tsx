'use client';

import * as React from 'react';
import { cn } from './utils';

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  actions?: React.ReactNode;
  userMenu?: React.ReactNode;
}

export function Header({ className, title, actions, userMenu, ...props }: HeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-6 shadow-soft',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-4">
        {title && (
          <h1 className="text-2xl font-semibold text-foreground font-display">
            {title}
          </h1>
        )}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {userMenu && <div className="flex items-center">{userMenu}</div>}
    </header>
  );
}
