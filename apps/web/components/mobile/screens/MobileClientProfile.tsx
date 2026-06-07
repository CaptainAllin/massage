'use client';

import React from 'react';
import { Avatar, Card, Tag, StatusChip, SectionHead } from '../primitives';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useClient } from '@/lib/hooks/use-clients';
import { useAppointments } from '@/lib/hooks/use-appointments';
import type { MobileRouter } from '../MobileShell';
import type { MobileClient } from './MobileClients';
import type { MobileConversation } from './MobileMessages';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MobileClientProfileProps {
  router: MobileRouter;
  param: unknown;
}

interface UpcomingAppt {
  dayAbbr: string;
  date: number;
  month: string;
  time: string;
  service: string;
  duration: string;
  therapist: string;
  status: string;
}

interface VisitRow {
  service: string;
  date: string;
  amount: number;
}

// ─── Formatters ───────────────────────────────────────────────────────────────

const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmtDate(d: Date | null): string {
  if (!d) return 'No visits';
  const date = new Date(d);
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function fmtLifetime(amount: number): string {
  return amount >= 1000 ? `$${(amount / 1000).toFixed(1)}k` : `$${amount}`;
}

function apptToUpcoming(appt: any): UpcomingAppt {
  const start = new Date(appt.startTime);
  const therapistUser = appt.therapist?.user;
  const therapistName = therapistUser
    ? `${therapistUser.firstName ?? ''} ${(therapistUser.lastName ?? '').charAt(0)}.`.trim()
    : '—';
  return {
    dayAbbr:  DAYS[start.getDay()],
    date:     start.getDate(),
    month:    MONTHS[start.getMonth()],
    time:     start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    service:  appt.serviceType || 'Session',
    duration: `${appt.duration} min`,
    therapist: therapistName,
    status:   (appt.status as string).toLowerCase(),
  };
}

function apptToVisit(appt: any): VisitRow {
  const date = new Date(appt.startTime);
  return {
    service: appt.serviceType || 'Session',
    date:    new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date),
    amount:  appt.price ?? 0,
  };
}

// ─── Action Button ────────────────────────────────────────────────────────────

interface ActionBtnProps {
  label: string;
  icon: React.ReactNode;
  primary?: boolean;
  onClick?: () => void;
  href?: string;
}

function ActionBtn({ label, icon, primary = false, onClick, href }: ActionBtnProps) {
  const style: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    padding: '13px 8px',
    borderRadius: 16,
    background: primary ? 'var(--m-grad)' : 'var(--m-surface)',
    border: primary ? 'none' : '1px solid var(--m-line)',
    cursor: 'pointer',
    color: primary ? '#fff' : 'var(--m-ink)',
    textDecoration: 'none',
  };

  const inner = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', lineHeight: 1 }}>
        {label}
      </span>
    </>
  );

  if (href) {
    return (
      <a href={href} className="im-tab im-press" style={style}>
        {inner}
      </a>
    );
  }

  return (
    <button className="im-tab im-press" onClick={onClick} style={style}>
      {inner}
    </button>
  );
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function MessageIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
        stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="2" />
      <path d="M8 2v4M16 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PhoneIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.8 12.8 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.8 12.8 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke="var(--m-accent-dk)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="var(--m-accent-dk)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Client Profile Screen ────────────────────────────────────────────────────

