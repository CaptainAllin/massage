'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Sidebar, Header } from '@massage/ui';
import { useAuth, useRole } from '@massage/auth';
import { QuickCallProvider } from '@/components/quick-call/QuickCallContext';
import { QuickCallModal } from '@/components/quick-call/QuickCallModal';
import { NewSessionProvider, useNewSession } from '@/components/new-session/NewSessionContext';
import { NewSessionModal } from '@/components/new-session/NewSessionModal';
import { BusinessIdProvider } from '@/lib/hooks/use-business-id';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useBusinessMemberRole, usePermissions } from '@/lib/hooks/use-permissions';
import { OnboardingProvider, useOnboardingContext } from '@/components/onboarding/OnboardingProvider';
import { WelcomeModal } from '@/components/onboarding/WelcomeModal';
import { CongratsModal } from '@/components/onboarding/CongratsModal';
import { DashboardHeaderActions } from './DashboardHeaderActions';
import { BusinessSwitcher } from '@/components/BusinessSwitcher';
import { apiClient } from '@/lib/api-client';
import { usePWAInstall } from '@/lib/hooks/use-pwa-install';
import { PWAInstallBanner } from '@/components/pwa/PWAInstallBanner';
import { PWAFirstLoginModal } from '@/components/pwa/PWAFirstLoginModal';
import { MobileShell, type MobileView } from '@/components/mobile/MobileShell';

// Routes the mobile shell renders natively via its own tab navigation. Anything
// else under (dashboard) is shown as a pushed overlay inside the shell so the
// "More" menu destinations (Intake Forms, Promotions, etc.) work on mobile.
const MOBILE_CORE_ROUTES: Record<string, MobileView> = {
  dashboard:    'dashboard',
  appointments: 'appts',
  clients:      'clients',
  messages:     'messages',
  payments:     'payments',
  settings:     'settings',
};

// Titles for the pushed-overlay header, keyed by the first path segment.
const MOBILE_ROUTE_TITLES: Record<string, string> = {
  'intake-forms':     'Intake Forms',
  'therapists':       'Therapists',
  'inventory':        'Inventory',
  'telehealth':       'Telehealth',
  'insurance-claims': 'Insurance',
  'promotions':       'Promotions',
  'gift-cards':       'Gift Cards',
  'loyalty':          'Loyalty',
  'analytics':        'Analytics',
  'reports':          'Reports',
  'automation':       'Automation',
  'exports':          'Exports',
  'payroll':          'Payroll',
  'invoices':         'Invoices',
  'services':         'Services',
  'packages':         'Packages',
  'memberships':      'Memberships',
  'communications':   'Communications',
  'treatment-notes':  'Treatment Notes',
  'tasks':            'Tasks',
};

// Title-case a path segment as a fallback when not in the explicit map.
function segmentToTitle(seg: string): string {
  return seg
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Prefetch all main pages' API data in the background so navigation is instant.
// Query keys and return shapes must match exactly what each page's hook uses.
// Runs once after the businessId is known.
function BackgroundPrefetcher() {
  const businessId = useBusinessId();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!businessId) return;
    const STALE = 5 * 60 * 1000;
    const prefetch = (key: unknown[], fn: () => Promise<unknown>) =>
      queryClient.prefetchQuery({ queryKey: key, queryFn: fn, staleTime: STALE });

    // useDashboard(businessId) → ['dashboard', businessId]
    prefetch(['dashboard', businessId], () =>
      apiClient.get('/dashboard', { params: { businessId } }).then((r) => r.data.data)
    );

    // useClientsWithMeta(businessId, { search:undefined, page:1, limit:20, filter:'all' })
    // undefined properties are omitted by JSON.stringify so the hash matches { page:1, limit:20, filter:'all' }
    prefetch(['clients-meta', businessId, { page: 1, limit: 20, filter: 'all' }], async () => {
      const p = new URLSearchParams({ businessId, page: '1', limit: '20' });
      const r = await apiClient.get(`/clients?${p}`);
      return { data: r.data.data, meta: r.data.meta, counts: r.data.counts };
    });

    // usePayments(businessId, {}) → ['payments', businessId, {}], returns response.data
    prefetch(['payments', businessId, {}], () =>
      apiClient.get('/payments', { params: { businessId } }).then((r) => r.data)
    );

    // useTherapists(businessId) → ['therapists', businessId, undefined], returns response.data.data
    prefetch(['therapists', businessId, undefined], () =>
      apiClient.get('/therapists', { params: { businessId } }).then((r) => r.data.data)
    );

    // useConversations(businessId, {}) → ['conversations', businessId, {}], returns response.data
    prefetch(['conversations', businessId, {}], () =>
      apiClient.get('/conversations', { params: { businessId } }).then((r) => r.data)
    );

    // useInvoices(businessId, {}) → ['invoices', businessId, {}], returns response.data
    prefetch(['invoices', businessId, {}], () =>
      apiClient.get('/invoices', { params: { businessId } }).then((r) => r.data)
    );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  return null;
}

function CalendarPlusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2zm7-8v4m-2-2h4"
      />
    </svg>
  );
}

/** Maps the global Supabase UserRole to a BusinessMemberRole string for immediate sidebar rendering
 *  while the per-business role is still loading from the API. */
function mapGlobalRole(globalRole: string | null): string | null {
  switch (globalRole) {
    case 'BUSINESS_OWNER': return 'OWNER';
    case 'RECEPTIONIST': return 'RECEPTIONIST';
    case 'THERAPIST': return 'THERAPIST';
    case 'SUPER_ADMIN': return 'SUPER_ADMIN';
    default: return null;
  }
}

function NewSessionButton() {
  const { openNewSession } = useNewSession();
  return (
    <button
      onClick={openNewSession}
      className="iris-cta flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
      style={{
        background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)',
        color: '#FFFFFF',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.16), 0 1px 2px rgba(28,20,54,0.16)',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      <CalendarPlusIcon />
      <span className="hidden sm:inline">New session</span>
    </button>
  );
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { role: globalRole } = useRole();
  const businessId = useBusinessId();
  const { role: businessMemberRole } = useBusinessMemberRole(businessId);
  const { permissions } = usePermissions(businessId);
  // Use the resolved business role once loaded, fall back to mapped global role to avoid flash
  const role = businessMemberRole ?? mapGlobalRole(globalRole);
  const {
    loaded,
    welcomeShown,
    setWelcomeShown,
    allDone,
    congratsShown,
    setCongratsShown,
    dismissChecklist,
  } = useOnboardingContext();

  const { canInstall, hasManualInstall, browserType, triggerInstall } = usePWAInstall();

  const firstName = user?.user_metadata?.first_name ?? '';
  const lastName = user?.user_metadata?.last_name ?? '';
  const initials = firstName
    ? `${firstName[0]}${lastName?.[0] ?? ''}`.toUpperCase()
    : 'U';
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'My Account';
  const email = user?.email ?? '';

  // ≤767px: render mobile shell instead of desktop sidebar layout
  if (isMobile) {
    const seg = (pathname?.split('/')[1] ?? '') || 'dashboard';
    const coreView = MOBILE_CORE_ROUTES[seg];
    // Non-core routes (Intake Forms, Promotions, …) render their real page as a
    // pushed overlay inside the device frame, with a back button.
    const routeOverlay = coreView
      ? null
      : { title: MOBILE_ROUTE_TITLES[seg] ?? segmentToTitle(seg), node: children };

    const handleRouteBack = () => {
      if (typeof window !== 'undefined' && window.history.length > 1) {
        router.back();
      } else {
        router.push('/dashboard');
      }
    };

    return (
      <>
        <MobileShell
          initialView={coreView ?? 'dashboard'}
          routeOverlay={routeOverlay}
          onRouteBack={handleRouteBack}
        />
        <NewSessionModal />
        {/* Warm core screen data on mobile too, so tab switches render instantly. */}
        <BackgroundPrefetcher />
      </>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F3F4F7' }}>
      <Sidebar
        userRole={role}
        permissions={permissions.length > 0 ? permissions : undefined}
        userName={fullName}
        userEmail={email}
        userInitials={initials}
        onSignOut={signOut}
        onInstallApp={
          canInstall ? triggerInstall :
          // Manual-install browsers: badge shows, clicking navigates to Account settings
          hasManualInstall && browserType !== 'unsupported' ? () => router.push('/settings?tab=account') :
          undefined
        }
      />

      <div className="flex flex-1 flex-col overflow-hidden lg:ml-[230px]">
        <Header
          userInitials={initials}
          userName={fullName}
          userMenu={
            <div className="flex items-center gap-2 sm:gap-2.5">
              <BusinessSwitcher />
              <DashboardHeaderActions />
              <NewSessionButton />
            </div>
          }
        />

        <main className="flex-1 overflow-y-auto" style={{ background: '#F3F4F7', padding: '24px 28px 32px' }}>
          {children}
        </main>
      </div>

      <BackgroundPrefetcher />
      <QuickCallModal />
      <NewSessionModal />
      <PWAInstallBanner />
      <PWAFirstLoginModal />

      {loaded && !welcomeShown && (
        <WelcomeModal
          firstName={firstName}
          onStart={() => { setWelcomeShown(true); router.push('/setup'); }}
          onSkip={() => setWelcomeShown(true)}
        />
      )}

      {loaded && allDone && !congratsShown && (
        <CongratsModal
          firstName={firstName}
          onClose={() => {
            setCongratsShown(true);
            dismissChecklist();
          }}
        />
      )}
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <BusinessIdProvider>
      <OnboardingProvider>
        <QuickCallProvider>
          <NewSessionProvider>
            <DashboardContent>{children}</DashboardContent>
          </NewSessionProvider>
        </QuickCallProvider>
      </OnboardingProvider>
    </BusinessIdProvider>
  );
}
