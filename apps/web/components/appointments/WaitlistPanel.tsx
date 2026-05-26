'use client';

import { useState } from 'react';
import { Button } from '@massage/ui';
import { Therapist, Client } from '@massage/types';
import { Clock, Send, Trash2, Plus, AlertCircle, Timer } from 'lucide-react';
import { useWaitlist, useAddToWaitlist, useRemoveFromWaitlist, useOfferWaitlistSlot, WaitlistEntry } from '@/lib/hooks/use-waitlist';

interface Props {
  businessId: string | undefined;
  clients: Client[];
  therapists: Therapist[];
}

const STATUS_BADGE: Record<WaitlistEntry['status'], { label: string; color: string }> = {
  WAITING:  { label: 'Waiting',  color: 'bg-amber-100 text-amber-700' },
  OFFERED:  { label: 'Offered',  color: 'bg-blue-100 text-blue-700' },
  BOOKED:   { label: 'Booked',   color: 'bg-green-100 text-green-700' },
  EXPIRED:  { label: 'Expired',  color: 'bg-gray-100 text-gray-500' },
};

function waitDuration(createdAt: string) {
  const ms = Date.now() - new Date(createdAt).getTime();
  const days = Math.floor(ms / 86400000);
  if (days > 0) return `${days}d`;
  const hours = Math.floor(ms / 3600000);
  if (hours > 0) return `${hours}h`;
  return '<1h';
}

export function WaitlistPanel({ businessId, clients, therapists }: Props) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'WAITING' | 'OFFERED'>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [offerExpiryHours, setOfferExpiryHours] = useState(24);

  const { data: entries = [], isLoading } = useWaitlist(businessId, {
    status: statusFilter === 'all' ? undefined : statusFilter,
  });
  const addMutation = useAddToWaitlist(businessId!);
  const removeMutation = useRemoveFromWaitlist(businessId!);
  const offerMutation = useOfferWaitlistSlot(businessId!);

  const waiting = entries.filter((e) => e.status === 'WAITING').length;
  const offered = entries.filter((e) => e.status === 'OFFERED').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Waitlist</h2>
          <p className="text-sm text-gray-500">{waiting} waiting · {offered} offer sent</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">Offer expires in</span>
            <select
              value={offerExpiryHours}
              onChange={(e) => setOfferExpiryHours(Number(e.target.value))}
              className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
            >
              {[6, 12, 24, 48, 72].map((h) => (
                <option key={h} value={h}>{h}h</option>
              ))}
            </select>
          </div>
          <Button variant="primary" size="sm" onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add to Waitlist
          </Button>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex bg-gray-100 rounded-lg p-1 gap-1 w-fit">
        {(['all', 'WAITING', 'OFFERED'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              statusFilter === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {s === 'all' ? 'All' : s === 'WAITING' ? 'Waiting' : 'Offer Sent'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading waitlist…</div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">No clients on the waitlist</p>
            <p className="text-xs text-gray-400 mt-1">Clients join when a slot they want isn't available</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Service</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Therapist Pref.</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Waiting</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {entries.map((entry) => {
                const badge = STATUS_BADGE[entry.status];
                const therapistName = entry.therapist
                  ? `${(entry.therapist as any).user?.firstName ?? ''} ${(entry.therapist as any).user?.lastName ?? ''}`.trim() || '—'
                  : '—';
                return (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {entry.client.firstName} {entry.client.lastName}
                      </div>
                      <div className="text-xs text-gray-400">{entry.client.email || entry.client.phoneNumber || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{entry.serviceType || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{therapistName}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-gray-500">
                        <Timer className="h-3.5 w-3.5" />
                        {waitDuration(entry.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                        {badge.label}
                      </span>
                      {entry.status === 'OFFERED' && entry.offerExpiresAt && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          Expires {new Date(entry.offerExpiresAt).toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {entry.status === 'WAITING' && (
                          <button
                            onClick={() => offerMutation.mutate({ id: entry.id, offerExpiryHours })}
                            disabled={offerMutation.isPending}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors disabled:opacity-50"
                          >
                            <Send className="h-3.5 w-3.5" />
                            Offer Slot
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(`Remove ${entry.client.firstName} ${entry.client.lastName} from waitlist?`)) {
                              removeMutation.mutate(entry.id);
                            }
                          }}
                          disabled={removeMutation.isPending}
                          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add to Waitlist Drawer */}
      {isAddOpen && (
        <AddWaitlistModal
          clients={clients}
          therapists={therapists}
          onClose={() => setIsAddOpen(false)}
          onAdd={(data) => addMutation.mutateAsync(data).then(() => setIsAddOpen(false))}
          isLoading={addMutation.isPending}
        />
      )}
    </div>
  );
}

// ── Add Modal ─────────────────────────────────────────────────────────────────

const SERVICE_TYPES = [
  'Swedish Massage', 'Deep Tissue Massage', 'Relaxation Massage', 'Sports Massage',
  'Hot Stone Massage', 'Remedial Massage', 'Pregnancy Massage', 'Aromatherapy Massage',
];

function AddWaitlistModal({
  clients,
  therapists,
  onClose,
  onAdd,
  isLoading,
}: {
  clients: Client[];
  therapists: Therapist[];
  onClose: () => void;
  onAdd: (data: any) => Promise<void>;
  isLoading: boolean;
}) {
  const [clientId, setClientId] = useState('');
  const [therapistId, setTherapistId] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) { setError('Please select a client'); return; }
    setError('');
    try {
      await onAdd({ clientId, therapistId: therapistId || undefined, serviceType: serviceType || undefined, notes: notes || undefined });
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to add to waitlist');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Add Client to Waitlist</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Client *</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Service Type</label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Any service</option>
              {SERVICE_TYPES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Therapist Preference</label>
            <select
              value={therapistId}
              onChange={(e) => setTherapistId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Any therapist</option>
              {therapists.map((t) => (
                <option key={t.id} value={t.id}>
                  {(t as any).user?.firstName} {(t as any).user?.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any specific requirements…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 rounded-lg px-3 py-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)' }}
            >
              {isLoading ? 'Adding…' : 'Add to Waitlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
