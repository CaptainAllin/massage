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
        'sticky top-0 z-30 flex h-14 items-center justify-between pl-14 pr-4 lg:px-6',
        className
      )}
      style={{
        background: '#FBF8FD',
        borderBottom: '1px solid #EFE9F2',
        boxShadow: '0 1px 8px rgba(93,74,168,0.05)',
      }}
      {...props}
    >
      <div className="flex items-center gap-4">
        {title && (
          <h1 className="text-xl font-semibold font-display" style={{ color: '#1E1830', letterSpacing: '-0.3px' }}>
            {title}
          </h1>
        )}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {userMenu && <div className="flex items-center">{userMenu}</div>}
    </header>
  );
}
