'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import {
  Building2, Users, Bell, Palette, MapPin, CalendarCheck,
  ShieldCheck, FileText, LayoutDashboard, ExternalLink,
  MessageSquare, ChevronRight, SlidersHorizontal, Code2,
  Link2, Search,
} from 'lucide-react';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useBusiness } from '@/lib/hooks/use-business';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  desc: string;
  href?: string;
}
interface NavGroup { group: string; items: NavItem[] }

const NAV: NavGroup[] = [
  { group: 'General', items: [
    { id: 'overview',    label: 'Overview',         icon: SlidersHorizontal, desc: 'Status & quick links' },
    { id: 'business',   label: 'Business profile',  icon: Building2,         desc: 'Details clients see' },
    { id: 'locations',  label: 'Locations & rooms', icon: MapPin,            desc: 'Sites & treatment rooms', href: '/settings/locations' },
  ]},
  { group: 'Team & access', items: [
    { id: 'team',     label: 'Team',          icon: Users,         desc: 'Members, roles & rates' },
    { id: 'security', label: 'Security',      icon: ShieldCheck,   desc: 'Passkeys & 2-factor' },
    { id: 'portal',   label: 'Client portal', icon: LayoutDashboard, desc: 'Self-service for clients' },
  ]},
  { group: 'Client experience', items: [
    { id: 'branding',      label: 'Branding',        icon: Palette,      desc: 'Logo, colors & email' },
    { id: 'booking',       label: 'Online booking',  icon: CalendarCheck, desc: 'Who can book & how' },
    { id: 'notifications', label: 'Notifications',   icon: Bell,          desc: 'Reminders & channels' },
    { id: 'clinical',      label: 'Clinical notes',  icon: FileText,      desc: 'Draft visibility' },
  ]},
  { group: 'Connections', items: [
    { id: 'comms',        label: 'Communications', icon: MessageSquare, desc: 'Twilio, SendGrid, WhatsApp', href: '/settings/communications' },
    { id: 'integrations', label: 'Integrations',   icon: Link2,         desc: 'Accounting, CRM & more',    href: '/settings/integrations' },
    { id: 'api',          label: 'Developer API',  icon: Code2,         desc: 'Keys & webhooks' },
  ]},
];

