'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PortalShell } from '../components/PortalShell';
import { Receipt, Loader2, Printer } from 'lucide-react';

function fmt(n: number, currency = 'AUD') {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(n);
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    PAID: { bg: '#D1FAE5', color: '#065F46' },
    UNPAID: { bg: '#FEE2E2', color: '#991B1B' },
    DRAFT: { bg: '#F3F4F6', color: '#6B7280' },
    SENT: { bg: '#DBEAFE', color: '#1E40AF' },
    OVERDUE: { bg: '#FEF3C7', color: '#92400E' },
  };
  const s = map[status] ?? { bg: '#F3F4F6', color: '#6B7280' };
  return (
    <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>
      {status}
    </span>
  );
}

export default function PortalInvoices() {
  const supabase = createClient();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/client-portal/invoices', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const { data } = await res.json();
      setInvoices(data ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <PortalShell>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1E1830' }}>Invoices</h1>
          <p className="text-sm mt-1" style={{ color: '#7A7090' }}>View your invoices and payment history.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#5D4AA8' }} />
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="h-10 w-10 mx-auto mb-3" style={{ color: '#D1C9E6' }} />
            <p className="text-sm font-medium" style={{ color: '#7A7090' }}>No invoices yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((inv: any) => (
              <div key={inv.id} className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid #EFE9F2' }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#1E1830' }}>
                      Invoice #{inv.number ?? inv.id.slice(-6).toUpperCase()}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#9E96B0' }}>
                      {new Date(inv.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <StatusBadge status={inv.status} />
                </div>

                {/* Line items */}
                {inv.lineItems?.length > 0 && (
                  <div className="space-y-1 mb-3">
                    {inv.lineItems.map((li: any, i: number) => (
                      <div key={i} className="flex justify-between text-sm" style={{ color: '#4B4466' }}>
                        <span>{li.description}</span>
                        <span>{fmt(li.total ?? li.unitPrice * li.quantity, inv.currency)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center pt-3" style={{ borderTop: '1px solid #EFE9F2' }}>
                  <span className="text-sm font-semibold" style={{ color: '#1E1830' }}>Total</span>
                  <span className="text-sm font-bold" style={{ color: '#5D4AA8' }}>
                    {fmt(inv.total ?? 0, inv.currency)}
                  </span>
                </div>

                <div className="mt-3 flex gap-2">
                  {inv.status === 'UNPAID' && inv.stripePaymentUrl && (
                    <a
                      href={inv.stripePaymentUrl}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white"
                      style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)' }}
                    >
                      Pay now
                    </a>
                  )}
                  <a
                    href={`/api/client-portal/invoices/${inv.id}/receipt`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium"
                    style={{ background: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB' }}
                    title="Download receipt"
                  >
                    <Printer className="h-4 w-4" />
                    <span className="hidden sm:inline">Receipt</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
