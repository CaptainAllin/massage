'use client';

import { useState } from 'react';
import {
  AlertTriangle, CheckCircle2, XCircle, Clock, RefreshCw, CheckCheck,
  Mail, MessageSquare, Smartphone, Filter,
} from 'lucide-react';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useMessageLogs, useRetryMessage, useResolveMessage } from '@/lib/hooks/use-message-logs';

// ── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; Icon: any }> = {
  DELIVERED: { label: 'Delivered', bg: '#E8F5E9', color: '#2E7D32', Icon: CheckCircle2 },
  SENT: { label: 'Sent', bg: '#E3F2FD', color: '#1565C0', Icon: CheckCheck },
  QUEUED: { label: 'Queued', bg: '#FFF3E0', color: '#E65100', Icon: Clock },
  FAILED: { label: 'Failed', bg: '#FFEBEE', color: '#C62828', Icon: XCircle },
  UNDELIVERED: { label: 'Undelivered', bg: '#FCE4EC', color: '#880E4F', Icon: XCircle },
};

const CHANNEL_CONFIG: Record<string, { label: string; Icon: any }> = {
  EMAIL: { label: 'Email', Icon: Mail },
  SMS: { label: 'SMS', Icon: MessageSquare },
  WHATSAPP: { label: 'WhatsApp', Icon: Smartphone },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, bg: '#F3F4F6', color: '#6B7280', Icon: Clock };
  const { Icon } = cfg;
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full text-[11px] font-medium"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function ChannelIcon({ channel }: { channel: string }) {
  const cfg = CHANNEL_CONFIG[channel] ?? { label: channel, Icon: Mail };
  const { Icon } = cfg;
  return (
    <span className="inline-flex items-center gap-1 text-[12px] text-iris-ink2">
      <Icon className="w-3.5 h-3.5 text-iris-muted" />
      {cfg.label}
    </span>
  );
}

// ── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  subtext,
  accent,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  accent?: string;
}) {
  return (
    <div className="bg-white border border-iris-line2 rounded-[16px] px-5 py-4 flex flex-col gap-1">
      <p className="text-[12px] text-iris-muted font-medium">{label}</p>
      <p className="text-[22px] font-semibold text-iris-ink" style={accent ? { color: accent } : {}}>
        {value}
      </p>
      {subtext && <p className="text-[11.5px] text-iris-muted">{subtext}</p>}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

const MESSAGE_TYPE_LABELS: Record<string, string> = {
  APPOINTMENT_REMINDER: 'Appointment Reminder',
  BOOKING_CONFIRMATION: 'Booking Confirmation',
  INVOICE: 'Invoice',
  PAYMENT_CONFIRMATION: 'Payment Confirmation',
  PAYMENT_OVERDUE: 'Payment Overdue',
  WAITLIST_OFFER: 'Waitlist Offer',
};

export default function DeliveryReportsPage() {
  const businessId = useBusinessId();

  const [channel, setChannel] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useMessageLogs(businessId, {
    channel: channel || undefined,
    status: status || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    limit: 50,
  });

  const retryMutation = useRetryMessage();
  const resolveMutation = useResolveMessage();

  const logs: any[] = data?.data ?? [];
  const stats = data?.stats ?? {};
  const meta = data?.meta ?? {};

  return (
    <div className="px-7 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-semibold text-iris-ink">Delivery Reports</h1>
          <p className="text-[13px] text-iris-muted mt-0.5">
            Track SMS and email delivery status across all communications
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium border border-iris-line2 bg-white text-iris-ink hover:bg-iris-bg transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* High-failure alert */}
      {stats.highFailureAlert && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-[14px] px-5 py-3.5">
          <AlertTriangle className="w-4.5 h-4.5 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-[13.5px] font-semibold text-red-800">High delivery failure rate detected</p>
            <p className="text-[12.5px] text-red-600 mt-0.5">
              {stats.failedPct}% of messages have failed — review failed messages below or check your Twilio/Resend configuration.
            </p>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Sent" value={stats.totalSent ?? 0} />
        <StatCard
          label="Delivered"
          value={`${stats.deliveredPct ?? 0}%`}
          subtext={`${stats.delivered ?? 0} messages`}
          accent={stats.deliveredPct >= 90 ? '#2E7D32' : undefined}
        />
        <StatCard
          label="Failed"
          value={`${stats.failedPct ?? 0}%`}
          subtext={`${stats.failed ?? 0} messages`}
          accent={stats.failedPct > 5 ? '#C62828' : undefined}
        />
        <StatCard label="Pending" value={stats.pending ?? 0} subtext="in queue" />
      </div>

      {/* Filters */}
      <div className="bg-white border border-iris-line2 rounded-[16px] px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-3.5 h-3.5 text-iris-muted" />
          <span className="text-[13px] font-medium text-iris-ink">Filters</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={channel}
            onChange={(e) => { setChannel(e.target.value); setPage(1); }}
            className="px-3 py-1.5 rounded-xl border border-iris-line2 text-[13px] text-iris-ink bg-white focus:outline-none focus:ring-2 focus:ring-iris-primary/30"
          >
            <option value="">All channels</option>
            <option value="SMS">SMS</option>
            <option value="EMAIL">Email</option>
            <option value="WHATSAPP">WhatsApp</option>
          </select>

          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-1.5 rounded-xl border border-iris-line2 text-[13px] text-iris-ink bg-white focus:outline-none focus:ring-2 focus:ring-iris-primary/30"
          >
            <option value="">All statuses</option>
            <option value="DELIVERED">Delivered</option>
            <option value="SENT">Sent</option>
            <option value="QUEUED">Queued</option>
            <option value="FAILED">Failed</option>
            <option value="UNDELIVERED">Undelivered</option>
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="px-3 py-1.5 rounded-xl border border-iris-line2 text-[13px] text-iris-ink bg-white focus:outline-none focus:ring-2 focus:ring-iris-primary/30"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="px-3 py-1.5 rounded-xl border border-iris-line2 text-[13px] text-iris-ink bg-white focus:outline-none focus:ring-2 focus:ring-iris-primary/30"
          />

          {(channel || status || startDate || endDate) && (
            <button
              onClick={() => { setChannel(''); setStatus(''); setStartDate(''); setEndDate(''); setPage(1); }}
              className="px-3 py-1.5 rounded-xl text-[13px] text-iris-muted hover:text-iris-ink transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-iris-line2 rounded-[16px] overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center">
            <p className="text-[13px] text-iris-muted">Loading...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-[13px] text-iris-muted">No messages found for the selected filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-iris-line2">
                    <th className="text-left px-5 py-3 text-[12px] font-semibold text-iris-muted">Client</th>
                    <th className="text-left px-5 py-3 text-[12px] font-semibold text-iris-muted">Channel</th>
                    <th className="text-left px-5 py-3 text-[12px] font-semibold text-iris-muted">Type</th>
                    <th className="text-left px-5 py-3 text-[12px] font-semibold text-iris-muted">Recipient</th>
                    <th className="text-left px-5 py-3 text-[12px] font-semibold text-iris-muted">Status</th>
                    <th className="text-left px-5 py-3 text-[12px] font-semibold text-iris-muted">Sent</th>
                    <th className="text-left px-5 py-3 text-[12px] font-semibold text-iris-muted">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-iris-line2">
                  {logs.map((log: any) => {
                    const isFailed = log.status === 'FAILED' || log.status === 'UNDELIVERED';
                    const clientName = log.client
                      ? `${log.client.firstName} ${log.client.lastName}`
                      : '—';
                    const sentAt = log.sentAt
                      ? new Date(log.sentAt).toLocaleString('en-AU', {
                          month: 'short', day: 'numeric',
                          hour: 'numeric', minute: '2-digit', hour12: true,
                        })
                      : new Date(log.createdAt).toLocaleString('en-AU', {
                          month: 'short', day: 'numeric',
                          hour: 'numeric', minute: '2-digit', hour12: true,
                        });

                    return (
                      <tr key={log.id} className="hover:bg-iris-bg/40 transition-colors">
                        <td className="px-5 py-3 text-iris-ink font-medium">{clientName}</td>
                        <td className="px-5 py-3">
                          <ChannelIcon channel={log.channel} />
                        </td>
                        <td className="px-5 py-3 text-iris-ink2">
                          {MESSAGE_TYPE_LABELS[log.messageType] ?? log.messageType}
                        </td>
                        <td className="px-5 py-3 text-iris-ink2 font-mono text-[11.5px]">
                          {log.recipient}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={log.status} />
                          {log.errorCode && (
                            <p className="text-[10.5px] text-red-500 mt-0.5">{log.errorCode}</p>
                          )}
                        </td>
                        <td className="px-5 py-3 text-iris-muted text-[12px]">{sentAt}</td>
                        <td className="px-5 py-3">
                          {isFailed && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => retryMutation.mutate(log.id)}
                                disabled={retryMutation.isPending || log.retryCount >= 3}
                                className="px-2.5 py-1 rounded-lg text-[11.5px] font-medium border border-iris-line2 text-iris-ink hover:bg-iris-bg disabled:opacity-50 transition-colors"
                              >
                                Retry
                              </button>
                              <button
                                onClick={() => resolveMutation.mutate(log.id)}
                                disabled={resolveMutation.isPending}
                                className="px-2.5 py-1 rounded-lg text-[11.5px] font-medium border border-iris-line2 text-iris-ink hover:bg-iris-bg disabled:opacity-50 transition-colors"
                              >
                                Resolve
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-iris-line2">
                <p className="text-[12px] text-iris-muted">
                  {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 rounded-lg text-[12px] border border-iris-line2 text-iris-ink disabled:opacity-40 hover:bg-iris-bg transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                    disabled={page === meta.totalPages}
                    className="px-3 py-1 rounded-lg text-[12px] border border-iris-line2 text-iris-ink disabled:opacity-40 hover:bg-iris-bg transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
