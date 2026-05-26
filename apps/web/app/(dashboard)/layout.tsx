'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sidebar, Header } from '@massage/ui';
import { useAuth, useRole } from '@massage/auth';
import { QuickCallProvider, useQuickCall } from '@/components/quick-call/QuickCallContext';
import { QuickCallModal } from '@/components/quick-call/QuickCallModal';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useAppointments } from '@/lib/hooks/use-appointments';
import { OnboardingProvider, useOnboardingContext } from '@/components/onboarding/OnboardingProvider';
import { WelcomeModal } from '@/components/onboarding/WelcomeModal';
import { OnboardingProgressBar } from '@/components/onboarding/OnboardingProgressBar';
import { CongratsModal } from '@/components/onboarding/CongratsModal';

function PhoneCallIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z"
      />
    </svg>
  );
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

function QuickCallButton() {
  const { openQuickCall } = useQuickCall();
  return (
    <button
      onClick={() => openQuickCall()}
      title="Quick Call Intake"
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
      style={{ border: '1px solid #E5DEEC', background: '#FFFFFF', color: '#3D3450' }}
    >
      <PhoneCallIcon />
      <span className="hidden sm:inline">Quick Call</span>
    </button>
  );
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { role } = useRole();
  const businessId = useBusinessId();
  const {
    loaded,
    welcomeShown,
    setWelcomeShown,
    checklistDismissed,
    dismissChecklist,
    reopenChecklist,
    completedCount,
    totalCount,
    progressPct,
    allDone,
    congratsShown,
    setCongratsShown,
    whatsNewDismissed,
    dismissWhatsNew,
  } = useOnboardingContext();

  // Memoized so React Query sees a stable query key — avoids re-fetching on
  // every layout render (layout stays mounted across all dashboard pages).
  const [today, tomorrow] = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const t = new Date(d);
    t.setDate(t.getDate() + 1);
    return [d, t];
  }, []);

  const { data: appointmentsData } = useAppointments(
    businessId || '',
    { startDate: today, endDate: tomorrow }
  );
  const sessionCount = appointmentsData?.data?.length;

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
        onGetStarted={reopenChecklist}
        onboardingProgress={progressPct}
        whatsNewCount={whatsNewDismissed ? 0 : 4}
        onWhatsNew={dismissWhatsNew}
      />

      <div className="flex flex-1 flex-col overflow-hidden lg:ml-[230px]">
        <Header
          userInitials={initials}
          userName={fullName}
          sessionCount={sessionCount}
          userMenu={
            <div className="flex items-center gap-2 sm:gap-3">
              <QuickCallButton />
              <Link
                href="/appointments"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                style={{
                  background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 16px rgba(93,74,168,0.26)',
                }}
              >
                <CalendarPlusIcon />
                <span className="hidden sm:inline">New session</span>
              </Link>
            </div>
          }
        />

        <main className="flex-1 overflow-y-auto" style={{ background: '#F3F4F7', padding: '24px 28px 32px' }}>
          {loaded && !checklistDismissed && !allDone && (
            <OnboardingProgressBar
              completedCount={completedCount}
              totalCount={totalCount}
              progressPct={progressPct}
              onDismiss={dismissChecklist}
            />
          )}
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
    <OnboardingProvider>
      <QuickCallProvider>
        <DashboardContent>{children}</DashboardContent>
      </QuickCallProvider>
    </OnboardingProvider>
  );
}
