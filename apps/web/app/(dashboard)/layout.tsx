'use client';

import { Sidebar, Header } from '@massage/ui';
import { UserButton } from '@clerk/nextjs';
import { useRole } from '@massage/auth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role } = useRole();

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
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: 'h-10 w-10',
                  },
                }}
              />
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
