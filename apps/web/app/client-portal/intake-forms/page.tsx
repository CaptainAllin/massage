'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PortalShell } from '../components/PortalShell';
import { FileText, Loader2, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';

export default function PortalIntakeForms() {
  const supabase = createClient();
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/client-portal/intake-forms', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const { data } = await res.json();
      setForms(data ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <PortalShell>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1E1830' }}>Intake Forms</h1>
          <p className="text-sm mt-1" style={{ color: '#7A7090' }}>View and complete your intake forms.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#5D4AA8' }} />
          </div>
        ) : forms.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-10 w-10 mx-auto mb-3" style={{ color: '#D1C9E6' }} />
            <p className="text-sm font-medium" style={{ color: '#7A7090' }}>No intake forms</p>
            <p className="text-xs mt-1" style={{ color: '#9E96B0' }}>Forms assigned to you by your practitioner will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {forms.map((form: any) => {
              const isCompleted = !!form.submittedAt;
              return (
                <div key={form.id} className="rounded-xl p-4 flex items-center justify-between gap-3" style={{ background: '#fff', border: '1px solid #EFE9F2' }}>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: isCompleted ? '#D1FAE5' : '#EDE5F4' }}>
                      {isCompleted ? <CheckCircle className="h-4 w-4" style={{ color: '#065F46' }} /> : <Clock className="h-4 w-4" style={{ color: '#5D4AA8' }} />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#1E1830' }}>
                        {form.template?.name ?? 'Intake Form'}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: '#9E96B0' }}>
                        {isCompleted
                          ? `Submitted ${new Date(form.submittedAt).toLocaleDateString('en-AU')}`
                          : `Sent ${new Date(form.createdAt).toLocaleDateString('en-AU')}`}
                      </p>
                    </div>
                  </div>

                  {!isCompleted && (
                    <Link
                      href={`/intake/${form.id}`}
                      className="text-sm font-semibold px-4 py-1.5 rounded-lg text-white flex-shrink-0"
                      style={{ background: '#5D4AA8' }}
                    >
                      Complete
                    </Link>
                  )}
                  {isCompleted && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: '#D1FAE5', color: '#065F46' }}>
                      Completed
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
