'use client';

import { useState } from 'react';
import { Card, CardContent, Badge, Modal } from '@massage/ui';
import {
  Megaphone, Plus, Send, Eye, Trash2, Edit2, BarChart2, Clock,
  CheckCircle, Loader2, Mail, MessageSquare, Phone, RefreshCw,
} from 'lucide-react';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import {
  usePromotions,
  useCreatePromotion,
  useUpdatePromotion,
  useDeletePromotion,
  useSendPromotion,
  usePromotionAnalytics,
  type Promotion,
  type CreatePromotionDto,
  type RecipientFilter,
} from '@/lib/hooks/use-promotions';
import { PermissionGuard } from '@/components/PermissionGuard';

// ── helpers ──────────────────────────────────────────────────────────────────

const CHANNEL_ICON: Record<string, React.ReactNode> = {
  EMAIL: <Mail className="h-4 w-4" />,
  SMS: <MessageSquare className="h-4 w-4" />,
  WHATSAPP: <Phone className="h-4 w-4" />,
};

const STATUS_BADGE: Record<string, React.ReactNode> = {
  DRAFT: <Badge variant="default">Draft</Badge>,
  SCHEDULED: <Badge variant="warning">Scheduled</Badge>,
  SENDING: <Badge variant="warning">Sending…</Badge>,
  SENT: <Badge variant="success">Sent</Badge>,
  CANCELLED: <Badge variant="danger">Cancelled</Badge>,
};

const VARIABLES = ['{{clientName}}', '{{businessName}}', '{{offerText}}', '{{expiryDate}}'];

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDatetime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Analytics panel ──────────────────────────────────────────────────────────

