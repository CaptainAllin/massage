'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Calendar, FileText, Receipt, LogOut, Loader2, FolderOpen } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/client-portal/appointments', label: 'Appointments', icon: Calendar },
  { href: '/client-portal/invoices', label: 'Invoices', icon: Receipt },
  { href: '/client-portal/intake-forms', label: 'Intake Forms', icon: FileText },
  { href: '/client-portal/documents', label: 'Documents', icon: FolderOpen },
];

interface ClientInfo {
  clientId: string;
  firstName: string;
  lastName: string;
  email: string;
  business: { name: string; logo: string | null; primaryColor: string | null };
}

export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/client-portal/sign-in'); return; }

      const res = await fetch('/api/client-portal/auth', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) { router.replace('/client-portal/sign-in'); return; }
      const { data } = await res.json();
      setClient(data);
      setLoading(false);
    })();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/client-portal/sign-in');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F3F4F7' }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#5D4AA8' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F3F4F7' }}>
      {/* Top nav */}
      <header className="sticky top-0 z-10" style={{ background: '#fff', borderBottom: '1px solid #EFE9F2' }}>
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)' }}
            >
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                <path d="M9 2C9 2 5 5.5 5 9.5C5 11.985 6.791 14 9 14C11.209 14 13 11.985 13 9.5C13 5.5 9 2 9 2Z" fill="white" opacity="0.9" />
                <path d="M9 14V16M6 15.5H12" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#1E1830' }}>
                {client?.business.name ?? 'Client Portal'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm" style={{ color: '#7A7090' }}>
              {client?.firstName} {client?.lastName}
            </span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: '#7A7090' }}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>

        {/* Tab nav */}
        <div className="max-w-4xl mx-auto px-4">
          <nav className="flex gap-1 -mb-px">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors"
                  style={{
                    borderBottomColor: active ? '#5D4AA8' : 'transparent',
                    color: active ? '#5D4AA8' : '#7A7090',
                  }}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  );
}
