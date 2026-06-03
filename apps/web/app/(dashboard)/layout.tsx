'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sidebar, Header } from '@massage/ui';
import { useAuth, useRole } from '@massage/auth';
import { QuickCallProvider } from '@/components/quick-call/QuickCallContext';
import { QuickCallModal } from '@/components/quick-call/QuickCallModal';
import { BusinessIdProvider } from '@/lib/hooks/use-business-id';
import { OnboardingProvider, useOnboardingContext } from '@/components/onboarding/OnboardingProvider';
import { WelcomeModal } from '@/components/onboarding/WelcomeModal';
import { CongratsModal } from '@/components/onboarding/CongratsModal';
import { DashboardHeaderActions } from './DashboardHeaderActions';

function CalendarPlusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2zm7-8v4m-2-2h4"
      />
    </svg>
  );
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { role } = useRole();
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
              <DashboardHeaderActions />
              <Link
                href="/appointments"
                className="iris-cta flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
                style={{
                  background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)',
                  color: '#FFFFFF',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.16), 0 1px 2px rgba(28,20,54,0.16)',
                }}
              >
                <CalendarPlusIcon />
                <span className="hidden sm:inline">New session</span>
              </Link>
            </div>
          }
        />

        <main className="flex-1 overflow-y-auto" style={{ background: '#F3F4F7', padding: '24px 28px 32px' }}>
          {children}
        </main>
      </div>

      <QuickCallModal />

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
          <DashboardContent>{children}</DashboardContent>
        </QuickCallProvider>
      </OnboardingProvider>
    </BusinessIdProvider>
  );
}
