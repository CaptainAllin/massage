'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, Button, Input, Badge } from '@massage/ui';
import { Users, Bell, Save, Upload, Loader2, Check, BellRing, MapPin, Globe, Lock, UserCheck, ShieldCheck, KeyRound, Trash2, Plus, LayoutDashboard, ExternalLink, Copy, CheckCheck, Phone, X, Info, ChevronRight, Code2, Mail, Send, UserMinus, RefreshCw, Sliders, RotateCcw, UserCircle, Camera, Download, Smartphone, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useBusiness, useUpdateBusiness } from '@/lib/hooks/use-business';
import { useTherapists } from '@/lib/hooks/use-therapists';
import { useStaffInvites, useSendStaffInvite, useCancelStaffInvite, useResendStaffInvite, useBusinessMembers, useRemoveBusinessMember, useRolePermissions, useUpdateRolePermissions, useUpdateMemberPermissions } from '@/lib/hooks/use-staff-invites';
import { ROLE_PERMISSIONS, PERMISSION_GROUPS, PERMISSION_LABELS, resolvePermissions, type Permission, type PermissionOverrides } from '@/lib/permissions';
import { useLocations } from '@/lib/hooks/use-locations';
import { useCommunicationSettings, useUpdateCommunicationSettings } from '@/lib/hooks/use-messages';
import { uploadFile, getPublicUrl, brandingPath, uniqueFileName, BUCKETS } from '@/lib/storage';
import { COUNTRIES, CURRENCIES, getCountryByCode } from '@/lib/format';
import { getCountryFormat, formatPhoneDisplay } from '@/lib/countryFormats';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { PostcodeInput } from '@/components/ui/PostcodeInput';
import { apiClient } from '@/lib/api-client';
import { usePushNotifications } from '@/lib/hooks/use-push-notifications';
import { usePWAInstall } from '@/lib/hooks/use-pwa-install';
import { listPasskeys, enrollPasskey, revokePasskey, type PasskeyFactor } from '@/lib/supabase/passkeys';
import { createClient } from '@/lib/supabase/client';
import { useIntakeFormTemplates } from '@/lib/hooks/use-intake-forms';

type Panel = 'overview' | 'account' | 'business' | 'team' | 'notifications' | 'branding' | 'booking' | 'clinical' | 'security' | 'portal' | 'api';


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




// ─── Team Tab ─────────────────────────────────────────────────────────────────

const ROLE_INFO: Record<string, { label: string; description: string; color: string }> = {
  OWNER: {
    label: 'Owner',
    description: 'Full access to all features including settings, payroll, and team management.',
    color: '#5D4AA8',
  },
  SENIOR_THERAPIST: {
    label: 'Senior Therapist',
    description: 'Can manage all bookings, client records, and view performance reports. Cannot access payroll, financials, or business settings.',
    color: '#0284C7',
  },
  THERAPIST: {
    label: 'Therapist',
    description: 'Can view their own schedule, write treatment notes, and manage their availability. Cannot access billing, payroll, or other therapists\' records.',
    color: '#059669',
  },
  RECEPTIONIST: {
    label: 'Receptionist',
    description: 'Can manage all appointments, clients, and invoices across the practice. Cannot access payroll or admin settings.',
    color: '#D97706',
  },
};

// ─── Permission toggle used in both role and member modals ────────────────────

function PermissionToggle({
  permission,
  checked,
  isDefault,
  onChange,
}: {
  permission: string;
  checked: boolean;
  isDefault: boolean;
  onChange: (p: string, val: boolean) => void;
}) {
  const label = PERMISSION_LABELS[permission] ?? permission;
  const isModified = checked !== isDefault;
  return (
    <label className="flex items-center justify-between gap-3 py-1.5 cursor-pointer group">
      <span className="text-xs" style={{ color: '#3D3450' }}>
        {label}
        {isModified && (
          <span
            className="ml-1.5 text-[10px] font-semibold px-1 rounded"
            style={{ background: checked ? '#D1FAE5' : '#FEE2E2', color: checked ? '#065F46' : '#991B1B' }}
          >
            {checked ? '+added' : '−removed'}
          </span>
        )}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(permission, !checked)}
        className="relative flex-shrink-0 h-5 w-9 rounded-full transition-colors focus:outline-none"
        style={{ background: checked ? '#5D4AA8' : '#D1D5DB' }}
      >
        <span
          className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
          style={{ left: checked ? '17px' : '2px' }}
        />
      </button>
    </label>
  );
}

// ─── Role Permissions Modal (6.2.1 + 6.2.2) ──────────────────────────────────

