'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@massage/ui';
import {
  ArrowLeft, Clock, Plus, Trash2, Loader2, Check, AlertCircle,
  Calendar, RefreshCw, X,
} from 'lucide-react';
import Link from 'next/link';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import {
  useBusinessHours,
  useUpdateBusinessHours,
  useBusinessClosures,
  useCreateBusinessClosure,
  useDeleteBusinessClosure,
  type BusinessHoursDay,
} from '@/lib/hooks/use-business-hours';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ─── Closure form modal ───────────────────────────────────────────────────────

function ClosureModal({
  businessId,
  onClose,
}: {
  businessId: string;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    date: '',
    reason: '',
    notifyClients: false,
    isRecurringAnnual: false,
  });
  const [error, setError] = useState('');
  const create = useCreateBusinessClosure(businessId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.date) { setError('Date is required'); return; }
    try {
      await create.mutateAsync(form);
      onClose();
    } catch {
      setError('Failed to save closure. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div
          className="p-5 border-b flex items-center justify-between"
          style={{ borderColor: '#EFE9F2' }}
        >
          <div>
            <h2 className="text-base font-semibold" style={{ color: '#1E1830' }}>Add Closure Date</h2>
            <p className="text-xs mt-0.5" style={{ color: '#7A7090' }}>Mark a day as closed for the whole business.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-lg p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#3D3450' }}>Date</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4AA8]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#3D3450' }}>Reason (optional)</label>
            <input
              type="text"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="e.g. Public holiday, staff training day"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4AA8]"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => setForm({ ...form, isRecurringAnnual: !form.isRecurringAnnual })}
              className="relative flex-shrink-0 cursor-pointer"
              style={{ width: 40, height: 22 }}
            >
              <div
                style={{
                  width: 40, height: 22, borderRadius: 11,
                  background: form.isRecurringAnnual ? '#5D4AA8' : '#D1D5DB',
                  transition: 'background 0.2s',
                }}
              />
              <div
                style={{
                  position: 'absolute', top: 3, left: form.isRecurringAnnual ? 21 : 3,
                  width: 16, height: 16, borderRadius: 8, background: '#fff',
                  transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}
              />
            </div>
            <div>
              <div className="text-sm font-medium" style={{ color: '#1E1830' }}>Repeat every year</div>
              <div className="text-xs" style={{ color: '#7A7090' }}>Blocks the same day each year (e.g. Christmas)</div>
            </div>
          </label>

          <div className="flex gap-3 pt-1">
            <Button variant="outline" type="button" onClick={onClose} className="flex-1">Cancel</Button>
            <Button variant="primary" type="submit" disabled={create.isPending} className="flex-1">
              {create.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : 'Add Closure'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BusinessHoursPage() {
  const businessId = useBusinessId();

  const { data: hoursData, isLoading: hoursLoading } = useBusinessHours(businessId);
  const { data: closures = [], isLoading: closuresLoading } = useBusinessClosures(businessId);
  const updateHours = useUpdateBusinessHours(businessId);
  const deleteClosure = useDeleteBusinessClosure(businessId);

  const [hours, setHours] = useState<BusinessHoursDay[]>([]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [closureModalOpen, setClosureModalOpen] = useState(false);

  useEffect(() => {
    if (hoursData && hoursData.length > 0) {
      setHours(hoursData as BusinessHoursDay[]);
    } else {
      // Default: Mon–Fri 9–17, Sat–Sun closed
      setHours(
        Array.from({ length: 7 }, (_, i) => ({
          id: null,
          businessId: businessId || '',
          locationId: null,
          dayOfWeek: i,
          openTime: '09:00',
          closeTime: '17:00',
          isClosed: i === 0 || i === 6,
        }))
      );
    }
  }, [hoursData, businessId]);

  const updateDay = (dayOfWeek: number, patch: Partial<BusinessHoursDay>) => {
    setHours((prev) => prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, ...patch } : h)));
  };

  const handleSave = async () => {
    if (!businessId) return;
    setSaving(true);
    try {
      await updateHours.mutateAsync(
        hours.map(({ dayOfWeek, openTime, closeTime, isClosed, locationId }) => ({
          dayOfWeek, openTime, closeTime, isClosed, locationId,
        }))
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/settings" className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground mt-0.5">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#5D4AA8', letterSpacing: '1.4px' }}>Scheduling</p>
          <h1 className="text-2xl font-semibold font-display" style={{ color: '#1E1830', letterSpacing: '-0.4px' }}>Business Hours</h1>
          <p className="text-sm mt-0.5" style={{ color: '#7A7090' }}>
            Set your opening hours. Online bookings will only show slots within these times.
          </p>
        </div>
      </div>

      {/* ── Weekly Hours ───────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4" style={{ color: '#5D4AA8' }} />
          <h2 className="text-base font-semibold" style={{ color: '#1E1830' }}>Weekly Schedule</h2>
        </div>

        {hoursLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-8 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading hours…
          </div>
        ) : (
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: '#EFE9F2' }}>
            {hours.map((day, idx) => (
              <div
                key={day.dayOfWeek}
                className="flex items-center gap-4 px-5 py-3.5"
                style={{
                  borderBottom: idx < 6 ? '1px solid #EFE9F2' : 'none',
                  background: day.isClosed ? '#FAFAFA' : '#fff',
                }}
              >
                {/* Day name */}
                <div style={{ width: 96, flexShrink: 0 }}>
                  <span
                    className="text-sm font-medium"
                    style={{ color: day.isClosed ? '#9E96B0' : '#1E1830' }}
                  >
                    {DAY_LABELS[day.dayOfWeek]}
                  </span>
                </div>

                {/* Open/Closed toggle */}
                <label className="flex items-center gap-2 cursor-pointer select-none" style={{ width: 80, flexShrink: 0 }}>
                  <div
                    onClick={() => updateDay(day.dayOfWeek, { isClosed: !day.isClosed })}
                    className="relative cursor-pointer"
                    style={{ width: 36, height: 20, flexShrink: 0 }}
                  >
                    <div
                      style={{
                        width: 36, height: 20, borderRadius: 10,
                        background: !day.isClosed ? '#5D4AA8' : '#D1D5DB',
                        transition: 'background 0.2s',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute', top: 2,
                        left: !day.isClosed ? 18 : 2,
                        width: 16, height: 16, borderRadius: 8, background: '#fff',
                        transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium" style={{ color: day.isClosed ? '#9E96B0' : '#5D4AA8' }}>
                    {day.isClosed ? 'Closed' : 'Open'}
                  </span>
                </label>

                {/* Time inputs */}
                {day.isClosed ? (
                  <span className="text-sm" style={{ color: '#9E96B0' }}>Closed all day</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={day.openTime}
                      onChange={(e) => updateDay(day.dayOfWeek, { openTime: e.target.value })}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4AA8]"
                      style={{ width: 108 }}
                    />
                    <span className="text-sm" style={{ color: '#9E96B0' }}>to</span>
                    <input
                      type="time"
                      value={day.closeTime}
                      onChange={(e) => updateDay(day.dayOfWeek, { closeTime: e.target.value })}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4AA8]"
                      style={{ width: 108 }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end mt-4">
          <Button variant="primary" onClick={handleSave} disabled={saving || hoursLoading}>
            {saving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
            ) : saved ? (
              <><Check className="h-4 w-4 mr-2" />Saved</>
            ) : (
              'Save Hours'
            )}
          </Button>
        </div>
      </section>

      {/* ── Closures ───────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" style={{ color: '#5D4AA8' }} />
            <h2 className="text-base font-semibold" style={{ color: '#1E1830' }}>Holiday & Closure Dates</h2>
          </div>
          <Button variant="outline" size="sm" onClick={() => setClosureModalOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Closure
          </Button>
        </div>

        <div
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: '#EFE9F2' }}
        >
          {closuresLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-8 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading closures…
            </div>
          ) : (closures as any[]).length === 0 ? (
            <div className="py-10 text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2" style={{ color: '#D1C8E8' }} />
              <p className="text-sm font-medium" style={{ color: '#1E1830' }}>No closure dates</p>
              <p className="text-xs mt-1" style={{ color: '#7A7090' }}>
                Add public holidays or staff training days to block bookings.
              </p>
            </div>
          ) : (
            (closures as any[]).map((c: any, idx: number) => {
              const d = new Date(c.date);
              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between px-5 py-3.5 gap-4"
                  style={{
                    borderBottom: idx < (closures as any[]).length - 1 ? '1px solid #EFE9F2' : 'none',
                    background: '#fff',
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: '#EDE5F4' }}
                    >
                      <Calendar className="h-4 w-4" style={{ color: '#5D4AA8' }} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium" style={{ color: '#1E1830' }}>
                        {d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                      <div className="text-xs mt-0.5 flex items-center gap-2" style={{ color: '#7A7090' }}>
                        {c.reason && <span>{c.reason}</span>}
                        {c.isRecurringAnnual && (
                          <span className="flex items-center gap-1">
                            <RefreshCw className="h-3 w-3" /> Repeats yearly
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Remove this closure date?')) deleteClosure.mutate(c.id);
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </section>

      {closureModalOpen && businessId && (
        <ClosureModal businessId={businessId} onClose={() => setClosureModalOpen(false)} />
      )}
    </div>
  );
}
