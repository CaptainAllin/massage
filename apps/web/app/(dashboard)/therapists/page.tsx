'use client';

import { useState, useMemo, KeyboardEvent } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Table, type Column } from '@massage/ui';
import {
  TrendingUp, TrendingDown, Users, Award, Activity, RefreshCw, X, ChevronDown,
  Plus, Search, Loader2, UserCheck, Info, Calendar,
} from 'lucide-react';
import { TherapistComparisonChart, type TherapistPerformanceData } from '@/components/analytics/TherapistComparisonChart';
import { KPICard } from '@/components/analytics/KPICard';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useBusiness } from '@/lib/hooks/use-business';
import { formatCurrency as fmtCurrency } from '@/lib/format';
import {
  useTherapistPerformance, useTherapists, useCreateTherapist,
  type TherapistPerformanceRecord,
} from '@/lib/hooks/use-therapists';
import { useLocations } from '@/lib/hooks/use-locations';
import { apiClient } from '@/lib/api-client';
import { useOnboardingContext } from '@/components/onboarding/OnboardingProvider';

// ─── Shared helpers ───────────────────────────────────────────────────────────

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-start gap-3 rounded-xl p-4"
      style={{ background: '#F3EFFD', border: '1px solid rgba(93,74,168,0.15)' }}
    >
      <Info className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#5D4AA8' }} />
      <p className="text-sm leading-relaxed" style={{ color: '#5D4AA8' }}>{children}</p>
    </div>
  );
}

// ─── Tag / Chip input for specializations ────────────────────────────────────

function TagInput({
  tags, onChange, placeholder,
}: { tags: string[]; onChange: (tags: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState('');

  const addTag = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !tags.includes(trimmed)) onChange([...tags, trimmed]);
    setInput('');
  };

  const removeTag = (tag: string) => onChange(tags.filter((t) => t !== tag));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div
      className="min-h-[42px] flex flex-wrap gap-1.5 items-center rounded-xl border-2 border-input bg-background px-3 py-2 cursor-text"
      onClick={() => document.getElementById('tag-input')?.focus()}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ background: '#EDE5F4', color: '#5D4AA8' }}
        >
          {tag}
          <button type="button" onClick={() => removeTag(tag)} className="hover:opacity-70">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        id="tag-input"
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => { if (input.trim()) addTag(input); }}
        placeholder={tags.length ? '' : placeholder}
        className="flex-1 min-w-[120px] text-sm bg-transparent outline-none placeholder:text-gray-400"
      />
    </div>
  );
}

// ─── Add Therapist Modal ──────────────────────────────────────────────────────

interface FoundUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  hasTherapistProfile: boolean;
}