function CommandPalette({ onClose, go }: { onClose: () => void; go: (id: string) => void }) {
  const [q, setQ] = useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const allItems = NAV.flatMap((grp) => grp.items.map((it) => ({ ...it, group: grp.group })));

  useEffect(() => { inputRef.current?.focus(); }, []);

  const filtered = !q.trim()
    ? allItems
    : allItems.filter((it) =>
        it.label.toLowerCase().includes(q.toLowerCase()) ||
        it.desc.toLowerCase().includes(q.toLowerCase())
      );

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(30,24,48,0.34)', backdropFilter: 'blur(3px)', zIndex: 80, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '11vh' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: 580, maxWidth: '92vw', background: '#fff', borderRadius: 18, boxShadow: '0 18px 50px rgba(28,20,54,0.22), 0 4px 12px rgba(28,20,54,0.12)', border: '1px solid #EFE9F2', overflow: 'hidden' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid #EFE9F2' }}>
          <Search className="h-[18px] w-[18px]" style={{ color: '#5D4AA8', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search every setting…"
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15.5, color: '#1E1830', fontFamily: 'inherit', background: 'transparent' }}
          />
          <span style={{ fontSize: 11, color: '#7A7090', padding: '3px 7px', borderRadius: 6, background: '#F3F4F7', border: '1px solid #EFE9F2' }}>esc</span>
        </div>
        <div style={{ maxHeight: 380, overflowY: 'auto', padding: 10 }}>
          <div style={{ padding: '8px 12px 6px', fontSize: 10.5, color: '#7A7090', letterSpacing: 1.2, textTransform: 'uppercase' as const, fontWeight: 600 }}>Settings</div>
          {filtered.map((it) => {
            const Ic = it.icon;
            return (
              <button
                key={it.id}
                onClick={() => { go(it.id); onClose(); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 11, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' as const }}
              >
                <span style={{ width: 30, height: 30, borderRadius: 9, background: '#EDE5F4', color: '#5D4AA8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Ic className="h-4 w-4" />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: '#1E1830', display: 'block' }}>{it.label}</span>
                  <span style={{ fontSize: 11.5, color: '#7A7090' }}>{it.desc}</span>
                </span>
                <span style={{ fontSize: 10.5, color: '#9E96B0', textTransform: 'uppercase' as const, letterSpacing: 0.6, whiteSpace: 'nowrap' as const }}>{it.group}</span>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ padding: '30px 12px', textAlign: 'center' as const, color: '#7A7090', fontSize: 13 }}>
              No settings match &ldquo;{q}&rdquo;.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const businessId = useBusinessId();
  const { data: business } = useBusiness(businessId || '');
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [paletteOpen, setPaletteOpen] = useState(false);

  const businessName = business?.name || 'Your Practice';

  const activeId = React.useMemo(() => {
    if (pathname.startsWith('/settings/locations')) return 'locations';
    if (pathname.startsWith('/settings/communications')) return 'comms';
    if (pathname.startsWith('/settings/integrations')) return 'integrations';
    return searchParams.get('tab') || 'overview';
  }, [pathname, searchParams]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setPaletteOpen((o) => !o); }
      if (e.key === 'Escape') setPaletteOpen(false);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const go = (id: string) => {
    const item = NAV.flatMap((g) => g.items).find((i) => i.id === id);
    if (item?.href) router.push(item.href);
    else router.push(`/settings?tab=${id}`);
  };

  return (
    <div
      className="-mt-6 -mx-7 -mb-8"
      style={{ height: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      {/* ── Header ────────────────────────────────────────────────────── */}
      <header style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '11px 30px', borderBottom: '1px solid #EFE9F2', background: '#FBF8FD', flexShrink: 0 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: '#7A7090' }}>
            <span>Workspace</span>
            <ChevronRight className="h-3 w-3" />
            <span style={{ color: '#5D4AA8', fontWeight: 600 }}>Settings</span>
          </div>
          <div suppressHydrationWarning style={{ fontSize: 18, fontWeight: 600, color: '#1E1830', letterSpacing: -0.3, marginTop: 2 }}>{businessName}</div>
        </div>
        <button
          onClick={() => setPaletteOpen(true)}
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, height: 40, padding: '0 14px', borderRadius: 999, border: '1px solid #E5DEEC', background: '#fff', color: '#7A7090', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer', width: 320 }}
        >
          <Search className="h-4 w-4" />
          <span style={{ flex: 1, textAlign: 'left' }}>Search every setting…</span>
          <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 6, background: '#F3F4F7', border: '1px solid #EFE9F2' }}>⌘K</span>
        </button>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 9px', borderRadius: 999, background: '#E9F7F0', color: '#1B8A5A', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: '#1B8A5A', flexShrink: 0 }} />
          Synced
        </span>
        <div style={{ width: 1, height: 24, background: '#E5DEEC', flexShrink: 0 }} />
        <div suppressHydrationWarning style={{ width: 36, height: 36, borderRadius: 18, background: '#EDE5F4', color: '#5D4AA8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0, letterSpacing: -0.5 }}>
          {businessName.slice(0, 2).toUpperCase()}
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Sidebar nav ─── */}
        <nav style={{ width: 250, flexShrink: 0, overflowY: 'auto', padding: '20px 14px 28px', borderRight: '1px solid #EFE9F2', background: '#FBF8FD', scrollbarWidth: 'thin' as const }}>
          <button
            onClick={() => setPaletteOpen(true)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, height: 38, padding: '0 12px', borderRadius: 11, border: '1px solid #E5DEEC', background: '#fff', color: '#7A7090', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer', marginBottom: 18 }}
          >
            <Search className="h-4 w-4" />
            <span style={{ flex: 1, textAlign: 'left' }}>Search settings…</span>
            <span style={{ fontSize: 10.5, padding: '2px 6px', borderRadius: 5, background: '#F3F4F7', border: '1px solid #EFE9F2' }}>⌘K</span>
          </button>

          {NAV.map((grp) => (
            <div key={grp.group} style={{ marginBottom: 16 }}>
              <div style={{ padding: '0 10px 8px', fontSize: 10.5, color: '#7A7090', letterSpacing: 1.3, textTransform: 'uppercase' as const, fontWeight: 600 }}>{grp.group}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {grp.items.map((it) => {
                  const on = it.id === activeId;
                  const Ic = it.icon;
                  const href = it.href ?? `/settings?tab=${it.id}`;
                  return (
                    <Link
                      key={it.id}
                      href={href}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 11, padding: '9px 11px', borderRadius: 11,
                        textDecoration: 'none',
                        background: on ? '#fff' : 'transparent',
                        boxShadow: on ? '0 1px 2px rgba(28,20,54,0.05)' : 'none',
                        outline: on ? '1px solid #EFE9F2' : 'none',
                      }}
                    >
                      <span style={{ width: 30, height: 30, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: on ? 'linear-gradient(135deg, #5D4AA8, #7665C2)' : '#EDE5F4', color: on ? '#fff' : '#5D4AA8' }}>
                        <Ic className="h-4 w-4" />
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: on ? 600 : 500, color: on ? '#1E1830' : '#3D3450', display: 'block', lineHeight: 1.3 }}>{it.label}</span>
                        <span style={{ fontSize: 11, color: '#7A7090', display: 'block', lineHeight: 1.3, marginTop: 1 }}>{it.desc}</span>
                      </span>
                      {it.href && <ExternalLink className="h-3 w-3" style={{ color: '#9E96B0', flexShrink: 0 }} />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ── Content slot ─── */}
        <div
          id="settings-content"
          style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '22px 30px 90px', scrollbarWidth: 'thin' as const }}
        >
          <div style={{ maxWidth: 1080, margin: '0 auto' }}>
            {children}
          </div>
        </div>
      </div>

      {paletteOpen && <CommandPalette go={go} onClose={() => setPaletteOpen(false)} />}
    </div>
  );
}
