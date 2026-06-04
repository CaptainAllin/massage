'use client';

import React, { useState } from 'react';
import { Button } from '@massage/ui';
import {
  ArrowLeft, Calendar, Check, X, AlertCircle, Loader2,
  Plus, CalendarCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useTherapists } from '@/lib/hooks/use-therapists';
import { useLeaveRequests, useApproveLeaveRequest, useSubmitLeaveRequest, type LeaveRequest } from '@/lib/hooks/use-leave-management';

const LEAVE_TYPE_LABELS: Record<string, string> = {
  VACATION: 'Vacation',
  SICK: 'Sick Leave',
  PERSONAL: 'Personal',
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING:  { bg: '#FEF3C7', text: '#92400E' },
  APPROVED: { bg: '#D1FAE5', text: '#065F46' },
  DECLINED: { bg: '#FEE2E2', text: '#991B1B' },
};

// ─── Leave Request Form Modal ─────────────────────────────────────────────────

function RequestLeaveModal({
  businessId,
  therapists,
  onClose,
}: {
  businessId: string;
  therapists: any[];
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    therapistId: therapists[0]?.id ?? '',
    leaveType: 'VACATION',
    startDate: '',
    endDate: '',
    reason: '',
    notes: '',
    isAllDay: true,
  });
  const [error, setError] = useState('');
  const submit = useSubmitLeaveRequest(businessId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.therapistId || !form.startDate || !form.endDate) {
      setError('Therapist, start date and end date are required');
      return;
    }
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    // For all-day leaves, make end date inclusive by setting it to end of day
    end.setHours(23, 59, 59, 999);
    if (start >= end) {
      setError('Start date must be before end date');
      return;
    }
    try {
      await submit.mutateAsync({
        therapistId: form.therapistId,
        leaveType: form.leaveType,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        reason: form.reason || undefined,
        notes: form.notes || undefined,
        isAllDay: form.isAllDay,
      });
      onClose();
    } catch {
      setError('Failed to submit leave request. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b flex items-center justify-between sticky top-0 bg-white" style={{ borderColor: '#EFE9F2' }}>
          <div>
            <h2 className="text-base font-semibold" style={{ color: '#1E1830' }}>Add Leave</h2>
            <p className="text-xs mt-0.5" style={{ color: '#7A7090' }}>Block a therapist's calendar for leave.</p>
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
            <label className="block text-sm font-medium mb-1" style={{ color: '#3D3450' }}>Therapist</label>
            <select
              value={form.therapistId}
              onChange={(e) => setForm({ ...form, therapistId: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4AA8]"
            >
              {therapists.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.user?.firstName} {t.user?.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#3D3450' }}>Leave Type</label>
            <select
              value={form.leaveType}
              onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4AA8]"
            >
              <option value="VACATION">Vacation</option>
              <option value="SICK">Sick Leave</option>
              <option value="PERSONAL">Personal</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#3D3450' }}>Start Date</label>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4AA8]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#3D3450' }}>End Date</label>
              <input
                type="date"
                required
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4AA8]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#3D3450' }}>Reason (optional)</label>
            <input
              type="text"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="e.g. Annual leave, medical appointment"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4AA8]"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="outline" type="button" onClick={onClose} className="flex-1">Cancel</Button>
            <Button variant="primary" type="submit" disabled={submit.isPending} className="flex-1">
              {submit.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : 'Add Leave'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Leave Card ───────────────────────────────────────────────────────────────

function LeaveCard({
  leave,
  onApprove,
  onDecline,
  isActing,
}: {
  leave: LeaveRequest;
  onApprove: () => void;
  onDecline: () => void;
  isActing: boolean;
}) {
  const colors = STATUS_COLORS[leave.status] || STATUS_COLORS.PENDING;
  const start = new Date(leave.startDate);
  const end = new Date(leave.endDate);
  const therapistName = `${leave.therapist.user.firstName || ''} ${leave.therapist.user.lastName || ''}`.trim();

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });

  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div
      className="flex items-start justify-between p-4 rounded-xl gap-4"
      style={{ border: '1px solid #EFE9F2', background: '#fff' }}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div
          className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: '#EDE5F4' }}
        >
          <Calendar className="h-4 w-4" style={{ color: '#5D4AA8' }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium" style={{ color: '#1E1830' }}>{therapistName}</span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: colors.bg, color: colors.text }}
            >
              {leave.status}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: '#F3F4F7', color: '#7A7090' }}
            >
              {LEAVE_TYPE_LABELS[leave.leaveType] || leave.leaveType}
            </span>
          </div>
          <div className="text-xs mt-1" style={{ color: '#7A7090' }}>
            {formatDate(start)} – {formatDate(end)} · {days} day{days !== 1 ? 's' : ''}
          </div>
          {leave.reason && (
            <div className="text-xs mt-0.5" style={{ color: '#9E96B0' }}>{leave.reason}</div>
          )}
        </div>
      </div>

      {leave.status === 'PENDING' && (
        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onApprove}
            disabled={isActing}
            style={{ color: '#065F46', borderColor: '#6EE7B7' }}
          >
            <Check className="h-3.5 w-3.5 mr-1" /> Approve
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDecline}
            disabled={isActing}
            style={{ color: '#991B1B', borderColor: '#FECACA' }}
          >
            <X className="h-3.5 w-3.5 mr-1" /> Decline
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LeaveManagementPage() {
  const businessId = useBusinessId();
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'DECLINED'>('ALL');
  const [modalOpen, setModalOpen] = useState(false);

  const { data: allLeave = [], isLoading } = useLeaveRequests(businessId);
  const { data: therapists = [] } = useTherapists(businessId, { isActive: true });
  const approve = useApproveLeaveRequest(businessId);

  const filtered = filter === 'ALL'
    ? (allLeave as LeaveRequest[])
    : (allLeave as LeaveRequest[]).filter((l) => l.status === filter);

  const pendingCount = (allLeave as LeaveRequest[]).filter((l) => l.status === 'PENDING').length;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/settings" className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground mt-0.5">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#5D4AA8', letterSpacing: '1.4px' }}>Scheduling</p>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold font-display" style={{ color: '#1E1830', letterSpacing: '-0.4px' }}>
                Leave Management
              </h1>
              <p className="text-sm mt-0.5" style={{ color: '#7A7090' }}>
                Manage staff leave requests. Approved leave blocks their booking slots automatically.
              </p>
            </div>
            <Button variant="primary" onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Add Leave
            </Button>
          </div>
        </div>
      </div>

      {/* Info */}
      {pendingCount > 0 && (
        <div
          className="flex items-start gap-3 rounded-xl p-4"
          style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}
        >
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#92400E' }} />
          <div className="text-sm" style={{ color: '#92400E' }}>
            <strong>{pendingCount} pending leave request{pendingCount > 1 ? 's' : ''}</strong> awaiting approval.
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['ALL', 'PENDING', 'APPROVED', 'DECLINED'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
            style={
              filter === f
                ? { background: '#5D4AA8', color: '#fff', border: '1px solid #5D4AA8' }
                : { background: '#F9FAFB', color: '#6B7280', border: '1px solid #E5E7EB' }
            }
          >
            {f === 'ALL' ? `All (${(allLeave as any[]).length})` : f.charAt(0) + f.slice(1).toLowerCase()}
            {f === 'PENDING' && pendingCount > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Leave list */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-12 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading leave records…
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center rounded-2xl border" style={{ borderColor: '#EFE9F2' }}>
          <CalendarCheck className="h-10 w-10 mx-auto mb-3" style={{ color: '#D1C8E8' }} />
          <p className="text-sm font-medium" style={{ color: '#1E1830' }}>No leave records</p>
          <p className="text-xs mt-1" style={{ color: '#7A7090' }}>
            {filter === 'PENDING' ? 'No pending requests.' : 'No leave records match this filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((leave) => (
            <LeaveCard
              key={leave.id}
              leave={leave}
              onApprove={() => approve.mutate({ id: leave.id, action: 'approve' })}
              onDecline={() => approve.mutate({ id: leave.id, action: 'decline' })}
              isActing={approve.isPending}
            />
          ))}
        </div>
      )}

      {modalOpen && businessId && (
        <RequestLeaveModal
          businessId={businessId}
          therapists={therapists as any[]}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
