'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, Button, Input, Badge } from '@massage/ui';
import { Building2, Users, Bell, Palette, Save, Upload, Loader2, Check, BellRing, MapPin, CalendarCheck, Globe, Lock, UserCheck, Clock, ShieldCheck, KeyRound, Trash2, Plus, Link2, FileText, LayoutDashboard, ExternalLink, Copy, CheckCheck, Phone, Pencil, Search, X, Info, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useBusiness, useUpdateBusiness } from '@/lib/hooks/use-business';
import { useTherapists, useCreateTherapist } from '@/lib/hooks/use-therapists';
import { useLocations } from '@/lib/hooks/use-locations';
import { useCommunicationSettings, useUpdateCommunicationSettings } from '@/lib/hooks/use-messages';
import { uploadFile, getPublicUrl, brandingPath, uniqueFileName, BUCKETS } from '@/lib/storage';
import { COUNTRIES, CURRENCIES, getCountryByCode } from '@/lib/format';
import { getCountryFormat, formatPhoneDisplay } from '@/lib/countryFormats';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { PostcodeInput } from '@/components/ui/PostcodeInput';
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
      <label className="block text-sm font-medium mb-1" style={{ color: '#3D3450' }}>
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
    city: '', state: '', postalCode: '', country: 'AU', currency: 'AUD', website: '',
  });
  // Multiple phone numbers stored as comma-separated string
  const [extraPhones, setExtraPhones] = useState<string[]>([]);
  const [stateQuery, setStateQuery] = useState('');
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const stateRef = React.useRef<HTMLDivElement>(null);

  const countryFmt = getCountryFormat(form.country);
  const filteredStates = countryFmt.states.filter(
    (s) =>
      s.name.toLowerCase().includes(stateQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(stateQuery.toLowerCase())
  );

  // Close state dropdown on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (stateRef.current && !stateRef.current.contains(e.target as Node)) {
        setStateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (business) {
      const phones = ((business.phoneNumber || '') as string).split(',').map((p) => p.trim()).filter(Boolean);
      setForm({
        name: business.name || '',
        email: business.email || '',
        phoneNumber: phones[0] || '',
        address: business.address || '',
        city: business.city || '',
        state: business.state || '',
        postalCode: business.postalCode || '',
        country: business.country || 'AU',
        currency: (business as any).currency || 'AUD',
        website: business.website || '',
      });
      setStateQuery(business.state || '');
      setExtraPhones(phones.slice(1));
    }
  }, [business]);

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const handleCountryChange = (countryCode: string) => {
    const country = getCountryByCode(countryCode);
    setForm((f) => ({
      ...f,
      country: countryCode,
      currency: country?.currency || f.currency,
      state: '',
    }));
    setStateQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allPhones = [form.phoneNumber, ...extraPhones].filter(Boolean);
    await updateBusiness.mutateAsync({ ...form, phoneNumber: allPhones.join(', ') } as any);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const selectClass = 'w-full rounded-xl border-2 border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary';

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

        {/* Primary phone number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
          <PhoneInput
            value={form.phoneNumber}
            onChange={(v) => setForm((f) => ({ ...f, phoneNumber: v }))}
            countryCode={form.country}
          />
        </div>

        {/* Extra phone number rows */}
        {extraPhones.map((phone, i) => (
          <div key={i} className="md:col-span-2 flex items-end gap-2">
            <div className="flex-1">
              <PhoneInput
                value={phone}
                onChange={(v) => setExtraPhones((prev) => prev.map((p, idx) => idx === i ? v : p))}
                countryCode={form.country}
                label={`Additional Phone ${i + 1}`}
              />
            </div>
            <button
              type="button"
              onClick={() => setExtraPhones((prev) => prev.filter((_, idx) => idx !== i))}
              className="mb-0.5 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Remove phone"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}

        {/* Add another phone */}
        <div className="md:col-span-2">
          <button
            type="button"
            onClick={() => setExtraPhones((prev) => [...prev, ''])}
            className="flex items-center gap-1.5 text-sm font-medium"
            style={{ color: '#5D4AA8' }}
          >
            <Plus className="h-3.5 w-3.5" />
            Add another phone number
          </button>
        </div>

        <div className="md:col-span-2">
          <Input label="Street Address" {...field('address')} placeholder="123 Main St" />
        </div>
        <Input label="City" {...field('city')} placeholder="e.g. Melbourne" />

        {/* State / Province — searchable dropdown */}
        <div ref={stateRef} className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {countryFmt.stateLabel}
          </label>
          <input
            type="text"
            value={stateQuery}
            onChange={(e) => { setStateQuery(e.target.value); setStateDropdownOpen(true); }}
            onFocus={() => setStateDropdownOpen(true)}
            placeholder={`Search ${countryFmt.stateLabel.toLowerCase()}…`}
            className="w-full rounded-xl border-2 border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-gray-400"
          />
          {stateDropdownOpen && filteredStates.length > 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-xl border border-[#EFE9F2] bg-white shadow-lg max-h-52 overflow-y-auto">
              {filteredStates.map((s) => (
                <button
                  key={s.code}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setForm((f) => ({ ...f, state: s.code }));
                    setStateQuery(s.name);
                    setStateDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-[#F3EFFD] transition-colors ${form.state === s.code ? 'bg-[#F3EFFD] font-medium text-[#5D4AA8]' : 'text-gray-800'}`}
                >
                  <span className="font-medium">{s.code}</span>
                  <span className="text-gray-500 ml-2">{s.name}</span>
                </button>
              ))}
            </div>
          )}
          {/* Free-text fallback when no states list */}
          {countryFmt.states.length === 0 && (
            <input
              type="text"
              value={form.state}
              onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
              placeholder="e.g. VIC"
              className="mt-1 w-full rounded-xl border-2 border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-gray-400"
            />
          )}
        </div>

        {/* Postcode */}
        <PostcodeInput
          value={form.postalCode}
          onChange={(v) => setForm((f) => ({ ...f, postalCode: v }))}
          countryCode={form.country}
        />

        <FieldRow label="Country">
          <select
            value={form.country}
            onChange={(e) => handleCountryChange(e.target.value)}
            className={selectClass}
          >
            <option value="">Select country…</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </FieldRow>
        <FieldRow label="Currency">
          <select
            value={form.currency}
            onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
            className={selectClass}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
            ))}
          </select>
        </FieldRow>
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

// ─── Team helpers ─────────────────────────────────────────────────────────────

function TagInput({ tags, onChange, placeholder }: { tags: string[]; onChange: (t: string[]) => void; placeholder?: string }) {
  const [input, setInput] = React.useState('');
  const addTag = (val: string) => { const t = val.trim(); if (t && !tags.includes(t)) onChange([...tags, t]); setInput(''); };
  const removeTag = (tag: string) => onChange(tags.filter((t) => t !== tag));
  return (
    <div className="min-h-[42px] flex flex-wrap gap-1.5 items-center rounded-xl border-2 border-input bg-background px-3 py-2 cursor-text">
      {tags.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: '#EDE5F4', color: '#5D4AA8' }}>
          {tag}
          <button type="button" onClick={() => removeTag(tag)}><X className="h-3 w-3" /></button>
        </span>
      ))}
      <input
        type="text" value={input} onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(input); } else if (e.key === 'Backspace' && !input && tags.length) removeTag(tags[tags.length - 1]); }}
        onBlur={() => { if (input.trim()) addTag(input); }}
        placeholder={tags.length ? '' : placeholder}
        className="flex-1 min-w-[120px] text-sm bg-transparent outline-none placeholder:text-gray-400"
      />
    </div>
  );
}

