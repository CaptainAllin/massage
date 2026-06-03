'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@massage/ui';
import { Loader2, Check, Upload, BellRing, Bell, Building2, Palette } from 'lucide-react';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useBusiness, useUpdateBusiness } from '@/lib/hooks/use-business';
import { useCommunicationSettings, useUpdateCommunicationSettings } from '@/lib/hooks/use-messages';
import { usePushNotifications } from '@/lib/hooks/use-push-notifications';
import { uploadFile, getPublicUrl, brandingPath, uniqueFileName, BUCKETS } from '@/lib/storage';
import { useOnboardingContext } from '@/components/onboarding/OnboardingProvider';
import { COUNTRIES, getCountryByCode } from '@/lib/format';
import { getCountryFormat } from '@/lib/countryFormats';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { PostcodeInput } from '@/components/ui/PostcodeInput';

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = [
  { num: 1, label: 'Business Profile', icon: <Building2 className="h-4 w-4" /> },
  { num: 2, label: 'Branding',          icon: <Palette className="h-4 w-4" /> },
  { num: 3, label: 'Notifications',     icon: <Bell className="h-4 w-4" /> },
];

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((s, i) => {
        const done    = s.num < current;
        const active  = s.num === current;
        return (
          <div key={s.num} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all"
                style={
                  done    ? { background: '#5D4AA8', color: '#fff' }
                  : active ? { background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)', color: '#fff', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.16), 0 1px 3px rgba(28,20,54,0.18)' }
                  :          { background: '#EDE5F4', color: '#9E96B0' }
                }
              >
                {done
                  ? <Check className="h-4 w-4" />
                  : s.icon
                }
              </div>
              <span
                className="text-xs font-medium whitespace-nowrap"
                style={{ color: active ? '#5D4AA8' : done ? '#5D4AA8' : '#9E96B0' }}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="mx-3 mb-5"
                style={{
                  height: '2px',
                  width: '64px',
                  background: done ? '#5D4AA8' : '#EDE5F4',
                  borderRadius: '2px',
                  transition: 'background 0.3s',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-start gap-2 rounded-xl p-3"
      style={{ background: '#F3EFFD', border: '1px solid rgba(93,74,168,0.12)' }}
    >
      <span className="text-xs mt-0.5 flex-shrink-0" style={{ color: '#5D4AA8' }}>ⓘ</span>
      <p className="text-xs leading-relaxed" style={{ color: '#5D4AA8' }}>{children}</p>
    </div>
  );
}

function Toggle({
  id, label, description, checked, onChange,
}: { id: string; label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label
      htmlFor={id}
      className="flex items-start justify-between gap-4 p-4 rounded-xl border cursor-pointer transition-colors"
      style={{
        borderColor: checked ? 'rgba(93,74,168,0.3)' : '#EFE9F2',
        background: checked ? '#F9F8FF' : '#FAFAFA',
      }}
    >
      <div>
        <p className="text-sm font-medium" style={{ color: '#1E1830' }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: '#7A7090' }}>{description}</p>
      </div>
      <div className="relative mt-0.5 flex-shrink-0">
        <input
          id={id}
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-[#5D4AA8]' : 'bg-gray-200'}`}>
          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </div>
      </div>
    </label>
  );
}

// ─── Step 1: Business Profile ─────────────────────────────────────────────────

function Step1({
  businessId,
  onNext,
}: { businessId: string; onNext: () => void }) {
  const { data: business, isLoading } = useBusiness(businessId);
  const updateBusiness = useUpdateBusiness(businessId);
  const [form, setForm] = useState({
    name: '', email: '', phoneNumber: '', address: '',
    city: '', state: '', postalCode: '', country: 'AU', currency: 'AUD', website: '',
  });

  useEffect(() => {
    if (business) {
      setForm({
        name:         business.name || '',
        email:        business.email || '',
        phoneNumber:  business.phoneNumber || '',
        address:      business.address || '',
        city:         business.city || '',
        state:        business.state || '',
        postalCode:   business.postalCode || '',
        country:      business.country || 'AU',
        currency:     (business as any).currency || 'AUD',
        website:      business.website || '',
      });
    }
  }, [business]);

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value })),
  });

  const handleCountryChange = (countryCode: string) => {
    const country = getCountryByCode(countryCode);
    setForm(f => ({
      ...f,
      country: countryCode,
      currency: country?.currency || f.currency,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateBusiness.mutateAsync(form);
    onNext();
  };

  if (isLoading) return <div className="py-12 text-center text-sm" style={{ color: '#7A7090' }}>Loading…</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold mb-1" style={{ color: '#1E1830' }}>Business Profile</h2>
        <p className="text-sm" style={{ color: '#7A7090' }}>Tell us about your practice so clients know who they're booking with.</p>
      </div>

      <Hint>
        Your <strong>Business Name</strong> appears on invoices, appointment reminders, and your public booking page.
        Make it recognisable to your clients.
      </Hint>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#3D3450' }}>
            Business Name <span style={{ color: '#C97E68' }}>*</span>
          </label>
          <Input required placeholder="e.g. Serenity Wellness Clinic" {...field('name')} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Email" type="email" placeholder="info@yourbusiness.com" {...field('email')} />
          <PhoneInput
            label="Phone Number"
            value={form.phoneNumber}
            onChange={(v) => setForm((f) => ({ ...f, phoneNumber: v }))}
            countryCode={form.country}
          />
        </div>

        <div>
          <Input label="Street Address" placeholder="123 Main St" {...field('address')} />
          <p className="text-xs mt-1" style={{ color: '#9E96B0' }}>
            Used on invoices and for the Google Maps link shown to clients.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Input label="City" placeholder="Melbourne" {...field('city')} />
          <Input label="State" placeholder="VIC" {...field('state')} />
          <PostcodeInput
            value={form.postalCode}
            onChange={(v) => setForm((f) => ({ ...f, postalCode: v }))}
            countryCode={form.country}
          />
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#3D3450' }}>Country</label>
            <select
              value={form.country}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="w-full rounded-xl border-2 border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="">Select…</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <Input label="Website" type="url" placeholder="https://yourbusiness.com" {...field('website')} />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" variant="primary" disabled={updateBusiness.isPending}>
          {updateBusiness.isPending
            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
            : <>Save & Continue →</>}
        </Button>
      </div>
    </form>
  );
}

// ─── Step 2: Branding ─────────────────────────────────────────────────────────

function Step2({
  businessId,
  onNext,
  onBack,
}: { businessId: string; onNext: () => void; onBack: () => void }) {
  const { data: business, isLoading } = useBusiness(businessId);
  const { data: commSettings } = useCommunicationSettings(businessId);
  const updateBusiness = useUpdateBusiness(businessId);
  const updateComm = useUpdateCommunicationSettings(businessId);
  const fileRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState('#A8C3A0');
  const [secondaryColor, setSecondaryColor] = useState('#E7D8C9');
  const [emailSignature, setEmailSignature] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (business) {
      setPrimaryColor(business.primaryColor || '#A8C3A0');
      setSecondaryColor(business.secondaryColor || '#E7D8C9');
      if (business.logo) setLogoUrl(getPublicUrl(BUCKETS.BRANDING, business.logo));
    }
  }, [business]);

  useEffect(() => {
    if (commSettings) setEmailSignature(commSettings.emailSignature || '');
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
    setIsSaving(true);
    try {
      await Promise.all([
        updateBusiness.mutateAsync({ primaryColor, secondaryColor } as any),
        updateComm.mutateAsync({ emailSignature } as any),
      ]);
      onNext();
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="py-12 text-center text-sm" style={{ color: '#7A7090' }}>Loading…</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1" style={{ color: '#1E1830' }}>Branding</h2>
        <p className="text-sm" style={{ color: '#7A7090' }}>Customise how your business looks on the booking page and in emails.</p>
      </div>

      {/* Logo */}
      <div>
        <p className="text-sm font-medium mb-2" style={{ color: '#3D3450' }}>Business Logo</p>
        <div className="flex items-center gap-4">
          <div
            className="h-20 w-20 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden"
            style={{ borderColor: logoUrl ? 'rgba(93,74,168,0.3)' : '#D1C4E0', background: '#F9F8FF' }}
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#5D4AA8' }} />
            ) : logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
            ) : (
              <Upload className="h-6 w-6" style={{ color: '#9E96B0' }} />
            )}
          </div>
          <div>
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Upload className="h-4 w-4 mr-2" />
              {logoUrl ? 'Replace Logo' : 'Upload Logo'}
            </Button>
            <p className="text-xs mt-1" style={{ color: '#9E96B0' }}>PNG, JPG or SVG · Max 2 MB</p>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
      </div>

      {/* Colors */}
      <div>
        <p className="text-sm font-medium mb-1" style={{ color: '#3D3450' }}>Brand Colors</p>
        <p className="text-xs mb-3" style={{ color: '#9E96B0' }}>These colors appear on your booking page and in outbound emails.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Primary Color',   value: primaryColor,   set: setPrimaryColor },
            { label: 'Secondary Color', value: secondaryColor, set: setSecondaryColor },
          ].map(({ label, value, set }) => (
            <div key={label}>
              <label className="block text-xs font-medium mb-2" style={{ color: '#3D3450' }}>{label}</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  className="h-10 w-14 rounded-lg border cursor-pointer p-0.5"
                />
                <Input value={value} onChange={(e) => set(e.target.value)} className="flex-1" />
              </div>
              <div className="mt-2 h-6 rounded-lg border" style={{ backgroundColor: value }} />
            </div>
          ))}
        </div>
      </div>

      {/* Email Footer */}
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#3D3450' }}>
          Email Footer / Signature
        </label>
        <textarea
          value={emailSignature}
          onChange={(e) => setEmailSignature(e.target.value)}
          rows={4}
          placeholder={`Best regards,\nYour Wellness Team\n\nPhone: ${getCountryFormat(business?.country || 'AU').phonePrefix} …`}
          className="w-full rounded-xl border-2 border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        />
        <p className="text-xs mt-1" style={{ color: '#9E96B0' }}>Appended to the bottom of all outbound emails.</p>
      </div>

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={onBack}>← Back</Button>
        <Button type="submit" variant="primary" disabled={isSaving}>
          {isSaving
            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
            : <>Save & Continue →</>}
        </Button>
      </div>
    </form>
  );
}

