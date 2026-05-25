'use client';

import Link from 'next/link';
import { useAuth } from '@massage/auth';
import { useAppointments } from '@/lib/hooks/use-appointments';
import { useClients } from '@/lib/hooks/use-clients';
import { useBusinessId } from '@/lib/hooks/use-business-id';

// ── Tiny stat card ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden"
      style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 2px 12px rgba(93,74,168,0.06)' }}
    >
      {/* radial halo */}
      <div
        className="absolute -top-6 -right-6 w-28 h-28 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(93,74,168,0.08), transparent 70%)' }}
      />
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p
            className="mb-2 uppercase tracking-widest"
            style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '1.4px', color: '#5D4AA8' }}
          >
            {label}
          </p>
          <p
            className="tabular-nums font-semibold"
            style={{ fontSize: '30px', color: '#1E1830', letterSpacing: '-0.8px', lineHeight: 1 }}
          >
            {value}
          </p>
          {sub && (
            <p className="mt-1.5 text-xs" style={{ color: '#7A7090' }}>
              {sub}
            </p>
          )}
        </div>
        <div
          className="rounded-xl flex items-center justify-center w-10 h-10 flex-shrink-0"
          style={{ background: accent ?? '#EDE5F4' }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

// ── Appointment row ───────────────────────────────────────────────────────────

function ApptRow({
  clientName,
  service,
  time,
  status,
}: {
  clientName: string;
  service: string;
  time: string;
  status: string;
}) {
  const statusColor: Record<string, { bg: string; text: string }> = {
    CONFIRMED: { bg: '#EDE5F4', text: '#5D4AA8' },
    PENDING: { bg: '#F7E5DD', text: '#C97E68' },
    COMPLETED: { bg: '#E5F5F0', text: '#2D8A67' },
    CANCELLED: { bg: '#F5E5E5', text: '#C94040' },
  };
  const s = statusColor[status] ?? { bg: '#EDE5F4', text: '#5D4AA8' };
  const label = status.charAt(0) + status.slice(1).toLowerCase();

  return (
    <div className="flex items-center gap-3 py-2.5 border-b last:border-0" style={{ borderColor: '#EFE9F2' }}>
      <div
        className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold"
        style={{ background: '#EDE5F4', color: '#5D4AA8' }}
      >
        {clientName.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: '#1E1830' }}>{clientName}</p>
        <p className="text-xs truncate" style={{ color: '#7A7090' }}>{service}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs font-medium" style={{ color: '#3D3450' }}>{time}</p>
        <span
          className="text-xs font-medium rounded-full px-2 py-0.5 mt-0.5 inline-block"
          style={{ background: s.bg, color: s.text, fontSize: '10px' }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

// ── Quick action button ───────────────────────────────────────────────────────

function QuickAction({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl transition-all group"
      style={{ background: '#EDE5F4', border: '1px solid #E5DEEC' }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
        style={{ background: 'linear-gradient(135deg, #5D4AA8, #7665C2)' }}
      >
        {icon}
      </div>
      <span className="text-xs font-semibold" style={{ color: '#3D3450' }}>{label}</span>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const businessId = useBusinessId();
  const firstName = user?.user_metadata?.first_name || '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: appointmentsData, isLoading: apptLoading } = useAppointments(
    businessId || '',
    { startDate: today, endDate: tomorrow }
  );

  const { data: clientsData, isLoading: clientsLoading } = useClients(
    businessId || '',
    { isActive: true }
  );

  const todayAppts = appointmentsData?.data ?? [];
  const totalClients = clientsData?.length ?? 0;
  const isLoading = apptLoading || clientsLoading;

  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6 max-w-6xl">

      {/* Greeting banner */}
      <div
        className="relative rounded-2xl px-6 py-5 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)', boxShadow: '0 8px 32px rgba(93,74,168,0.28)' }}
      >
        <div
          className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.08), transparent 70%)' }}
        />
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.6)', letterSpacing: '1.4px' }}>
          {dayName}, {dateStr}
        </p>
        <h1
          className="font-semibold"
          style={{ fontSize: '22px', color: '#fff', letterSpacing: '-0.4px', lineHeight: 1.2 }}
        >
          Good {getGreeting()}, {firstName || 'there'} 👋
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {isLoading
            ? 'Loading your day…'
            : todayAppts.length === 0
              ? 'No appointments scheduled for today.'
              : `You have ${todayAppts.length} appointment${todayAppts.length !== 1 ? 's' : ''} today.`}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Sessions"
          value={isLoading ? '—' : todayAppts.length}
          sub={todayAppts.length === 0 ? 'None scheduled' : 'Scheduled today'}
          icon={
            <svg width="18" height="18" fill="none" stroke="#5D4AA8" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
        />
        <StatCard
          label="Active Clients"
          value={isLoading ? '—' : totalClients}
          sub={totalClients === 0 ? 'Add your first client' : 'In your practice'}
          icon={
            <svg width="18" height="18" fill="none" stroke="#5D4AA8" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
          }
        />
        <StatCard
          label="This Month"
          value="$0"
          sub="Revenue — coming soon"
          accent="#F7E5DD"
          icon={
            <svg width="18" height="18" fill="none" stroke="#C97E68" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          }
        />
        <StatCard
          label="Pending Forms"
          value="0"
          sub="Intake forms — coming soon"
          icon={
            <svg width="18" height="18" fill="none" stroke="#5D4AA8" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
            </svg>
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Today's appointments */}
        <div
          className="lg:col-span-2 rounded-2xl p-5"
          style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 2px 12px rgba(93,74,168,0.06)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold" style={{ fontSize: '15px', color: '#1E1830' }}>
              Today's Sessions
            </h2>
            <Link
              href="/appointments"
              className="text-xs font-semibold transition-colors"
              style={{ color: '#5D4AA8' }}
            >
              View all →
            </Link>
          </div>
          {isLoading ? (
            <p className="text-sm py-6 text-center" style={{ color: '#7A7090' }}>Loading…</p>
          ) : todayAppts.length === 0 ? (
            <div className="py-8 text-center">
              <div
                className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                style={{ background: '#EDE5F4' }}
              >
                <svg width="22" height="22" fill="none" stroke="#5D4AA8" strokeWidth="1.8" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <p className="text-sm font-medium" style={{ color: '#3D3450' }}>No sessions today</p>
              <p className="text-xs mt-0.5" style={{ color: '#7A7090' }}>Schedule an appointment to get started</p>
              <Link
                href="/appointments"
                className="inline-block mt-4 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)' }}
              >
                + New Appointment
              </Link>
            </div>
          ) : (
            <div>
              {todayAppts.slice(0, 6).map((appt: any) => {
                const clientName = appt.client
                  ? `${appt.client.firstName} ${appt.client.lastName}`
                  : 'Unknown Client';
                const time = new Date(appt.startTime).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                });
                return (
                  <ApptRow
                    key={appt.id}
                    clientName={clientName}
                    service={appt.serviceType ?? 'Session'}
                    time={time}
                    status={appt.status ?? 'CONFIRMED'}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div
          className="rounded-2xl p-5"
          style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 2px 12px rgba(93,74,168,0.06)' }}
        >
          <h2 className="font-semibold mb-4" style={{ fontSize: '15px', color: '#1E1830' }}>
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction
              href="/appointments"
              label="New Appointment"
              icon={
                <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="12" y1="12" x2="12" y2="16" /><line x1="10" y1="14" x2="14" y2="14" />
                </svg>
              }
            />
            <QuickAction
              href="/clients"
              label="Add Client"
              icon={
                <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="16" y1="11" x2="22" y2="11" />
                </svg>
              }
            />
            <QuickAction
              href="/treatment-notes/new"
              label="New SOAP Note"
              icon={
                <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="13" x2="12" y2="17" /><line x1="10" y1="15" x2="14" y2="15" />
                </svg>
              }
            />
            <QuickAction
              href="/messages"
              label="Messages"
              icon={
                <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