interface FoundUser { id: string; email: string; firstName: string | null; lastName: string | null; hasTherapistProfile: boolean; }

function AddTeamMemberModal({ businessId, onClose, onCreated }: { businessId: string; onClose: () => void; onCreated: () => void }) {
  const createTherapist = useCreateTherapist(businessId);
  const { data: locations = [] } = useLocations(businessId);
  const [email, setEmail] = React.useState('');
  const [searching, setSearching] = React.useState(false);
  const [searchError, setSearchError] = React.useState('');
  const [foundUser, setFoundUser] = React.useState<FoundUser | null>(null);
  const [specializations, setSpecializations] = React.useState<string[]>([]);
  const [bio, setBio] = React.useState('');
  const [licenseNumber, setLicenseNumber] = React.useState('');
  const [licenseExpiry, setLicenseExpiry] = React.useState('');
  const [hourlyRate, setHourlyRate] = React.useState('');
  const [locationId, setLocationId] = React.useState('');

  const handleSearch = async () => {
    if (!email.trim()) return;
    setSearching(true); setSearchError(''); setFoundUser(null);
    try {
      const resp = await apiClient.get<{ success: boolean; data: FoundUser }>(`/users/search?email=${encodeURIComponent(email.trim())}&businessId=${businessId}`);
      const user = resp.data.data;
      if (user.hasTherapistProfile) setSearchError('This user already has a therapist profile in your practice.');
      else setFoundUser(user);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'User not found';
      setSearchError(msg === 'No account found with that email address' ? 'No account found. The person must sign up first.' : msg);
    } finally { setSearching(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundUser) return;
    await createTherapist.mutateAsync({ userId: foundUser.id, specializations, bio: bio || undefined, licenseNumber: licenseNumber || undefined, licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : undefined, hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined, locationId: locationId || undefined } as any);
    onCreated(); onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900 rounded-t-2xl" style={{ borderColor: '#EFE9F2' }}>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: '#1E1830' }}>Add Team Member</h2>
            <p className="text-xs mt-0.5" style={{ color: '#7A7090' }}>Link a team member's account and set their profile details.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-lg p-1"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: '#3D3450' }}>Step 1 — Find team member</p>
            <div className="flex items-start gap-3 rounded-xl p-4 mb-3" style={{ background: '#F3EFFD', border: '1px solid rgba(93,74,168,0.15)' }}>
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#5D4AA8' }} />
              <p className="text-sm leading-relaxed" style={{ color: '#5D4AA8' }}>The team member must <strong>sign up first</strong> before you can create their profile here.</p>
            </div>
            <div className="flex gap-2">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="team.member@example.com" className="flex-1 rounded-xl border-2 border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              <button type="button" onClick={handleSearch} disabled={searching || !email.trim()} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)' }}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}Search
              </button>
            </div>
            {searchError && <p className="text-xs mt-2 text-red-600">{searchError}</p>}
            {foundUser && (
              <div className="flex items-center gap-3 mt-3 p-3 rounded-xl" style={{ background: '#F0FDF4', border: '1px solid rgba(22,163,74,0.2)' }}>
                <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-sm flex-shrink-0">{foundUser.firstName?.[0]}{foundUser.lastName?.[0]}</div>
                <div><p className="text-sm font-medium text-green-800">{foundUser.firstName} {foundUser.lastName}</p><p className="text-xs text-green-600">{foundUser.email}</p></div>
                <UserCheck className="h-4 w-4 text-green-600 ml-auto" />
              </div>
            )}
          </div>

          {foundUser && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm font-semibold" style={{ color: '#3D3450' }}>Step 2 — Profile details</p>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#3D3450' }}>Specializations <span className="ml-1 text-xs font-normal" style={{ color: '#9E96B0' }}>— press Enter to add</span></label>
                <TagInput tags={specializations} onChange={setSpecializations} placeholder="e.g. Deep Tissue, Sports…" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#3D3450' }}>Bio</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} placeholder="Short background…" className="w-full rounded-xl border-2 border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="rounded-xl p-4 space-y-3" style={{ background: '#FAFAFA', border: '1px solid #EFE9F2' }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#5D4AA8' }}>Credentials & Rate</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#3D3450' }}>License Number</label>
                    <input type="text" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="e.g. RMT-12345" className="w-full rounded-xl border-2 border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#3D3450' }}>License Expiry</label>
                    <input type="date" value={licenseExpiry} onChange={(e) => setLicenseExpiry(e.target.value)} className="w-full rounded-xl border-2 border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#3D3450' }}>Hourly Rate</label>
                    <input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} min="0" step="0.01" placeholder="0.00" className="w-full rounded-xl border-2 border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  {locations.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: '#3D3450' }}>Location</label>
                      <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className="w-full rounded-xl border-2 border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="">Any location</option>
                        {(locations as any[]).map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={createTherapist.isPending}>
                  {createTherapist.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Adding…</> : 'Add Team Member'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function EditTeamMemberModal({ businessId, therapist, onClose, onSaved }: { businessId: string; therapist: any; onClose: () => void; onSaved: () => void }) {
  const u = therapist.user;
  const [form, setForm] = React.useState({
    firstName: u?.firstName || '',
    lastName: u?.lastName || '',
    email: u?.email || '',
    phoneNumber: u?.phoneNumber || '',
    role: u?.role || 'THERAPIST',
  });
  const [specializations, setSpecializations] = React.useState<string[]>(therapist.specializations || []);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const { data: business } = useBusiness(businessId);
  const countryCode = business?.country || 'AU';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Please enter a valid email address');
      return;
    }
    setSaving(true); setError('');
    try {
      await Promise.all([
        apiClient.patch(`/users/${u.id}`, { businessId, ...form }),
        apiClient.patch(`/therapists/${therapist.id}`, { businessId, specializations }),
      ]);
      onSaved(); onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900 rounded-t-2xl" style={{ borderColor: '#EFE9F2' }}>
          <h2 className="text-lg font-semibold" style={{ color: '#1E1830' }}>Edit Team Member</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-lg p-1"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="rounded-xl p-3 text-sm" style={{ background: '#F5E5E5', color: '#922020', border: '1px solid #F5CECE' }}>{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#3D3450' }}>First Name</label>
              <Input value={form.firstName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, firstName: e.target.value }))} placeholder="First" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#3D3450' }}>Last Name</label>
              <Input value={form.lastName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, lastName: e.target.value }))} placeholder="Last" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#3D3450' }}>Email Address</label>
            <Input
              type="email"
              value={form.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="team.member@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#3D3450' }}>Mobile Number</label>
            <PhoneInput
              value={form.phoneNumber}
              onChange={(v) => setForm((f) => ({ ...f, phoneNumber: v }))}
              countryCode={countryCode}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#3D3450' }}>Role</label>
            <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className="w-full rounded-xl border-2 border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="THERAPIST">Therapist</option>
              <option value="RECEPTIONIST">Receptionist</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#3D3450' }}>
              Services / Massage Types
              <span className="ml-1 text-xs font-normal" style={{ color: '#9E96B0' }}>— press Enter to add</span>
            </label>
            <TagInput
              tags={specializations}
              onChange={setSpecializations}
              placeholder="e.g. Deep Tissue, Hot Stone, Remedial…"
            />
            <p className="text-xs mt-1" style={{ color: '#9E96B0' }}>
              Shown on the therapist's card and used for filtering during booking.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : <><Check className="h-4 w-4 mr-2" />Save Changes</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
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
  const { data: therapists, isLoading, refetch } = useTherapists(businessId);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTherapist, setEditingTherapist] = useState<any | null>(null);

  const handleToggleActive = async (therapistId: string, current: boolean) => {
    setUpdatingId(therapistId);
    try {
      await apiClient.patch(`/therapists/${therapistId}`, { businessId, isActive: !current });
      await refetch();
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading team…</div>;

  return (
    <div className="space-y-5">
      {showAddModal && (
        <AddTeamMemberModal
          businessId={businessId}
          onClose={() => setShowAddModal(false)}
          onCreated={() => { refetch(); }}
        />
      )}
      {editingTherapist && (
        <EditTeamMemberModal
          businessId={businessId}
          therapist={editingTherapist}
          onClose={() => setEditingTherapist(null)}
          onSaved={() => { refetch(); }}
        />
      )}

      <div className="flex items-start justify-between">
        <SectionHeader
          title="Team & Permissions"
          description="Manage your staff members and their access roles."
        />
        <Button variant="primary" onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />Add Team Member
        </Button>
      </div>

      {/* Role explanation callout */}
      <div
        className="rounded-xl p-4 space-y-3"
        style={{ background: '#F3EFFD', border: '1px solid rgba(93,74,168,0.15)' }}
      >
        <p className="text-sm font-semibold" style={{ color: '#3D3450' }}>Understanding roles</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {['THERAPIST', 'RECEPTIONIST'].map((role) => (
            <div key={role} className="rounded-lg p-3" style={{ background: '#fff', border: '1px solid rgba(93,74,168,0.1)' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: '#5D4AA8' }}>{ROLE_INFO[role].label}</p>
              <p className="text-xs leading-relaxed" style={{ color: '#7A7090' }}>{ROLE_INFO[role].description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {!therapists?.length && (
          <div className="text-center py-8 rounded-xl border-2 border-dashed border-gray-200">
            <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No team members yet.</p>
            <button onClick={() => setShowAddModal(true)} className="mt-2 text-sm font-medium" style={{ color: '#5D4AA8' }}>Add your first team member</button>
          </div>
        )}
        {(therapists || []).map((t: any) => {
          const u = t.user;
          return (
            <Card key={t.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#EDE5F4] flex items-center justify-center text-[#5D4AA8] font-semibold text-sm flex-shrink-0">
                      {u?.firstName?.[0]}{u?.lastName?.[0]}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{u?.firstName} {u?.lastName}</p>
                      <p className="text-xs text-muted-foreground">{u?.email}</p>
                      {u?.phoneNumber && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3" />{formatPhoneDisplay(u.phoneNumber)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={t.isActive ? 'success' : 'default'}>
                      {t.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <button
                      onClick={() => setEditingTherapist(t)}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                      style={{ borderColor: '#D1D5DB', color: '#374151' }}
                      title="Edit team member"
                    >
                      <Pencil className="h-3.5 w-3.5" />Edit
                    </button>
                    <Button
                      variant={t.isActive ? 'outline' : 'primary'}
                      onClick={() => handleToggleActive(t.id, t.isActive)}
                      disabled={updatingId === t.id}
                      title={t.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {updatingId === t.id ? <Loader2 className="h-3 w-3 animate-spin" /> : t.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>
                {t.specializations?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {t.specializations.map((s: string) => (
                      <span key={s} className="text-xs bg-gray-100 dark:bg-gray-800 rounded px-2 py-0.5">{s}</span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
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
        <div className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-[#5D4AA8]' : 'bg-[#D1D5DB]'}`}>
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

      <div
        className="flex items-start gap-2.5 rounded-xl p-3.5"
        style={{ background: '#F3EFFD', border: '1px solid rgba(93,74,168,0.15)' }}
      >
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#5D4AA8' }} />
        <p className="text-xs" style={{ color: '#5D4AA8' }}>
          To configure Twilio, SendGrid, or WhatsApp API keys, visit{' '}
          <Link href="/settings/communications" className="underline font-medium">
            Communications Settings
          </Link>.
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
    <div className="mt-6 rounded-xl p-5 space-y-3" style={{ border: '1px solid #EFE9F2' }}>
      <div className="flex items-center gap-2">
        <BellRing className="h-5 w-5" style={{ color: '#5D4AA8' }} />
        <h3 className="text-sm font-semibold" style={{ color: '#1E1830' }}>Browser Push Notifications</h3>
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
        <Button
          type="button"
          variant={isSubscribed ? 'outline' : 'outline'}
          size="sm"
          disabled={isLoading}
          onClick={isSubscribed ? unsubscribe : subscribe}
          className={isSubscribed ? 'border-red-300 text-red-700 hover:bg-red-50' : ''}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isSubscribed ? (
            <>
              <Bell className="h-4 w-4 mr-2" />
              Disable push notifications
            </>
          ) : (
            <>
              <BellRing className="h-4 w-4 mr-2" />
              Enable push notifications
            </>
          )}
        </Button>
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
          placeholder={`Best regards,\nYour Wellness Team\n\nPhone: …`}
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
                <p className="text-xs mt-0.5" style={{ color: '#7A7090' }}>{opt.description}</p>
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
                <p className="text-xs mt-0.5" style={{ color: '#7A7090' }}>{opt.description}</p>
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
  const [portalOrigin, setPortalOrigin] = React.useState('');
  const { data: business, isLoading } = useBusiness(businessId);
  const updateBusiness = useUpdateBusiness(businessId);
  const [saved, setSaved] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [settings, setSettings] = useState({ showNotes: false, showInvoices: true, showIntakeForms: true });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPortalOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (business) {
      setEnabled((business as any).clientPortalEnabled ?? false);
      const s = (business as any).clientPortalSettings;
      if (s) setSettings({ showNotes: s.showNotes ?? false, showInvoices: s.showInvoices ?? true, showIntakeForms: s.showIntakeForms ?? true });
    }
  }, [business]);

  const portalUrl = `${portalOrigin}/client-portal/sign-in`;

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

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#5D4AA8', letterSpacing: '1.4px' }}>More Settings</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/settings/reminders"
            className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:bg-muted transition-colors"
          >
            <div className="h-10 w-10 bg-[#EDE5F4] rounded-lg flex items-center justify-center flex-shrink-0">
              <BellRing className="h-5 w-5 text-[#5D4AA8]" />
            </div>
            <div>
              <p className="font-medium text-foreground">Reminders &amp; Notifications</p>
              <p className="text-sm text-muted-foreground">Toggle and customise automated messages</p>
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
              <p className="font-medium text-foreground">Locations &amp; Rooms</p>
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
              <p className="text-sm text-muted-foreground">Restrict booking windows for therapists, rooms, or services</p>
            </div>
          </Link>

          <Link
            href="/settings/communications"
            className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:bg-muted transition-colors"
          >
            <div className="h-10 w-10 bg-[#EDE5F4] rounded-lg flex items-center justify-center flex-shrink-0">
              <MessageSquare className="h-5 w-5 text-[#5D4AA8]" />
            </div>
            <div>
              <p className="font-medium text-foreground">Communications</p>
              <p className="text-sm text-muted-foreground">Configure Twilio, SendGrid, and WhatsApp credentials</p>
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
              <p className="text-sm text-muted-foreground">Connect Xero or QuickBooks for invoice and payment sync</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
