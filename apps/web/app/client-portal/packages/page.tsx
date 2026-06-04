'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PortalShell } from '../components/PortalShell';
import { Package, Loader2, RefreshCw } from 'lucide-react';

function fmt(n: number, currency = 'AUD') {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(n);
}

function MembershipStatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    ACTIVE: { bg: '#D1FAE5', color: '#065F46' },
    PAUSED: { bg: '#FEF3C7', color: '#92400E' },
    CANCELLED: { bg: '#FEE2E2', color: '#991B1B' },
    EXPIRED: { bg: '#F3F4F6', color: '#6B7280' },
  };
  const s = map[status] ?? { bg: '#F3F4F6', color: '#6B7280' };
  return (
    <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

function PackageStatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    ACTIVE: { bg: '#D1FAE5', color: '#065F46' },
    COMPLETED: { bg: '#DBEAFE', color: '#1E40AF' },
    EXPIRED: { bg: '#F3F4F6', color: '#6B7280' },
    CANCELLED: { bg: '#FEE2E2', color: '#991B1B' },
  };
  const s = map[status] ?? { bg: '#F3F4F6', color: '#6B7280' };
  return (
    <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export default function PortalPackages() {
  const supabase = createClient();
  const [memberships, setMemberships] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const r = await fetch('/api/client-portal/packages', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const { data } = await r.json();
      setMemberships(data?.memberships ?? []);
      setPackages(data?.packages ?? []);
      setLoading(false);
    })();
  }, []);

  const hasContent = memberships.length > 0 || packages.length > 0;

  return (
    <PortalShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1E1830' }}>Packages & Memberships</h1>
          <p className="text-sm mt-1" style={{ color: '#7A7090' }}>Your active packages and membership status.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#5D4AA8' }} />
          </div>
        ) : !hasContent ? (
          <div className="text-center py-12">
            <Package className="h-10 w-10 mx-auto mb-3" style={{ color: '#D1C9E6' }} />
            <p className="text-sm font-medium" style={{ color: '#7A7090' }}>No packages or memberships</p>
            <p className="text-xs mt-1" style={{ color: '#9E96B0' }}>Ask your practitioner about available packages.</p>
          </div>
        ) : (
          <>
            {memberships.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold" style={{ color: '#3D3450' }}>Memberships</h2>
                {memberships.map((m: any) => {
                  const sessionsLeft = m.sessionsPerMonth - m.sessionsUsed + m.rolledOverSessions;
                  const nextBilling = m.nextBillingDate ? new Date(m.nextBillingDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
                  return (
                    <div key={m.id} className="rounded-xl p-4 space-y-3" style={{ background: '#fff', border: '1px solid #EFE9F2' }}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm" style={{ color: '#1E1830' }}>{m.name}</p>
                          {m.description && <p className="text-xs mt-0.5" style={{ color: '#9E96B0' }}>{m.description}</p>}
                        </div>
                        <MembershipStatusBadge status={m.status} />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg p-3" style={{ background: '#F8F5FF' }}>
                          <p className="text-xs font-medium mb-0.5" style={{ color: '#7A7090' }}>Sessions left</p>
                          <p className="text-lg font-bold" style={{ color: '#5D4AA8' }}>{sessionsLeft}</p>
                          <p className="text-xs" style={{ color: '#9E96B0' }}>of {m.sessionsPerMonth}/month</p>
                        </div>
                        <div className="rounded-lg p-3" style={{ background: '#F8F5FF' }}>
                          <p className="text-xs font-medium mb-0.5" style={{ color: '#7A7090' }}>Monthly cost</p>
                          <p className="text-lg font-bold" style={{ color: '#5D4AA8' }}>{fmt(m.price, m.currency)}</p>
                          {nextBilling && <p className="text-xs" style={{ color: '#9E96B0' }}>Renews {nextBilling}</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </section>
            )}

            {packages.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold" style={{ color: '#3D3450' }}>Session Packages</h2>
                {packages.map((p: any) => {
                  const sessionsLeft = p.totalSessions - p.sessionsUsed;
                  const pct = Math.round((p.sessionsUsed / p.totalSessions) * 100);
                  const expiresDate = p.expirationDate ? new Date(p.expirationDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
                  return (
                    <div key={p.id} className="rounded-xl p-4 space-y-3" style={{ background: '#fff', border: '1px solid #EFE9F2' }}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm" style={{ color: '#1E1830' }}>{p.name}</p>
                          {p.description && <p className="text-xs mt-0.5" style={{ color: '#9E96B0' }}>{p.description}</p>}
                        </div>
                        <PackageStatusBadge status={p.status} />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1.5" style={{ color: '#7A7090' }}>
                          <span>{sessionsLeft} sessions remaining</span>
                          <span>{p.sessionsUsed} / {p.totalSessions} used</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: '#EFE9F2' }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #5D4AA8, #8B73D4)' }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1" style={{ color: '#9E96B0' }}>
                        <span>Purchased {new Date(p.purchasedAt).toLocaleDateString('en-AU')}</span>
                        {expiresDate && <span className="flex items-center gap-1"><RefreshCw className="h-3 w-3" />Expires {expiresDate}</span>}
                      </div>
                    </div>
                  );
                })}
              </section>
            )}
          </>
        )}
      </div>
    </PortalShell>
  );
}
