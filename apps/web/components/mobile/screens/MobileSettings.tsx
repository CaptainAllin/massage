'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LargeHeader } from '../LargeHeader';
import { Avatar, Card } from '../primitives';
import type { MobileRouter } from '../MobileShell';
import { useAuth } from '@massage/auth';
import { usePWAInstall } from '@/lib/hooks/use-pwa-install';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useBusiness, useUpdateBusiness } from '@/lib/hooks/use-business';
import { useBusinessMembers, useStaffInvites } from '@/lib/hooks/use-staff-invites';
import { useBusinessHours, useUpdateBusinessHours, type BusinessHoursDay } from '@/lib/hooks/use-business-hours';
import { useCommunicationSettings, useUpdateCommunicationSettings } from '@/lib/hooks/use-messages';
import { listPasskeys, enrollPasskey, revokePasskey, type PasskeyFactor } from '@/lib/supabase/passkeys';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MobileSettingsProps {
  router: MobileRouter;
  param: unknown;
}

type SettingsSubView = 'business' | 'team' | 'hours' | 'booking' | 'notifications' | 'security' | 'account';

// ─── Shared primitives ────────────────────────────────────────────────────────

function SubViewHeader({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '16px 16px 0',
        marginBottom: 20,
        flexShrink: 0,
      }}
    >
      <button
        onClick={onBack}
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          background: 'var(--m-soft)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: 'var(--m-ink)',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--m-ink)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', letterSpacing: -0.3 }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 12, color: 'var(--m-muted)', marginTop: 1, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--m-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
      {children}
    </div>
  );
}

function MobileInput({ label, value, onChange, placeholder, type = 'text' }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <FieldLabel>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '11px 14px',
          borderRadius: 12,
          border: '1.5px solid var(--m-line2)',
          background: 'var(--m-surface)',
          fontSize: 14.5,
          color: 'var(--m-ink)',
          fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

function SaveBtn({ saving, saved, onClick }: { saving: boolean; saved: boolean; onClick?: () => void }) {
  return (
    <button
      type={onClick ? 'button' : 'submit'}
      onClick={onClick}
      disabled={saving}
      style={{
        width: '100%',
        padding: '13px',
        borderRadius: 14,
        background: saved ? 'var(--m-ok, #3E9E7A)' : 'var(--m-grad, linear-gradient(135deg, #5D4AA8, #3F2F87))',
        border: 'none',
        fontSize: 14.5,
        fontWeight: 700,
        color: '#fff',
        cursor: saving ? 'default' : 'pointer',
        fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
        opacity: saving ? 0.7 : 1,
        transition: 'background 0.2s',
      }}
    >
      {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
    </button>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative',
        width: 44,
        height: 26,
        borderRadius: 13,
        background: checked ? 'var(--m-primary)' : 'var(--m-line2)',
        border: 'none',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'background 0.2s',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: checked ? 21 : 3,
          width: 20,
          height: 20,
          borderRadius: 10,
          background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          transition: 'left 0.2s',
        }}
      />
    </button>
  );
}

function ToggleRow({ label, description, checked, onChange }: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 0',
        borderBottom: '1px solid var(--m-line2)',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--m-ink)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
          {label}
        </div>
        {description && (
          <div style={{ fontSize: 12, color: 'var(--m-muted)', marginTop: 2, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
            {description}
          </div>
        )}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

// ─── Sub-views ────────────────────────────────────────────────────────────────

function BusinessSubView({ businessId }: { businessId: string }) {
  const { data: business, isLoading } = useBusiness(businessId);
  const update = useUpdateBusiness(businessId);
  const [form, setForm] = useState({ name: '', email: '', phoneNumber: '', address: '', city: '', website: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (business) {
      setForm({
        name: business.name || '',
        email: business.email || '',
        phoneNumber: business.phoneNumber || '',
        address: business.address || '',
        city: business.city || '',
        website: business.website || '',
      });
    }
  }, [business]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await update.mutateAsync(form as any);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--m-muted)', fontSize: 14 }}>Loading…</div>;
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: '0 16px 24px' }}>
      <MobileInput label="Business Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="e.g. Serenity Wellness" />
      <MobileInput label="Email" type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} placeholder="info@yourbusiness.com" />
      <MobileInput label="Phone" type="tel" value={form.phoneNumber} onChange={(v) => setForm((f) => ({ ...f, phoneNumber: v }))} placeholder="+61 4xx xxx xxx" />
      <MobileInput label="Street Address" value={form.address} onChange={(v) => setForm((f) => ({ ...f, address: v }))} placeholder="123 Main St" />
      <MobileInput label="City" value={form.city} onChange={(v) => setForm((f) => ({ ...f, city: v }))} placeholder="e.g. Melbourne" />
      <MobileInput label="Website" type="url" value={form.website} onChange={(v) => setForm((f) => ({ ...f, website: v }))} placeholder="https://yourbusiness.com" />
      <SaveBtn saving={saving} saved={saved} />
    </form>
  );
}