function AnalyticsPanel({ promotion, businessId }: { promotion: Promotion; businessId: string }) {
  const { data, isLoading } = usePromotionAnalytics(promotion.id, businessId);

  if (isLoading) return <div className="animate-pulse h-32 bg-gray-100 rounded-lg" />;
  if (!data) return null;

  const metrics = [
    { label: 'Sent', value: data.totalSent, color: 'text-blue-600' },
    { label: 'Opened', value: data.totalOpened, sub: `${data.openRate.toFixed(1)}%`, color: 'text-green-600' },
    { label: 'Clicked', value: data.totalClicked, sub: `${data.clickRate.toFixed(1)}%`, color: 'text-purple-600' },
    { label: 'Converted', value: data.totalConverted, sub: `${data.conversionRate.toFixed(1)}%`, color: 'text-orange-600' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
      {metrics.map(({ label, value, sub, color }) => (
        <div key={label} className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          <p className={`text-xl font-bold ${color}`}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
      ))}
    </div>
  );
}

// ── Create / Edit modal ───────────────────────────────────────────────────────

interface FormState {
  name: string;
  description: string;
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP';
  subject: string;
  bodyText: string;
  filterType: 'all' | 'inactive' | 'custom';
  daysInactive: string;
  scheduledFor: string;
}

const BLANK: FormState = {
  name: '', description: '', channel: 'EMAIL', subject: '', bodyText: '',
  filterType: 'all', daysInactive: '30', scheduledFor: '',
};

function toFormState(p: Promotion): FormState {
  const f = p.recipientFilter as RecipientFilter;
  return {
    name: p.name,
    description: p.description ?? '',
    channel: p.channel,
    subject: p.subject ?? '',
    bodyText: p.body,
    filterType: f.type,
    daysInactive: String(f.daysInactive ?? 30),
    scheduledFor: p.scheduledFor ? new Date(p.scheduledFor).toISOString().slice(0, 16) : '',
  };
}

interface PromotionModalProps {
  businessId: string;
  editing: Promotion | null;
  onClose: () => void;
}

function PromotionModal({ businessId, editing, onClose }: PromotionModalProps) {
  const [form, setForm] = useState<FormState>(editing ? toFormState(editing) : BLANK);
  const create = useCreatePromotion();
  const update = useUpdatePromotion(editing?.id ?? '', businessId);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const insertVariable = (v: string) => setForm((f) => ({ ...f, bodyText: f.bodyText + v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const recipientFilter: RecipientFilter = {
      type: form.filterType,
      ...(form.filterType === 'inactive' && { daysInactive: parseInt(form.daysInactive) }),
    };
    const dto: CreatePromotionDto = {
      businessId,
      name: form.name,
      description: form.description || undefined,
      channel: form.channel,
      subject: form.channel === 'EMAIL' ? form.subject : undefined,
      bodyText: form.bodyText,
      recipientFilter,
      scheduledFor: form.scheduledFor || undefined,
    };
    if (editing) {
      await update.mutateAsync({ ...dto, bodyText: dto.bodyText });
    } else {
      await create.mutateAsync(dto);
    }
    onClose();
  };

  const isPending = create.isPending || update.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Promotion Name *</label>
          <input
            required
            value={form.name}
            onChange={set('name')}
            placeholder="e.g. Summer Special — 20% Off"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input
            value={form.description}
            onChange={set('description')}
            placeholder="Internal notes about this promotion"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Channel *</label>
          <select
            value={form.channel}
            onChange={set('channel')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="EMAIL">Email</option>
            <option value="SMS">SMS</option>
            <option value="WHATSAPP">WhatsApp</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Schedule (optional)</label>
          <input
            type="datetime-local"
            value={form.scheduledFor}
            onChange={set('scheduledFor')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {form.channel === 'EMAIL' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line</label>
          <input
            value={form.subject}
            onChange={set('subject')}
            placeholder="e.g. {{clientName}}, you've got a special offer!"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">Message Body *</label>
          <div className="flex gap-1 flex-wrap">
            {VARIABLES.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => insertVariable(v)}
                className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-mono"
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <textarea
          required
          rows={6}
          value={form.bodyText}
          onChange={set('bodyText')}
          placeholder="Hi {{clientName}}, we have a special offer just for you…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-400 mt-1">Click variable tags above to insert them at cursor position.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Recipients</label>
        <select
          value={form.filterType}
          onChange={set('filterType')}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All active clients</option>
          <option value="inactive">Inactive clients</option>
        </select>
        {form.filterType === 'inactive' && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-gray-600">Clients with no visit in the last</span>
            <input
              type="number"
              min="1"
              value={form.daysInactive}
              onChange={set('daysInactive')}
              className="w-20 rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">days</span>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {editing ? 'Save Changes' : 'Create Promotion'}
        </button>
      </div>
    </form>
  );
}

// ── Send / Preview modal ──────────────────────────────────────────────────────

function SendModal({ promotion, businessId, onClose }: { promotion: Promotion; businessId: string; onClose: () => void }) {
  const [previewEmail, setPreviewEmail] = useState('');
  const [previewResult, setPreviewResult] = useState<{ renderedSubject?: string; renderedBody: string } | null>(null);
  const send = useSendPromotion(promotion.id, businessId);

  const handlePreview = async () => {
    if (!previewEmail) return;
    const result = await send.mutateAsync({ preview: true, previewEmail });
    setPreviewResult(result);
  };

  const handleSend = async () => {
    await send.mutateAsync({});
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">Ready to send: {promotion.name}</p>
        <p>Channel: {promotion.channel} · Recipients: {promotion.recipientFilter ? (promotion.recipientFilter as RecipientFilter).type === 'all' ? 'All active clients' : (promotion.recipientFilter as RecipientFilter).type === 'inactive' ? `Inactive ${(promotion.recipientFilter as RecipientFilter).daysInactive}+ days` : 'Custom list' : '—'}</p>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Send a test preview first (recommended)</p>
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="your@email.com"
            value={previewEmail}
            onChange={(e) => setPreviewEmail(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handlePreview}
            disabled={send.isPending || !previewEmail}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50"
          >
            {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
            Preview
          </button>
        </div>
      </div>

      {previewResult && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2">
          {previewResult.renderedSubject && (
            <p className="text-sm"><span className="font-medium">Subject:</span> {previewResult.renderedSubject}</p>
          )}
          <div className="text-sm whitespace-pre-wrap text-gray-700 bg-white border border-gray-200 rounded p-3 max-h-40 overflow-y-auto">
            {previewResult.renderedBody}
          </div>
          <p className="text-xs text-green-600 flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5" /> Preview sent to {previewEmail}
          </p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
        <button
          onClick={handleSend}
          disabled={send.isPending}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send Now
        </button>
      </div>
    </div>
  );
}

// ── Promotion card ────────────────────────────────────────────────────────────

interface PromotionCardProps {
  promotion: Promotion;
  businessId: string;
  onEdit: (p: Promotion) => void;
  onSend: (p: Promotion) => void;
}

function PromotionCard({ promotion: p, businessId, onEdit, onSend }: PromotionCardProps) {
  const [showAnalytics, setShowAnalytics] = useState(false);
  const del = useDeletePromotion(businessId);
  const filter = p.recipientFilter as RecipientFilter;

  const recipientLabel =
    filter.type === 'all' ? 'All active clients' :
    filter.type === 'inactive' ? `Inactive ${filter.daysInactive ?? 30}+ days` :
    'Custom list';

  const canEdit = p.status === 'DRAFT' || p.status === 'SCHEDULED';
  const canSend = p.status === 'DRAFT' || p.status === 'SCHEDULED';
  const canDelete = p.status !== 'SENDING';

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-gray-500">{CHANNEL_ICON[p.channel]}</span>
              <h3 className="font-semibold text-gray-900 truncate">{p.name}</h3>
              {STATUS_BADGE[p.status]}
            </div>
            {p.description && <p className="text-sm text-gray-500 mb-2">{p.description}</p>}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
              <span>Recipients: {recipientLabel}</span>
              {p.scheduledFor && p.status === 'SCHEDULED' && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Scheduled {fmtDatetime(p.scheduledFor)}
                </span>
              )}
              {p.sentAt && (
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" /> Sent {fmtDate(p.sentAt)} · {p.totalSent} delivered
                </span>
              )}
              <span>Created {fmtDate(p.createdAt)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {p.status === 'SENT' && (
              <button
                onClick={() => setShowAnalytics((v) => !v)}
                title="Analytics"
                className="p-1.5 rounded text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
              >
                <BarChart2 className="h-4 w-4" />
              </button>
            )}
            {canEdit && (
              <button
                onClick={() => onEdit(p)}
                title="Edit"
                className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            )}
            {canSend && (
              <button
                onClick={() => onSend(p)}
                title="Send"
                className="p-1.5 rounded text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => del.mutate(p.id)}
                title="Delete"
                disabled={del.isPending}
                className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {showAnalytics && <AnalyticsPanel promotion={p} businessId={businessId} />}
      </CardContent>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type ModalMode = 'create' | 'edit' | 'send' | null;

function PromotionsPageInner() {
  const businessId = useBusinessId();
  const [statusFilter, setStatusFilter] = useState('');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Promotion | null>(null);

  const { data: promotions = [], isLoading, error, refetch } = usePromotions(
    businessId,
    statusFilter ? { status: statusFilter } : undefined
  );

  const openCreate = () => { setSelected(null); setModalMode('create'); };
  const openEdit = (p: Promotion) => { setSelected(p); setModalMode('edit'); };
  const openSend = (p: Promotion) => { setSelected(p); setModalMode('send'); };
  const closeModal = () => { setModalMode(null); setSelected(null); };

  const statuses = ['', 'DRAFT', 'SCHEDULED', 'SENT', 'CANCELLED'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-display">Promotions</h1>
          <p className="text-muted-foreground mt-1">Create and send promotional campaigns to your clients</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            New Promotion
          </button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              statusFilter === s
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {s === '' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 text-sm">
          Failed to load promotions. Please try again.
        </div>
      )}

      {/* Variable reference card */}
      <Card className="bg-blue-50 border-blue-100">
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-blue-800">Available template variables:</span>
            {VARIABLES.map((v) => (
              <code key={v} className="text-xs bg-white border border-blue-200 text-blue-700 rounded px-2 py-0.5 font-mono">{v}</code>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg bg-gray-100 h-24" />
          ))}
        </div>
      ) : promotions.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Megaphone className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-700">No promotions yet</p>
          <p className="text-sm mt-1">Create your first campaign to reach clients via email, SMS, or WhatsApp.</p>
          <button
            onClick={openCreate}
            className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Create Promotion
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {promotions.map((p) => (
            <PromotionCard
              key={p.id}
              promotion={p}
              businessId={businessId ?? ''}
              onEdit={openEdit}
              onSend={openSend}
            />
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal
        isOpen={modalMode === 'create' || modalMode === 'edit'}
        onClose={closeModal}
        title={modalMode === 'edit' ? 'Edit Promotion' : 'New Promotion'}
        size="lg"
      >
        {businessId && (
          <PromotionModal
            businessId={businessId}
            editing={modalMode === 'edit' ? selected : null}
            onClose={closeModal}
          />
        )}
      </Modal>

      {/* Send modal */}
      <Modal
        isOpen={modalMode === 'send'}
        onClose={closeModal}
        title="Send Promotion"
        size="md"
      >
        {selected && businessId && (
          <SendModal promotion={selected} businessId={businessId} onClose={closeModal} />
        )}
      </Modal>
    </div>
  );
}

export default function PromotionsPage() {
  return (
    <PermissionGuard permission="promotions:view">
      <PromotionsPageInner />
    </PermissionGuard>
  );
}
