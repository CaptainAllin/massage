'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, Button, Input, Badge } from '@massage/ui';
import { Building2, Users, Bell, Palette, Save, Upload, Loader2, Check, BellRing, MapPin, CalendarCheck, Globe, Lock, UserCheck, Clock, ShieldCheck, KeyRound, Trash2, Plus, Link2, FileText, LayoutDashboard, ExternalLink, Copy, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useBusiness, useUpdateBusiness } from '@/lib/hooks/use-business';
import { useTherapists } from '@/lib/hooks/use-therapists';
import { useCommunicationSettings, useUpdateCommunicationSettings } from '@/lib/hooks/use-messages';
import { uploadFile, getPublicUrl, brandingPath, uniqueFileName, BUCKETS } from '@/lib/storage';
import { apiClient } from '@/lib/api-client';
import { usePushNotifications } from '@/lib/hooks/use-push-notifications';
import { listPasskeys, enrollPasskey, revokePasskey, type PasskeyFactor } from '@/lib/supabase/passkeys';

type Tab = 'business' | 'team' | 'notifications' | 'branding' | 'booking' | 'clinical' | 'security' | 'portal';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'business', label: 'Business', icon: <Building2 className="h-4 w-4" /> },
  { id: 'team', label: 'Team', icon: <Users className="h-4 w-4" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
  { id: 'branding', label: 'Branding', icon: <Palette className="h-4 w-4" /> },
  { id: 'booking', label: 'Booking', icon: <CalendarCheck className="h-4 w-4" /> },
  { id: 'clinical', label: 'Clinical Notes', icon: <FileText className="h-4 w-4" /> },
  { id: 'security', label: 'Security', icon: <ShieldCheck className="h-4 w-4" /> },
  { id: 'portal', label: 'Client Portal', icon: <LayoutDashboard className="h-4 w-4" /> },
];

// ─── Shared helpers ───────────────────────────────────────────────────────────

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  );
}

function SaveButton({ isSaving, saved }: { isSaving: boolean; saved: boolean }) {
  return (
    <Button type="submit" variant="primary" disabled={isSaving}>
      {isSaving ? (
        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
      ) : saved ? (
        <><Check className="h-4 w-4 mr-2" />Saved</>
      ) : (
        <><Save className="h-4 w-4 mr-2" />Save Changes</>
      )}
    </Button>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

// ─── Business Tab ─────────────────────────────────────────────────────────────

function BusinessTab({ businessId }: { businessId: string }) {
  const { data: business, isLoading } = useBusiness(businessId);
  const updateBusiness = useUpdateBusiness(businessId);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phoneNumber: '', address: '',
    city: '', state: '', postalCode: '', country: 'USA', website: '',
  });

  useEffect(() => {
    if (business) {
      setForm({
        name: business.name || '',
        email: business.email || '',
        phoneNumber: business.phoneNumber || '',
        address: business.address || '',
        city: business.city || '',
        state: business.state || '',
        postalCode: business.postalCode || '',
        country: business.country || 'USA',
        website: business.website || '',
      });
    }
  }, [business]);

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateBusiness.mutateAsync(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <SectionHeader
        title="Business Profile"
        description="Update your clinic or practice information displayed to clients."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Input label="Business Name" required {...field('name')} placeholder="e.g. Serenity Wellness Clinic" />
        </div>
        <Input label="Email" type="email" {...field('email')} placeholder="info@yourbusiness.com" />
        <Input label="Phone Number" type="tel" {...field('phoneNumber')} placeholder="+1 (555) 000-0000" />
        <div className="md:col-span-2">
          <Input label="Street Address" {...field('address')} placeholder="123 Main St" />
        </div>
        <Input label="City" {...field('city')} placeholder="Melbourne" />
        <Input label="State / Province" {...field('state')} placeholder="VIC" />
        <Input label="Postal Code" {...field('postalCode')} placeholder="3000" />
        <Input label="Country" {...field('country')} placeholder="Australia" />
        <div className="md:col-span-2">
          <Input label="Website" type="url" {...field('website')} placeholder="https://yourbusiness.com" />
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <SaveButton isSaving={updateBusiness.isPending} saved={saved} />
      </div>
    </form>
  );
}

// ─── Team Tab ─────────────────────────────────────────────────────────────────

