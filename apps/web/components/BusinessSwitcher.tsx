'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Building2 } from 'lucide-react';
import { useBusinessSwitcher } from '@/lib/hooks/use-business-id';

export function BusinessSwitcher() {
  const { businessId, businesses, switchBusiness } = useBusinessSwitcher();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Only render if user has multiple businesses
  if (businesses.length <= 1) return null;

  const current = businesses.find((b) => b.id === businessId);

  const handleSwitch = async (id: string) => {
    setOpen(false);
    if (id !== businessId) {
      await switchBusiness(id);
      // Reload so all data refreshes for the new business context
      window.location.reload();
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          height: 32,
          padding: '0 10px 0 8px',
          borderRadius: 999,
          border: '1px solid #E5DEEC',
          background: '#fff',
          color: '#3D3450',
          fontFamily: 'inherit',
          fontSize: 12.5,
          fontWeight: 500,
          cursor: 'pointer',
          maxWidth: 200,
        }}
        title="Switch business"
      >
        <Building2 style={{ width: 13, height: 13, color: '#5D4AA8', flexShrink: 0 }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {current?.name ?? 'Select business'}
        </span>
        <ChevronDown style={{ width: 12, height: 12, color: '#9E96B0', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            minWidth: 220,
            background: '#fff',
            borderRadius: 14,
            boxShadow: '0 8px 32px rgba(28,20,54,0.15)',
            border: '1px solid #EFE9F2',
            zIndex: 200,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '8px 12px 6px', fontSize: 10.5, color: '#7A7090', letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 600 }}>
            Your businesses
          </div>
          {businesses.map((b) => (
            <button
              key={b.id}
              onClick={() => handleSwitch(b.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                border: 'none',
                background: b.id === businessId ? '#F3EFFD' : 'transparent',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
                transition: 'background 0.12s',
              }}
              onMouseEnter={(e) => { if (b.id !== businessId) (e.currentTarget as HTMLElement).style.background = '#F9F7FE'; }}
              onMouseLeave={(e) => { if (b.id !== businessId) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: b.id === businessId ? '#5D4AA8' : '#EDE5F4',
                  color: b.id === businessId ? '#fff' : '#5D4AA8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {b.name.slice(0, 2).toUpperCase()}
              </div>
              <span style={{ flex: 1, fontSize: 13, fontWeight: b.id === businessId ? 600 : 400, color: '#1E1830', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {b.name}
              </span>
              {b.id === businessId && <Check style={{ width: 14, height: 14, color: '#5D4AA8', flexShrink: 0 }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
