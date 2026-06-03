'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Phone, Mail, MessageSquare, CalendarPlus, Link2, Check, Loader2, LayoutDashboard } from 'lucide-react';
import { Client } from '@massage/types';
import { APT_COLORS, APT_SOFT } from '@/lib/appointment-colors';

function colorIdx(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i)) % APT_COLORS.length;
  return h;
}

function calcAge(dob: Date | null): number | null {
  if (!dob) return null;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export interface ClientHeaderProps {
  client: Client;
  lifetimeSpent?: number;
  businessId?: string;
  onMessage?: () => void;
  onBook?: () => void;
}

export const ClientHeader: React.FC<ClientHeaderProps> = ({
  client,
  lifetimeSpent = 0,
  businessId,
  onMessage,
  onBook,
}) => {
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalSent, setPortalSent] = useState(false);

  const handleSendPortalInvite = async () => {
    if (!businessId || !client.email) return;
    setPortalLoading(true);
    try {
      await fetch(`/api/clients/${client.id}/portal-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId }),
      });
      setPortalSent(true);
      setTimeout(() => setPortalSent(false), 3000);
    } catch {
      // silently fail
    } finally {
      setPortalLoading(false);
    }
  };

  const handleSendInvite = async () => {
    if (!businessId) return;
    setInviteLoading(true);
    try {
      const r = await fetch(`/api/clients/${client.id}/booking-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, expiresInHours: 72 }),
      });
      const d = await r.json();
      if (d.success && d.data.bookingUrl) {
        await navigator.clipboard.writeText(d.data.bookingUrl);
        setInviteCopied(true);
        setTimeout(() => setInviteCopied(false), 3000);
      }
    } catch {
      // silently fail
    } finally {
      setInviteLoading(false);
    }
  };
  const fullName = `${client.firstName} ${client.lastName}`;
  const initials = `${client.firstName[0] || ''}${client.lastName[0] || ''}`.toUpperCase();
  const ci = colorIdx(client.id);
  const age = calcAge(client.dateOfBirth);

  const conditions: string[] = Array.isArray(client.medicalHistory?.conditions)
    ? client.medicalHistory.conditions
    : [];
  const allergies = client.allergies || [];

  const cadence = (() => {
    if (!client.lastVisitDate || client.totalVisits < 2) return '—';
    const msPerVisit =
      (new Date(client.lastVisitDate).getTime() - new Date(client.createdAt).getTime()) /
      (client.totalVisits - 1);
    const days = Math.round(msPerVisit / 86_400_000);
    if (days <= 10) return 'Weekly';
    if (days <= 20) return 'Bi-weekly';
    if (days <= 40) return 'Monthly';
    return `Every ${days}d`;
  })();

  const lastVisitLabel = client.lastVisitDate
    ? `Last: ${new Date(client.lastVisitDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })}`
    : 'No visits yet';

  return (
    <div
      className="bg-white rounded-[22px] border border-iris-line2 overflow-hidden relative"
      style={{ boxShadow: 'none' }}
    >
      {/* Radial violet halo — top-right */}
      <div
        className="pointer-events-none absolute top-0 right-0 w-72 h-48"
        style={{ background: 'radial-gradient(circle at top right, #5D4AA811, transparent 70%)' }}
      />

      <div className="px-7 py-6 relative">
        {/* 7.1.1 Breadcrumb */}
        <nav className="flex items-center gap-1.5 mb-5">
          <Link
            href="/clients"
            className="flex items-center gap-1 text-iris-muted hover:text-iris-primary transition-colors text-[13px]"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-iris-primary" strokeWidth={2.5} />
            Clients
          </Link>
          <span className="text-iris-muted text-[13px]">/</span>
          <span className="text-iris-ink text-[13px] font-medium">{fullName}</span>
        </nav>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-5">
            {/* 7.1.2 Large avatar */}
            <div
              className="w-[72px] h-[72px] rounded-full flex items-center justify-center flex-shrink-0 text-2xl font-semibold select-none"
              style={{ background: APT_SOFT[ci], color: APT_COLORS[ci] }}
            >
              {initials}
            </div>

            <div>
              {/* 7.1.3 Name + status pill */}
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-[22px] font-semibold text-iris-ink leading-tight">{fullName}</h1>
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-[3px] rounded-full text-[11.5px] font-medium"
                  style={{ background: '#EDE5F4', color: '#5D4AA8' }}
                >
                  <span
                    className="w-[6px] h-[6px] rounded-full"
                    style={{ background: '#5D4AA8' }}
                  />
                  {client.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* 7.1.4 Contact row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-iris-muted">
                {client.phoneNumber && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 flex-shrink-0" />
                    {client.phoneNumber}
                  </span>
                )}
                {client.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 flex-shrink-0" />
                    {client.email}
                  </span>
                )}
                {age !== null && <span>{age} yrs old</span>}
              </div>

              {/* 7.1.5 Tags */}
              {(conditions.length > 0 || allergies.length > 0) && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {conditions.slice(0, 4).map((cond: string) => (
                    <span
                      key={cond}
                      className="px-2.5 py-[2px] rounded-full text-[11px] font-medium"
                      style={{ background: '#EDE5F4', color: '#5D4AA8' }}
                    >
                      {cond}
                    </span>
                  ))}
                  {allergies.slice(0, 3).map((allergy) => (
                    <span
                      key={allergy}
                      className="px-2.5 py-[2px] rounded-full text-[11px] font-medium"
                      style={{ background: '#F7E5DD', color: '#C97E68' }}
                    >
                      ⚠ {allergy}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 7.1.6 Action buttons */}
          <div className="flex items-center gap-2.5 flex-shrink-0 mt-1">
            <button
              onClick={onMessage}
              className="flex items-center gap-2 px-4 py-[7px] rounded-full text-[13px] font-medium text-iris-ink border border-iris-line bg-white hover:bg-iris-soft1 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Message
            </button>
            {businessId && (
              <button
                onClick={handleSendInvite}
                disabled={inviteLoading}
                title="Copy invite link (expires in 72 hours)"
                className="flex items-center gap-2 px-4 py-[7px] rounded-full text-[13px] font-medium text-iris-ink border border-iris-line bg-white hover:bg-iris-soft1 transition-colors disabled:opacity-60"
              >
                {inviteLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : inviteCopied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Link2 className="w-4 h-4" />
                )}
                {inviteCopied ? 'Link copied!' : 'Send invite'}
              </button>
            )}
            {businessId && client.email && (
              <button
                onClick={handleSendPortalInvite}
                disabled={portalLoading}
                title="Send client portal invite email"
                className="flex items-center gap-2 px-4 py-[7px] rounded-full text-[13px] font-medium text-iris-ink border border-iris-line bg-white hover:bg-iris-soft1 transition-colors disabled:opacity-60"
              >
                {portalLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : portalSent ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <LayoutDashboard className="w-4 h-4" />
                )}
                {portalSent ? 'Invite sent!' : 'Portal invite'}
              </button>
            )}
            <button
              onClick={onBook}
              className="iris-cta flex items-center gap-2 px-4 py-[7px] rounded-full text-[13px] font-medium text-white iris-gradient-primary iris-shadow-cta"
            >
              <CalendarPlus className="w-4 h-4" />
              Book session
            </button>
          </div>
        </div>
      </div>

      {/* 7.2 KPI Row */}
      <div className="border-t border-iris-line2 grid grid-cols-4 divide-x divide-iris-line2">
        <KPICell
          label="Sessions"
          value={String(client.totalVisits)}
          sub={lastVisitLabel}
        />
        <KPICell
          label="Lifetime spent"
          value={`$${lifetimeSpent.toLocaleString()}`}
          sub="All time"
        />
        <KPICell
          label="Cadence"
          value={cadence}
          sub="Avg frequency"
        />
        <KPICell
          label="Since"
          value={new Date(client.createdAt).toLocaleDateString('en', { month: 'short', year: 'numeric' })}
          sub={client.isActive ? 'Active client' : 'Inactive'}
        />
      </div>
    </div>
  );
};

function KPICell({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="px-6 py-4">
      <p className="text-[10.5px] font-medium uppercase tracking-[1px] text-iris-muted mb-1">
        {label}
      </p>
      <p className="text-[22px] font-[500] text-iris-ink tabular-nums leading-tight">{value}</p>
      <p className="text-[11px] text-iris-muted mt-0.5">{sub}</p>
    </div>
  );
}
