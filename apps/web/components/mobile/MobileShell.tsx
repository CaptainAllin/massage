'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { BottomSheet } from './BottomSheet';
import { useAuth } from '@massage/auth';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { apiClient } from '@/lib/api-client';
import { useUnreadCount } from '@/lib/hooks/use-messages';
import { useNewSession } from '@/components/new-session/NewSessionContext';
import { usePWAInstall } from '@/lib/hooks/use-pwa-install';
import { PWAFirstLoginModal } from '@/components/pwa/PWAFirstLoginModal';
import { Avatar } from './primitives';
import { MobileDashboard } from './screens/MobileDashboard';
import { MobileAppointments } from './screens/MobileAppointments';
import { MobileClients } from './screens/MobileClients';
import { MobileClientProfile } from './screens/MobileClientProfile';
import { MobileMessages } from './screens/MobileMessages';
import { MobileThread } from './screens/MobileThread';
import { MobilePayments } from './screens/MobilePayments';
import { MobileSettings } from './screens/MobileSettings';
import { MobileAnalytics } from './screens/MobileAnalytics';
import { MobileLoyalty } from './screens/MobileLoyalty';
import { MobileInventory } from './screens/MobileInventory';
import { MobilePromotions } from './screens/MobilePromotions';
import { MobileGiftCards } from './screens/MobileGiftCards';

// ─── Types ───────────────────────────────────────────────────────────────────

export type MobileView =
  | 'dashboard'
  | 'appts'
  | 'clients'
  | 'client-profile'
  | 'messages'
  | 'thread'
  | 'payments'
  | 'settings'
  | 'analytics'
  | 'loyalty'
  | 'inventory'
  | 'promotions'
  | 'gift-cards';

export interface MobileRouter {
  view: MobileView;
  param: unknown;
  navigate: (view: MobileView, param?: unknown) => void;
  goBack: () => void;
  readConversationIds: Set<string>;
}

// ─── Status Bar ──────────────────────────────────────────────────────────────

function StatusBar() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const fmt = () => {
      const d = new Date();
      const h = d.getHours();
      const m = d.getMinutes().toString().padStart(2, '0');
      return `${h > 12 ? h - 12 : h || 12}:${m}`;
    };
    setTime(fmt());
    const id = setInterval(() => setTime(fmt()), 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        height: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        flexShrink: 0,
        background: 'var(--m-surface)',
      }}
    >
      {/* Time */}
      <span
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: 'var(--m-ink)',
          fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {time}
      </span>

      {/* Right icons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Signal bars */}
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
          <rect x="0" y="7" width="3" height="5" rx="0.8" fill="var(--m-ink)" />
          <rect x="4.5" y="4.5" width="3" height="7.5" rx="0.8" fill="var(--m-ink)" />
          <rect x="9" y="2" width="3" height="10" rx="0.8" fill="var(--m-ink)" />
          <rect x="13.5" y="0" width="3" height="12" rx="0.8" fill="var(--m-ink)" />
        </svg>

        {/* WiFi arcs */}
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
          <path d="M8 10.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" fill="var(--m-ink)" />
          <path d="M5.1 8.3a4.1 4.1 0 0 1 5.8 0" stroke="var(--m-ink)" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M2.5 5.6a7.4 7.4 0 0 1 11 0" stroke="var(--m-ink)" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M0.2 3a10.8 10.8 0 0 1 15.6 0" stroke="var(--m-ink)" strokeWidth="1.4" strokeLinecap="round" />
        </svg>

        {/* Battery */}
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
          <rect x="0.5" y="0.5" width="21" height="11" rx="3" stroke="var(--m-ink)" strokeWidth="1.2" />
          <rect x="22" y="3.5" width="2.5" height="5" rx="1.2" fill="var(--m-ink)" />
          <rect x="2" y="2" width="17" height="8" rx="1.8" fill="var(--m-ink)" />
        </svg>
      </div>
    </div>
  );
}

// ─── Tab Bar ─────────────────────────────────────────────────────────────────

