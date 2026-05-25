'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Sparkles, CalendarDays } from 'lucide-react';
import { Skeleton } from '@massage/ui';
import { useClient } from '@/lib/hooks';
import { usePayments } from '@/lib/hooks/use-payments';
import { useAppointments } from '@/lib/hooks/use-appointments';
import { useTreatmentNotes } from '@/lib/hooks/use-treatment-notes';
import { ClientHeader } from '@/components/clients/ClientHeader';
import { ClientIntakeForms } from '@/components/clients/ClientIntakeForms';
import { PaymentsList } from '@/components/payments/PaymentsList';
import { SavedPaymentMethods } from '@/components/payments/SavedPaymentMethods';
import { SessionTimeline } from '@/components/clients/SessionTimeline';
import { TreatmentSuggestionsPanel } from '@/components/ai';
import { useBusinessId } from '@/lib/hooks/use-business-id';

// ── Iris tab styling ─────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'notes', label: 'Notes', badge: true },
  { id: 'intake', label: 'Intake forms' },
  { id: 'payments', label: 'Payments' },
  { id: 'ai', label: 'AI Suggestions' },
];

interface IrisTabsProps {
  active: string;
  onChange: (id: string) => void;
  notesCount: number;
}

function IrisTabs({ active, onChange, notesCount }: IrisTabsProps) {
  return (
    <div className="flex items-end gap-0 border-b border-iris-line2">
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="relative flex items-center gap-2 px-5 py-3 text-[13.5px] transition-colors"
            style={{
              color: isActive ? '#5D4AA8' : '#7A7090',
              fontWeight: isActive ? 500 : 400,
            }}
          >
            {tab.label}
            {/* 7.3.3 Notes badge */}
            {tab.badge && notesCount > 0 && (
              <span
                className="px-1.5 py-[1px] rounded-full text-[10px] font-medium"
                style={{ background: '#E8A89333', color: '#C97E68' }}
              >
                {notesCount}
              </span>
            )}
            {/* 7.3.2 Active underline */}
            {isActive && (
              <span
                className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t"
                style={{ background: '#5D4AA8' }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Overview info card ───────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-iris-line2 last:border-0">
      <span className="text-[12.5px] font-medium text-iris-muted">{label}</span>
      <span className="text-[13px] text-iris-ink text-right max-w-[60%]">{value}</span>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[18px] border border-iris-line2 overflow-hidden">
      <div className="px-5 py-4 border-b border-iris-line2">
        <h3 className="text-[13.5px] font-semibold text-iris-ink">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

// ── 7.5.1 Latest notes card ──────────────────────────────────────────────────

function NotesCard({ note }: { note: any }) {
  if (!note) return null;
  const noteDate = new Date(note.createdAt);
  const text = note.assessment || note.subjectiveFindings || note.plan || '';

  return (
    <div className="bg-white rounded-[18px] border border-iris-line2 overflow-hidden">
      <div className="px-5 py-4 border-b border-iris-line2 flex items-center justify-between">
        <h3 className="text-[13.5px] font-semibold text-iris-ink">Latest Note</h3>
        <span className="text-[11.5px] text-iris-muted">
          {noteDate.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>
      <div className="px-5 py-4">
        {text ? (
          <p className="text-[13px] text-iris-ink2 leading-relaxed line-clamp-4">{text}</p>
        ) : (
          <p className="text-[13px] text-iris-muted">No note content recorded.</p>
        )}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-iris-line2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold"
            style={{ background: '#EDE5F4', color: '#5D4AA8' }}
          >
            T
          </div>
          <span className="text-[11.5px] text-iris-muted">Therapist note</span>
        </div>
      </div>
    </div>
  );
}

// ── 7.5.2 Recurring booking card ─────────────────────────────────────────────

function RecurringBookingCard({ nextSession }: { nextSession: string | null }) {
  if (!nextSession) return null;
  return (
    <div className="bg-white rounded-[18px] border border-iris-line2 overflow-hidden">
      <div className="px-5 py-4">
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#EDE5F4' }}
          >
            <CalendarDays className="w-4.5 h-4.5" style={{ color: '#5D4AA8' }} />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-medium text-iris-ink">Recurring · Monthly</p>
            <p className="text-[12px] text-iris-muted mt-0.5">Next: {nextSession}</p>
          </div>
          <span
            className="px-2.5 py-[3px] rounded-full text-[10.5px] font-medium flex-shrink-0"
            style={{ background: '#EDE5F4', color: '#5D4AA8' }}
          >
            Ongoing
          </span>
        </div>
      </div>
    </div>
  );
}

// ── 7.5.3 AI upsell banner ───────────────────────────────────────────────────

function AIUpsellBanner({ clientName }: { clientName: string }) {
  return (
    <div
      className="rounded-[18px] border border-iris-line2 px-5 py-4"
      style={{ background: '#F7E5DD' }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: '#E8A89344' }}
        >
          <Sparkles className="w-4 h-4" style={{ color: '#C97E68' }} />
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-semibold" style={{ color: '#C97E68' }}>
            AI Suggestion
          </p>
          <p className="text-[12px] mt-1 leading-relaxed" style={{ color: '#7A4F3A' }}>
            {clientName} may benefit from a follow-up session based on their visit history. Send a
            personalised booking reminder.
          </p>
          <button
            className="mt-2.5 px-3.5 py-1.5 rounded-full text-[12px] font-medium text-white"
            style={{ background: '#C97E68' }}
          >
            Send reminder
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function ClientProfilePage() {
  const params = useParams();
  const clientId = params.id as string;
  const businessId = useBusinessId();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: client, isLoading } = useClient(clientId, businessId);
  const { data: paymentsData } = usePayments(businessId, { clientId });
  const { data: appointmentsData } = useAppointments(businessId, {
    clientId,
    limit: 50,
    sortBy: 'startTime',
    sortOrder: 'desc',
  } as any);
  const { data: notesData } = useTreatmentNotes(businessId, { clientId, limit: 10 } as any);

  if (isLoading) {
    return (
      <div className="space-y-5 px-7 py-6">
        <Skeleton variant="rectangular" height={220} className="rounded-[22px]" />
        <Skeleton variant="rectangular" height={48} className="rounded-xl" />
        <Skeleton variant="rectangular" height={400} className="rounded-[18px]" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-16">
        <p className="text-iris-muted text-sm">Client not found.</p>
      </div>
    );
  }

  const payments = paymentsData?.data || [];
  const appointments = (appointmentsData as any)?.data || appointmentsData || [];
  const notes: any[] = (notesData as any)?.data || notesData || [];
  const latestNote = notes[0] ?? null;

  const lifetimeSpent = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const fullName = `${client.firstName} ${client.lastName}`;

  const upcomingApt = [...appointments]
    .filter((a: any) => new Date(a.startTime) > new Date())
    .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];

  const nextSessionLabel = upcomingApt
    ? new Date(upcomingApt.startTime).toLocaleDateString('en', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div className="px-7 py-6 space-y-5">
      {/* 7.1 + 7.2 Profile Header Card with KPI Row */}
      <ClientHeader
        client={client}
        lifetimeSpent={lifetimeSpent}
        onMessage={() => {}}
        onBook={() => {}}
      />

      {/* 7.3 Iris Tabs */}
      <div className="bg-white rounded-[18px] border border-iris-line2 overflow-hidden">
        <IrisTabs active={activeTab} onChange={setActiveTab} notesCount={notes.length} />

        <div className="p-6">
          {/* ── Overview ── */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
              {/* Left: contact info */}
              <div className="space-y-4">
                <SectionCard title="Contact Information">
                  <InfoRow label="Email" value={client.email || '—'} />
                  <InfoRow label="Phone" value={client.phoneNumber || '—'} />
                  <InfoRow
                    label="Address"
                    value={
                      client.address
                        ? `${client.address}${client.city ? ', ' + client.city : ''}${client.state ? ', ' + client.state : ''}`
                        : '—'
                    }
                  />
                  <InfoRow label="Occupation" value={client.occupation || '—'} />
                </SectionCard>

                <SectionCard title="Emergency Contact">
                  <InfoRow label="Name" value={client.emergencyContactName || '—'} />
                  <InfoRow label="Phone" value={client.emergencyContactPhone || '—'} />
                </SectionCard>

                <SectionCard title="Insurance">
                  <InfoRow label="Provider" value={client.insuranceProvider || '—'} />
                  <InfoRow label="Policy #" value={client.insurancePolicyNumber || '—'} />
                  <InfoRow label="Physician" value={client.primaryPhysician || '—'} />
                </SectionCard>

                {client.goals && (
                  <SectionCard title="Wellness Goals">
                    <p className="text-[13px] text-iris-ink2 leading-relaxed">{client.goals}</p>
                  </SectionCard>
                )}

                {(client.medicalHistory as any)?.notes && (
                  <SectionCard title="Health Notes">
                    <p className="text-[13px] text-iris-ink2 leading-relaxed">
                      {(client.medicalHistory as any).notes}
                    </p>
                  </SectionCard>
                )}

                {((client.medications?.length ?? 0) > 0 || (client.allergies?.length ?? 0) > 0) && (
                  <SectionCard title="Medications & Allergies">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-iris-muted mb-2">
                          Medications
                        </p>
                        {client.medications && client.medications.length > 0 ? (
                          <ul className="space-y-1">
                            {client.medications.map((m, i) => (
                              <li key={i} className="text-[13px] text-iris-ink2">
                                {m}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[13px] text-iris-muted">None recorded</p>
                        )}
                      </div>
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-iris-muted mb-2">
                          Allergies
                        </p>
                        {client.allergies && client.allergies.length > 0 ? (
                          <ul className="space-y-1">
                            {client.allergies.map((a, i) => (
                              <li key={i} className="text-[13px] text-iris-ink2">
                                {a}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[13px] text-iris-muted">None recorded</p>
                        )}
                      </div>
                    </div>
                  </SectionCard>
                )}
              </div>

              {/* Right: sidebar cards */}
              <div className="space-y-4">
                {/* 7.5.1 Latest notes */}
                <NotesCard note={latestNote} />

                {/* 7.5.2 Recurring booking */}
                <RecurringBookingCard nextSession={nextSessionLabel} />

                {/* 7.5.3 AI upsell */}
                <AIUpsellBanner clientName={client.firstName} />
              </div>
            </div>
          )}

          {/* ── 7.4 Sessions timeline ── */}
          {activeTab === 'sessions' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <p className="text-[11px] font-medium uppercase tracking-[1px] text-iris-muted">
                  {appointments.length} sessions total
                </p>
              </div>
              <SessionTimeline appointments={appointments} />
            </div>
          )}

          {/* ── Notes ── */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              {notes.length === 0 ? (
                <div className="text-center py-10 text-iris-muted text-sm">
                  No treatment notes yet.
                </div>
              ) : (
                notes.map((note: any) => (
                  <div
                    key={note.id}
                    className="bg-iris-soft1 rounded-[14px] p-5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[12px] font-medium uppercase tracking-wide text-iris-primary">
                        {new Date(note.createdAt).toLocaleDateString('en', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      {note.aiSummary && (
                        <span
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium"
                          style={{ background: '#F7E5DD', color: '#C97E68' }}
                        >
                          <Sparkles className="w-3 h-3" /> AI Summary
                        </span>
                      )}
                    </div>
                    {note.aiSummary ? (
                      <p className="text-[13px] text-iris-ink2 leading-relaxed">{note.aiSummary}</p>
                    ) : (
                      <div className="space-y-2">
                        {note.subjectiveFindings && (
                          <p className="text-[13px] text-iris-ink2">
                            <span className="font-medium">S:</span> {note.subjectiveFindings}
                          </p>
                        )}
                        {note.objectiveFindings && (
                          <p className="text-[13px] text-iris-ink2">
                            <span className="font-medium">O:</span> {note.objectiveFindings}
                          </p>
                        )}
                        {note.assessment && (
                          <p className="text-[13px] text-iris-ink2">
                            <span className="font-medium">A:</span> {note.assessment}
                          </p>
                        )}
                        {note.plan && (
                          <p className="text-[13px] text-iris-ink2">
                            <span className="font-medium">P:</span> {note.plan}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Intake Forms ── */}
          {activeTab === 'intake' && (
            <ClientIntakeForms
              clientId={clientId}
              clientName={fullName}
              businessId={businessId}
            />
          )}

          {/* ── Payments ── */}
          {activeTab === 'payments' && (
            <div className="space-y-5">
              {businessId && <SavedPaymentMethods businessId={businessId} clientId={clientId} />}
              <SectionCard title="Payment History">
                <PaymentsList payments={payments} isLoading={false} onFilterChange={() => {}} />
              </SectionCard>
            </div>
          )}

          {/* ── AI Suggestions ── */}
          {activeTab === 'ai' && (
            <TreatmentSuggestionsPanel clientId={clientId} clientName={fullName} />
          )}
        </div>
      </div>
    </div>
  );
}