export function MobileClientProfile({ router, param }: MobileClientProfileProps) {
  const client = param as MobileClient;
  const businessId = useBusinessId();

  // 5.4.2 Real client data (phone, allergies, totalVisits, lastVisitDate)
  const { data: realClient } = useClient(client?.id ?? '', businessId);

  // 5.6.2 Upcoming appointments for this client
  const { data: upcomingData } = useAppointments(businessId, {
    clientId: client?.id,
    startDate: new Date().toISOString(),
    sortOrder: 'asc',
    limit: 1,
  } as any);

  // 5.7.2 Past completed visits
  const { data: pastData } = useAppointments(businessId, {
    clientId: client?.id,
    status: 'COMPLETED' as any,
    sortBy: 'startTime',
    sortOrder: 'desc',
    limit: 10,
  } as any);

  if (!client) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: 24 }}>
        <div style={{ color: 'var(--m-muted)', fontSize: 14, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
          No client selected.
        </div>
      </div>
    );
  }

  // ─── Derived data ───────────────────────────────────────────────────────────

  // 5.5.3 Real allergies array
  const allergies: string[] = realClient?.allergies ?? [];
  const hasAllergy = allergies.length > 0 || client.tags.includes('Allergies');
  const allergyText = allergies.length > 0 ? allergies.join(', ') : 'Client has reported allergies. Review intake form before session.';

  // 5.4.2 Real KPI values
  const visitCount = realClient?.totalVisits ?? client.visitCount;
  const lastVisitLabel = fmtDate(realClient?.lastVisitDate ?? null) || client.lastVisit;
  const pastVisits: VisitRow[] = (pastData?.data as any[] | undefined)?.map(apptToVisit) ?? null as any;
  const lifetimeAmount = pastVisits
    ? pastVisits.reduce((sum, v) => sum + v.amount, 0)
    : visitCount * 115;

  // 5.6.1 Upcoming appointment from real data
  const rawUpcoming = (upcomingData?.data as any[] | undefined)?.[0] ?? null;
  const upcoming: UpcomingAppt | null = rawUpcoming ? apptToUpcoming(rawUpcoming) : null;

  // 5.3.5 Real phone number
  const phoneNumber = realClient?.phoneNumber ?? null;

  // 5.3.4 Thread conversation context
  const threadConvo: MobileConversation = {
    id: `client-${client.id}`,
    clientId: client.id,
    clientName: client.name,
    channel: 'sms',
    preview: '',
    timestamp: '',
    unreadCount: 0,
    memberIds: [],
    messages: [],
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', paddingBottom: 40 }}
         className="im-scroll">

      {/* 5.1.1 Back button */}
      <div style={{ padding: '16px 16px 0' }}>
        <button
          className="im-tab im-press"
          onClick={() => router.goBack()}
          aria-label="Back to clients"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--m-primary)',
            fontSize: 14,
            fontWeight: 600,
            fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            padding: '12px 0',
            minHeight: 44,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="var(--m-primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Clients
        </button>
      </div>

      {/* 5.2 Profile hero */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '20px 16px 24px',
          gap: 8,
        }}
      >
        <Avatar name={client.name} size={84} color={client.therapistColor} />

        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: 'var(--m-ink)',
            fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            letterSpacing: -0.5,
            margin: '4px 0 0',
            textAlign: 'center',
          }}
        >
          {client.name}
        </h1>

        {client.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            {client.tags.map((tag) => (
              <Tag key={tag} label={tag} />
            ))}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: 'var(--m-muted)',
            fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: client.therapistColor, flexShrink: 0 }} />
          Sees {client.therapist}
        </div>
      </div>

      {/* 5.3 Quick actions — 5.3.4 Message→Thread, 5.3.5 Call→tel: */}
      <div style={{ padding: '0 16px 20px', display: 'flex', gap: 10 }}>
        <ActionBtn
          label="Message"
          primary
          icon={<MessageIcon color="#fff" />}
          onClick={() => router.navigate('thread', threadConvo)}
        />
        <ActionBtn
          label="Book"
          icon={<CalendarIcon color="var(--m-ink)" />}
          onClick={() => router.navigate('appts')}
        />
        {phoneNumber ? (
          <ActionBtn
            label="Call"
            icon={<PhoneIcon color="var(--m-ink)" />}
            href={`tel:${phoneNumber}`}
          />
        ) : (
          <ActionBtn
            label="Call"
            icon={<PhoneIcon color="var(--m-faint)" />}
          />
        )}
      </div>

      {/* 5.4 KPI stats — 5.4.2 wired to real client data */}
      <div style={{ padding: '0 16px 20px' }}>
        <Card padding={0} style={{ overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
            {[
              { label: 'Visits',     value: realClient ? String(visitCount) : '—' },
              { label: 'Lifetime',   value: realClient ? fmtLifetime(lifetimeAmount) : '—' },
              { label: 'Last Visit', value: realClient ? lastVisitLabel.split(',')[0] : '—' },
            ].map((stat, i) => (
              <div
                key={stat.label}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '18px 8px',
                  borderLeft: i > 0 ? '1px solid var(--m-line2)' : 'none',
                  gap: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 21,
                    fontWeight: 700,
                    color: 'var(--m-ink)',
                    fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1,
                  }}
                >
                  {stat.value}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--m-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: 0.6,
                    fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                  }}
                >
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 5.5 Allergy alert — 5.5.3 wired to real allergies */}
      {hasAllergy && (
        <div style={{ padding: '0 16px 20px' }}>
          <div
            style={{
              background: 'var(--m-warn-soft)',
              border: '1px solid var(--m-accent)',
              borderRadius: 22,
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <div style={{ flexShrink: 0, marginTop: 1 }}>
              <ShieldIcon />
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--m-accent-dk)',
                  textTransform: 'uppercase',
                  letterSpacing: 1.2,
                  fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                  marginBottom: 4,
                }}
              >
                Allergy Alert
              </div>
              <div
                style={{
                  fontSize: 13.5,
                  color: 'var(--m-ink)',
                  fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                  lineHeight: 1.4,
                }}
              >
                {allergyText}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5.6 Upcoming appointment — 5.6.1/5.6.2 wired to real appointments */}
      <div style={{ padding: '0 16px 20px' }}>
        <SectionHead title="Upcoming" style={{ padding: '0 0 4px' }} />
        {upcoming ? (
          <Card padding={16}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* Date block */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flexShrink: 0,
                  width: 44,
                  gap: 1,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--m-primary)',
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                    fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                  }}
                >
                  {upcoming.dayAbbr}
                </span>
                <span
                  style={{
                    fontSize: 26,
                    fontWeight: 700,
                    color: 'var(--m-primary)',
                    fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                    lineHeight: 1,
                  }}
                >
                  {upcoming.date}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: 'var(--m-muted)',
                    fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                  }}
                >
                  {upcoming.month}
                </span>
              </div>

              <div style={{ width: 1, height: 52, background: 'var(--m-line2)', flexShrink: 0 }} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span
                    style={{
                      fontSize: 14.5,
                      fontWeight: 600,
                      color: 'var(--m-ink)',
                      fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                    }}
                  >
                    {upcoming.time} · {upcoming.service}
                  </span>
                  <StatusChip status={upcoming.status} />
                </div>
                <div
                  style={{
                    fontSize: 12.5,
                    color: 'var(--m-muted)',
                    fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span>{upcoming.duration}</span>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: client.therapistColor, flexShrink: 0 }} />
                  <span>{upcoming.therapist}</span>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card padding={16}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: 'var(--m-muted)',
                fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                fontSize: 13.5,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="3" stroke="var(--m-muted)" strokeWidth="1.8" />
                <path d="M8 2v4M16 2v4M3 10h18" stroke="var(--m-muted)" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              No upcoming appointments
            </div>
          </Card>
        )}
      </div>

      {/* 5.7 Recent visits — 5.7.2 wired to real history, 5.7.3 empty state */}
      <div style={{ padding: '0 16px 16px' }}>
        <SectionHead title="Recent visits" style={{ padding: '0 0 4px' }} />
        {pastVisits === null ? null : pastVisits.length === 0 ? (
          <Card padding={16}>
            <div
              style={{
                color: 'var(--m-muted)',
                fontSize: 13.5,
                fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              }}
            >
              No past visits yet
            </div>
          </Card>
        ) : (
          <Card padding={0} style={{ overflow: 'hidden' }}>
            {pastVisits.map((visit, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '13px 16px',
                  borderBottom: i < pastVisits.length - 1 ? '1px solid var(--m-line2)' : 'none',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--m-ink)',
                      fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                      marginBottom: 2,
                    }}
                  >
                    {visit.service}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--m-muted)',
                      fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                    }}
                  >
                    {visit.date}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: 'var(--m-ok)',
                    fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                    fontVariantNumeric: 'tabular-nums',
                    flexShrink: 0,
                    marginLeft: 12,
                  }}
                >
                  ${visit.amount}
                </span>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
