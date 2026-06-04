'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

// Prefetch the most-visited pages' API data in the background so navigating
// to them feels instant. Runs once after the businessId is known.
function BackgroundPrefetcher() {
  const businessId = useBusinessId();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!businessId) return;
    const prefetch = (key: unknown[], fn: () => Promise<unknown>) =>
      queryClient.prefetchQuery({ queryKey: key, queryFn: fn, staleTime: 5 * 60 * 1000 });

    prefetch(['appointments', businessId, {}], () =>
      apiClient.get('/appointments', { params: { businessId } }).then((r) => r.data.data)
    );
    prefetch(['clients', businessId, {}], () =>
      apiClient.get('/clients', { params: { businessId } }).then((r) => r.data.data)
    );
    prefetch(['payments', businessId, {}], () =>
      apiClient.get('/payments', { params: { businessId } }).then((r) => r.data.data)
    );
  // Only prefetch once per businessId
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

function DashboardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
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

  const firstName = user?.user_metadata?.first_name ?? '';
  const lastName = user?.user_metadata?.last_name ?? '';
  const initials = firstName
    ? `${firstName[0]}${lastName?.[0] ?? ''}`.toUpperCase()
    : 'U';
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'My Account';
  const email = user?.email ?? '';

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F3F4F7' }}>
      <Sidebar
        userRole={role}
        permissions={permissions.length > 0 ? permissions : undefined}
        userName={fullName}
        userEmail={email}
        userInitials={initials}
        onSignOut={signOut}
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
