'use client';

import React, { useState } from 'react';
import { Button, Card, CardContent } from '@massage/ui';
import { ArrowLeft, Plus, Trash2, Clock, Edit2, X, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useTherapists } from '@/lib/hooks/use-therapists';
import { useRooms } from '@/lib/hooks/use-rooms';
import {
  useAvailabilityRules,
  useCreateAvailabilityRule,
  useUpdateAvailabilityRule,
  useDeleteAvailabilityRule,
} from '@/lib/hooks/use-availability-rules';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SERVICE_TYPES = [
  'Swedish Massage',
  'Deep Tissue Massage',
  'Relaxation Massage',
  'Sports Massage',
  'Hot Stone Massage',
  'Remedial Massage',
  'Pregnancy Massage',
  'Aromatherapy Massage',
];

// ─── Rule Form Modal ──────────────────────────────────────────────────────────

function RuleFormModal({
  businessId,
  rule,
  therapists,
  rooms,
  onClose,
}: {
  businessId: string;
  rule?: any;
  therapists: any[];
  rooms: any[];
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    therapistId: rule?.therapistId ?? '',
    roomId: rule?.roomId ?? '',
    serviceType: rule?.serviceType ?? '',
    daysOfWeek: (rule?.daysOfWeek as number[]) ?? [],
    startTime: rule?.startTime ?? '09:00',
    endTime: rule?.endTime ?? '17:00',
    priority: rule?.priority?.toString() ?? '0',
  });
  const [error, setError] = useState('');

  const createRule = useCreateAvailabilityRule(businessId);
  const updateRule = useUpdateAvailabilityRule(businessId);

  const toggleDay = (day: number) => {
    setForm((f) => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(day)
        ? f.daysOfWeek.filter((d) => d !== day)
        : [...f.daysOfWeek, day].sort(),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.daysOfWeek.length === 0) {
      setError('Select at least one day.');
      return;
    }
    if (!form.therapistId && !form.roomId && !form.serviceType) {
      setError('Set at least one target: therapist, room, or service type.');
      return;
    }

    try {
      const payload = {
        therapistId: form.therapistId || undefined,
        roomId: form.roomId || undefined,
        serviceType: form.serviceType || undefined,
        daysOfWeek: form.daysOfWeek,
        startTime: form.startTime,
        endTime: form.endTime,
        priority: parseInt(form.priority) || 0,
      };

      if (rule) {
        await updateRule.mutateAsync({ id: rule.id, ...payload });
      } else {
        await createRule.mutateAsync(payload);
      }
      onClose();
    } catch {
      setError('Failed to save rule. Please try again.');
    }
  };

  const isPending = createRule.isPending || updateRule.isPending;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b flex items-center justify-between sticky top-0 bg-white" style={{ borderColor: '#EFE9F2' }}>
          <div>
            <h2 className="text-base font-semibold" style={{ color: '#1E1830' }}>
              {rule ? 'Edit Rule' : 'New Availability Rule'}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#7A7090' }}>
              Restrict when a therapist, room, or service type is bookable.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-lg p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Target */}
          <div className="space-y-3">
            <p className="text-sm font-medium" style={{ color: '#3D3450' }}>Rule applies to</p>
            <p className="text-xs" style={{ color: '#9E96B0' }}>
              Leave a field empty to match any value. At least one target must be set.
            </p>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Therapist</label>
              <select
                value={form.therapistId}
                onChange={(e) => setForm({ ...form, therapistId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4AA8]"
              >
                <option value="">Any therapist</option>
                {therapists.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.user?.firstName} {t.user?.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Room</label>
              <select
                value={form.roomId}
                onChange={(e) => setForm({ ...form, roomId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4AA8]"
              >
                <option value="">Any room</option>
                {rooms.map((r: any) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Service Type</label>
              <select
                value={form.serviceType}
                onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4AA8]"
              >
                <option value="">Any service</option>
                {SERVICE_TYPES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <hr style={{ borderColor: '#EFE9F2' }} />

          {/* Days of week */}
          <div>
            <p className="text-sm font-medium mb-2" style={{ color: '#3D3450' }}>Available on</p>
            <div className="flex gap-2 flex-wrap">
              {DAY_LABELS.map((label, idx) => {
                const active = form.daysOfWeek.includes(idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    className="w-11 h-10 rounded-lg text-sm font-medium transition-all"
                    style={
                      active
                        ? { background: '#5D4AA8', color: '#fff', border: '1px solid #5D4AA8' }
                        : { background: '#F9FAFB', color: '#374151', border: '1px solid #E5E7EB' }
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
              <input
                type="time"
                required
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4AA8]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Time</label>
              <input
                type="time"
                required
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4AA8]"
              />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Priority (higher wins on conflict)</label>
            <input
              type="number"
              min={0}
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4AA8]"
              placeholder="0"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="outline" type="button" onClick={onClose} className="flex-1">Cancel</Button>
            <Button variant="primary" type="submit" disabled={isPending} className="flex-1">
              {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : rule ? 'Update Rule' : 'Create Rule'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Rule Card ────────────────────────────────────────────────────────────────

function RuleCard({ rule, onEdit, onDelete }: { rule: any; onEdit: () => void; onDelete: () => void }) {
  const days = (rule.daysOfWeek as number[]).map((d) => DAY_LABELS[d]).join(', ');

  const targets: string[] = [];
  if (rule.therapist) targets.push(`${rule.therapist.user?.firstName} ${rule.therapist.user?.lastName}`);
  if (rule.room) targets.push(`Room: ${rule.room.name}`);
  if (rule.serviceType) targets.push(rule.serviceType);

  return (
    <div
      className="flex items-start justify-between p-4 rounded-xl gap-4"
      style={{ border: '1px solid #EFE9F2', background: '#fff' }}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="h-9 w-9 bg-[#EDE5F4] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
          <Clock className="h-4 w-4 text-[#5D4AA8]" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: '#1E1830' }}>
            {targets.length > 0 ? targets.join(' + ') : 'All therapists / rooms'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#7A7090' }}>
            {days} · {rule.startTime} – {rule.endTime}
            {rule.priority > 0 && ` · Priority ${rule.priority}`}
          </p>
        </div>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit2 className="w-3.5 h-3.5" />
        </Button>
        <Button variant="outline" size="sm" onClick={onDelete}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SchedulingPage() {
  const businessId = useBusinessId();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editRule, setEditRule] = useState<any>(null);

  const { data: rules = [], isLoading } = useAvailabilityRules(businessId);
  const { data: therapists = [] } = useTherapists(businessId, { isActive: true });
  const { data: rooms = [] } = useRooms(businessId, true);
  const deleteRule = useDeleteAvailabilityRule(businessId);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/settings" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Availability Rules</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Fine-tune when therapists, rooms, or service types are bookable
          </p>
        </div>
      </div>

      {/* Info callout */}
      <div
        className="flex items-start gap-3 rounded-xl p-4"
        style={{ background: '#F3EFFD', border: '1px solid rgba(93,74,168,0.15)' }}
      >
        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#5D4AA8' }} />
        <div className="text-sm" style={{ color: '#5D4AA8' }}>
          <strong>How rules work:</strong> A rule defines a permitted booking window for a specific therapist, room,
          or service type. When a client tries to book, the system only allows slots that fall within a matching rule.
          Rules complement (not replace) therapist working hours set under Scheduling → Availability.
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> New Rule
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Loading rules…</div>
      ) : (rules as any[]).length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No availability rules yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Add rules to restrict booking windows for specific therapists, rooms, or services.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(rules as any[]).map((rule: any) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onEdit={() => setEditRule(rule)}
              onDelete={() => {
                if (confirm('Delete this availability rule?')) {
                  deleteRule.mutate(rule.id);
                }
              }}
            />
          ))}
        </div>
      )}

      {(isCreateOpen || editRule) && businessId && (
        <RuleFormModal
          businessId={businessId}
          rule={editRule ?? undefined}
          therapists={therapists as any[]}
          rooms={rooms as any[]}
          onClose={() => { setIsCreateOpen(false); setEditRule(null); }}
        />
      )}
    </div>
  );
}
