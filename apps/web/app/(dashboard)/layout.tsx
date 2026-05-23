'use client';

import { Sidebar, Header } from '@massage/ui';
import { useAuth, useRole } from '@massage/auth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, signOut } = useAuth();
  const { role } = useRole();

  const initials = user?.user_metadata?.first_name 
    ? `${user.user_metadata.first_name[0]}${user.user_metadata.last_name?.[0] || ''}`.toUpperCase()
    : 'U';

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar userRole={role} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden lg:ml-64">
        {/* Header */}
        <Header
          userMenu={
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-800 font-semibold text-sm border border-green-200 shadow-sm">
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
                className="text-sm text-muted-foreground hover:text-foreground hover:bg-gray-100 px-3 py-1.5 rounded-md border border-gray-200 transition-colors font-medium ml-2"
              >
                Sign Out
              </button>
            </div>
          }
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
