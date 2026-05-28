'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PortalShell } from '../components/PortalShell';
import { FolderOpen, Loader2, FileText, User } from 'lucide-react';

export default function PortalDocuments() {
  const supabase = createClient();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/client-portal/documents', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const { data } = await res.json();
      setDocs(data ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <PortalShell>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1E1830' }}>Documents</h1>
          <p className="text-sm mt-1" style={{ color: '#7A7090' }}>
            Treatment summaries and documents shared by your care team.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#5D4AA8' }} />
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="h-10 w-10 mx-auto mb-3" style={{ color: '#D1C9E6' }} />
            <p className="text-sm font-medium" style={{ color: '#7A7090' }}>No documents yet</p>
            <p className="text-xs mt-1" style={{ color: '#9E96B0' }}>
              Your practitioner will share approved treatment summaries here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {docs.map((doc: any) => {
              const therapistName = [doc.therapist?.user?.firstName, doc.therapist?.user?.lastName].filter(Boolean).join(' ');
              return (
                <div key={doc.id} className="rounded-xl p-4 flex items-center gap-3" style={{ background: '#fff', border: '1px solid #EFE9F2' }}>
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#EDE5F4' }}>
                    <FileText className="h-4 w-4" style={{ color: '#5D4AA8' }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate" style={{ color: '#1E1830' }}>
                      {doc.title ?? 'Treatment Note'}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {therapistName && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: '#9E96B0' }}>
                          <User className="h-3 w-3" /> {therapistName}
                        </span>
                      )}
                      <span className="text-xs" style={{ color: '#9E96B0' }}>
                        {new Date(doc.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
