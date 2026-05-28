'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PortalShell } from '../components/PortalShell';
import { Calendar, Clock, MapPin, User, Loader2 } from 'lucide-react';

function formatDateTime(dt: string) {
  const d = new Date(dt);
  return {
    date: d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }),
    time: d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),
  };
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    SCHEDULED: { bg: '#EDE5F4', color: '#5D4AA8', label: 'Scheduled' },
    CONFIRMED: { bg: '#D1FAE5', color: '#065F46', label: 'Confirmed' },
    COMPLETED: { bg: '#E5F5EC', color: '#1a6b38', label: 'Completed' },
    CANCELLED: { bg: '#FEE2E2', color: '#991B1B', label: 'Cancelled' },
    NO_SHOW: { bg: '#FEF3C7', color: '#92400E', label: 'No-show' },
  };
  const s = map[status] ?? { bg: '#F3F4F6', color: '#6B7280', label: status };
  return (
    <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function AppointmentCard({ appt }: { appt: any }) {
  const { date, time } = formatDateTime(appt.startTime);
  const therapistName = [appt.therapist?.user?.firstName, appt.therapist?.user?.lastName].filter(Boolean).join(' ');
  return (
    <div className="rounded-xl p-4 space-y-3" style={{ background: '#fff', border: '1px solid #EFE9F2' }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-sm" style={{ color: '#1E1830' }}>{appt.serviceType ?? 'Appointment'}</p>
          <p className="text-xs mt-0.5" style={{ color: '#7A7090' }}>{appt.duration} min</p>
        </div>
        <StatusBadge status={appt.status} />
      </div>
      <div className="space-y-1.5 text-sm" style={{ color: '#4B4466' }}>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 flex-shrink-0" style={{ color: '#9E96B0' }} />
          <span>{date}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 flex-shrink-0" style={{ color: '#9E96B0' }} />
          <span>{time}</span>
        </div>
        {therapistName && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 flex-shrink-0" style={{ color: '#9E96B0' }} />
            <span>{therapistName}</span>
          </div>
        )}
        {appt.location?.name && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 flex-shrink-0" style={{ color: '#9E96B0' }} />
            <span>{appt.location.name}{appt.location.city ? `, ${appt.location.city}` : ''}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PortalAppointments() {
  const supabase = createClient();
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [past, setPast] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const token = session.access_token;

      const [upRes, pastRes] = await Promise.all([
        fetch('/api/client-portal/appointments?upcoming=true', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/client-portal/appointments?upcoming=false', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const [upData, pastData] = await Promise.all([upRes.json(), pastRes.json()]);
      setUpcoming(upData.data ?? []);
      setPast(pastData.data ?? []);
      setLoading(false);
    })();
  }, []);

  const list = tab === 'upcoming' ? upcoming : past;

  return (
    <PortalShell>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1E1830' }}>Appointments</h1>
          <p className="text-sm mt-1" style={{ color: '#7A7090' }}>View your upcoming and past appointments.</p>
        </div>

        <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#EFE9F2' }}>
          {(['upcoming', 'past'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors capitalize"
              style={tab === t ? { background: '#fff', color: '#5D4AA8', boxShadow: '0 1px 3px rgba(0,0,0,.08)' } : { color: '#7A7090' }}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#5D4AA8' }} />
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-10 w-10 mx-auto mb-3" style={{ color: '#D1C9E6' }} />
            <p className="text-sm font-medium" style={{ color: '#7A7090' }}>No {tab} appointments</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {list.map((appt: any) => (
              <AppointmentCard key={appt.id} appt={appt} />
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