function AddTherapistModal({
  businessId,
  onClose,
  onCreated,
}: {
  businessId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const createTherapist = useCreateTherapist(businessId);
  const { data: locations = [] } = useLocations(businessId);

  const [email, setEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [foundUser, setFoundUser] = useState<FoundUser | null>(null);

  const [specializations, setSpecializations] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [locationId, setLocationId] = useState('');

  const handleSearch = async () => {
    if (!email.trim()) return;
    setSearching(true);
    setSearchError('');
    setFoundUser(null);
    try {
      const resp = await apiClient.get<{ success: boolean; data: FoundUser }>(
        `/users/search?email=${encodeURIComponent(email.trim())}&businessId=${businessId}`
      );
      const user = resp.data.data;
      if (user.hasTherapistProfile) {
        setSearchError('This user already has a therapist profile in your practice.');
      } else {
        setFoundUser(user);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'User not found';
      setSearchError(msg === 'No account found with that email address'
        ? 'No account found. The person must sign up first before you can create their therapist profile.'
        : msg);
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundUser) return;
    await createTherapist.mutateAsync({
      userId: foundUser.id,
      specializations,
      bio: bio || undefined,
      licenseNumber: licenseNumber || undefined,
      licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : undefined,
      hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
      locationId: locationId || undefined,
    } as any);
    onCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div
          className="p-5 border-b flex items-center justify-between sticky top-0 bg-white rounded-t-2xl"
          style={{ borderColor: '#EFE9F2' }}
        >
          <div>
            <h2 className="text-lg font-semibold" style={{ color: '#1E1830' }}>Add Therapist Profile</h2>
            <p className="text-xs mt-0.5" style={{ color: '#7A7090' }}>
              Link a team member's account and set their practice details.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-lg p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Step 1: Find user account */}
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: '#3D3450' }}>Step 1 — Find team member account</p>
            <Hint>
              A Therapist profile is different from a user account. The team member must{' '}
              <strong>sign up to the platform first</strong> before you can create their therapist profile here.
            </Hint>
            <div className="flex gap-2 mt-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="team.member@example.com"
                className="flex-1 rounded-xl border-2 border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={searching || !email.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)' }}
              >
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Search
              </button>
            </div>
            {searchError && (
              <p className="text-xs mt-2 text-red-600">{searchError}</p>
            )}
            {foundUser && (
              <div
                className="flex items-center gap-3 mt-3 p-3 rounded-xl"
                style={{ background: '#F0FDF4', border: '1px solid rgba(22,163,74,0.2)' }}
              >
                <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-sm flex-shrink-0">
                  {foundUser.firstName?.[0]}{foundUser.lastName?.[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800">
                    {foundUser.firstName} {foundUser.lastName}
                  </p>
                  <p className="text-xs text-green-600">{foundUser.email}</p>
                </div>
                <UserCheck className="h-4 w-4 text-green-600 ml-auto" />
              </div>
            )}
          </div>

          {/* Step 2: Profile details (shown after user found) */}
          {foundUser && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm font-semibold" style={{ color: '#3D3450' }}>Step 2 — Set profile details</p>

              {/* Specializations */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#3D3450' }}>
                  Specializations
                  <span className="ml-1 text-xs font-normal" style={{ color: '#9E96B0' }}>
                    — press Enter to add
                  </span>
                </label>
                <TagInput
                  tags={specializations}
                  onChange={setSpecializations}
                  placeholder="e.g. Deep Tissue, Sports Massage…"
                />
                <p className="text-xs mt-1" style={{ color: '#9E96B0' }}>
                  Shown to clients on the booking page for therapist selection.
                </p>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#3D3450' }}>Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="A short description about this therapist's background and approach…"
                  className="w-full rounded-xl border-2 border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Credentials */}
              <div
                className="rounded-xl p-4 space-y-3"
                style={{ background: '#FAFAFA', border: '1px solid #EFE9F2' }}
              >
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#5D4AA8', letterSpacing: '1px' }}>
                  Credentials
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#3D3450' }}>
                      License Number
                    </label>
                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="e.g. RMT-12345"
                      className="w-full rounded-xl border-2 border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#3D3450' }}>
                      License Expiry
                    </label>
                    <input
                      type="date"
                      value={licenseExpiry}
                      onChange={(e) => setLicenseExpiry(e.target.value)}
                      className="w-full rounded-xl border-2 border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <p className="text-xs" style={{ color: '#9E96B0' }}>
                  License details are used for compliance tracking and are only visible to admin staff.
                </p>
              </div>

              {/* Hourly rate */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#3D3450' }}>
                  Hourly Rate ($)
                </label>
                <input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="e.g. 80"
                  className="w-full rounded-xl border-2 border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs mt-1" style={{ color: '#9E96B0' }}>Used for payroll calculations.</p>
              </div>

              {/* Location */}
              {(locations as any[]).length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#3D3450' }}>
                    Assign to Location
                  </label>
                  <select
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    className="w-full rounded-xl border-2 border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">No specific location</option>
                    {(locations as any[]).map((loc: any) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Availability note */}
              <div
                className="flex items-start gap-2 rounded-xl p-3 text-xs"
                style={{ background: '#F0EFFF', border: '1px solid rgba(93,74,168,0.12)', color: '#5D4AA8' }}
              >
                <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  Availability (working hours per day) can be set from the therapist's profile after creation.
                  Navigate to the therapist's record and open the <strong>Availability</strong> tab.
                </span>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-medium border transition-colors"
                  style={{ borderColor: '#EFE9F2', color: '#7A7090' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTherapist.isPending}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)' }}
                >
                  {createTherapist.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />Creating…
                    </span>
                  ) : 'Create Therapist Profile'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Team management tab ──────────────────────────────────────────────────────

function TeamManagement({ businessId }: { businessId: string }) {
  const { data: therapists = [], isLoading, refetch } = useTherapists(businessId);
  const [showModal, setShowModal] = useState(false);
  const { checkedItems, toggleItem } = useOnboardingContext();

  const handleCreated = () => {
    if (!checkedItems.has('add_therapist')) toggleItem('add_therapist');
    refetch();
  };

  return (
    <div className="space-y-5">
      <Hint>
        A <strong>Therapist record</strong> is a practice profile — it holds specializations, credentials, and
        availability. It is separate from a <strong>user account</strong> (the login). A team member needs both:
        a user account to log in, and a therapist record to appear on the schedule and booking page.
      </Hint>

      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 1px 2px rgba(28,20,54,0.12), 0 1px 1px rgba(28,20,54,0.06)' }}
        >
          <Plus className="h-4 w-4" />
          Add Therapist Profile
        </button>
      </div>

      {isLoading ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 18, height: 18, border: '2px solid #5D4AA8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
            <span style={{ fontSize: 13.5, color: '#7A7090' }}>Loading therapists…</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border p-5 animate-pulse" style={{ borderColor: '#EFE9F2' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200" />
                  <div className="space-y-1 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (therapists as any[]).length === 0 ? (
        <div
          className="rounded-2xl border-2 border-dashed p-12 text-center"
          style={{ borderColor: '#D1C4E0' }}
        >
          <div
            className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: '#EDE5F4' }}
          >
            <Users className="h-7 w-7" style={{ color: '#5D4AA8' }} />
          </div>
          <p className="font-semibold mb-1" style={{ color: '#1E1830' }}>No therapist profiles yet</p>
          <p className="text-sm mb-4" style={{ color: '#7A7090' }}>
            Add your first therapist profile to start scheduling sessions.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)' }}
          >
            <Plus className="h-4 w-4" />
            Add Therapist Profile
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(therapists as any[]).map((t: any) => (
            <TherapistCard key={t.id} therapist={t} />
          ))}
        </div>
      )}

      {showModal && businessId && (
        <AddTherapistModal
          businessId={businessId}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

function TherapistCard({ therapist: t }: { therapist: any }) {
  const u = t.user;
  const initials = `${u?.firstName?.[0] ?? ''}${u?.lastName?.[0] ?? ''}`.toUpperCase() || '?';
  return (
    <div
      className="rounded-2xl border p-5 space-y-3 hover:shadow-md transition-shadow"
      style={{ borderColor: '#EFE9F2', background: '#fff' }}
    >
      <div className="flex items-center gap-3">
        <div
          className="h-11 w-11 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0"
          style={{ background: '#EDE5F4', color: '#5D4AA8' }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="font-semibold truncate" style={{ color: '#1E1830' }}>
            {u?.firstName} {u?.lastName}
          </p>
          <p className="text-xs truncate" style={{ color: '#9E96B0' }}>{u?.email}</p>
        </div>
        <Badge variant={t.isActive ? 'success' : 'default'} className="ml-auto flex-shrink-0">
          {t.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {t.specializations?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {t.specializations.map((s: string) => (
            <span
              key={s}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: '#EDE5F4', color: '#5D4AA8' }}
            >
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="space-y-1 text-xs" style={{ color: '#7A7090' }}>
        {t.licenseNumber && (
          <p>License: <span className="font-medium" style={{ color: '#3D3450' }}>{t.licenseNumber}</span></p>
        )}
        {t.licenseExpiry && (
          <p>
            Expires:{' '}
            <span className="font-medium" style={{ color: '#3D3450' }}>
              {new Date(t.licenseExpiry).toLocaleDateString()}
            </span>
          </p>
        )}
        {t.hourlyRate != null && (
          <p>Rate: <span className="font-medium" style={{ color: '#3D3450' }}>${t.hourlyRate}/hr</span></p>
        )}
      </div>
    </div>
  );
}

// ─── Analytics tab (existing performance view) ────────────────────────────────

type DatePreset = 'week' | 'month' | 'quarter' | 'year';
type SortKey = keyof TherapistPerformanceRecord;
type MetricToggle = 'revenue' | 'sessions';

function makeDateRange(preset: DatePreset) {
  const end = new Date();
  const start = new Date();
  const offsets: Record<DatePreset, number> = { week: 7, month: 30, quarter: 90, year: 365 };
  start.setDate(end.getDate() - offsets[preset]);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

function formatCurrency(cents: number, currency = 'AUD') {
  return fmtCurrency(cents / 100, currency, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function getRateBadge(rate: number) {
  if (rate >= 70) return <Badge variant="success">{rate.toFixed(1)}%</Badge>;
  if (rate >= 40) return <Badge variant="warning">{rate.toFixed(1)}%</Badge>;
  return <Badge variant="danger">{rate.toFixed(1)}%</Badge>;
}

const PRESET_LABELS: Record<DatePreset, string> = {
  week: 'Last 7 Days',
  month: 'Last 30 Days',
  quarter: 'Last 90 Days',
  year: 'Last Year',
};

interface DetailPanelProps {
  therapist: TherapistPerformanceRecord;
  teamAvg: {
    sessionsCompleted: number;
    revenueGenerated: number;
    utilizationRate: number;
    rebookingRate: number;
  };
  onClose: () => void;
  currency?: string;
}

function TherapistDetailPanel({ therapist, teamAvg, onClose, currency = 'AUD' }: DetailPanelProps) {
  const [detailPreset, setDetailPreset] = useState<DatePreset>('month');
  const businessId = useBusinessId();
  const dateRange = makeDateRange(detailPreset);

  const { data, isLoading } = useTherapistPerformance(businessId, {
    ...dateRange,
    therapistId: therapist.therapistId,
  });

  const detail = data?.therapists?.[0] ?? therapist;

  const metrics = [
    { label: 'Sessions Completed', value: detail.sessionsCompleted, avg: teamAvg.sessionsCompleted, format: 'number' as const },
    { label: 'Revenue Generated', value: detail.revenueGenerated, avg: teamAvg.revenueGenerated, format: 'currency' as const },
    { label: 'Utilization Rate', value: detail.utilizationRate, avg: teamAvg.utilizationRate, format: 'percentage' as const },
    { label: 'Rebooking Rate', value: detail.rebookingRate, avg: teamAvg.rebookingRate, format: 'percentage' as const },
  ];

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-800 font-semibold text-sm border border-blue-200">
              {therapist.therapistName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div>
              <CardTitle className="text-base">{therapist.therapistName}</CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">Individual performance breakdown</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {(Object.keys(PRESET_LABELS) as DatePreset[]).map((preset) => (
                <button
                  key={preset}
                  onClick={() => setDetailPreset(preset)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    detailPreset === preset ? 'bg-blue-600 text-white' : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {PRESET_LABELS[preset]}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-200 transition-colors">
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                <div className="h-8 bg-gray-200 rounded w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.map(({ label, value, avg, format }) => {
              const diff = avg > 0 ? ((value - avg) / avg) * 100 : 0;
              const formatted =
                format === 'currency' ? formatCurrency(value, currency)
                : format === 'percentage' ? `${value.toFixed(1)}%`
                : value.toString();
              const avgFormatted =
                format === 'currency' ? formatCurrency(avg, currency)
                : format === 'percentage' ? `${avg.toFixed(1)}%`
                : avg.toFixed(1);
              return (
                <div key={label} className="rounded-lg bg-white border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <p className="text-xl font-bold text-gray-900">{formatted}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {diff >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-[#5D4AA8]" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className={`text-xs font-medium ${diff >= 0 ? 'text-[#5D4AA8]' : 'text-red-500'}`}>
                      {diff >= 0 ? '+' : ''}{diff.toFixed(1)}% vs team avg
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">Team avg: {avgFormatted}</p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PerformanceAnalytics({ businessId, currency = 'AUD' }: { businessId: string; currency?: string }) {
  const [preset, setPreset] = useState<DatePreset>('month');
  const [metric, setMetric] = useState<MetricToggle>('revenue');
  const [sortKey, setSortKey] = useState<SortKey>('revenueGenerated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const dateRange = makeDateRange(preset);
  const { data, isLoading, error, refetch } = useTherapistPerformance(businessId, dateRange);

  const therapists = data?.therapists ?? [];

  const kpis = useMemo(() => {
    if (!therapists.length) return null;
    const totalSessions = therapists.reduce((s, t) => s + t.sessionsCompleted, 0);
    const totalRevenue = therapists.reduce((s, t) => s + t.revenueGenerated, 0);
    const top = [...therapists].sort((a, b) => b.revenueGenerated - a.revenueGenerated)[0];
    const avgUtil = therapists.reduce((s, t) => s + t.utilizationRate, 0) / therapists.length;
    return {
      activeTherapists: therapists.length,
      avgSessionsPerTherapist: Math.round((totalSessions / therapists.length) * 10) / 10,
      topPerformer: top.therapistName,
      topPerformerRevenue: top.revenueGenerated,
      utilizationRate: Math.round(avgUtil * 10) / 10,
      teamAvg: {
        sessionsCompleted: totalSessions / therapists.length,
        revenueGenerated: totalRevenue / therapists.length,
        utilizationRate: avgUtil,
        rebookingRate: therapists.reduce((s, t) => s + t.rebookingRate, 0) / therapists.length,
      },
    };
  }, [therapists]);

  const chartData = useMemo<TherapistPerformanceData[]>(
    () => therapists.map((t) => ({
      id: t.therapistId,
      name: t.therapistName,
      revenue: t.revenueGenerated,
      sessions: t.sessionsCompleted,
      completionRate: t.utilizationRate,
    })),
    [therapists],
  );

  const sorted = useMemo(() => {
    return [...therapists].sort((a, b) => {
      const av = a[sortKey] as number;
      const bv = b[sortKey] as number;
      return sortOrder === 'asc' ? av - bv : bv - av;
    });
  }, [therapists, sortKey, sortOrder]);

  const handleSort = (key: string) => {
    if (key === sortKey) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key as SortKey); setSortOrder('desc'); }
  };

  const selectedTherapist = selectedId ? therapists.find((t) => t.therapistId === selectedId) : null;

  const columns: Column<TherapistPerformanceRecord>[] = [
    {
      key: 'therapistName',
      header: 'Therapist',
      render: (t) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EDE5F4] text-[#5D4AA8] text-xs font-semibold border border-[#E5DEEC] shrink-0">
            {t.therapistName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <span className="font-medium">{t.therapistName}</span>
        </div>
      ),
    },
    { key: 'sessionsCompleted', header: 'Sessions', sortable: true, render: (t) => <span className="font-semibold">{t.sessionsCompleted}</span> },
    { key: 'revenueGenerated', header: 'Revenue', sortable: true, render: (t) => <span className="font-semibold">{formatCurrency(t.revenueGenerated, currency)}</span> },
    { key: 'utilizationRate', header: 'Utilization', sortable: true, render: (t) => getRateBadge(t.utilizationRate) },
    { key: 'rebookingRate', header: 'Rebooking', sortable: true, render: (t) => getRateBadge(t.rebookingRate) },
    {
      key: 'therapistId',
      header: '',
      render: (t) => (
        <button
          onClick={(e) => { e.stopPropagation(); setSelectedId((cur) => (cur === t.therapistId ? null : t.therapistId)); }}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          {selectedId === t.therapistId ? 'Hide detail' : 'View detail'}
          <ChevronDown className={`h-3 w-3 transition-transform ${selectedId === t.therapistId ? 'rotate-180' : ''}`} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {(Object.keys(PRESET_LABELS) as DatePreset[]).map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                preset === p ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {PRESET_LABELS[p]}
            </button>
          ))}
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 text-sm">
          Failed to load performance data. Please try again.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Active Therapists" value={kpis?.activeTherapists ?? 0} format="number" icon={<Users className="h-4 w-4" />} isLoading={isLoading} />
        <KPICard title="Avg Sessions" value={kpis?.avgSessionsPerTherapist ?? 0} format="number" subtitle="Per therapist" icon={<Activity className="h-4 w-4" />} isLoading={isLoading} />
        <KPICard title="Top Performer" value={kpis?.topPerformer ?? 'N/A'} subtitle={kpis?.topPerformerRevenue ? formatCurrency(kpis.topPerformerRevenue, currency) : undefined} icon={<Award className="h-4 w-4" />} isLoading={isLoading} />
        <KPICard title="Avg Utilization" value={kpis?.utilizationRate ?? 0} format="percentage" subtitle="Team average" isLoading={isLoading} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Team Comparison</h2>
          <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
            {(['revenue', 'sessions'] as MetricToggle[]).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                  metric === m ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        {isLoading ? (
          <Card className="p-6"><div className="h-[400px] animate-pulse bg-gray-100 rounded-lg" /></Card>
        ) : (
          <TherapistComparisonChart
            data={chartData}
            metric={metric}
            title={metric === 'revenue' ? 'Revenue by Therapist' : 'Sessions by Therapist'}
            currency={currency}
          />
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">All Therapists</h2>
        {isLoading ? (
          <Card className="p-6">
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="h-8 w-8 bg-gray-200 rounded-full" />
                  <div className="flex-1 h-8 bg-gray-200 rounded" />
                  <div className="w-20 h-8 bg-gray-200 rounded" />
                  <div className="w-24 h-8 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Table
            data={sorted}
            columns={columns}
            onSort={handleSort}
            sortKey={sortKey}
            sortOrder={sortOrder}
            onRowClick={(t) => setSelectedId((cur) => (cur === t.therapistId ? null : t.therapistId))}
            emptyMessage="No therapist data for this period"
          />
        )}
      </div>

      {selectedTherapist && kpis && (
        <TherapistDetailPanel
          therapist={selectedTherapist}
          teamAvg={kpis.teamAvg}
          onClose={() => setSelectedId(null)}
          currency={currency}
        />
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type MainTab = 'team' | 'analytics';

export default function TherapistsPage() {
  const businessId = useBusinessId();
  const { data: business } = useBusiness(businessId);
  const currency = (business as any)?.currency || 'AUD';
  const [activeTab, setActiveTab] = useState<MainTab>('team');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#5D4AA8', letterSpacing: '1.4px' }}>
          Team
        </p>
        <h1 className="text-2xl font-semibold font-display" style={{ color: '#1E1830', letterSpacing: '-0.4px' }}>
          Therapists
        </h1>
        <p className="text-sm" style={{ color: '#7A7090' }}>
          Manage your team profiles and review performance metrics.
        </p>
      </div>

      {/* Tab nav */}
      <div style={{ borderBottom: '1px solid #EFE9F2' }}>
        <nav className="-mb-px flex gap-6">
          {([
            { id: 'team' as MainTab, label: 'Team', icon: <Users className="h-4 w-4" /> },
            { id: 'analytics' as MainTab, label: 'Analytics', icon: <Activity className="h-4 w-4" /> },
          ]).map((tab) => (
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

      {!businessId ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : activeTab === 'team' ? (
        <TeamManagement businessId={businessId} />
      ) : (
        <PerformanceAnalytics businessId={businessId} currency={currency} />
      )}
    </div>
  );
}