function RolePermissionsModal({
  businessId,
  role,
  roleOverrides,
  onClose,
}: {
  businessId: string;
  role: string;
  roleOverrides: { grant: string[]; revoke: string[] };
  onClose: () => void;
}) {
  const roleInfo = ROLE_INFO[role];
  const defaults = new Set<string>(ROLE_PERMISSIONS[role] ?? []);
  const updateRolePermissions = useUpdateRolePermissions(businessId);

  // Initialise from defaults + stored overrides
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const group of PERMISSION_GROUPS) {
      for (const p of group.permissions) {
        let on = defaults.has(p);
        if (roleOverrides.grant.includes(p)) on = true;
        if (roleOverrides.revoke.includes(p)) on = false;
        initial[p] = on;
      }
    }
    return initial;
  });

  const handleToggle = (p: string, val: boolean) => setChecked((prev) => ({ ...prev, [p]: val }));

  const handleReset = () => {
    const reset: Record<string, boolean> = {};
    for (const group of PERMISSION_GROUPS) {
      for (const p of group.permissions) reset[p] = defaults.has(p);
    }
    setChecked(reset);
  };

  const handleSave = async () => {
    const grant: string[] = [];
    const revoke: string[] = [];
    for (const [p, on] of Object.entries(checked)) {
      const inDefault = defaults.has(p as Permission);
      if (on && !inDefault) grant.push(p);
      if (!on && inDefault) revoke.push(p);
    }
    await updateRolePermissions.mutateAsync({ role, grant, revoke });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: 'rgba(30,24,48,0.5)' }}>
      <div className="w-full max-w-lg rounded-2xl" style={{ background: '#fff', boxShadow: '0 8px 32px rgba(93,74,168,0.18)' }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: '#F0EBF8' }}>
          <div>
            <h3 className="font-semibold text-base" style={{ color: '#1E1830' }}>
              <span className="mr-2" style={{ color: roleInfo?.color }}>{roleInfo?.label}</span>Permissions
            </h3>
            <p className="text-xs mt-0.5" style={{ color: '#9B91B0' }}>Changes apply to all {roleInfo?.label}s in your business.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors hover:bg-gray-50"
              style={{ borderColor: '#D1D5DB', color: '#6B7280' }}
            >
              <RotateCcw className="h-3 w-3" />Reset
            </button>
            <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-4">
          {PERMISSION_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#9B91B0' }}>{group.label}</p>
              <div className="rounded-xl px-3 py-1 divide-y divide-purple-100" style={{ background: '#F9F7FE' }}>
                {group.permissions.map((p) => (
                  <PermissionToggle
                    key={p}
                    permission={p}
                    checked={checked[p] ?? false}
                    isDefault={defaults.has(p)}
                    onChange={handleToggle}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t" style={{ borderColor: '#F0EBF8' }}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-xl border"
            style={{ borderColor: '#E5DEEC', color: '#7A7090' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateRolePermissions.isPending}
            className="px-4 py-2 text-sm font-semibold text-white rounded-xl flex items-center gap-2 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)' }}
          >
            {updateRolePermissions.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Member Permissions Modal (6.2.3) ─────────────────────────────────────────

function MemberPermissionsModal({
  businessId,
  member,
  roleOverrides,
  onClose,
}: {
  businessId: string;
  member: { id: string; role: string; permissions?: PermissionOverrides | null; user: { firstName: string; lastName: string } };
  roleOverrides: { grant: string[]; revoke: string[] };
  onClose: () => void;
}) {
  const roleInfo = ROLE_INFO[member.role];
  const updateMemberPermissions = useUpdateMemberPermissions(businessId);

  // Effective permissions after role defaults + role overrides (before member overrides)
  const effectiveRoleSet = resolvePermissions(member.role, undefined, roleOverrides);

  // Build initial state from effectiveRoleSet + any existing member overrides
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const group of PERMISSION_GROUPS) {
      for (const p of group.permissions) {
        let on = effectiveRoleSet.has(p as Permission);
        const mo = member.permissions;
        if (mo?.grant?.includes(p)) on = true;
        if (mo?.revoke?.includes(p)) on = false;
        initial[p] = on;
      }
    }
    return initial;
  });

  const handleToggle = (p: string, val: boolean) => setChecked((prev) => ({ ...prev, [p]: val }));

  const handleReset = () => {
    const reset: Record<string, boolean> = {};
    for (const group of PERMISSION_GROUPS) {
      for (const p of group.permissions) reset[p] = effectiveRoleSet.has(p as Permission);
    }
    setChecked(reset);
  };

  const handleSave = async () => {
    const grant: string[] = [];
    const revoke: string[] = [];
    for (const [p, on] of Object.entries(checked)) {
      const inEffective = effectiveRoleSet.has(p as Permission);
      if (on && !inEffective) grant.push(p);
      if (!on && inEffective) revoke.push(p);
    }
    const permissions = grant.length === 0 && revoke.length === 0 ? null : { grant, revoke };
    await updateMemberPermissions.mutateAsync({ id: member.id, permissions });
    onClose();
  };

  const name = `${member.user.firstName} ${member.user.lastName}`.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: 'rgba(30,24,48,0.5)' }}>
      <div className="w-full max-w-lg rounded-2xl" style={{ background: '#fff', boxShadow: '0 8px 32px rgba(93,74,168,0.18)' }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: '#F0EBF8' }}>
          <div>
            <h3 className="font-semibold text-base" style={{ color: '#1E1830' }}>{name}&apos;s Permissions</h3>
            <p className="text-xs mt-0.5" style={{ color: '#9B91B0' }}>
              Overrides <span style={{ color: roleInfo?.color }}>{roleInfo?.label}</span> defaults for this person only.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors hover:bg-gray-50"
              style={{ borderColor: '#D1D5DB', color: '#6B7280' }}
            >
              <RotateCcw className="h-3 w-3" />Reset
            </button>
            <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-4">
          {PERMISSION_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#9B91B0' }}>{group.label}</p>
              <div className="rounded-xl px-3 py-1 divide-y" style={{ background: '#F9F7FE' }}>
                {group.permissions.map((p) => (
                  <PermissionToggle
                    key={p}
                    permission={p}
                    checked={checked[p] ?? false}
                    isDefault={effectiveRoleSet.has(p as Permission)}
                    onChange={handleToggle}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t" style={{ borderColor: '#F0EBF8' }}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-xl border"
            style={{ borderColor: '#E5DEEC', color: '#7A7090' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateMemberPermissions.isPending}
            className="px-4 py-2 text-sm font-semibold text-white rounded-xl flex items-center gap-2 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)' }}
          >
            {updateMemberPermissions.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function InviteStaffModal({ businessId, onClose, onSent }: { businessId: string; onClose: () => void; onSent: () => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('THERAPIST');
  const [error, setError] = useState('');
  const sendInvite = useSendStaffInvite(businessId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await sendInvite.mutateAsync({ email, role });
      onSent();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to send invite');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(30,24,48,0.5)' }}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#fff', boxShadow: '0 8px 32px rgba(93,74,168,0.18)' }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-base" style={{ color: '#1E1830' }}>Invite Staff Member</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {error && (
          <div className="rounded-xl p-3 mb-4 text-sm" style={{ background: '#F5E5E5', color: '#922020', border: '1px solid #F5CECE' }}>{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#3D3450' }}>Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl outline-none transition-all"
              style={{ border: '1px solid #E5DEEC', color: '#1E1830' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#5D4AA8')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#E5DEEC')}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#3D3450' }}>Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl outline-none transition-all"
              style={{ border: '1px solid #E5DEEC', color: '#1E1830', background: '#fff' }}
            >
              <option value="THERAPIST">Therapist</option>
              <option value="SENIOR_THERAPIST">Senior Therapist</option>
              <option value="RECEPTIONIST">Receptionist</option>
            </select>
            <p className="text-xs mt-1.5" style={{ color: '#9B91B0' }}>{ROLE_INFO[role]?.description}</p>
          </div>
          <button
            type="submit"
            disabled={sendInvite.isPending}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 1px 2px rgba(28,20,54,0.12), 0 1px 1px rgba(28,20,54,0.06)' }}
          >
            {sendInvite.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sendInvite.isPending ? 'Sending…' : 'Send Invite'}
          </button>
        </form>
      </div>
    </div>
  );
}

function OwnerTherapistToggle({ businessId }: { businessId: string }) {
  const [isTherapist, setIsTherapist] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiClient.get(`/businesses/${businessId}/owner-therapist`)
      .then((d: any) => setIsTherapist(d?.isTherapist ?? false))
      .catch(() => setIsTherapist(false));
  }, [businessId]);

  const handleToggle = async () => {
    if (isTherapist === null) return;
    setSaving(true);
    try {
      const result: any = await apiClient.patch(`/businesses/${businessId}/owner-therapist`, { enabled: !isTherapist });
      setIsTherapist(result?.isTherapist ?? !isTherapist);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="rounded-xl p-4 flex items-center justify-between gap-4"
      style={{ background: '#F3EFFD', border: '1px solid rgba(93,74,168,0.2)' }}
    >
      <div className="flex items-center gap-3">
        <UserCheck className="h-5 w-5 flex-shrink-0" style={{ color: '#5D4AA8' }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: '#3D3450' }}>I also work as a therapist</p>
          <p className="text-xs mt-0.5" style={{ color: '#7A7090' }}>
            Enable this to appear on the booking schedule and take appointments. Clients only see your name, not your owner role.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleToggle}
        disabled={saving || isTherapist === null}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${isTherapist ? 'bg-[#5D4AA8]' : 'bg-gray-200'}`}
        aria-checked={isTherapist ?? false}
        role="switch"
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out ${isTherapist ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  );
}

function StaffProfileModal({ businessId, member, onClose }: { businessId: string; member: any; onClose: () => void }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [therapistId, setTherapistId] = useState<string | null>(null);
  const [form, setForm] = useState({ bio: '', specializations: [] as string[] });
  const [specInput, setSpecInput] = useState('');
  const [userForm, setUserForm] = useState({ firstName: '', lastName: '' });

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      // Pre-fill from member.user
      if (member.user) {
        setUserForm({ firstName: member.user.firstName ?? '', lastName: member.user.lastName ?? '' });
      }
      // Load therapist profile for this member
      const r = await fetch(`/api/therapists?businessId=${businessId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const { data } = await r.json();
      const t = (data ?? []).find((th: any) => th.userId === member.userId || th.user?.id === member.userId);
      if (t) {
        setTherapistId(t.id);
        setForm({ bio: t.bio ?? '', specializations: t.specializations ?? [] });
      }
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, member.userId]);

  const handleSave = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    if (therapistId) {
      await fetch(`/api/therapists/${therapistId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, bio: form.bio, specializations: form.specializations }),
      });
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1200);
  };

  const addSpec = () => {
    const tag = specInput.trim();
    if (tag && !form.specializations.includes(tag)) setForm((f) => ({ ...f, specializations: [...f.specializations, tag] }));
    setSpecInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(30,24,48,0.5)' }}>
      <div className="w-full max-w-md rounded-2xl p-6 space-y-5" style={{ background: '#fff', boxShadow: '0 8px 32px rgba(93,74,168,0.18)' }}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-base" style={{ color: '#1E1830' }}>Edit Staff Profile</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100"><X className="h-4 w-4 text-gray-400" /></button>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#F9F7FE' }}>
          <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: '#EDE5F4', color: '#5D4AA8' }}>
            {userForm.firstName?.[0]}{userForm.lastName?.[0]}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#1E1830' }}>{userForm.firstName} {userForm.lastName}</p>
            <p className="text-xs" style={{ color: '#7A7090' }}>{member.user?.email}</p>
          </div>
        </div>
        {loading ? (
          <div className="text-sm text-muted-foreground py-4 text-center">Loading…</div>
        ) : (
          <>
            {!therapistId && (
              <p className="text-xs rounded-xl p-3" style={{ background: '#FFF8E1', color: '#A16207', border: '1px solid #FEF08A' }}>
                This member does not have a therapist profile. Only therapist and senior therapist roles have booking profiles.
              </p>
            )}
            {therapistId && (
              <>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#3D3450' }}>Bio</label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                    rows={3}
                    placeholder="Bio visible to clients on booking page…"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl outline-none resize-none"
                    style={{ border: '1px solid #E5DEEC', fontFamily: 'inherit' }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#5D4AA8')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#E5DEEC')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#3D3450' }}>Specializations</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      value={specInput}
                      onChange={(e) => setSpecInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSpec(); } }}
                      placeholder="Add specialization…"
                      className="flex-1 px-3.5 py-2 text-sm rounded-xl outline-none"
                      style={{ border: '1px solid #E5DEEC' }}
                    />
                    <button type="button" onClick={addSpec} className="px-3 py-2 text-sm rounded-xl font-medium" style={{ background: '#EDE5F4', color: '#5D4AA8' }}>Add</button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {form.specializations.map((s) => (
                      <span key={s} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full" style={{ background: '#F3EFFD', color: '#5D4AA8' }}>
                        {s}
                        <button type="button" onClick={() => setForm((f) => ({ ...f, specializations: f.specializations.filter((x) => x !== s) }))} className="ml-0.5 hover:text-red-500"><X className="h-3 w-3" /></button>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-1">
                  <button onClick={onClose} className="px-4 py-2 text-sm rounded-xl border" style={{ borderColor: '#E5DEEC', color: '#7A7090' }}>Cancel</button>
                  <button
                    onClick={handleSave}
                    disabled={saving || saved}
                    className="px-4 py-2 text-sm font-semibold text-white rounded-xl flex items-center gap-2 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)' }}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                    {saved ? 'Saved!' : 'Save Profile'}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TeamTab({ businessId }: { businessId: string }) {
  const { data: members, isLoading: membersLoading, refetch: refetchMembers } = useBusinessMembers(businessId);
  const { data: invites, isLoading: invitesLoading } = useStaffInvites(businessId);
  const { data: rolePermData } = useRolePermissions(businessId);
  const removeMembers = useRemoveBusinessMember(businessId);
  const cancelInvite = useCancelStaffInvite(businessId);
  const resendInvite = useResendStaffInvite(businessId);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [editingProfileMember, setEditingProfileMember] = useState<any | null>(null);
  const didMigrate = useRef(false);

  // One-time backfill: if only 0–1 members found after load, therapists may be missing
  // BusinessMember records (seed gap). Silently run migration scoped to this business.
  useEffect(() => {
    if (membersLoading || didMigrate.current) return;
    const nonOwnerCount = (members || []).filter((m: any) => m.role !== 'OWNER').length;
    if (nonOwnerCount === 0) {
      didMigrate.current = true;
      apiClient.post(`/admin/migrate-business-members?businessId=${businessId}`, {})
        .then(() => refetchMembers())
        .catch(() => {});
    }
  }, [membersLoading, members, businessId, refetchMembers]);

  const isLoading = membersLoading || invitesLoading;

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Remove this team member? Their historical records will remain.')) return;
    setActionId(memberId);
    try {
      await removeMembers.mutateAsync(memberId);
    } finally {
      setActionId(null);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    setActionId(inviteId);
    try {
      await cancelInvite.mutateAsync(inviteId);
    } finally {
      setActionId(null);
    }
  };

  const handleResendInvite = async (inviteId: string) => {
    setActionId(inviteId);
    try {
      await resendInvite.mutateAsync(inviteId);
    } finally {
      setActionId(null);
    }
  };

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading team…</div>;

  const pendingInvites = (invites || []).filter((inv: any) => !inv.acceptedAt && new Date(inv.expiresAt) > new Date());
  const ownerMembers = (members || []).filter((m: any) => m.role === 'OWNER');
  const activeMembers = (members || []).filter((m: any) => m.role !== 'OWNER');
  const totalMembers = (members || []).length;

  const emptyRoleOverride = { grant: [] as string[], revoke: [] as string[] };

  const MemberCard = ({ m, isOwner = false }: { m: any; isOwner?: boolean }) => {
    const u = m.user;
    const roleInfo = ROLE_INFO[m.role];
    const memberOverrides = m.permissions as PermissionOverrides | null;
    const hasMemberCustom = (memberOverrides?.grant?.length ?? 0) > 0 || (memberOverrides?.revoke?.length ?? 0) > 0;
    return (
      <Card key={m.id}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0"
                style={{ background: isOwner ? 'linear-gradient(135deg, #5D4AA8, #7665C2)' : '#EDE5F4', color: '#fff' }}
              >
                {u?.firstName?.[0]}{u?.lastName?.[0]}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="font-medium text-sm">{u?.firstName} {u?.lastName}</p>
                  {isOwner && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: '#EDE5F4', color: '#5D4AA8' }}>
                      You
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{u?.email}</p>
                {u?.phoneNumber && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Phone className="h-3 w-3" />{formatPhoneDisplay(u.phoneNumber)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: isOwner ? '#EDE5F4' : '#F3EFFD',
                  color: roleInfo?.color ?? '#5D4AA8',
                }}
              >
                {roleInfo?.label ?? m.role}
              </span>
              {!isOwner && hasMemberCustom && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: '#EDE5F4', color: '#5D4AA8' }}>
                  Custom
                </span>
              )}
              <Badge variant="success">Active</Badge>
              {!isOwner && (m.role === 'THERAPIST' || m.role === 'SENIOR_THERAPIST') && (
                <button
                  onClick={() => setEditingProfileMember(m)}
                  className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors hover:bg-purple-50"
                  style={{ borderColor: '#E5DEEC', color: '#5D4AA8' }}
                  title="Edit therapist profile (bio, specializations)"
                >
                  <UserCircle className="h-3 w-3" />Profile
                </button>
              )}
              {!isOwner && (
                <>
                  <button
                    onClick={() => setEditingMember(m)}
                    className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors hover:bg-purple-50"
                    style={{ borderColor: '#E5DEEC', color: '#5D4AA8' }}
                    title="Customise permissions for this person"
                  >
                    <Sliders className="h-3 w-3" />Permissions
                  </button>
                  <button
                    onClick={() => handleRemoveMember(m.id)}
                    disabled={actionId === m.id}
                    className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors hover:bg-red-50"
                    style={{ borderColor: '#FCA5A5', color: '#DC2626' }}
                    title="Remove from business"
                  >
                    {actionId === m.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserMinus className="h-3 w-3" />}
                    Remove
                  </button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {showInviteModal && (
        <InviteStaffModal
          businessId={businessId}
          onClose={() => setShowInviteModal(false)}
          onSent={() => {}}
        />
      )}
      {editingRole && rolePermData && (
        <RolePermissionsModal
          businessId={businessId}
          role={editingRole}
          roleOverrides={rolePermData[editingRole] ?? emptyRoleOverride}
          onClose={() => setEditingRole(null)}
        />
      )}
      {editingMember && rolePermData && (
        <MemberPermissionsModal
          businessId={businessId}
          member={editingMember}
          roleOverrides={rolePermData[editingMember.role] ?? emptyRoleOverride}
          onClose={() => setEditingMember(null)}
        />
      )}

      <div className="flex items-start justify-between">
        <SectionHeader
          title="Team & Permissions"
          description="Invite staff, manage their roles, and customise what each person can access."
        />
        <Button variant="primary" onClick={() => setShowInviteModal(true)}>
          <Mail className="h-4 w-4 mr-2" />Invite Staff
        </Button>
      </div>

      <OwnerTherapistToggle businessId={businessId} />

      {/* Role permissions — 6.2.1 view + 6.2.2 edit */}
      <div className="rounded-xl p-4 space-y-3" style={{ background: '#F3EFFD', border: '1px solid rgba(93,74,168,0.15)' }}>
        <p className="text-sm font-semibold" style={{ color: '#3D3450' }}>Role permissions</p>
        <p className="text-xs" style={{ color: '#9B91B0' }}>
          Customise what each role can access across your business. Changes apply to all members with that role.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(['SENIOR_THERAPIST', 'THERAPIST', 'RECEPTIONIST'] as const).map((role) => {
            const overrides = rolePermData?.[role] ?? emptyRoleOverride;
            const grantCount = overrides.grant.length;
            const revokeCount = overrides.revoke.length;
            const hasCustom = grantCount > 0 || revokeCount > 0;
            const effective = resolvePermissions(role, undefined, overrides);
            return (
              <div key={role} className="rounded-lg p-3 flex flex-col gap-2" style={{ background: '#fff', border: '1px solid rgba(93,74,168,0.1)' }}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold" style={{ color: ROLE_INFO[role].color }}>{ROLE_INFO[role].label}</p>
                  {hasCustom && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: '#EDE5F4', color: '#5D4AA8' }}>
                      Custom
                    </span>
                  )}
                </div>
                <p className="text-xs leading-relaxed" style={{ color: '#7A7090' }}>{ROLE_INFO[role].description}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[11px]" style={{ color: '#9B91B0' }}>
                    {effective.size} permission{effective.size !== 1 ? 's' : ''}
                    {hasCustom && (
                      <span className="ml-1">
                        {grantCount > 0 && <span style={{ color: '#059669' }}>+{grantCount}</span>}
                        {grantCount > 0 && revokeCount > 0 && ' '}
                        {revokeCount > 0 && <span style={{ color: '#DC2626' }}>−{revokeCount}</span>}
                      </span>
                    )}
                  </span>
                  <button
                    onClick={() => setEditingRole(role)}
                    className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg transition-colors hover:bg-purple-50"
                    style={{ color: '#5D4AA8' }}
                  >
                    <Sliders className="h-3 w-3" />Customise
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#9B91B0' }}>Pending Invites ({pendingInvites.length})</p>
          {pendingInvites.map((inv: any) => (
            <Card key={inv.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#FEF9C3' }}>
                      <Mail className="h-4 w-4" style={{ color: '#A16207' }} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{inv.email}</p>
                      <p className="text-xs" style={{ color: '#7A7090' }}>
                        Expires {new Date(inv.expiresAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#FEF9C3', color: '#A16207' }}>
                      Pending
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: '#F3EFFD', color: ROLE_INFO[inv.role]?.color ?? '#5D4AA8' }}>
                      {ROLE_INFO[inv.role]?.label ?? inv.role}
                    </span>
                    <button
                      onClick={() => handleResendInvite(inv.id)}
                      disabled={actionId === inv.id}
                      className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors hover:bg-gray-50"
                      style={{ borderColor: '#D1D5DB', color: '#374151' }}
                      title="Resend invite"
                    >
                      {actionId === inv.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      Resend
                    </button>
                    <button
                      onClick={() => handleCancelInvite(inv.id)}
                      disabled={actionId === inv.id}
                      className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors hover:bg-red-50"
                      style={{ borderColor: '#FCA5A5', color: '#DC2626' }}
                      title="Cancel invite"
                    >
                      <X className="h-3 w-3" />Cancel
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* All team members — owner first, then staff */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#9B91B0' }}>
          Team Members {totalMembers > 0 ? `(${totalMembers})` : ''}
        </p>
        {totalMembers === 0 && pendingInvites.length === 0 && (
          <div className="text-center py-8 rounded-xl border-2 border-dashed border-gray-200">
            <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No team members yet.</p>
            <button onClick={() => setShowInviteModal(true)} className="mt-2 text-sm font-medium" style={{ color: '#5D4AA8' }}>
              Invite your first team member
            </button>
          </div>
        )}
        {ownerMembers.map((m: any) => <MemberCard key={m.id} m={m} isOwner />)}
        {activeMembers.map((m: any) => <MemberCard key={m.id} m={m} />)}
      </div>

      {editingProfileMember && (
        <StaffProfileModal
          businessId={businessId}
          member={editingProfileMember}
          onClose={() => setEditingProfileMember(null)}
        />
      )}
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

      <div
        className="flex items-center justify-between rounded-xl p-3.5"
        style={{ background: '#F3EFFD', border: '1px solid rgba(93,74,168,0.15)' }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: '#1E1830' }}>Reminder rules</p>
          <p className="text-xs" style={{ color: '#7A7090', marginTop: 2 }}>Configure per-trigger automation templates (10 triggers available).</p>
        </div>
        <Link
          href="/settings/reminders"
          className="text-xs font-medium underline"
          style={{ color: '#5D4AA8', whiteSpace: 'nowrap' }}
        >
          Configure reminder rules →
        </Link>
      </div>

      <BrowserPushSection />
      <StaffNotificationPrefs />
    </form>
  );
}

function StaffNotificationPrefs() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState({
    leaveDecision: true,
    teamJoined: true,
    newBooking: true,
  });

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const r = await fetch('/api/users/me/notification-prefs', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const { data } = await r.json();
      if (data) setPrefs(data);
      setLoading(false);
    })();
  }, []);

  const save = async (key: keyof typeof prefs, val: boolean) => {
    const next = { ...prefs, [key]: val };
    setPrefs(next);
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSaving(false); return; }
    await fetch('/api/users/me/notification-prefs', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: val }),
    });
    setSaving(false);
  };

  const Toggle = ({ id, label, description, checked, onChange }: {
    id: string; label: string; description: string; checked: boolean; onChange: (v: boolean) => void;
  }) => (
    <label htmlFor={id} className="flex items-start justify-between gap-4 p-4 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="relative mt-0.5 flex-shrink-0">
        <input id={id} type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-[#5D4AA8]' : 'bg-[#D1D5DB]'}`}>
          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </div>
      </div>
    </label>
  );

  if (loading) return null;

  return (
    <div className="mt-6 rounded-xl p-5 space-y-3" style={{ border: '1px solid #EFE9F2' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCircle className="h-5 w-5" style={{ color: '#5D4AA8' }} />
          <h3 className="text-sm font-semibold" style={{ color: '#1E1830' }}>My notification preferences</h3>
        </div>
        {saving && <Loader2 className="h-4 w-4 animate-spin" style={{ color: '#5D4AA8' }} />}
      </div>
      <p className="text-xs text-muted-foreground">
        Choose which email notifications you personally receive. These apply to your account only.
      </p>
      <div className="space-y-2 pt-1">
        <Toggle
          id="pref-leave"
          label="Leave request decisions"
          description="Receive an email when your leave request is approved or declined."
          checked={prefs.leaveDecision}
          onChange={(v) => save('leaveDecision', v)}
        />
        <Toggle
          id="pref-team"
          label="Business invites accepted"
          description="Receive a welcome email when you're successfully added to a business."
          checked={prefs.teamJoined}
          onChange={(v) => save('teamJoined', v)}
        />
        <Toggle
          id="pref-booking"
          label="New bookings assigned"
          description="Receive an email when a new appointment is assigned to you."
          checked={prefs.newBooking}
          onChange={(v) => save('newBooking', v)}
        />
      </div>
    </div>
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
  const [cancellationWindowHours, setCancellationWindowHours] = useState(24);
  const [minBookingNoticeHours, setMinBookingNoticeHours] = useState(1);
  const [maxBookingWindowDays, setMaxBookingWindowDays] = useState(60);
  const [appointmentBufferMinutes, setAppointmentBufferMinutes] = useState(0);
  const [depositRequired, setDepositRequired] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositType, setDepositType] = useState<'PERCENT' | 'FIXED'>('PERCENT');

  useEffect(() => {
    if (business) {
      const b = business as any;
      setMode(b.bookingMode || 'PUBLIC');
      setCancellationWindowHours(b.cancellationWindowHours ?? 24);
      setMinBookingNoticeHours(b.minBookingNoticeHours ?? 1);
      setMaxBookingWindowDays(b.maxBookingWindowDays ?? 60);
      setAppointmentBufferMinutes(b.appointmentBufferMinutes ?? 0);
      setDepositRequired(b.depositRequired ?? false);
      setDepositAmount(b.depositAmount != null ? String(b.depositAmount) : '');
      setDepositType(b.depositType || 'PERCENT');
    }
  }, [business]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateBusiness.mutateAsync({
      bookingMode: mode,
      cancellationWindowHours,
      minBookingNoticeHours,
      maxBookingWindowDays,
      appointmentBufferMinutes,
      depositRequired,
      depositAmount: depositAmount ? parseFloat(depositAmount) : null,
      depositType,
    } as any);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Booking Access */}
      <div className="space-y-4">
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
      </div>

      <hr className="border-border" />

      {/* Scheduling Rules */}
      <div className="space-y-4">
        <SectionHeader
          title="Scheduling Rules"
          description="Set limits on when clients can book, how far ahead, and gaps between appointments."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#3D3450' }}>
              Minimum advance notice
            </label>
            <select
              value={minBookingNoticeHours}
              onChange={(e) => setMinBookingNoticeHours(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {[0, 1, 2, 4, 12, 24, 48].map((h) => (
                <option key={h} value={h}>{h === 0 ? 'No minimum' : `${h} hour${h !== 1 ? 's' : ''}`}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">How far ahead clients must book</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#3D3450' }}>
              Maximum booking window
            </label>
            <select
              value={maxBookingWindowDays}
              onChange={(e) => setMaxBookingWindowDays(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {[7, 14, 30, 60, 90, 180].map((d) => (
                <option key={d} value={d}>{d} days</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">How far into the future clients can book</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#3D3450' }}>
              Appointment buffer
            </label>
            <select
              value={appointmentBufferMinutes}
              onChange={(e) => setAppointmentBufferMinutes(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {[0, 5, 10, 15, 30].map((m) => (
                <option key={m} value={m}>{m === 0 ? 'No buffer' : `${m} minutes`}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">Gap to leave between appointments</p>
          </div>
        </div>
      </div>

      <hr className="border-border" />

      {/* Cancellation Policy */}
      <div className="space-y-4">
        <SectionHeader
          title="Cancellation Policy"
          description="Define how much notice clients must give before cancelling."
        />
        <div className="max-w-xs">
          <label className="block text-sm font-medium mb-1" style={{ color: '#3D3450' }}>
            Cancellation notice required
          </label>
          <select
            value={cancellationWindowHours}
            onChange={(e) => setCancellationWindowHours(Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {[0, 2, 4, 8, 12, 24, 48, 72].map((h) => (
              <option key={h} value={h}>{h === 0 ? 'No restriction' : `${h} hours`}</option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            Clients cannot cancel within this window. Staff can always cancel.
          </p>
        </div>
      </div>

      <hr className="border-border" />

      {/* Deposit */}
      <div className="space-y-4">
        <SectionHeader
          title="Deposit"
          description="Require a deposit at the time of booking to reduce no-shows."
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDepositRequired(!depositRequired)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${depositRequired ? 'bg-[#5D4AA8]' : 'bg-gray-200'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${depositRequired ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
          <span className="text-sm font-medium" style={{ color: '#3D3450' }}>Require deposit at booking</span>
        </div>
        {depositRequired && (
          <div className="grid grid-cols-2 gap-4 max-w-sm">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#3D3450' }}>Amount</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="e.g. 25"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#3D3450' }}>Type</label>
              <select
                value={depositType}
                onChange={(e) => setDepositType(e.target.value as 'PERCENT' | 'FIXED')}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="PERCENT">Percentage (%)</option>
                <option value="FIXED">Fixed amount ($)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <SaveButton isSaving={updateBusiness.isPending} saved={saved} />
      </div>
    </form>
  );
}

// ─── Security Tab ────────────────────────────────────────────────────────────

// ─── Account Tab ─────────────────────────────────────────────────────────────

function GetTheAppCard() {
  const { canInstall, hasManualInstall, isInstalled, browserType, triggerInstall } = usePWAInstall();

  const manualInstructions: Record<string, string> = {
    'ios': 'Tap the Share button (↑) at the bottom of Safari, then tap "Add to Home Screen".',
    'mac-safari': 'In Safari, click File in the menu bar, then click "Add to Dock…"',
    'firefox-android': 'Tap the ⋮ menu in the top right, then tap "Install".',
  };

  return (
    <div className="space-y-3 p-5 rounded-xl" style={{ border: '1px solid #EFE9F2' }}>
      <div className="flex items-center gap-2">
        <Smartphone className="h-4 w-4" style={{ color: '#5D4AA8' }} />
        <p className="text-sm font-semibold" style={{ color: '#3D3450' }}>Get the app</p>
      </div>
      {isInstalled ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: '#2E7D32' }}>
          <CheckCircle2 className="h-4 w-4" />
          Iris is installed on this device.
        </div>
      ) : canInstall ? (
        <>
          <p className="text-xs" style={{ color: '#7A7090' }}>
            Install Iris on your device for instant home-screen access, offline support, and push notifications.
          </p>
          <button
            type="button"
            onClick={triggerInstall}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)' }}
          >
            <Download className="h-3.5 w-3.5" />
            Install app
          </button>
        </>
      ) : hasManualInstall ? (
        <>
          <p className="text-xs" style={{ color: '#7A7090' }}>
            {manualInstructions[browserType] ?? 'Follow your browser\'s steps to add Iris to your home screen.'}
          </p>
          <div
            className="rounded-xl p-3 text-xs space-y-1"
            style={{ background: '#F3EFF9', color: '#3D3450', border: '1px solid #E0D5F0' }}
          >
            {browserType === 'ios' && (
              <ol className="space-y-1 list-decimal list-inside">
                <li>Tap the <strong>Share</strong> button (↑) at the bottom of Safari</li>
                <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                <li>Tap <strong>"Add"</strong> to confirm</li>
              </ol>
            )}
            {browserType === 'mac-safari' && (
              <ol className="space-y-1 list-decimal list-inside">
                <li>Click <strong>File</strong> in the Safari menu bar</li>
                <li>Click <strong>"Add to Dock…"</strong></li>
                <li>Click <strong>"Add"</strong> to confirm</li>
              </ol>
            )}
            {browserType === 'firefox-android' && (
              <ol className="space-y-1 list-decimal list-inside">
                <li>Tap the <strong>⋮ menu</strong> in the top right</li>
                <li>Tap <strong>"Install"</strong></li>
                <li>Tap <strong>"Add"</strong> to confirm</li>
              </ol>
            )}
          </div>
        </>
      ) : (
        <p className="text-xs" style={{ color: '#7A7090' }}>
          Open Iris in <strong>Chrome</strong> or <strong>Edge</strong> to install the app on your device.
          Firefox does not support PWA installation.
        </p>
      )}
    </div>
  );
}

function AccountTab({ businessId }: { businessId?: string }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', profileImageUrl: '' });
  const [therapistProfile, setTherapistProfile] = useState<{ id: string; bio: string; specializations: string[] } | null>(null);
  const [therapistForm, setTherapistForm] = useState({ bio: '', specializations: [] as string[] });
  const [specializationInput, setSpecializationInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const r = await fetch('/api/users/me', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const { data } = await r.json();
      if (data) {
        setForm({
          firstName: data.firstName ?? '',
          lastName: data.lastName ?? '',
          profileImageUrl: data.profileImageUrl ?? '',
        });
      }
      // Load therapist profile if applicable
      if (businessId) {
        const tr = await fetch(`/api/therapists?businessId=${businessId}&me=true`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const tData = await tr.json();
        if (tData?.data) {
          setTherapistProfile(tData.data);
          setTherapistForm({ bio: tData.data.bio ?? '', specializations: tData.data.specializations ?? [] });
        }
      }
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: form.firstName, lastName: form.lastName }),
      });
      // Save therapist profile if applicable
      if (therapistProfile && businessId) {
        await fetch(`/api/therapists/${therapistProfile.id}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ businessId, bio: therapistForm.bio, specializations: therapistForm.specializations }),
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `avatars/${session.user.id}/profile.${ext}`;
      await uploadFile(BUCKETS.DOCUMENTS, path, file);
      const publicUrl = getPublicUrl(BUCKETS.DOCUMENTS, path);
      await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileImageUrl: publicUrl }),
      });
      setForm((f) => ({ ...f, profileImageUrl: publicUrl }));
    } catch {
      setError('Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePasswordReset = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user.email) return;
    await supabase.auth.resetPasswordForEmail(session.user.email, {
      redirectTo: `${window.location.origin}/settings?tab=account`,
    });
    setResetEmailSent(true);
    setTimeout(() => setResetEmailSent(false), 5000);
  };

  const addSpecialization = () => {
    const tag = specializationInput.trim();
    if (tag && !therapistForm.specializations.includes(tag)) {
      setTherapistForm((f) => ({ ...f, specializations: [...f.specializations, tag] }));
    }
    setSpecializationInput('');
  };

  const removeSpecialization = (tag: string) => {
    setTherapistForm((f) => ({ ...f, specializations: f.specializations.filter((s) => s !== tag) }));
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const initials = [form.firstName, form.lastName].filter(Boolean).map(s => s[0]).join('').toUpperCase() || '?';

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <SectionHeader title="My Account" description="Update your name, photo, and password." />

      {error && (
        <div className="rounded-xl p-3 text-sm" style={{ background: '#F5E5E5', color: '#922020', border: '1px solid #F5CECE' }}>
          {error}
        </div>
      )}

      {/* Profile photo */}
      <div className="flex items-center gap-5 p-5 rounded-xl" style={{ border: '1px solid #EFE9F2' }}>
        <div className="relative">
          {form.profileImageUrl ? (
            <img
              src={form.profileImageUrl}
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover"
              style={{ border: '2px solid #EFE9F2' }}
            />
          ) : (
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)', color: '#fff' }}>
              {initials}
            </div>
          )}
          <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer" style={{ background: '#5D4AA8' }}>
            {uploadingPhoto ? <Loader2 className="h-3 w-3 text-white animate-spin" /> : <Camera className="h-3 w-3 text-white" />}
            <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
          </label>
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#1E1830' }}>{[form.firstName, form.lastName].filter(Boolean).join(' ') || 'Your Name'}</p>
          <p className="text-xs mt-0.5" style={{ color: '#7A7090' }}>Click the camera icon to update your photo</p>
        </div>
      </div>

      {/* Name fields */}
      <div className="space-y-4 p-5 rounded-xl" style={{ border: '1px solid #EFE9F2' }}>
        <p className="text-sm font-semibold" style={{ color: '#3D3450' }}>Personal details</p>
        <div className="grid grid-cols-2 gap-4">
          <FieldRow label="First name">
            <Input
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              placeholder="First name"
            />
          </FieldRow>
          <FieldRow label="Last name">
            <Input
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              placeholder="Last name"
            />
          </FieldRow>
        </div>
        <div className="flex justify-end pt-1">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : saved ? <><Check className="h-4 w-4 mr-2" />Saved</> : <><Save className="h-4 w-4 mr-2" />Save Changes</>}
          </Button>
        </div>
      </div>

      {/* Therapist profile — shown only if user has a therapist record */}
      {therapistProfile && (
        <div className="space-y-4 p-5 rounded-xl" style={{ border: '1px solid #EFE9F2' }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#3D3450' }}>Therapist profile</p>
            <p className="text-xs mt-0.5" style={{ color: '#7A7090' }}>This information is visible to clients on the booking page.</p>
          </div>
          <FieldRow label="Bio">
            <textarea
              value={therapistForm.bio}
              onChange={(e) => setTherapistForm((f) => ({ ...f, bio: e.target.value }))}
              placeholder="Tell clients about your background and approach…"
              rows={4}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl outline-none transition-all resize-none"
              style={{ border: '1px solid #E5DEEC', color: '#1E1830', fontFamily: 'inherit' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#5D4AA8')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#E5DEEC')}
            />
          </FieldRow>
          <FieldRow label="Specializations">
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  value={specializationInput}
                  onChange={(e) => setSpecializationInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSpecialization(); } }}
                  placeholder="e.g. Deep Tissue, Sports Massage…"
                  className="flex-1 px-3.5 py-2 text-sm rounded-xl outline-none"
                  style={{ border: '1px solid #E5DEEC', color: '#1E1830' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#5D4AA8')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#E5DEEC')}
                />
                <button
                  type="button"
                  onClick={addSpecialization}
                  className="px-3 py-2 text-sm rounded-xl font-medium"
                  style={{ background: '#EDE5F4', color: '#5D4AA8' }}
                >
                  Add
                </button>
              </div>
              {therapistForm.specializations.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {therapistForm.specializations.map((s) => (
                    <span key={s} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: '#F3EFFD', color: '#5D4AA8' }}>
                      {s}
                      <button type="button" onClick={() => removeSpecialization(s)} className="hover:text-red-500 ml-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs" style={{ color: '#9B91B0' }}>Press Enter or comma to add. Click × to remove.</p>
            </div>
          </FieldRow>
        </div>
      )}

      {/* Password */}
      <div className="space-y-3 p-5 rounded-xl" style={{ border: '1px solid #EFE9F2' }}>
        <p className="text-sm font-semibold" style={{ color: '#3D3450' }}>Password</p>
        <p className="text-xs" style={{ color: '#7A7090' }}>We'll send a password reset link to your email address.</p>
        {resetEmailSent ? (
          <div className="rounded-xl p-3 text-sm" style={{ background: '#E8F5E9', color: '#1B5E20', border: '1px solid #C8E6C9' }}>
            Password reset email sent! Check your inbox.
          </div>
        ) : (
          <Button type="button" variant="outline" onClick={handlePasswordReset}>
            <Lock className="h-4 w-4 mr-2" />Send password reset email
          </Button>
        )}
      </div>

      <GetTheAppCard />
    </form>
  );
}

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

  const { data: intakeTemplatesData } = useIntakeFormTemplates(businessId);
  const intakeTemplates = (intakeTemplatesData?.data ?? intakeTemplatesData ?? []) as any[];
  const [defaultIntakeTemplateId, setDefaultIntakeTemplateId] = useState('');
  const [intakeSaved, setIntakeSaved] = useState(false);

  useEffect(() => {
    if (business) {
      setVisibility(((business as any).draftNoteVisibility as DraftNoteVisibility) || 'ALL_THERAPISTS');
    }
  }, [business]);

  useEffect(() => {
    const defaultTemplate = intakeTemplates.find((t: any) => t.isDefault);
    setDefaultIntakeTemplateId(defaultTemplate?.id ?? '');
  }, [intakeTemplates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateBusiness.mutateAsync({ draftNoteVisibility: visibility } as any);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDefaultIntakeChange = async (templateId: string) => {
    setDefaultIntakeTemplateId(templateId);
    if (templateId) {
      // Setting a new default — API handles clearing the old one
      await apiClient.patch(`/intake-form-templates/${templateId}?businessId=${businessId}`, {
        businessId,
        isDefault: true,
      });
    } else {
      // Clearing the default
      const currentDefault = intakeTemplates.find((t: any) => t.isDefault);
      if (currentDefault) {
        await apiClient.patch(`/intake-form-templates/${currentDefault.id}?businessId=${businessId}`, {
          businessId,
          isDefault: false,
        });
      }
    }
    setIntakeSaved(true);
    setTimeout(() => setIntakeSaved(false), 2000);
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

      <div className="border-t pt-6 mt-2" style={{ borderColor: '#EFE9F2' }}>
        <SectionHeader
          title="Default Intake Form"
          description="Select the intake form automatically attached to new appointments when no service-specific form is configured."
        />
        <div className="flex items-center gap-3">
          <select
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4AA8]/30"
            value={defaultIntakeTemplateId}
            onChange={(e) => handleDefaultIntakeChange(e.target.value)}
          >
            <option value="">None (no default form)</option>
            {intakeTemplates.map((t: any) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {intakeSaved && (
            <span className="text-sm font-medium flex items-center gap-1" style={{ color: '#2E7D32' }}>
              <Check className="h-4 w-4" /> Saved
            </span>
          )}
        </div>
        {intakeTemplates.length === 0 && (
          <p className="mt-2 text-sm text-gray-400">
            No intake form templates found.{' '}
            <Link href="/intake-forms/templates" className="text-[#5D4AA8] underline">Create one</Link> first.
          </p>
        )}
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

// ─── Overview panel ───────────────────────────────────────────────────────────

function OverviewPanel({ go }: { go: (p: string) => void }) {
  const businessId = useBusinessId();
  const { data: business } = useBusiness(businessId || '');
  const { data: therapists } = useTherapists(businessId || '');
  const { data: locations } = useLocations(businessId || '');

  const teamCount = (therapists as any[])?.length ?? 0;
  const locationCount = (locations as any[])?.length ?? 0;

  const tasks = [
    { id: 'business' as Panel, label: 'Business profile', sub: business?.name ? 'Name, contact & address set' : 'Name, contact & address', done: !!(business?.name) },
    { id: 'team' as Panel,     label: 'Invite your team', sub: teamCount > 0 ? `${teamCount} team member${teamCount > 1 ? 's' : ''}` : 'No team members yet', done: teamCount > 0 },
    { id: 'branding' as Panel, label: 'Upload your logo', sub: (business as any)?.logo ? 'Logo uploaded' : 'Logo not set', done: !!(business as any)?.logo },
    { id: 'security' as Panel, label: 'Turn on passkeys', sub: 'Recommended for owners', done: false },
    { id: 'portal' as Panel,   label: 'Enable client portal', sub: (business as any)?.clientPortalEnabled ? 'Portal is live' : 'Give clients self-service', done: !!(business as any)?.clientPortalEnabled },
  ];

  const doneN = tasks.filter((t) => t.done).length;
  const pct = Math.round((doneN / tasks.length) * 100);
  const R = 30, circ = 2 * Math.PI * R;

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 11, color: '#5D4AA8', letterSpacing: 1.5, textTransform: 'uppercase' as const, fontWeight: 600, marginBottom: 6, margin: '0 0 6px' }}>Workspace settings</p>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#1E1830', letterSpacing: -0.6, lineHeight: 1.1 }}>Everything about your practice</h1>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: '#7A7090', lineHeight: 1.45, maxWidth: 620 }}>Manage your clinic, team, client experience and connected services — all in one place.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, alignItems: 'start', marginBottom: 16 }}>
        {/* Setup card */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #EFE9F2', boxShadow: '0 1px 2px rgba(28,20,54,0.05)', padding: 18 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#1E1830', margin: '0 0 3px' }}>Finish setting up</p>
          <p style={{ fontSize: 12.5, color: '#7A7090', margin: '0 0 14px', lineHeight: 1.5 }}>A few steps left to get the most out of Iris.</p>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginBottom: 14 }}>
            <div style={{ position: 'relative', width: 76, height: 76, flexShrink: 0 }}>
              <svg width="76" height="76" viewBox="0 0 76 76">
                <circle cx="38" cy="38" r={R} fill="none" stroke="#EFE9F2" strokeWidth="7" />
                <circle cx="38" cy="38" r={R} fill="none" stroke="#5D4AA8" strokeWidth="7" strokeLinecap="round"
                  strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)} transform="rotate(-90 38 38)" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 19, fontWeight: 700, color: '#1E1830', lineHeight: 1 }}>{pct}%</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: '#1E1830' }}>{doneN} of {tasks.length} complete</div>
              <div style={{ fontSize: 12.5, color: '#7A7090', marginTop: 3, lineHeight: 1.5 }}>Complete remaining steps to unlock online booking and reminders.</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {tasks.map((tk) => (
              <button key={tk.id} onClick={() => go(tk.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 11, border: `1px solid ${tk.done ? 'transparent' : '#EFE9F2'}`, background: tk.done ? 'transparent' : '#fff', cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'inherit' }}>
                <span style={{ width: 22, height: 22, borderRadius: 11, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: tk.done ? '#5D4AA8' : 'transparent', border: tk.done ? 'none' : '2px solid #E5DEEC', color: '#fff' }}>
                  {tk.done && <Check className="h-3 w-3" />}
                </span>
                <span style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1E1830', display: 'block' }}>{tk.label}</span>
                  <span style={{ fontSize: 11.5, color: '#7A7090' }}>{tk.sub}</span>
                </span>
                {!tk.done && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: '#F7E5DD', color: '#C97E68', fontWeight: 600, whiteSpace: 'nowrap' as const }}>Do this</span>}
                <ChevronRight className="h-4 w-4" style={{ color: '#9E96B0', flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { l: 'Team', v: String(teamCount), sub: `${teamCount} active`, id: 'team' as Panel, Icon: Users },
              { l: 'Locations', v: String(locationCount), sub: `${locationCount} site${locationCount !== 1 ? 's' : ''}`, id: 'overview' as Panel, href: '/settings/locations', Icon: MapPin },
            ].map((s) => (
              <button key={s.l} onClick={() => s.href ? (window.location.href = s.href) : go(s.id)} style={{ background: '#fff', borderRadius: 18, border: '1px solid #EFE9F2', boxShadow: '0 1px 2px rgba(28,20,54,0.05)', padding: 16, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}>
                <span style={{ width: 34, height: 34, borderRadius: 10, background: '#EDE5F4', color: '#5D4AA8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <s.Icon className="h-4 w-4" />
                </span>
                <div style={{ fontSize: 26, fontWeight: 700, color: '#1E1830', letterSpacing: -0.6, lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#3D3450', marginTop: 8 }}>{s.l}</div>
                <div style={{ fontSize: 11, color: '#7A7090', marginTop: 2 }}>{s.sub}</div>
              </button>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #EFE9F2', boxShadow: '0 1px 2px rgba(28,20,54,0.05)', padding: 18 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#1E1830', margin: '0 0 12px' }}>Quick links</p>
            {[
              { label: 'Communications', desc: 'Configure Twilio, SendGrid', href: '/settings/communications' },
              { label: 'Integrations', desc: 'Xero, QuickBooks & more', href: '/settings/integrations' },
              { label: 'Scheduling rules', desc: 'Availability windows', href: '/settings/scheduling' },
              { label: 'Reminders', desc: 'Automated messages', href: '/settings/reminders' },
            ].map((lk, i) => (
              <Link key={lk.href} href={lk.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderTop: i === 0 ? 'none' : '1px solid #EFE9F2', textDecoration: 'none' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12.5, fontWeight: 600, color: '#1E1830', margin: 0 }}>{lk.label}</p>
                  <p style={{ fontSize: 11, color: '#7A7090', margin: 0 }}>{lk.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4" style={{ color: '#9E96B0' }} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── API panel ────────────────────────────────────────────────────────────────

function ApiPanel() {
  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 11, color: '#5D4AA8', letterSpacing: 1.5, textTransform: 'uppercase' as const, fontWeight: 600, margin: '0 0 6px' }}>Connections</p>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#1E1830', letterSpacing: -0.6 }}>Developer API</h1>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: '#7A7090', lineHeight: 1.45 }}>Programmatic access to your data. Keys and webhooks coming soon.</p>
      </div>
      <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #EFE9F2', padding: '40px 32px', textAlign: 'center' as const }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: '#EDE5F4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#5D4AA8' }}>
          <Code2 className="h-7 w-7" />
        </div>
        <p style={{ fontSize: 15.5, fontWeight: 600, color: '#1E1830', margin: '0 0 8px' }}>API access coming soon</p>
        <p style={{ fontSize: 13, color: '#7A7090', maxWidth: 380, margin: '0 auto 20px', lineHeight: 1.55 }}>API keys and webhook configuration will be available in a future update. You&apos;ll be able to build custom integrations and automations.</p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, background: '#EDE5F4', color: '#5D4AA8', fontSize: 13, fontWeight: 600 }}>
          <ExternalLink className="h-4 w-4" />
          Join the waitlist
        </div>
      </div>
    </div>
  );
}

// ─── Save bar ─────────────────────────────────────────────────────────────────

function SaveBar({ status, onSave, onDiscard }: { status: 'clean' | 'dirty' | 'saved'; onSave: () => void; onDiscard: () => void }) {
  if (status === 'clean') return null;
  const saved = status === 'saved';
  return (
    <div style={{ position: 'fixed', left: 250, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none', padding: '0 0 22px', zIndex: 40 }}>
      <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 16, padding: '11px 11px 11px 20px', borderRadius: 14, background: saved ? '#E9F7F0' : '#231C3D', border: saved ? '1px solid #C2E8D5' : 'none', boxShadow: '0 8px 28px rgba(28,20,54,0.12), 0 2px 6px rgba(28,20,54,0.06)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, fontWeight: 500, color: saved ? '#1B8A5A' : '#fff' }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, background: saved ? '#1B8A5A' : '#E8A893', boxShadow: saved ? 'none' : '0 0 0 4px rgba(232,168,147,0.2)' }} />
          {saved ? 'All changes saved' : 'You have unsaved changes'}
        </span>
        {!saved && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onDiscard} style={{ height: 34, padding: '0 14px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.18)', background: 'transparent', color: 'rgba(255,255,255,0.85)', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
              Discard
            </button>
            <button onClick={onSave} style={{ height: 34, padding: '0 16px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg, #7665C2, #5D4AA8)', color: '#fff', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Save className="h-3.5 w-3.5" />
              Save changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const businessId = useBusinessId();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'clean' | 'dirty' | 'saved'>('clean');
  const [resetKey, setResetKey] = useState(0);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const active = (searchParams.get('tab') || 'overview') as Panel;

  useEffect(() => {
    setStatus('clean');
    document.getElementById('settings-content')?.scrollTo(0, 0);
  }, [active]);

  const go = (id: string) => {
    router.push(`/settings?tab=${id}`);
  };

  const handleContentChange = useCallback(() => {
    setStatus((s) => (s === 'clean' ? 'dirty' : s));
  }, []);

  const handleSave = () => {
    const form = document.getElementById('settings-content')?.querySelector('form');
    if (form) form.requestSubmit();
    clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => {
      setStatus('saved');
      savedTimerRef.current = setTimeout(() => setStatus('clean'), 2400);
    }, 250);
  };

  const handleDiscard = () => {
    setStatus('clean');
    setResetKey((k) => k + 1);
  };

  const renderPanel = () => {
    if (!businessId) return <div style={{ padding: 40, color: '#7A7090', fontSize: 13 }}>Loading settings…</div>;
    switch (active) {
      case 'overview':      return <OverviewPanel go={go} />;
      case 'account':       return <AccountTab businessId={businessId} />;
      case 'business':      return <BusinessTab businessId={businessId} />;
      case 'team':          return <TeamTab businessId={businessId} />;
      case 'notifications': return <NotificationsTab businessId={businessId} />;
      case 'branding':      return <BrandingTab businessId={businessId} />;
      case 'booking':       return <BookingTab businessId={businessId} />;
      case 'clinical':      return <ClinicalTab businessId={businessId} />;
      case 'security':      return <SecurityTab />;
      case 'portal':        return <ClientPortalTab businessId={businessId} />;
      case 'api':           return <ApiPanel />;
      default:              return null;
    }
  };

  return (
    <>
      <div
        key={`${active}-${resetKey}`}
        onInput={handleContentChange}
        onChange={handleContentChange as any}
      >
        {renderPanel()}
      </div>
      <SaveBar status={status} onSave={handleSave} onDiscard={handleDiscard} />
    </>
  );
}