const TAB_DEFS = [
  { id: 'dashboard', label: 'Home',     icon: HomeIcon },
  { id: 'appts',     label: 'Calendar', icon: CalendarIcon },
  { id: 'clients',   label: 'Clients',  icon: UsersIcon },
  { id: 'messages',  label: 'Inbox',    icon: ChatIcon },
  { id: 'more',      label: 'More',     icon: EllipsisIcon },
] as const;

function HomeIcon({ active }: { active: boolean }) {
  const sw = active ? 2 : 1.6;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"
        stroke="currentColor" strokeWidth={sw} strokeLinejoin="round" />
      <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarIcon({ active }: { active: boolean }) {
  const sw = active ? 2 : 1.6;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth={sw} />
      <path d="M8 2v4M16 2v4M3 10h18" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" />
    </svg>
  );
}

function UsersIcon({ active }: { active: boolean }) {
  const sw = active ? 2 : 1.6;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth={sw} />
      <path d="M2 21v-1a7 7 0 0 1 14 0v1" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" />
      <path d="M16 3.1a4 4 0 0 1 0 7.8M22 21v-1a7 7 0 0 0-5-6.7"
        stroke="currentColor" strokeWidth={sw} strokeLinecap="round" />
    </svg>
  );
}

function ChatIcon({ active }: { active: boolean }) {
  const sw = active ? 2 : 1.6;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
        stroke="currentColor" strokeWidth={sw} strokeLinejoin="round" />
    </svg>
  );
}

function EllipsisIcon({ active: _active }: { active?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="5" cy="12" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <circle cx="19" cy="12" r="1.6" fill="currentColor" />
    </svg>
  );
}

interface TabBarProps {
  activeView: MobileView | null;
  onTabPress: (id: string) => void;
  unreadCount?: number;
}