const ROLE_LABEL: Record<string, string> = {
  OWNER: 'Owner',
  SENIOR_THERAPIST: 'Senior Therapist',
  THERAPIST: 'Therapist',
  RECEPTIONIST: 'Receptionist',
};

function TeamSubView({ businessId }: { businessId: string }) {
  const { data: members, isLoading: mLoading } = useBusinessMembers(businessId);
  const { data: invites, isLoading: iLoading } = useStaffInvites(businessId);

  if (mLoading || iLoading) {
    return <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--m-muted)', fontSize: 14 }}>Loading…</div>;
  }

  const pendingInvites = (invites || []).filter((inv: any) => !inv.acceptedAt && new Date(inv.expiresAt) > new Date());

  return (
    <div style={{ padding: '0 16px 24px' }}>
      {pendingInvites.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <FieldLabel>Pending Invites ({pendingInvites.length})</FieldLabel>
          <Card style={{ padding: '0 14px' }}>
            {pendingInvites.map((inv: any, i: number) => (
              <div
                key={inv.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 0',
                  borderBottom: i < pendingInvites.length - 1 ? '1px solid var(--m-line2)' : 'none',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: '#FEF9C3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: 16,
                  }}
                >
                  ✉️
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--m-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
                    {inv.email}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--m-muted)', marginTop: 1, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
                    {ROLE_LABEL[inv.role] ?? inv.role} · Pending
                  </div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      <FieldLabel>Team Members ({(members || []).length})</FieldLabel>
      <Card style={{ padding: '0 14px' }}>
        {(members || []).length === 0 && (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--m-muted)', fontSize: 13, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
            No team members yet.
          </div>
        )}
        {(members || []).map((m: any, i: number) => {
          const u = m.user;
          const name = `${u?.firstName || ''} ${u?.lastName || ''}`.trim() || 'Unknown';
          const initials = (u?.firstName?.[0] ?? '') + (u?.lastName?.[0] ?? '');
          const isLast = i === (members || []).length - 1;
          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 0',
                borderBottom: isLast ? 'none' : '1px solid var(--m-line2)',
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: m.role === 'OWNER' ? 'linear-gradient(135deg, #5D4AA8, #7665C2)' : '#EDE5F4',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  flexShrink: 0,
                  fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                }}
              >
                {initials || '?'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--m-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
                  {name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--m-muted)', marginTop: 1, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
                  {u?.email}
                </div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#5D4AA8',
                  background: '#EDE5F4',
                  padding: '3px 8px',
                  borderRadius: 8,
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                }}
              >
                {ROLE_LABEL[m.role] ?? m.role}
              </span>
            </div>
          );
        })}
      </Card>

      <div style={{ marginTop: 14, fontSize: 12.5, color: 'var(--m-muted)', textAlign: 'center', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
        To invite new team members, open the full settings on desktop.
      </div>
    </div>
  );
}

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function HoursSubView({ businessId }: { businessId: string }) {
  const { data: rawHours, isLoading } = useBusinessHours(businessId);
  const update = useUpdateBusinessHours(businessId);
  const [hours, setHours] = useState<BusinessHoursDay[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (rawHours) {
      const base: BusinessHoursDay[] = Array.from({ length: 7 }, (_, i) => ({
        id: null,
        businessId,
        locationId: null,
        dayOfWeek: i,
        openTime: '09:00',
        closeTime: '17:00',
        isClosed: i === 0 || i === 6,
      }));
      rawHours.forEach((h) => {
        base[h.dayOfWeek] = { ...base[h.dayOfWeek], ...h };
      });
      setHours(base);
    }
  }, [rawHours, businessId]);

  const toggleDay = (idx: number) => {
    setHours((prev) => prev.map((h, i) => i === idx ? { ...h, isClosed: !h.isClosed } : h));
  };

  const setTime = (idx: number, field: 'openTime' | 'closeTime', val: string) => {
    setHours((prev) => prev.map((h, i) => i === idx ? { ...h, [field]: val } : h));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = hours.map(({ id: _id, businessId: _bid, locationId: _lid, ...rest }) => rest);
      await update.mutateAsync(payload as any);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--m-muted)', fontSize: 14 }}>Loading…</div>;
  }

  return (
    <div style={{ padding: '0 16px 24px' }}>
      <Card style={{ padding: '0 14px', marginBottom: 16 }}>
        {hours.map((h, i) => (
          <div
            key={h.dayOfWeek}
            style={{
              padding: '13px 0',
              borderBottom: i < 6 ? '1px solid var(--m-line2)' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: h.isClosed ? 0 : 10 }}>
              <div style={{ width: 80, fontSize: 13.5, fontWeight: 600, color: 'var(--m-ink)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
                {DAY_LABELS[h.dayOfWeek].slice(0, 3)}
              </div>
              <Toggle checked={!h.isClosed} onChange={() => toggleDay(i)} />
              <span style={{ fontSize: 12, color: 'var(--m-muted)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
                {h.isClosed ? 'Closed' : 'Open'}
              </span>
            </div>
            {!h.isClosed && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 90 }}>
                <input
                  type="time"
                  value={h.openTime}
                  onChange={(e) => setTime(i, 'openTime', e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 10,
                    border: '1.5px solid var(--m-line2)',
                    background: 'var(--m-bg)',
                    fontSize: 13,
                    color: 'var(--m-ink)',
                    fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                    outline: 'none',
                  }}
                />
                <span style={{ color: 'var(--m-muted)', fontSize: 12 }}>to</span>
                <input
                  type="time"
                  value={h.closeTime}
                  onChange={(e) => setTime(i, 'closeTime', e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 10,
                    border: '1.5px solid var(--m-line2)',
                    background: 'var(--m-bg)',
                    fontSize: 13,
                    color: 'var(--m-ink)',
                    fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                    outline: 'none',
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </Card>
      <SaveBtn saving={saving} saved={saved} onClick={handleSave} />
    </div>
  );
}

const BOOKING_MODES = [
  { value: 'PUBLIC',                label: 'Public',              desc: 'Anyone can book online' },
  { value: 'EXISTING_CLIENTS_ONLY', label: 'Existing clients',   desc: 'Only returning clients' },
  { value: 'INVITE_ONLY',           label: 'Invite only',         desc: 'Manual bookings only' },
] as const;

function BookingSubView({ businessId }: { businessId: string }) {
  const { data: business, isLoading } = useBusiness(businessId);
  const update = useUpdateBusiness(businessId);
  const [mode, setMode] = useState<'PUBLIC' | 'EXISTING_CLIENTS_ONLY' | 'INVITE_ONLY'>('PUBLIC');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (business) {
      setMode((business as any).bookingMode || 'PUBLIC');
    }
  }, [business]);

  const bookingUrl = business ? `${typeof window !== 'undefined' ? window.location.origin : ''}/book/${(business as any).slug || businessId}` : '';

  const copyUrl = () => {
    if (!bookingUrl) return;
    navigator.clipboard.writeText(bookingUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await update.mutateAsync({ bookingMode: mode } as any);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--m-muted)', fontSize: 14 }}>Loading…</div>;
  }

  return (
    <div style={{ padding: '0 16px 24px' }}>
      {bookingUrl && (
        <div style={{ marginBottom: 20 }}>
          <FieldLabel>Your Booking Link</FieldLabel>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '11px 14px',
              borderRadius: 12,
              background: 'var(--m-soft)',
              border: '1.5px solid var(--m-line2)',
            }}
          >
            <div style={{ flex: 1, fontSize: 12.5, color: 'var(--m-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
              {bookingUrl}
            </div>
            <button
              onClick={copyUrl}
              style={{
                padding: '5px 10px',
                borderRadius: 8,
                background: copied ? 'var(--m-ok, #3E9E7A)' : 'var(--m-primary)',
                border: 'none',
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                flexShrink: 0,
                fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <FieldLabel>Who Can Book</FieldLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {BOOKING_MODES.map((opt) => {
            const selected = mode === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setMode(opt.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '13px 14px',
                  borderRadius: 14,
                  border: selected ? '2px solid var(--m-primary)' : '1.5px solid var(--m-line2)',
                  background: selected ? 'rgba(93,74,168,0.06)' : 'var(--m-surface)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    border: selected ? '6px solid var(--m-primary)' : '2px solid var(--m-line2)',
                    flexShrink: 0,
                    transition: 'border 0.15s',
                  }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: selected ? 'var(--m-primary)' : 'var(--m-ink)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--m-muted)', marginTop: 1, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
                    {opt.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <SaveBtn saving={saving} saved={saved} onClick={handleSave} />
    </div>
  );
}

function NotificationsSubView({ businessId }: { businessId: string }) {
  const { data: settings, isLoading } = useCommunicationSettings(businessId);
  const update = useUpdateCommunicationSettings(businessId);
  const [form, setForm] = useState({
    emailEnabled: false,
    smsEnabled: false,
    whatsappEnabled: false,
    autoSendReminders: false,
    defaultReminderHours: 24,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        emailEnabled: settings.emailEnabled,
        smsEnabled: settings.smsEnabled,
        whatsappEnabled: settings.whatsappEnabled,
        autoSendReminders: settings.autoSendReminders,
        defaultReminderHours: settings.defaultReminderHours,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await update.mutateAsync(form as any);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--m-muted)', fontSize: 14 }}>Loading…</div>;
  }

  return (
    <div style={{ padding: '0 16px 24px' }}>
      <Card style={{ padding: '0 14px', marginBottom: 16 }}>
        <ToggleRow
          label="Email"
          description="Send appointment reminders via email"
          checked={form.emailEnabled}
          onChange={(v) => setForm((f) => ({ ...f, emailEnabled: v }))}
        />
        <ToggleRow
          label="SMS"
          description="Send reminders via SMS (Twilio required)"
          checked={form.smsEnabled}
          onChange={(v) => setForm((f) => ({ ...f, smsEnabled: v }))}
        />
        <ToggleRow
          label="WhatsApp"
          description="Send reminders via WhatsApp Business API"
          checked={form.whatsappEnabled}
          onChange={(v) => setForm((f) => ({ ...f, whatsappEnabled: v }))}
        />
        <ToggleRow
          label="Auto-send reminders"
          description="Automatically send reminders for new appointments"
          checked={form.autoSendReminders}
          onChange={(v) => setForm((f) => ({ ...f, autoSendReminders: v }))}
        />
        <div style={{ padding: '12px 0' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--m-ink)', marginBottom: 8, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
            Reminder Lead Time
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="number"
              min="1"
              max="168"
              value={form.defaultReminderHours}
              onChange={(e) => setForm((f) => ({ ...f, defaultReminderHours: parseInt(e.target.value) || 24 }))}
              style={{
                width: 70,
                padding: '8px 10px',
                borderRadius: 10,
                border: '1.5px solid var(--m-line2)',
                background: 'var(--m-bg)',
                fontSize: 14,
                color: 'var(--m-ink)',
                fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                outline: 'none',
              }}
            />
            <span style={{ fontSize: 13, color: 'var(--m-muted)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
              hours before appointment
            </span>
          </div>
        </div>
      </Card>
      <SaveBtn saving={saving} saved={saved} onClick={handleSave} />
    </div>
  );
}

function SecuritySubView() {
  const [passkeys, setPasskeys] = useState<PasskeyFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPasskeys(await listPasskeys());
    } catch (e: any) {
      setError(e.message || 'Failed to load passkeys');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleEnroll = async () => {
    setEnrolling(true);
    setError('');
    setSuccess('');
    try {
      await enrollPasskey(`Passkey ${new Date().toLocaleDateString()}`);
      setSuccess('Passkey added successfully.');
      await load();
    } catch (e: any) {
      setError(e.message || 'Failed to add passkey');
    } finally {
      setEnrolling(false);
    }
  };

  const handleRevoke = async (factorId: string) => {
    if (!confirm('Remove this passkey?')) return;
    try {
      await revokePasskey(factorId);
      setSuccess('Passkey removed.');
      await load();
    } catch (e: any) {
      setError(e.message || 'Failed to remove passkey');
    }
  };

  return (
    <div style={{ padding: '0 16px 24px' }}>
      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 12, background: '#FEE2E2', color: '#991B1B', fontSize: 13, marginBottom: 12, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '10px 14px', borderRadius: 12, background: '#D1FAE5', color: '#065F46', fontSize: 13, marginBottom: 12, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
          {success}
        </div>
      )}

      <FieldLabel>Passkeys</FieldLabel>
      <Card style={{ padding: '0 14px', marginBottom: 16 }}>
        {loading && (
          <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--m-muted)', fontSize: 13 }}>Loading…</div>
        )}
        {!loading && passkeys.length === 0 && (
          <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--m-muted)', fontSize: 13, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
            No passkeys registered yet.
          </div>
        )}
        {passkeys.map((pk, i) => (
          <div
            key={pk.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 0',
              borderBottom: i < passkeys.length - 1 ? '1px solid var(--m-line2)' : 'none',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--m-ink)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
                {pk.friendlyName || 'Passkey'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--m-muted)', marginTop: 1, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
                Added {new Date(pk.createdAt).toLocaleDateString()}
              </div>
            </div>
            <button
              onClick={() => handleRevoke(pk.id)}
              style={{
                padding: '5px 10px',
                borderRadius: 8,
                background: 'none',
                border: '1.5px solid #FCA5A5',
                color: '#DC2626',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              }}
            >
              Remove
            </button>
          </div>
        ))}
      </Card>

      <button
        onClick={handleEnroll}
        disabled={enrolling}
        style={{
          width: '100%',
          padding: '13px',
          borderRadius: 14,
          background: 'var(--m-grad, linear-gradient(135deg, #5D4AA8, #3F2F87))',
          border: 'none',
          fontSize: 14.5,
          fontWeight: 700,
          color: '#fff',
          cursor: enrolling ? 'default' : 'pointer',
          fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
          opacity: enrolling ? 0.7 : 1,
        }}
      >
        {enrolling ? 'Registering…' : 'Add Passkey'}
      </button>

      <div
        style={{
          marginTop: 16,
          padding: '12px 14px',
          borderRadius: 12,
          background: 'var(--m-soft)',
          fontSize: 12.5,
          color: 'var(--m-muted)',
          fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
          lineHeight: 1.5,
        }}
      >
        Passkeys let you sign in with Face ID, Touch ID, or your device PIN — no password needed.
      </div>
    </div>
  );
}

function AccountSubView() {
  const { user } = useAuth();
  const firstName = user?.user_metadata?.first_name ?? '';
  const lastName  = user?.user_metadata?.last_name ?? '';
  const fullName  = [firstName, lastName].filter(Boolean).join(' ') || 'My Account';
  const email     = user?.email ?? '';
  const role      = user?.user_metadata?.role ?? 'Owner';

  return (
    <div style={{ padding: '0 16px 24px' }}>
      <Card style={{ padding: '16px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <Avatar name={fullName} size={52} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--m-ink)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
              {fullName}
            </div>
            <div style={{ fontSize: 13, color: 'var(--m-muted)', marginTop: 2, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {email}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <div
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 12,
              background: 'var(--m-soft)',
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--m-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>Role</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--m-primary)', marginTop: 2, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>{role}</div>
          </div>
          <div
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 12,
              background: 'var(--m-soft)',
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--m-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>Plan</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--m-primary)', marginTop: 2, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>Pro</div>
          </div>
        </div>
      </Card>

      <div
        style={{
          padding: '12px 14px',
          borderRadius: 12,
          background: 'var(--m-soft)',
          fontSize: 12.5,
          color: 'var(--m-muted)',
          fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
          lineHeight: 1.5,
        }}
      >
        To update your name, password, or profile photo, visit Settings on desktop.
      </div>
    </div>
  );
}

// ─── Settings List ─────────────────────────────────────────────────────────────

interface SettingsRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  last?: boolean;
  onPress?: () => void;
}

function SettingsRow({ icon, label, value, last = false, onPress }: SettingsRowProps) {
  return (
    <button
      className="im-tab im-press"
      onClick={onPress}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 0',
        background: 'none',
        border: 'none',
        borderBottom: last ? 'none' : '1px solid var(--m-line2)',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          background: 'var(--m-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: 'var(--m-primary)',
        }}
      >
        {icon}
      </div>

      <span
        style={{
          flex: 1,
          fontSize: 14.5,
          fontWeight: 500,
          color: 'var(--m-ink)',
          fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
        }}
      >
        {label}
      </span>

      {value && (
        <span
          style={{
            fontSize: 13,
            color: 'var(--m-muted)',
            fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            marginRight: 4,
          }}
        >
          {value}
        </span>
      )}

      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M9 18l6-6-6-6" stroke="var(--m-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function GroupLabel({ label }: { label: string }) {
  return (
    <div
      style={{
        fontSize: 11.5,
        fontWeight: 700,
        color: 'var(--m-muted)',
        textTransform: 'uppercase',
        letterSpacing: 1.3,
        fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
        marginBottom: 8,
        paddingLeft: 2,
      }}
    >
      {label}
    </div>
  );
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function BuildingIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 21V10M16 21V10M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 5V3h4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M2 21v-1a7 7 0 0 1 14 0v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 3.1a4 4 0 0 1 0 7.8M22 21v-1a7 7 0 0 0-5-6.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function CreditCardIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="6" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M2 10h20" stroke="currentColor" strokeWidth="1.8" />
      <path d="M6 15h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="8" cy="6" r="2" fill="var(--m-surface)" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16" cy="12" r="2" fill="var(--m-surface)" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="10" cy="18" r="2" fill="var(--m-surface)" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M9 18l6-6-6-6" stroke="var(--m-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AppIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="2" width="14" height="20" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 17v0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

// ─── Install Row ──────────────────────────────────────────────────────────────

interface InstallRowProps {
  isInstalled: boolean;
  canInstall: boolean;
  hasManualInstall: boolean;
  browserType: string;
  showHelp: boolean;
  onPress: () => void;
}

function InstallRow({ isInstalled, canInstall, hasManualInstall, browserType, showHelp, onPress }: InstallRowProps) {
  const MANUAL_INSTRUCTIONS: Record<string, string> = {
    'ios':             'Tap the Share button ↑, then "Add to Home Screen"',
    'mac-safari':      'Open the File menu, then "Add to Dock"',
    'firefox-android': 'Tap the menu ⋮, then "Install"',
    'chrome-android':  'Tap the menu ⋮ in the top right, then "Add to Home Screen"',
  };
  const instructions = MANUAL_INSTRUCTIONS[browserType];

  return (
    <div>
      <button
        className="im-tab im-press"
        onClick={onPress}
        disabled={isInstalled || (!canInstall && !hasManualInstall)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 0',
          background: 'none',
          border: 'none',
          cursor: isInstalled ? 'default' : 'pointer',
          textAlign: 'left',
          opacity: (!isInstalled && !canInstall && !hasManualInstall) ? 0.45 : 1,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: isInstalled ? 'rgba(62,158,122,0.12)' : 'var(--m-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: isInstalled ? 'var(--m-ok)' : 'var(--m-primary)',
          }}
        >
          <AppIcon />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14.5,
              fontWeight: 500,
              color: 'var(--m-ink)',
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            }}
          >
            {isInstalled ? 'Iris is installed' : 'Install Iris app'}
          </div>
          {isInstalled && (
            <div
              style={{
                fontSize: 12,
                color: 'var(--m-ok)',
                marginTop: 2,
                fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                fontWeight: 500,
              }}
            >
              Done · Running as a standalone app
            </div>
          )}
          {!isInstalled && (
            <div
              style={{
                fontSize: 12,
                color: 'var(--m-muted)',
                marginTop: 2,
                fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              }}
            >
              Add to your home screen for quick access
            </div>
          )}
        </div>

        {isInstalled ? (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--m-ok)',
              background: 'rgba(62,158,122,0.12)',
              padding: '3px 8px',
              borderRadius: 8,
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            }}
          >
            Done
          </span>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="var(--m-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {showHelp && instructions && (
        <div
          style={{
            fontSize: 13,
            color: 'var(--m-ink2)',
            background: 'var(--m-soft)',
            borderRadius: 12,
            padding: '10px 14px',
            marginBottom: 8,
            fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            lineHeight: 1.5,
          }}
        >
          {instructions}
        </div>
      )}
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function MobileSettings({ router: _router }: MobileSettingsProps) {
  const { user, signOut } = useAuth();
  const businessId = useBusinessId() ?? '';
  const { canInstall, isInstalled, hasManualInstall, browserType, triggerInstall } = usePWAInstall();
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [subView, setSubView] = useState<SettingsSubView | null>(null);

  const firstName = user?.user_metadata?.first_name ?? '';
  const lastName  = user?.user_metadata?.last_name ?? '';
  const fullName  = [firstName, lastName].filter(Boolean).join(' ') || 'My Account';
  const email     = user?.email ?? '';
  const role      = user?.user_metadata?.role ?? 'Owner';

  const handleInstallPress = async () => {
    if (isInstalled) return;
    if (canInstall) {
      await triggerInstall();
    } else if (hasManualInstall) {
      setShowInstallHelp((v) => !v);
    }
  };

  const SUB_VIEW_TITLES: Record<SettingsSubView, string> = {
    business:      'Business Profile',
    team:          'Team & Therapists',
    hours:         'Hours & Availability',
    booking:       'Booking Page',
    notifications: 'Notifications',
    security:      'Privacy & Security',
    account:       'My Account',
  };

  // Render sub-view
  if (subView) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <SubViewHeader
          title={SUB_VIEW_TITLES[subView]}
          onBack={() => setSubView(null)}
        />
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 32 }}>
          {subView === 'business'      && <BusinessSubView businessId={businessId} />}
          {subView === 'team'          && <TeamSubView businessId={businessId} />}
          {subView === 'hours'         && <HoursSubView businessId={businessId} />}
          {subView === 'booking'       && <BookingSubView businessId={businessId} />}
          {subView === 'notifications' && <NotificationsSubView businessId={businessId} />}
          {subView === 'security'      && <SecuritySubView />}
          {subView === 'account'       && <AccountSubView />}
        </div>
      </div>
    );
  }

  // Render main settings list
  return (
    <div style={{ padding: '20px 16px 8px' }}>
      <LargeHeader eyebrow="You" title="Settings" />

      {/* Profile card */}
      <Card style={{ padding: '14px 16px', marginBottom: 24 }}>
        <button
          className="im-tab im-press"
          onClick={() => setSubView('account')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            padding: 0,
          }}
        >
          <Avatar name={fullName} size={56} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: 'var(--m-ink)',
                fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {fullName}
            </div>
            <div
              style={{
                fontSize: 13,
                color: 'var(--m-muted)',
                marginTop: 3,
                fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {email}
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--m-primary)',
                marginTop: 2,
                fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                fontWeight: 600,
              }}
            >
              {role}
            </div>
          </div>

          <ChevronRightIcon />
        </button>
      </Card>

      {/* App group */}
      <div style={{ marginBottom: 24 }}>
        <GroupLabel label="App" />
        <Card style={{ padding: '0 16px' }}>
          <InstallRow
            isInstalled={isInstalled}
            canInstall={canInstall}
            hasManualInstall={hasManualInstall}
            browserType={browserType}
            showHelp={showInstallHelp}
            onPress={handleInstallPress}
          />
        </Card>
      </div>

      {/* Practice group */}
      <div style={{ marginBottom: 24 }}>
        <GroupLabel label="Practice" />
        <Card style={{ padding: '0 16px' }}>
          <SettingsRow icon={<BuildingIcon />} label="Business profile"     onPress={() => setSubView('business')} />
          <SettingsRow icon={<UsersIcon />}    label="Team & therapists"    onPress={() => setSubView('team')} />
          <SettingsRow icon={<ClockIcon />}    label="Hours & availability" onPress={() => setSubView('hours')} />
          <SettingsRow icon={<LinkIcon />}     label="Booking page"         onPress={() => setSubView('booking')} last />
        </Card>
      </div>

      {/* Account group */}
      <div style={{ marginBottom: 32 }}>
        <GroupLabel label="Account" />
        <Card style={{ padding: '0 16px' }}>
          <SettingsRow icon={<BellIcon />}       label="Notifications"      onPress={() => setSubView('notifications')} />
          <SettingsRow icon={<ShieldIcon />}     label="Privacy & security" onPress={() => setSubView('security')} />
          <SettingsRow icon={<CreditCardIcon />} label="Billing & plan"     value="Pro" onPress={() => setSubView('account')} />
          <SettingsRow icon={<SlidersIcon />}    label="Preferences"        onPress={() => setSubView('account')} last />
        </Card>
      </div>

      {/* Sign out */}
      <button
        className="im-tab im-press"
        onClick={() => signOut()}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: 14,
          background: 'var(--m-surface)',
          border: '1.5px solid var(--m-warn)',
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--m-warn)',
          cursor: 'pointer',
          fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
          marginBottom: 8,
        }}
      >
        Sign out
      </button>
    </div>
  );
}