const ROLE_INFO: Record<string, { label: string; description: string }> = {
  THERAPIST: {
    label: 'Therapist',
    description: 'Can view their own schedule, write treatment notes, and manage their availability. Cannot access billing, payroll, or other therapists\' records.',
  },
  RECEPTIONIST: {
    label: 'Receptionist',
    description: 'Can manage all appointments, clients, and invoices across the practice. Cannot access payroll or admin settings.',
  },
  ADMIN: {
    label: 'Admin',
    description: 'Full access to all features including settings, payroll, and team management.',
  },
};

function TeamTab({ businessId }: { businessId: string }) {
  const { data: therapists, isLoading } = useTherapists(businessId);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleToggleActive = async (therapistId: string, current: boolean) => {
    setUpdatingId(therapistId);
    try {
      await apiClient.patch(`/therapists/${therapistId}`, {
        businessId,
        isActive: !current,
      });
      window.location.reload();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    try {
      await apiClient.patch(`/users/${userId}`, { businessId, role: newRole });
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading team…</div>;

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Team & Permissions"
        description="Manage your staff members and their access roles."
      />

      {/* Role explanation callout */}
      <div
        className="rounded-xl p-4 space-y-3"
        style={{ background: '#F3EFFD', border: '1px solid rgba(93,74,168,0.15)' }}
      >
        <p className="text-sm font-semibold" style={{ color: '#3D3450' }}>Understanding roles</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {['THERAPIST', 'RECEPTIONIST'].map((role) => (
            <div
              key={role}
              className="rounded-lg p-3"
              style={{ background: '#fff', border: '1px solid rgba(93,74,168,0.1)' }}
            >
              <p className="text-xs font-semibold mb-1" style={{ color: '#5D4AA8' }}>
                {ROLE_INFO[role].label}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: '#7A7090' }}>
                {ROLE_INFO[role].description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {!therapists?.length && (
          <p className="text-sm text-muted-foreground">No team members found.</p>
        )}
        {(therapists || []).map((t: any) => {
          const u = t.user;
          return (
            <Card key={t.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#EDE5F4] flex items-center justify-center text-[#5D4AA8] font-semibold text-sm">
                      {u?.firstName?.[0]}{u?.lastName?.[0]}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {u?.firstName} {u?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{u?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant={t.isActive ? 'success' : 'default'}>
                      {t.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <select
                      className="text-xs border rounded px-2 py-1 bg-background text-foreground"
                      defaultValue={u?.role || 'THERAPIST'}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      disabled={updatingId === u?.id}
                      title="Change role"
                    >
                      <option value="THERAPIST">Therapist</option>
                      <option value="RECEPTIONIST">Receptionist</option>
                    </select>
                    <Button
                      variant={t.isActive ? 'outline' : 'primary'}
                      onClick={() => handleToggleActive(t.id, t.isActive)}
                      disabled={updatingId === t.id}
                      title={t.isActive
                        ? 'Deactivate — removes from scheduling and booking page'
                        : 'Activate — restores access to scheduling and booking page'}
                    >
                      {updatingId === t.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : t.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>
                {t.specializations?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {t.specializations.map((s: string) => (
                      <span key={s} className="text-xs bg-gray-100 dark:bg-gray-800 rounded px-2 py-0.5">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div
        className="rounded-lg p-4 text-sm"
        style={{ background: '#F9F8FF', border: '1px dashed rgba(93,74,168,0.3)', color: '#5D4AA8' }}
      >
        Team members appear here once they have a <strong>Therapist record</strong> linked to their account.
        To add a new team member, go to the{' '}
        <a href="/therapists" className="underline font-medium">Therapists</a> page → Team tab → Add Therapist Profile.
      </div>
    </div>
  );
}

// ─── Notifications Tab ────────────────────────────────────────────────────────

function NotificationsTab({ businessId }: { businessId: string }) {
  const { data: settings, isLoading } = useCommunicationSettings(businessId);
  const updateSettings = useUpdateCommunicationSettings(businessId);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    emailEnabled: false,
    smsEnabled: false,
    whatsappEnabled: false,
    defaultReminderHours: 24,
    autoSendReminders: false,
    smsOverageEnabled: false,
    smsHardStop: false,
  });

  useEffect(() => {
    if (settings) {
      setForm({
        emailEnabled: settings.emailEnabled,
        smsEnabled: settings.smsEnabled,
        whatsappEnabled: settings.whatsappEnabled,
        defaultReminderHours: settings.defaultReminderHours,
        autoSendReminders: settings.autoSendReminders,
        smsOverageEnabled: (settings as any).smsOverageEnabled ?? false,
        smsHardStop: (settings as any).smsHardStop ?? false,
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings.mutateAsync(form as any);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Toggle = ({
    id, label, description, checked, onChange,
  }: {
    id: string; label: string; description: string;
    checked: boolean; onChange: (v: boolean) => void;
  }) => (
    <label
      htmlFor={id}
      className="flex items-start justify-between gap-4 p-4 rounded-lg border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
    >
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="relative mt-0.5 flex-shrink-0">
        <input
          id={id}
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-[#5D4AA8]' : 'bg-gray-300 dark:bg-gray-600'}`}>
          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </div>
      </div>
    </label>
  );

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <SectionHeader
        title="Notification Settings"
        description="Choose which channels are active for sending reminders and messages."
      />

      <div className="space-y-3">
        <Toggle
          id="emailEnabled"
          label="Email Notifications"
          description="Send appointment reminders and receipts via email."
          checked={form.emailEnabled}
          onChange={(v) => setForm((f) => ({ ...f, emailEnabled: v }))}
        />
        <Toggle
          id="smsEnabled"
          label="SMS Notifications"
          description="Send appointment reminders via SMS (Twilio required)."
          checked={form.smsEnabled}
          onChange={(v) => setForm((f) => ({ ...f, smsEnabled: v }))}
        />
        <Toggle
          id="whatsappEnabled"
          label="WhatsApp Notifications"
          description="Send appointment reminders via WhatsApp Business API."
          checked={form.whatsappEnabled}
          onChange={(v) => setForm((f) => ({ ...f, whatsappEnabled: v }))}
        />
        <Toggle
          id="autoSendReminders"
          label="Auto-Send Reminders"
          description="Automatically send reminders for new appointments."
          checked={form.autoSendReminders}
          onChange={(v) => setForm((f) => ({ ...f, autoSendReminders: v }))}
        />
      </div>

      <div className="rounded-lg border border-violet-100 dark:border-violet-900/40 bg-violet-50 dark:bg-violet-900/20 p-4 space-y-3">
        <p className="text-sm font-semibold text-violet-800 dark:text-violet-300">SMS Credits — Overage Handling</p>
        <p className="text-xs text-violet-700 dark:text-violet-400">
          SMS is included in your plan. Configure what happens when your monthly credit allowance is exhausted.
        </p>
        <div className="space-y-2 pt-1">
          <Toggle
            id="smsOverageEnabled"
            label="Auto-purchase overage credits"
            description="Automatically buy extra SMS credits via Stripe when your allowance runs out (opt-in)."
            checked={form.smsOverageEnabled}
            onChange={(v) => setForm((f) => ({ ...f, smsOverageEnabled: v }))}
          />
          <Toggle
            id="smsHardStop"
            label="Hard stop when credits exhausted"
            description="Disable SMS sending entirely once your credits run out instead of continuing to send."
            checked={form.smsHardStop}
            onChange={(v) => setForm((f) => ({ ...f, smsHardStop: v }))}
          />
        </div>
      </div>

      <FieldRow label="Reminder Lead Time (hours)">
        <Input
          type="number"
          value={String(form.defaultReminderHours)}
          onChange={(e) =>
            setForm((f) => ({ ...f, defaultReminderHours: parseInt(e.target.value) || 24 }))
          }
          min="1"
          max="168"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Send reminders this many hours before the appointment (1–168).
        </p>
      </FieldRow>

      <div className="rounded-lg border border-blue-100 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-900/20 p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          To configure Twilio, SendGrid, or WhatsApp API keys, visit the{' '}
          <a href="/settings/communications" className="underline font-medium">
            Communications Provider Settings
          </a>{' '}
          page.
        </p>
      </div>

      <div className="flex justify-end pt-2">
        <SaveButton isSaving={updateSettings.isPending} saved={saved} />
      </div>

      <BrowserPushSection />
    </form>
  );
}

function BrowserPushSection() {
  const { isSupported, permission, isSubscribed, isLoading, subscribe, unsubscribe } =
    usePushNotifications();

  if (!isSupported) return null;

  return (
    <div className="mt-6 rounded-lg border border-gray-200 dark:border-gray-700 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <BellRing className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-semibold">Browser Push Notifications</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Receive real-time alerts for new bookings, appointment reminders, and payment confirmations
        in this browser—even when the app is in the background.
      </p>

      {permission === 'denied' ? (
        <p className="text-xs text-red-600">
          Notifications are blocked. Please allow them in your browser settings and reload.
        </p>
      ) : (
        <button
          type="button"
          disabled={isLoading}
          onClick={isSubscribed ? unsubscribe : subscribe}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
            isSubscribed
              ? 'border-red-300 text-red-700 hover:bg-red-50'
              : 'border-primary text-primary hover:bg-primary/5'
          } disabled:opacity-50`}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isSubscribed ? (
            <>
              <Bell className="h-4 w-4" />
              Disable push notifications
            </>
          ) : (
            <>
              <BellRing className="h-4 w-4" />
              Enable push notifications
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ─── Branding Tab ─────────────────────────────────────────────────────────────

function BrandingTab({ businessId }: { businessId: string }) {
  const { data: business, isLoading } = useBusiness(businessId);
  const { data: commSettings } = useCommunicationSettings(businessId);
  const updateBusiness = useUpdateBusiness(businessId);
  const updateComm = useUpdateCommunicationSettings(businessId);
  const fileRef = useRef<HTMLInputElement>(null);

  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState('#A8C3A0');
  const [secondaryColor, setSecondaryColor] = useState('#E7D8C9');
  const [emailSignature, setEmailSignature] = useState('');

  useEffect(() => {
    if (business) {
      setPrimaryColor(business.primaryColor || '#A8C3A0');
      setSecondaryColor(business.secondaryColor || '#E7D8C9');
      if (business.logo) {
        setLogoUrl(getPublicUrl(BUCKETS.BRANDING, business.logo));
      }
    }
  }, [business]);

  useEffect(() => {
    if (commSettings) {
      setEmailSignature(commSettings.emailSignature || '');
    }
  }, [commSettings]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = brandingPath(businessId, uniqueFileName(file.name));
      await uploadFile(BUCKETS.BRANDING, path, file);
      setLogoUrl(getPublicUrl(BUCKETS.BRANDING, path));
      await updateBusiness.mutateAsync({ logo: path } as any);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await Promise.all([
      updateBusiness.mutateAsync({ primaryColor, secondaryColor } as any),
      updateComm.mutateAsync({ emailSignature } as any),
    ]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SectionHeader
        title="Branding"
        description="Customize how your business appears to clients."
      />

      {/* Logo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Business Logo
        </label>
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-800">
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
            ) : (
              <Upload className="h-6 w-6 text-gray-400" />
            )}
          </div>
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {logoUrl ? 'Replace Logo' : 'Upload Logo'}
            </Button>
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG or SVG. Max 2 MB.</p>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleLogoUpload}
        />
      </div>

      {/* Colors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Primary Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-10 w-14 rounded-lg border cursor-pointer p-0.5"
            />
            <Input
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              placeholder="#A8C3A0"
              className="flex-1"
            />
          </div>
          <div
            className="mt-2 h-8 rounded-lg border"
            style={{ backgroundColor: primaryColor }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Secondary Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="h-10 w-14 rounded-lg border cursor-pointer p-0.5"
            />
            <Input
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              placeholder="#E7D8C9"
              className="flex-1"
            />
          </div>
          <div
            className="mt-2 h-8 rounded-lg border"
            style={{ backgroundColor: secondaryColor }}
          />
        </div>
      </div>

      {/* Email Footer */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email Footer / Signature
        </label>
        <textarea
          value={emailSignature}
          onChange={(e) => setEmailSignature(e.target.value)}
          rows={4}
          placeholder={`Best regards,\nYour Wellness Team\n\nPhone: +1 (555) 000-0000`}
          className="w-full rounded-xl border-2 border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Appended to the bottom of all outbound emails.
        </p>
      </div>

      <div className="flex justify-end pt-2">
        <SaveButton isSaving={updateBusiness.isPending || updateComm.isPending} saved={saved} />
      </div>
    </form>
  );
}

// ─── Booking Tab ──────────────────────────────────────────────────────────────

const BOOKING_MODE_OPTIONS = [
  {
    value: 'PUBLIC',
    icon: <Globe className="h-5 w-5" />,
    label: 'Public',
    description: 'Anyone can discover and book through your public booking page.',
  },
  {
    value: 'EXISTING_CLIENTS_ONLY',
    icon: <UserCheck className="h-5 w-5" />,
    label: 'Existing clients only',
    description: 'Clients must verify their email or phone before seeing availability. New clients are turned away.',
  },
  {
    value: 'INVITE_ONLY',
    icon: <Lock className="h-5 w-5" />,
    label: 'Invite only',
    description: 'Only clients with a personal invitation link can book. You send invites from the client profile.',
  },
] as const;

function BookingTab({ businessId }: { businessId: string }) {
  const { data: business, isLoading } = useBusiness(businessId);
  const updateBusiness = useUpdateBusiness(businessId);
  const [saved, setSaved] = useState(false);
  const [mode, setMode] = useState<'PUBLIC' | 'EXISTING_CLIENTS_ONLY' | 'INVITE_ONLY'>('PUBLIC');

  useEffect(() => {
    if (business) setMode((business as any).bookingMode || 'PUBLIC');
  }, [business]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateBusiness.mutateAsync({ bookingMode: mode } as any);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SectionHeader
        title="Online Booking Access"
        description="Control who can book appointments through your public booking page."
      />
      <div className="space-y-3">
        {BOOKING_MODE_OPTIONS.map((opt) => {
          const selected = mode === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMode(opt.value)}
              className="w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all"
              style={
                selected
                  ? { borderColor: '#5D4AA8', backgroundColor: '#F4F0FB' }
                  : { borderColor: '#E5E7EB', backgroundColor: 'transparent' }
              }
            >
              <div
                className="mt-0.5 flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: selected ? '#EDE5F4' : '#F3F4F6', color: selected ? '#5D4AA8' : '#6B7280' }}
              >
                {opt.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: selected ? '#5D4AA8' : '#111827' }}>
                  {opt.label}
                </p>
                <p className="text-xs mt-0.5 text-gray-500">{opt.description}</p>
              </div>
              <div
                className="mt-1 flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center"
                style={{ borderColor: selected ? '#5D4AA8' : '#D1D5DB' }}
              >
                {selected && <div className="w-2 h-2 rounded-full" style={{ background: '#5D4AA8' }} />}
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex justify-end pt-2">
        <SaveButton isSaving={updateBusiness.isPending} saved={saved} />
      </div>
    </form>
  );
}

// ─── Security Tab ────────────────────────────────────────────────────────────

function SecurityTab() {
  const [passkeys, setPasskeys] = useState<PasskeyFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newName, setNewName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
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
      const name = newName.trim() || `Passkey ${new Date().toLocaleDateString()}`;
      await enrollPasskey(name);
      setSuccess('Passkey registered successfully.');
      setShowNameInput(false);
      setNewName('');
      await load();
    } catch (e: any) {
      setError(e.message || 'Failed to register passkey');
    } finally {
      setEnrolling(false);
    }
  };

  const handleRevoke = async (factorId: string) => {
    if (!confirm('Remove this passkey? You will need to use your password to sign in.')) return;
    setRevokingId(factorId);
    setError('');
    setSuccess('');
    try {
      await revokePasskey(factorId);
      setSuccess('Passkey removed.');
      await load();
    } catch (e: any) {
      setError(e.message || 'Failed to remove passkey');
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Security"
        description="Manage passkeys and two-factor authentication for your account."
      />

      {error && (
        <div className="rounded-xl p-3 text-sm" style={{ background: '#F5E5E5', color: '#922020', border: '1px solid #F5CECE' }}>
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl p-3 text-sm" style={{ background: '#E8F5E9', color: '#1B5E20', border: '1px solid #C8E6C9' }}>
          {success}
        </div>
      )}

      {/* Passkeys section */}
      <div className="rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" style={{ color: '#5D4AA8' }} />
            <h3 className="text-sm font-semibold text-foreground">Passkeys</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowNameInput((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors"
            style={{ borderColor: '#5D4AA8', color: '#5D4AA8' }}
          >
            <Plus className="h-3.5 w-3.5" />
            Add passkey
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          Passkeys use your device&apos;s biometrics (Face ID, Touch ID, Windows Hello) or a hardware security key to sign in without a password.
        </p>

        {showNameInput && (
          <div className="flex items-center gap-2">
            <Input
              value={newName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
              placeholder={`e.g. MacBook Touch ID, iPhone Face ID`}
              className="flex-1"
              onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleEnroll()}
            />
            <Button
              type="button"
              variant="primary"
              onClick={handleEnroll}
              disabled={enrolling}
            >
              {enrolling ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Register'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => { setShowNameInput(false); setNewName(''); }}
            >
              Cancel
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : passkeys.length === 0 ? (
          <div
            className="rounded-lg p-4 text-sm text-center"
            style={{ background: '#F9F8FF', border: '1px dashed rgba(93,74,168,0.3)', color: '#7A7090' }}
          >
            No passkeys registered yet. Add one to sign in without a password.
          </div>
        ) : (
          <div className="space-y-2">
            {passkeys.map((pk) => (
              <div
                key={pk.id}
                className="flex items-center justify-between p-3 rounded-lg border"
                style={{ borderColor: '#E5DEEC', background: '#FDFCFF' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: '#EDE5F4' }}
                  >
                    <KeyRound className="h-4 w-4" style={{ color: '#5D4AA8' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{pk.friendlyName}</p>
                    <p className="text-xs text-muted-foreground">
                      Added {new Date(pk.createdAt).toLocaleDateString()}
                      {pk.status !== 'verified' && (
                        <span className="ml-2 text-amber-600">· {pk.status}</span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRevoke(pk.id)}
                  disabled={revokingId === pk.id}
                  className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                  title="Remove passkey"
                >
                  {revokingId === pk.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        className="rounded-lg p-4 text-sm space-y-1"
        style={{ background: '#F3EFFD', border: '1px solid rgba(93,74,168,0.15)' }}
      >
        <p className="font-medium" style={{ color: '#3D3450' }}>Enabling passkeys in Supabase</p>
        <p style={{ color: '#7A7090' }}>
          WebAuthn must be enabled in your Supabase project under <strong>Authentication → MFA → Add Factor → WebAuthn</strong> before passkeys can be registered.
        </p>
      </div>
    </div>
  );
}

// ─── Clinical Notes Tab ───────────────────────────────────────────────────────

type DraftNoteVisibility = 'ONLY_AUTHOR' | 'ALL_THERAPISTS' | 'BUSINESS_OWNER_ONLY';

const DRAFT_VISIBILITY_OPTIONS: {
  value: DraftNoteVisibility;
  icon: React.ReactNode;
  label: string;
  description: string;
}[] = [
  {
    value: 'ALL_THERAPISTS',
    icon: <Users className="h-5 w-5" />,
    label: 'All therapists',
    description: 'Every therapist in the practice can read draft notes written by their colleagues.',
  },
  {
    value: 'ONLY_AUTHOR',
    icon: <Lock className="h-5 w-5" />,
    label: 'Only the author',
    description: 'Therapists can only see their own draft notes. Approved notes remain visible to all.',
  },
  {
    value: 'BUSINESS_OWNER_ONLY',
    icon: <ShieldCheck className="h-5 w-5" />,
    label: 'Business owner only',
    description: 'Draft notes are hidden from all therapists until approved. Only the business owner can view drafts.',
  },
];

function ClinicalTab({ businessId }: { businessId: string }) {
  const { data: business, isLoading } = useBusiness(businessId);
  const updateBusiness = useUpdateBusiness(businessId);
  const [saved, setSaved] = useState(false);
  const [visibility, setVisibility] = useState<DraftNoteVisibility>('ALL_THERAPISTS');

  useEffect(() => {
    if (business) {
      setVisibility(((business as any).draftNoteVisibility as DraftNoteVisibility) || 'ALL_THERAPISTS');
    }
  }, [business]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateBusiness.mutateAsync({ draftNoteVisibility: visibility } as any);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SectionHeader
        title="Draft Note Visibility"
        description="Control which staff members can read treatment notes that are still in draft status. The business owner can always see all drafts regardless of this setting."
      />

      <div
        className="rounded-xl p-4 space-y-1 text-sm"
        style={{ background: '#F3EFFD', border: '1px solid rgba(93,74,168,0.15)' }}
      >
        <p className="font-medium" style={{ color: '#3D3450' }}>What counts as a draft?</p>
        <p style={{ color: '#7A7090' }}>
          A note stays in <strong>Draft</strong> status until it is submitted for review and approved. Notes in <strong>Approved</strong> status are always visible to all therapists, regardless of this setting.
        </p>
      </div>

      <div className="space-y-3">
        {DRAFT_VISIBILITY_OPTIONS.map((opt) => {
          const selected = visibility === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setVisibility(opt.value)}
              className="w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all"
              style={
                selected
                  ? { borderColor: '#5D4AA8', backgroundColor: '#F4F0FB' }
                  : { borderColor: '#E5E7EB', backgroundColor: 'transparent' }
              }
            >
              <div
                className="mt-0.5 flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: selected ? '#EDE5F4' : '#F3F4F6', color: selected ? '#5D4AA8' : '#6B7280' }}
              >
                {opt.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: selected ? '#5D4AA8' : '#111827' }}>
                  {opt.label}
                </p>
                <p className="text-xs mt-0.5 text-gray-500">{opt.description}</p>
              </div>
              <div
                className="mt-1 flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center"
                style={{ borderColor: selected ? '#5D4AA8' : '#D1D5DB' }}
              >
                {selected && <div className="w-2 h-2 rounded-full" style={{ background: '#5D4AA8' }} />}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-end pt-2">
        <SaveButton isSaving={updateBusiness.isPending} saved={saved} />
      </div>
    </form>
  );
}

// ─── Client Portal Tab ───────────────────────────────────────────────────────

function ClientPortalTab({ businessId }: { businessId: string }) {
  const { data: business, isLoading } = useBusiness(businessId);
  const updateBusiness = useUpdateBusiness(businessId);
  const [saved, setSaved] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [settings, setSettings] = useState({ showNotes: false, showInvoices: true, showIntakeForms: true });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (business) {
      setEnabled((business as any).clientPortalEnabled ?? false);
      const s = (business as any).clientPortalSettings;
      if (s) setSettings({ showNotes: s.showNotes ?? false, showInvoices: s.showInvoices ?? true, showIntakeForms: s.showIntakeForms ?? true });
    }
  }, [business]);

  const portalUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/client-portal/sign-in`
    : '/client-portal/sign-in';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateBusiness.mutateAsync({ clientPortalEnabled: enabled, clientPortalSettings: settings } as any);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(portalUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <SectionHeader title="Client Portal" description="Give clients a self-service portal to view their appointments, invoices, and forms." />

      {/* Enable toggle */}
      <div className="flex items-start justify-between gap-4 p-4 rounded-xl" style={{ background: '#FAFAFA', border: '1px solid #EFE9F2' }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#1E1830' }}>Enable Client Portal</p>
          <p className="text-xs mt-0.5" style={{ color: '#7A7090' }}>
            When enabled, clients can sign in at your portal URL to access their records.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEnabled((v) => !v)}
          className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
          style={{ background: enabled ? '#5D4AA8' : '#D1D5DB' }}
        >
          <span
            className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
            style={{ transform: enabled ? 'translateX(22px)' : 'translateX(2px)' }}
          />
        </button>
      </div>

      {/* Portal URL */}
      {enabled && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#3D3450' }}>Portal URL</label>
            <div className="flex gap-2">
              <div
                className="flex-1 px-3 py-2 rounded-xl text-sm truncate"
                style={{ background: '#F8F7FF', border: '1px solid #D9D3E8', color: '#5D4AA8' }}
              >
                {portalUrl}
              </div>
              <button
                type="button"
                onClick={copyUrl}
                className="px-3 py-2 rounded-xl text-sm flex items-center gap-1.5"
                style={{ background: '#EDE5F4', color: '#5D4AA8' }}
              >
                {copied ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <a
                href="/client-portal/sign-in"
                target="_blank"
                className="px-3 py-2 rounded-xl text-sm flex items-center gap-1.5"
                style={{ background: '#EDE5F4', color: '#5D4AA8' }}
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Visibility settings */}
          <div>
            <p className="text-sm font-semibold mb-3" style={{ color: '#1E1830' }}>Visible to Clients</p>
            <div className="space-y-2">
              {[
                { key: 'showInvoices', label: 'Invoices & payment history' },
                { key: 'showIntakeForms', label: 'Intake forms' },
                { key: 'showNotes', label: 'Approved treatment summaries (documents)' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings[key as keyof typeof settings]}
                    onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.checked }))}
                    className="w-4 h-4 rounded accent-[#5D4AA8]"
                  />
                  <span className="text-sm" style={{ color: '#3D3450' }}>{label}</span>
                </label>
              ))}
            </div>
            <p className="text-xs mt-2" style={{ color: '#9E96B0' }}>Appointments are always visible to clients.</p>
          </div>

          <div
            className="flex items-start gap-2.5 rounded-xl p-3.5"
            style={{ background: '#F3EFFD', border: '1px solid rgba(93,74,168,0.15)' }}
          >
            <LayoutDashboard className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#5D4AA8' }} />
            <p className="text-xs" style={{ color: '#5D4AA8' }}>
              To invite a client, go to their profile and click <strong>Send Portal Invite</strong>. They will receive an email with the portal link.
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <SaveButton isSaving={updateBusiness.isPending} saved={saved} />
      </div>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const businessId = useBusinessId();
  const [activeTab, setActiveTab] = useState<Tab>('business');

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#5D4AA8', letterSpacing: '1.4px' }}>Tools</p>
        <h1 className="text-2xl font-semibold font-display" style={{ color: '#1E1830', letterSpacing: '-0.4px' }}>Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: '#7A7090' }}>
          Manage your practice, team, notifications, and branding.
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{ borderBottom: '1px solid #EFE9F2' }}>
        <nav className="-mb-px flex gap-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors"
              style={
                activeTab === tab.id
                  ? { borderBottomColor: '#5D4AA8', color: '#5D4AA8' }
                  : { borderBottomColor: 'transparent', color: '#7A7090' }
              }
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <Card>
        <CardContent className="p-6">
          {!businessId ? (
            <p className="text-sm text-muted-foreground">Loading business settings…</p>
          ) : (
            <>
              {activeTab === 'business' && <BusinessTab businessId={businessId} />}
              {activeTab === 'team' && <TeamTab businessId={businessId} />}
              {activeTab === 'notifications' && <NotificationsTab businessId={businessId} />}
              {activeTab === 'branding' && <BrandingTab businessId={businessId} />}
              {activeTab === 'booking' && <BookingTab businessId={businessId} />}
              {activeTab === 'clinical' && <ClinicalTab businessId={businessId} />}
              {activeTab === 'security' && <SecurityTab />}
              {activeTab === 'portal' && <ClientPortalTab businessId={businessId} />}
            </>
          )}
        </CardContent>
      </Card>

      <Link
        href="/settings/reminders"
        className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:bg-muted transition-colors"
      >
        <div className="h-10 w-10 bg-[#EDE5F4] rounded-lg flex items-center justify-center flex-shrink-0">
          <BellRing className="h-5 w-5 text-[#5D4AA8]" />
        </div>
        <div>
          <p className="font-medium text-foreground">Reminders &amp; Notifications</p>
          <p className="text-sm text-muted-foreground">Toggle and customise automated messages sent to clients and staff</p>
        </div>
      </Link>

      <Link
        href="/settings/locations"
        className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:bg-muted transition-colors"
      >
        <div className="h-10 w-10 bg-[#EDE5F4] rounded-lg flex items-center justify-center flex-shrink-0">
          <MapPin className="h-5 w-5 text-[#5D4AA8]" />
        </div>
        <div>
          <p className="font-medium text-foreground">Locations & Rooms</p>
          <p className="text-sm text-muted-foreground">Manage your business locations and treatment rooms</p>
        </div>
      </Link>

      <Link
        href="/settings/scheduling"
        className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:bg-muted transition-colors"
      >
        <div className="h-10 w-10 bg-[#EDE5F4] rounded-lg flex items-center justify-center flex-shrink-0">
          <Clock className="h-5 w-5 text-[#5D4AA8]" />
        </div>
        <div>
          <p className="font-medium text-foreground">Availability Rules</p>
          <p className="text-sm text-muted-foreground">Restrict booking windows for specific therapists, rooms, or service types</p>
        </div>
      </Link>

      <Link
        href="/settings/integrations"
        className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:bg-muted transition-colors"
      >
        <div className="h-10 w-10 bg-[#EDE5F4] rounded-lg flex items-center justify-center flex-shrink-0">
          <Link2 className="h-5 w-5 text-[#5D4AA8]" />
        </div>
        <div>
          <p className="font-medium text-foreground">Integrations</p>
          <p className="text-sm text-muted-foreground">Connect Xero or QuickBooks for two-way invoice and payment sync</p>
        </div>
      </Link>
    </div>
  );
}