function TabBar({ activeView, onTabPress, unreadCount = 0 }: TabBarProps) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(255,255,255,0.86)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderTop: '1px solid var(--m-line)',
        display: 'flex',
        alignItems: 'stretch',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        zIndex: 50,
      }}
    >
      {TAB_DEFS.map((tab) => {
        const isActive = tab.id !== 'more' && activeView === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            className="im-tab"
            aria-label={tab.label}
            onClick={() => onTabPress(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              padding: '8px 0 4px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isActive ? 'var(--m-primary)' : 'var(--m-faint)',
              position: 'relative',
            }}
          >
            {/* Inbox unread badge */}
            {tab.id === 'messages' && unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 6,
                  right: '50%',
                  transform: 'translateX(12px)',
                  background: 'var(--m-accent)',
                  color: '#fff',
                  fontSize: 9,
                  fontWeight: 700,
                  lineHeight: 1,
                  padding: '2px 4.5px',
                  borderRadius: 100,
                  border: '1.5px solid #fff',
                  minWidth: 16,
                  textAlign: 'center',
                  fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}

            <Icon active={isActive} />

            <span
              style={{
                fontSize: 10.5,
                fontWeight: isActive ? 700 : 500,
                fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                letterSpacing: isActive ? -0.2 : 0,
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── FAB ─────────────────────────────────────────────────────────────────────

interface FABProps {
  onPress: () => void;
}

const FAB_VIEWS: MobileView[] = ['dashboard', 'appts', 'clients', 'messages'];

function FAB({ onPress }: FABProps) {
  return (
    <button
      className="im-tab im-fab"
      aria-label="Create new"
      onClick={onPress}
      style={{
        position: 'absolute',
        right: 18,
        bottom: 'calc(74px + env(safe-area-inset-bottom))',
        width: 58,
        height: 58,
        borderRadius: 20,
        background: 'var(--m-grad)',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 10px 26px rgba(63,47,135,0.5)',
        zIndex: 40,
      }}
    >
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <path d="M13 5v16M5 13h16" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    </button>
  );
}

// ─── More Sheet ───────────────────────────────────────────────────────────────

const MORE_GROUPS: Array<{
  label: string;
  color: string;
  bg: string;
  items: Array<{ label: string; icon: string; route: string; view?: MobileView }>;
}> = [
  {
    label: 'Operations',
    color: '#5D4AA8',
    bg: 'rgba(93,74,168,0.10)',
    items: [
      { label: 'Intake Forms', icon: '📋', route: '/intake-forms' },
      { label: 'Therapists',   icon: '👥', route: '/therapists' },
      { label: 'Inventory',    icon: '📦', route: '/inventory',  view: 'inventory' },
      { label: 'Telehealth',   icon: '💻', route: '/telehealth' },
      { label: 'Insurance',    icon: '🛡️', route: '/insurance-claims' },
    ],
  },
  {
    label: 'Growth',
    color: '#DE9277',
    bg: 'rgba(222,146,119,0.12)',
    items: [
      { label: 'Promotions', icon: '🎁', route: '/promotions', view: 'promotions' },
      { label: 'Gift Cards',  icon: '💳', route: '/gift-cards', view: 'gift-cards' },
      { label: 'Loyalty',     icon: '⭐', route: '/loyalty',    view: 'loyalty' },
      { label: 'Analytics',   icon: '📊', route: '/analytics',  view: 'analytics' },
      { label: 'Reports',     icon: '📈', route: '/reports' },
    ],
  },
  {
    label: 'Tools',
    color: '#3A87D4',
    bg: 'rgba(58,135,212,0.10)',
    items: [
      { label: 'Automation', icon: '⚡', route: '/automation' },
      { label: 'Payroll',    icon: '💰', route: '/payroll' },
      { label: 'Exports',    icon: '📤', route: '/exports' },
      { label: 'Settings',   icon: '⚙️', route: '/settings',  view: 'settings' },
    ],
  },
];

// Data warmers for the heaviest "More" destinations. Each entry mirrors the exact
// query key + return shape its page's hook uses, so when the page mounts React
// Query finds the data already cached and renders without a spinner. Keys/shapes
// must stay in lockstep with the corresponding hook in lib/hooks — verified
// against each hook's queryKey and queryFn return value.
function warmMoreData(qc: QueryClient, businessId: string) {
  const STALE = 5 * 60 * 1000;
  const warm = (key: unknown[], fn: () => Promise<unknown>) =>
    qc.prefetchQuery({ queryKey: key, queryFn: fn, staleTime: STALE });

  // useIntakeForms(businessId) → ['intake-forms', businessId, undefined], returns response.data
  warm(['intake-forms', businessId, undefined], () =>
    apiClient.get(`/intake-forms?businessId=${businessId}`).then((r) => r.data)
  );
  // usePromotions(businessId) → ['promotions', businessId, undefined], returns response.data.data
  warm(['promotions', businessId, undefined], () =>
    apiClient.get(`/promotions?businessId=${businessId}`).then((r) => r.data.data)
  );
  // useLoyaltyAccounts(businessId) → ['loyalty-accounts', businessId], returns response.data
  warm(['loyalty-accounts', businessId], () =>
    apiClient.get(`/loyalty/accounts?businessId=${businessId}`).then((r) => r.data)
  );
  // useLoyaltySettings(businessId) → ['loyalty-settings', businessId], returns response.data
  warm(['loyalty-settings', businessId], () =>
    apiClient.get(`/loyalty/settings?businessId=${businessId}`).then((r) => r.data)
  );
  // useGiftCards(businessId, {}) → ['gift-cards', businessId, {}], returns response.data.data
  warm(['gift-cards', businessId, {}], () =>
    apiClient.get(`/gift-cards?businessId=${businessId}`).then((r) => r.data.data)
  );
  // useInventory(businessId, {}) → ['inventory', businessId, {}], returns response.data
  warm(['inventory', businessId, {}], () =>
    apiClient.get(`/inventory?businessId=${businessId}`).then((r) => r.data)
  );
  // useAutomationRules(businessId) → ['automation', businessId], returns response.data
  warm(['automation', businessId], () =>
    apiClient.get(`/automation?businessId=${businessId}`).then((r) => r.data)
  );
  // usePayrollPeriods(businessId) → ['payroll', businessId], returns response.data
  warm(['payroll', businessId], () =>
    apiClient.get(`/payroll?businessId=${businessId}`).then((r) => r.data)
  );
  // Analytics page: useDashboardOverview({ startDate, endDate }) defaults to the
  // last 30 days → ['analytics', 'overview', params], returns response.data.data.
  // We reproduce the page's exact default param object so the key hashes match.
  const params = {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  };
  warm(['analytics', 'overview', params], () =>
    apiClient.get('/analytics/overview', { params }).then((r) => r.data.data)
  );
}

interface MoreSheetProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (view: MobileView) => void;
  /** Fired when a route-based destination is tapped, so the shell can show its
   *  navigation progress bar while the page loads. */
  onNavigateStart: () => void;
  userName: string;
  userEmail: string;
}

function MoreSheet({ open, onClose, onNavigate, onNavigateStart, userName, userEmail }: MoreSheetProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const businessId = useBusinessId();
  const [search, setSearch] = useState('');
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const { canInstall, hasManualInstall, isInstalled, browserType, triggerInstall } = usePWAInstall();

  // When the sheet opens, warm both halves of every "More" destination's cost:
  //   1. the route bundle + RSC payload (router.prefetch) — no cold chunk on tap
  //   2. the page's data (warmMoreData) — so it mounts already populated, no spinner
  // Together these make the pushed overlay feel native-instant. Both are deduped
  // (Next for routes, React Query for data), so re-opening is cheap.
  useEffect(() => {
    if (!open) return;
    for (const group of MORE_GROUPS) {
      for (const item of group.items) {
        if (!item.view) router.prefetch(item.route);
      }
    }
    if (businessId) warmMoreData(queryClient, businessId);
  }, [open, router, queryClient, businessId]);

  const handleInstallPress = async () => {
    if (canInstall) {
      await triggerInstall();
    } else if (hasManualInstall) {
      setShowInstallHelp((v) => !v);
    }
  };

  const filteredGroups = search
    ? MORE_GROUPS.map((g) => ({
        ...g,
        items: g.items.filter((i) => i.label.toLowerCase().includes(search.toLowerCase())),
      })).filter((g) => g.items.length > 0)
    : MORE_GROUPS;

  return (
    <BottomSheet open={open} onClose={onClose} title="More">
      <div style={{ padding: '0 16px 24px' }}>
        {/* Install card — shown only when app is not yet installed */}
        {!isInstalled && (canInstall || hasManualInstall) && (
          <div
            style={{
              background: 'var(--m-surface)',
              border: '1px solid var(--m-line2)',
              borderRadius: 18,
              boxShadow: '0 1px 4px rgba(28,20,54,0.06)',
              marginBottom: 16,
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px' }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 13,
                  background: 'var(--m-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="2" width="14" height="20" rx="3" stroke="var(--m-primary)" strokeWidth="1.8" />
                  <path d="M12 17v0" stroke="var(--m-primary)" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--m-ink)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', lineHeight: 1.2 }}>
                  Install Iris
                </div>
                <div style={{ fontSize: 12, color: 'var(--m-muted)', marginTop: 2, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
                  Add to home screen for quick access
                </div>
              </div>
              {canInstall && (
                <button
                  className="im-tab im-press"
                  onClick={handleInstallPress}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 10,
                    background: 'var(--m-grad)',
                    border: 'none',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    flexShrink: 0,
                    fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                  }}
                >
                  Install
                </button>
              )}
              {!canInstall && hasManualInstall && (
                <button
                  className="im-tab im-press"
                  onClick={handleInstallPress}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 10,
                    background: 'var(--m-soft)',
                    border: '1px solid var(--m-line)',
                    color: 'var(--m-primary)',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    flexShrink: 0,
                    fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                  }}
                >
                  {showInstallHelp ? 'Hide' : 'How?'}
                </button>
              )}
            </div>

            {/* Manual install instructions */}
            {showInstallHelp && hasManualInstall && (
              <div
                style={{
                  borderTop: '1px solid var(--m-line2)',
                  padding: '10px 14px 13px',
                  fontSize: 13,
                  color: 'var(--m-ink2)',
                  fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                  lineHeight: 1.6,
                  background: 'var(--m-soft2)',
                }}
              >
                {browserType === 'ios' && 'Tap the Share ↑ button at the bottom of Safari, then "Add to Home Screen"'}
                {browserType === 'mac-safari' && 'Open the File menu in Safari, then "Add to Dock"'}
                {browserType === 'firefox-android' && 'Tap the ⋮ menu, then "Install"'}
                {browserType === 'chrome-android' && 'Tap the ⋮ menu in the top-right corner, then "Add to Home Screen"'}
              </div>
            )}
          </div>
        )}

        {/* Search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--m-bg)',
            border: '1px solid var(--m-line)',
            borderRadius: 14,
            padding: '10px 14px',
            marginBottom: 20,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="var(--m-muted)" strokeWidth="2" />
            <path d="M21 21l-4.35-4.35" stroke="var(--m-muted)" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            placeholder="Jump to anything…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              fontSize: 14,
              color: 'var(--m-ink)',
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            }}
          />
          {search ? (
            <button onClick={() => setSearch('')} aria-label="Clear search" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 44, minHeight: 44 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M18 6 6 18M6 6l12 12" stroke="var(--m-muted)" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          ) : (
            <div
              style={{
                display: 'flex', alignItems: 'center',
                padding: '2px 7px', borderRadius: 6,
                border: '1px solid var(--m-line)', background: 'var(--m-surface)',
                fontSize: 11, fontWeight: 600, color: 'var(--m-faint)',
                fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                letterSpacing: 0.2, flexShrink: 0,
              }}
            >
              ⌘K
            </div>
          )}
        </div>

        {/* Groups */}
        {filteredGroups.map((group) => (
          <div key={group.label} style={{ marginBottom: 24 }}>
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                fontSize: 11, fontWeight: 700,
                color: 'var(--m-muted)',
                textTransform: 'uppercase', letterSpacing: 1.2,
                marginBottom: 10,
                fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: group.color, flexShrink: 0 }} />
              {group.label}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {group.items.map((item) => (
                <button
                  key={item.label}
                  className="im-tab im-press"
                  // Press-intent prefetch: fires before the click resolves, giving
                  // the route chunk a head start the instant a finger touches down.
                  onPointerDown={() => { if (!item.view) router.prefetch(item.route); }}
                  onClick={() => {
                    if (item.view) {
                      onNavigate(item.view);
                    } else {
                      onNavigateStart();
                      router.push(item.route);
                    }
                    onClose();
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 14px',
                    background: 'var(--m-surface)',
                    border: '1px solid var(--m-line2)',
                    borderRadius: 16,
                    boxShadow: '0 1px 2px rgba(28,20,54,0.07)',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      width: 34, height: 34, borderRadius: 10,
                      background: group.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </div>
                  <span
                    style={{
                      fontSize: 13.5, fontWeight: 600,
                      color: 'var(--m-ink)',
                      fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                      lineHeight: 1.3,
                    }}
                  >
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Profile row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 16px',
            background: 'var(--m-bg)',
            border: '1px solid var(--m-line2)',
            borderRadius: 16,
            marginTop: 4,
          }}
        >
          <Avatar name={userName || 'User'} size={44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--m-ink)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
              {userName}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--m-muted)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userEmail}
            </div>
          </div>
          <button
            className="im-tab im-press"
            onClick={() => { onNavigate('settings'); onClose(); }}
            style={{
              padding: '7px 14px',
              borderRadius: 10,
              background: 'var(--m-soft)',
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--m-primary)',
              cursor: 'pointer',
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              flexShrink: 0,
            }}
          >
            Settings
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

// ─── Create Sheet ─────────────────────────────────────────────────────────────

const CREATE_ITEMS = [
  { label: 'New appointment', icon: CalendarIcon,   color: '#5D4AA8', view: 'appts'    as MobileView },
  { label: 'Add client',      icon: UsersIcon,      color: '#3A87D4', view: 'clients'  as MobileView },
  { label: 'New message',     icon: ChatIcon,       color: '#3E9E7A', view: 'messages' as MobileView },
  { label: 'Take payment',    icon: PaymentIcon,    color: '#DE9277', view: 'payments' as MobileView },
] as const;

function PaymentIcon({ active }: { active: boolean }) {
  const sw = active ? 2 : 1.6;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="6" width="20" height="14" rx="3" stroke="currentColor" strokeWidth={sw} />
      <path d="M2 10h20" stroke="currentColor" strokeWidth={sw} />
      <path d="M6 15h4" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M9 18l6-6-6-6" stroke="var(--m-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface CreateSheetProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (view: MobileView) => void;
  onNewSession: () => void;
}

function CreateSheet({ open, onClose, onNavigate, onNewSession }: CreateSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Create">
      <div style={{ padding: '0 16px 32px' }}>
        {CREATE_ITEMS.map((item) => {
          const Icon = item.icon;
          const bg = item.color + '1A';
          return (
            <button
              key={item.label}
              className="im-tab im-press"
              onClick={() => {
                if (item.label === 'New appointment') {
                  onNewSession();
                } else {
                  onNavigate(item.view);
                }
                onClose();
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '13px 0',
                background: 'none',
                border: 'none',
                borderBottom: '1px solid var(--m-line2)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: item.color,
                }}
              >
                <Icon active={false} />
              </div>
              <span
                style={{
                  flex: 1,
                  fontSize: 15.5,
                  fontWeight: 600,
                  color: 'var(--m-ink)',
                  fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                }}
              >
                {item.label}
              </span>
              <ChevronRightIcon />
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}

// ─── Route Overlay ────────────────────────────────────────────────────────────
// Renders a full desktop route page (Intake Forms, Promotions, etc.) inside the
// mobile device frame as a pushed view with a back button. Used for the "More"
// menu destinations that don't have a dedicated native mobile screen.

interface RouteOverlayProps {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}

function RouteOverlay({ title, onBack, children }: RouteOverlayProps) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          flexShrink: 0,
          borderBottom: '1px solid var(--m-line)',
          background: 'var(--m-surface)',
        }}
      >
        <button
          onClick={onBack}
          aria-label="Back"
          className="im-press"
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            background: 'var(--m-soft)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: 'var(--m-ink)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--m-ink)',
            fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            letterSpacing: -0.3,
          }}
        >
          {title}
        </div>
      </div>
      <div
        className="im-scroll"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
          // Clear the always-visible tab bar (64px) plus normal breathing room.
          paddingBottom: 'calc(88px + env(safe-area-inset-bottom))',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Screen registry — swapped out as phases are built
const SCREENS: Record<MobileView, React.ComponentType<{ router: MobileRouter; param: unknown }>> = {
  dashboard:        MobileDashboard,
  appts:            MobileAppointments,
  clients:          MobileClients,
  'client-profile': MobileClientProfile,
  messages:         MobileMessages,
  thread:           MobileThread,
  payments:         MobilePayments,
  settings:         MobileSettings,
  analytics:        MobileAnalytics,
  loyalty:          MobileLoyalty,
  inventory:        MobileInventory,
  promotions:       MobilePromotions,
  'gift-cards':     MobileGiftCards,
};

// Detail views that suppress the FAB (the tab bar now stays visible everywhere)
const DETAIL_VIEWS: MobileView[] = ['client-profile', 'thread'];

// Detail views map back to their originating tab so the bar still highlights it
const DETAIL_PARENT_TAB: Partial<Record<MobileView, MobileView>> = {
  'client-profile': 'clients',
  thread: 'messages',
};

// Next.js routes for each core tab — used to leave a route overlay on tab press
const TAB_ROUTE: Record<string, string> = {
  dashboard: '/dashboard',
  appts: '/appointments',
  clients: '/clients',
  messages: '/messages',
};

// Vertical space the always-visible tab bar occupies (icon + label + safe area)
const TAB_BAR_SPACE = 'calc(64px + env(safe-area-inset-bottom))';

// ─── Nav Progress Bar ─────────────────────────────────────────────────────────
// Thin indeterminate bar pinned to the top of the device frame. Shows the instant
// a route navigation starts (tap registered) and clears once the new route commits,
// so a "More" destination never feels like a dead tap while its page loads.

function NavProgressBar({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div
      style={{
        position: 'absolute',
        top: 'env(safe-area-inset-top)',
        left: 0,
        right: 0,
        height: 3,
        overflow: 'hidden',
        zIndex: 100,
        pointerEvents: 'none',
        background: 'var(--m-soft)',
      }}
    >
      <div
        className="im-navbar-fill"
        style={{
          height: '100%',
          width: '40%',
          borderRadius: 100,
          background: 'var(--m-grad)',
        }}
      />
    </div>
  );
}

// ─── Mobile Shell ─────────────────────────────────────────────────────────────

interface MobileShellProps {
  initialView?: MobileView;
  /** When set, a non-core route page (e.g. Intake Forms) is shown as a pushed
   *  overlay inside the device frame instead of a native mobile screen. */
  routeOverlay?: { title: string; node: React.ReactNode } | null;
  /** Invoked when the overlay's back button is pressed (typically router.back). */
  onRouteBack?: () => void;
}

export function MobileShell({ initialView = 'dashboard', routeOverlay = null, onRouteBack }: MobileShellProps) {
  const nextRouter = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const businessId = useBusinessId();
  const { data: unreadCount = 0 } = useUnreadCount(businessId);
  const { openNewSession } = useNewSession();
  const [view, setView] = useState<MobileView>(initialView);
  const [param, setParam] = useState<unknown>(null);
  const [history, setHistory] = useState<Array<{ view: MobileView; param: unknown }>>([]);
  const [moreOpen, setMoreOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [readConversationIds, setReadConversationIds] = useState<Set<string>>(new Set());
  const [navigating, setNavigating] = useState(false);

  // A route navigation has committed once the pathname changes — clear the bar.
  // Also clears whenever a fresh route overlay arrives (e.g. its page resolved).
  useEffect(() => {
    setNavigating(false);
  }, [pathname]);

  // Safety net: never let the bar hang if a navigation stalls or targets the
  // current route (no pathname change to clear it).
  useEffect(() => {
    if (!navigating) return;
    const id = setTimeout(() => setNavigating(false), 8000);
    return () => clearTimeout(id);
  }, [navigating]);

  const firstName = user?.user_metadata?.first_name ?? '';
  const lastName  = user?.user_metadata?.last_name ?? '';
  const fullName  = [firstName, lastName].filter(Boolean).join(' ') || 'My Account';
  const email     = user?.email ?? '';

  const navigate = useCallback((nextView: MobileView, nextParam?: unknown) => {
    if (nextView === 'thread' && nextParam) {
      const p = nextParam as any;
      // A client row collapses every channel-conversation; clear them all so the
      // aggregate badge fully disappears once the thread is opened.
      const ids: string[] = Array.isArray(p.memberIds) && p.memberIds.length
        ? p.memberIds
        : typeof p.id === 'string' ? [p.id] : [];
      if (ids.length) {
        setReadConversationIds((prev) => {
          const next = new Set(prev);
          ids.forEach((id) => next.add(id));
          return next;
        });
      }
    }
    setHistory((h) => [...h, { view, param }]);
    setView(nextView);
    setParam(nextParam ?? null);
  }, [view, param]);

  const goBack = useCallback(() => {
    const prev = history[history.length - 1];
    if (prev) {
      setHistory((h) => h.slice(0, -1));
      setView(prev.view);
      setParam(prev.param);
    }
  }, [history]);

  const router: MobileRouter = { view, param, navigate, goBack, readConversationIds };

  const handleTabPress = (id: string) => {
    if (id === 'more') {
      setMoreOpen(true);
      return;
    }
    setHistory([]);
    setView(id as MobileView);
    setParam(null);
    // While a route overlay (a "More" destination) is showing, the displayed
    // screen is driven by the URL — push the core route so the overlay clears.
    if (routeOverlay) {
      setNavigating(true);
      nextRouter.push(TAB_ROUTE[id] ?? '/dashboard');
    }
  };

  const isDetailView = DETAIL_VIEWS.includes(view);
  const anySheetOpen = moreOpen || createOpen;
  const showFAB = !isDetailView && !anySheetOpen && !routeOverlay && FAB_VIEWS.includes(view);

  const Screen = SCREENS[view];

  return (
    <div
      className="im-stage"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 30% 20%, #E9E5F2, #DAD6E6 70%)',
      }}
    >
      <div
        className="im-device"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 420,
          height: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'var(--m-bg)',
        }}
      >
        {/* Status bar — desktop only (hidden via media query on real mobile) */}
        <div className="im-status-bar-wrap">
          <StatusBar />
        </div>

        {/* Top navigation progress bar — instant feedback that a tap registered */}
        <NavProgressBar active={navigating} />

        {/* Screen content */}
        {routeOverlay ? (
          // Pushed route page (More menu destination) shown inside the frame
          <RouteOverlay title={routeOverlay.title} onBack={() => onRouteBack?.()}>
            {routeOverlay.node}
          </RouteOverlay>
        ) : isDetailView ? (
          // Detail views: no scroll wrapper, full flex column. Reserve space at the
          // bottom so the screen's own footer (e.g. the thread composer) sits above
          // the always-visible tab bar instead of behind it.
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingBottom: TAB_BAR_SPACE }}>
            <Screen router={router} param={param} />
          </div>
        ) : (
          // List/main views: scrollable with bottom padding for tab bar
          <div
            className="im-scroll"
            style={{
              flex: 1,
              overflowY: 'auto',
              paddingBottom: 96,
            }}
          >
            <Screen router={router} param={param} />
          </div>
        )}

        {/* Bottom tab bar — always visible so navigation is never lost. Detail
            views highlight their parent tab; route overlays highlight nothing. */}
        <TabBar
          activeView={routeOverlay ? null : (DETAIL_PARENT_TAB[view] ?? view)}
          onTabPress={handleTabPress}
          unreadCount={unreadCount}
        />

        {/* FAB */}
        {showFAB && <FAB onPress={() => setCreateOpen(true)} />}

        {/* PWA first-login install prompt (mobile) */}
        <PWAFirstLoginModal />

        {/* Sheets */}
        <MoreSheet
          open={moreOpen}
          onClose={() => setMoreOpen(false)}
          onNavigate={(v) => { setView(v); setHistory([]); }}
          onNavigateStart={() => setNavigating(true)}
          userName={fullName}
          userEmail={email}
        />
        <CreateSheet
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onNavigate={(v) => { navigate(v); }}
          onNewSession={openNewSession}
        />
      </div>

      <style>{`
        /* Status bar hidden by default — shown only in desktop frame simulation */
        .im-status-bar-wrap { display: none; }

        /* Indeterminate sweep for the top navigation progress bar */
        @keyframes im-navbar-sweep {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
        .im-navbar-fill {
          animation: im-navbar-sweep 1s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .im-navbar-fill { animation-duration: 1.8s; }
        }

        /* Desktop browser: show device frame and fake status bar */
        @media (hover: hover) and (pointer: fine) and (min-width: 480px) {
          .im-device {
            height: min(820px, 94dvh);
            border-radius: 46px;
            box-shadow:
              0 2px 0 4px #1b1530,
              0 0 0 14px #2a2342,
              0 0 0 16px #1b1530,
              0 30px 80px rgba(0,0,0,0.5);
          }
          .im-status-bar-wrap { display: block; }
        }

        /* Real touch device: edge-to-edge, respect safe-area top */
        @media (hover: none), (pointer: coarse) {
          .im-stage {
            background: var(--m-bg) !important;
          }
          .im-device {
            max-width: 100%;
            padding-top: env(safe-area-inset-top);
          }
        }
      `}</style>
    </div>
  );
}
