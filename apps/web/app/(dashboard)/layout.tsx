'use client';

import { Sidebar, Header } from '@massage/ui';
import { useAuth, useRole } from '@massage/auth';
import { QuickCallProvider, useQuickCall } from '@/components/quick-call/QuickCallContext';
import { QuickCallModal } from '@/components/quick-call/QuickCallModal';

function PhoneCallIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z"
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
      className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors shadow-sm"
    >
      <PhoneCallIcon />
      <span className="hidden sm:inline">Quick Call</span>
    </button>
  );
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const { role } = useRole();

  const initials = user?.user_metadata?.first_name
    ? `${user.user_metadata.first_name[0]}${user.user_metadata.last_name?.[0] || ''}`.toUpperCase()
    : 'U';

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userRole={role} />

      <div className="flex flex-1 flex-col overflow-hidden lg:ml-64">
        <Header
          userMenu={
            <div className="flex items-center gap-2 sm:gap-3">
              <QuickCallButton />
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-green-100 text-green-800 font-semibold text-sm border border-green-200 shadow-sm">
                  {initials}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-sm font-medium text-foreground">
                    {user?.user_metadata?.first_name} {user?.user_metadata?.last_name}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {role?.toLowerCase()?.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="text-xs sm:text-sm text-muted-foreground hover:text-foreground hover:bg-gray-100 px-2 sm:px-3 py-1.5 rounded-md border border-gray-200 transition-colors font-medium"
              >
                Sign Out
              </button>
            </div>
          }
        />

        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6">
          {children}
        </main>
      </div>

      <QuickCallModal />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <QuickCallProvider>
      <DashboardContent>{children}</DashboardContent>
    </QuickCallProvider>
  );
}