// ─── Step 3: Notifications ────────────────────────────────────────────────────

function Step3({
  businessId,
  onComplete,
  onBack,
}: { businessId: string; onComplete: () => void; onBack: () => void }) {
  const { data: settings, isLoading } = useCommunicationSettings(businessId);
  const updateSettings = useUpdateCommunicationSettings(businessId);
  const { isSupported, permission, isSubscribed, isLoading: pushLoading, subscribe, unsubscribe } = usePushNotifications();
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    emailEnabled:         false,
    smsEnabled:           false,
    whatsappEnabled:      false,
    defaultReminderHours: 24,
    autoSendReminders:    false,
  });

  useEffect(() => {
    if (settings) {
      setForm({
        emailEnabled:         settings.emailEnabled,
        smsEnabled:           settings.smsEnabled,
        whatsappEnabled:      settings.whatsappEnabled,
        defaultReminderHours: settings.defaultReminderHours,
        autoSendReminders:    settings.autoSendReminders,
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSettings.mutateAsync(form as any);
      onComplete();
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="py-12 text-center text-sm" style={{ color: '#7A7090' }}>Loading…</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold mb-1" style={{ color: '#1E1830' }}>Notifications</h2>
        <p className="text-sm" style={{ color: '#7A7090' }}>Choose how you stay in touch with clients and receive alerts.</p>
      </div>

      <div className="space-y-2">
        <Toggle
          id="emailEnabled"
          label="Email Notifications"
          description="Send appointment reminders and receipts via email."
          checked={form.emailEnabled}
          onChange={(v) => setForm(f => ({ ...f, emailEnabled: v }))}
        />
        <Toggle
          id="smsEnabled"
          label="SMS Notifications"
          description="Send reminders via SMS. Requires a Twilio account."
          checked={form.smsEnabled}
          onChange={(v) => setForm(f => ({ ...f, smsEnabled: v }))}
        />
        <Toggle
          id="whatsappEnabled"
          label="WhatsApp Notifications"
          description="Send reminders via WhatsApp Business API."
          checked={form.whatsappEnabled}
          onChange={(v) => setForm(f => ({ ...f, whatsappEnabled: v }))}
        />
        <Toggle
          id="autoSendReminders"
          label="Auto-Send Reminders"
          description="Automatically send reminders for all new appointments."
          checked={form.autoSendReminders}
          onChange={(v) => setForm(f => ({ ...f, autoSendReminders: v }))}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#3D3450' }}>
          Reminder Lead Time (hours)
        </label>
        <Input
          type="number"
          value={String(form.defaultReminderHours)}
          onChange={(e) => setForm(f => ({ ...f, defaultReminderHours: parseInt(e.target.value) || 24 }))}
          min="1"
          max="168"
        />
        <p className="text-xs mt-1" style={{ color: '#9E96B0' }}>Send reminders this many hours before the appointment (1–168).</p>
      </div>

      <div
        className="rounded-xl p-3 text-xs"
        style={{ background: '#F0EFFF', border: '1px solid rgba(93,74,168,0.12)', color: '#5D4AA8' }}
      >
        To set up Twilio, SendGrid, or WhatsApp API keys, visit{' '}
        <a href="/settings/communications" className="underline font-medium">Communications Provider Settings</a>.
      </div>

      {/* Browser push */}
      {isSupported && (
        <div
          className="rounded-xl p-4 space-y-3"
          style={{ border: '1px solid #EFE9F2', background: '#FAFAFA' }}
        >
          <div className="flex items-center gap-2">
            <BellRing className="h-4 w-4" style={{ color: '#5D4AA8' }} />
            <p className="text-sm font-semibold" style={{ color: '#1E1830' }}>Browser Push Notifications</p>
          </div>
          <p className="text-xs" style={{ color: '#7A7090' }}>
            Receive real-time alerts for new bookings and appointment changes in this browser.
          </p>
          {permission === 'denied' ? (
            <p className="text-xs text-red-600">Notifications are blocked in browser settings. Allow them and reload to enable.</p>
          ) : (
            <button
              type="button"
              disabled={pushLoading}
              onClick={isSubscribed ? unsubscribe : subscribe}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors disabled:opacity-50"
              style={
                isSubscribed
                  ? { borderColor: '#FECDD3', color: '#B91C1C' }
                  : { borderColor: 'rgba(93,74,168,0.4)', color: '#5D4AA8' }
              }
            >
              {pushLoading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : isSubscribed
                  ? <><Bell className="h-4 w-4" />Disable push notifications</>
                  : <><BellRing className="h-4 w-4" />Enable push notifications</>}
            </button>
          )}
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={onBack}>← Back</Button>
        <Button type="submit" variant="primary" disabled={isSaving}>
          {isSaving
            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
            : <>Finish Setup →</>}
        </Button>
      </div>
    </form>
  );
}

// ─── Completion screen ────────────────────────────────────────────────────────

function CompletionScreen({ onGo }: { onGo: () => void }) {
  return (
    <div className="py-6 text-center space-y-5">
      <div
        className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)', boxShadow: '0 8px 28px rgba(28,20,54,0.14), 0 2px 6px rgba(28,20,54,0.08)' }}
      >
        <Check className="h-8 w-8 text-white" />
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2" style={{ color: '#1E1830' }}>You're all set!</h2>
        <p className="text-sm" style={{ color: '#7A7090' }}>
          Your business profile, branding, and notifications are configured.
          You can update these anytime in Settings.
        </p>
      </div>
      <button
        onClick={onGo}
        className="iris-cta inline-block px-6 py-3 rounded-2xl font-semibold text-white text-sm"
        style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.16), 0 1px 2px rgba(28,20,54,0.16)' }}
      >
        Go to Dashboard →
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SetupPage() {
  const router = useRouter();
  const businessId = useBusinessId();
  const { toggleItem, checkedItems } = useOnboardingContext();
  const [step, setStep] = useState<Step | 'done'>(1);

  const handleComplete = () => {
    if (!checkedItems.has('business_profile')) {
      toggleItem('business_profile');
    }
    setStep('done');
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="max-w-xl mx-auto py-4">
      {/* Header */}
      <div className="text-center mb-6">
        <p className="text-xs font-semibold uppercase mb-1" style={{ color: '#5D4AA8', letterSpacing: '1.4px' }}>
          Business Setup
        </p>
        <h1 className="text-2xl font-semibold" style={{ color: '#1E1830', letterSpacing: '-0.4px' }}>
          Set up your practice
        </h1>
        <p className="text-sm mt-1" style={{ color: '#7A7090' }}>
          Complete these three sections before your first booking.
        </p>
      </div>

      {step !== 'done' && <StepIndicator current={step} />}

      <div
        className="rounded-2xl p-6"
        style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 4px 24px rgba(93,74,168,0.08)' }}
      >
        {!businessId ? (
          <div className="py-12 text-center text-sm" style={{ color: '#7A7090' }}>Loading…</div>
        ) : step === 1 ? (
          <Step1 businessId={businessId} onNext={() => setStep(2)} />
        ) : step === 2 ? (
          <Step2 businessId={businessId} onNext={() => setStep(3)} onBack={() => setStep(1)} />
        ) : step === 3 ? (
          <Step3 businessId={businessId} onComplete={handleComplete} onBack={() => setStep(2)} />
        ) : (
          <CompletionScreen onGo={handleGoToDashboard} />
        )}
      </div>

      {step !== 'done' && (
        <p className="text-center mt-4 text-xs" style={{ color: '#9E96B0' }}>
          You can always update these in{' '}
          <a href="/settings" className="underline" style={{ color: '#5D4AA8' }}>Settings</a>.
        </p>
      )}
    </div>
  );
}
