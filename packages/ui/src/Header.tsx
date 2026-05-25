'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { cn } from './utils';

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  actions?: React.ReactNode;
  userMenu?: React.ReactNode;
  userInitials?: string;
  userName?: string;
  sessionCount?: number;
}

function formatDateString(d: Date) {
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function Header({
  className,
  title,
  actions,
  userMenu,
  userInitials,
  userName,
  sessionCount,
  ...props
}: HeaderProps) {
  const [dateStr, setDateStr] = React.useState(() => formatDateString(new Date()));
  const searchRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const id = setInterval(() => setDateStr(formatDateString(new Date())), 60_000);
    return () => clearInterval(id);
  }, []);

  React.useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const subtitleText =
    sessionCount != null
      ? `${sessionCount} session${sessionCount !== 1 ? 's' : ''} today`
      : null;

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 items-center pl-14 pr-4 lg:px-6 gap-4',
        className
      )}
      style={{
        background: '#FBF8FD',
        borderBottom: '1px solid #EFE9F2',
        boxShadow: '0 1px 8px rgba(93,74,168,0.05)',
      }}
      {...props}
    >
      {/* Left: date + subtitle */}
      <div className="flex flex-col justify-center min-w-0 flex-shrink-0">
        <span
          style={{ fontSize: '13.5px', fontWeight: 500, color: '#1E1830', letterSpacing: '-0.2px', lineHeight: 1.2 }}
        >
          {dateStr}
        </span>
        {subtitleText && (
          <span style={{ fontSize: '11.5px', color: '#7A7090', lineHeight: 1.3 }}>
            {subtitleText}
          </span>
        )}
      </div>

      {/* Center: search pill */}
      <div className="hidden md:flex flex-1 justify-center">
        <div
          className="flex items-center gap-2 px-3 w-full max-w-[280px] cursor-text"
          style={{
            height: '36px',
            borderRadius: '999px',
            background: '#FFFFFF',
            border: '1px solid #E5DEEC',
          }}
          onClick={() => searchRef.current?.focus()}
        >
          <Search size={14} style={{ color: '#7A7090', flexShrink: 0 }} />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search clients, sessions…"
            className="flex-1 bg-transparent outline-none"
            style={{ fontSize: '13px', color: '#1E1830' }}
          />
          <kbd
            className="hidden sm:inline-flex items-center justify-center"
            style={{
              fontSize: '11px',
              color: '#7A7090',
              background: '#F1ECF5',
              border: '1px solid #E5DEEC',
              borderRadius: '4px',
              padding: '1px 5px',
              lineHeight: 1.4,
              flexShrink: 0,
              fontFamily: 'inherit',
            }}
          >
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: user menu + divider + avatar */}
      <div className="flex items-center gap-2 sm:gap-3 ml-auto flex-shrink-0">
        {userMenu}
        {userMenu && userInitials && (
          <div style={{ width: '1px', height: '20px', background: '#E5DEEC', flexShrink: 0 }} />
        )}
        {userInitials && (
          <div
            title={userName}
            className="flex items-center justify-center rounded-full font-semibold cursor-pointer flex-shrink-0 select-none"
            style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, #7665C2, #5D4AA8)',
              color: '#FFFFFF',
              fontSize: '13px',
            }}
          >
            {userInitials}
          </div>
        )}
      </div>
    </header>
  );
}
