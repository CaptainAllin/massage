'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, Button, Input, Badge } from '@massage/ui';
import { Building2, Users, Bell, Palette, Save, Upload, Loader2, Check, BellRing, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useBusiness, useUpdateBusiness } from '@/lib/hooks/use-business';
import { useTherapists } from '@/lib/hooks/use-therapists';
import { useCommunicationSettings, useUpdateCommunicationSettings } from '@/lib/hooks/use-messages';
import { uploadFile, getPublicUrl, brandingPath, uniqueFileName, BUCKETS } from '@/lib/storage';
import { apiClient } from '@/lib/api-client';
import { usePushNotifications } from '@/lib/hooks/use-push-notifications';

type Tab = 'business' | 'team' | 'notifications' | 'branding';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'business', label: 'Business', icon: <Building2 className="h-4 w-4" /> },
  { id: 'team', label: 'Team', icon: <Users className="h-4 w-4" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
  { id: 'branding', label: 'Branding', icon: <Palette className="h-4 w-4" /> },
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
      // Invalidation happens in the hook — refetch
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
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-semibold text-sm">
                      {u?.firstName?.[0]}{u?.lastName?.[0]}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {u?.firstName} {u?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{u?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={t.isActive ? 'success' : 'default'}>
                      {t.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <select
                      className="text-xs border rounded px-2 py-1 bg-background text-foreground"
                      defaultValue={u?.role || 'THERAPIST'}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      disabled={updatingId === u?.id}
                    >
                      <option value="THERAPIST">Therapist</option>
                      <option value="RECEPTIONIST">Receptionist</option>
                    </select>
                    <Button
                      variant={t.isActive ? 'outline' : 'primary'}
                      onClick={() => handleToggleActive(t.id, t.isActive)}
                      disabled={updatingId === t.id}
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

      <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-4 text-center">
        <p className="text-sm text-muted-foreground">
          To add new team members, create a Therapist record from the{' '}
          <a href="/therapists" className="text-primary underline underline-offset-2">
            Therapists
          </a>{' '}
          page.
        </p>
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
  });

  useEffect(() => {
    if (settings) {
      setForm({
        emailEnabled: settings.emailEnabled,
        smsEnabled: settings.smsEnabled,
        whatsappEnabled: settings.whatsappEnabled,
        defaultReminderHours: settings.defaultReminderHours,
        autoSendReminders: settings.autoSendReminders,
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
        <div className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const businessId = useBusinessId();
  const [activeTab, setActiveTab] = useState<Tab>('business');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-display">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your practice, team, notifications, and branding.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
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
            </>
          )}
        </CardContent>
      </Card>

      <Link
        href="/settings/locations"
        className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:bg-muted transition-colors"
      >
        <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <MapPin className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <p className="font-medium text-foreground">Manage Locations</p>
          <p className="text-sm text-muted-foreground">Add and configure your business locations for multi-location support</p>
        </div>
      </Link>
    </div>
  );
}
