'use client';

import React, { useState } from 'react';
import { Button, Card, CardContent } from '@massage/ui';
import {
  Zap,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
  MessageSquare,
  Tag,
  ClipboardList,
} from 'lucide-react';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import {
  useAutomationRules,
  useCreateAutomationRule,
  useUpdateAutomationRule,
  useToggleAutomationRule,
  useDeleteAutomationRule,
} from '@/lib/hooks/use-automation';

const TRIGGERS = [
  { value: 'APPOINTMENT_BOOKED', label: 'Appointment Booked' },
  { value: 'APPOINTMENT_COMPLETED', label: 'Appointment Completed' },
  { value: 'APPOINTMENT_CANCELLED', label: 'Appointment Cancelled' },
  { value: 'PAYMENT_RECEIVED', label: 'Payment Received' },
  { value: 'PAYMENT_FAILED', label: 'Payment Failed' },
  { value: 'CLIENT_INACTIVE', label: 'Client Inactive (30+ days)' },
  { value: 'CLIENT_CREATED', label: 'New Client Created' },
  { value: 'MEMBERSHIP_RENEWED', label: 'Membership Renewed' },
  { value: 'INTAKE_FORM_SUBMITTED', label: 'Intake Form Submitted' },
];

const ACTION_TYPES = [
  { value: 'SEND_EMAIL', label: 'Send Email', icon: Mail },
  { value: 'SEND_SMS', label: 'Send SMS', icon: MessageSquare },
  { value: 'ADD_TAG', label: 'Add Tag to Client', icon: Tag },
  { value: 'CREATE_TASK', label: 'Create Task Note', icon: ClipboardList },
];

const PRESET_TEMPLATES = [
  {
    name: 'Re-engagement: Inactive Clients',
    description: 'Send a promotional email to clients who haven\'t visited in 30+ days',
    trigger: 'CLIENT_INACTIVE',
    conditions: {},
    actions: [
      {
        type: 'SEND_EMAIL',
        params: {
          to: '{{client.email}}',
          subject: 'We miss you at {{business.name}}!',
          body: 'Hi {{client.firstName}}, it\'s been a while! Book your next session and enjoy 10% off with code WELCOMEBACK.',
        },
      },
    ],
  },
  {
    name: 'Post-Appointment Follow-up',
    description: 'Send a thank-you message after each completed appointment',
    trigger: 'APPOINTMENT_COMPLETED',
    conditions: {},
    actions: [
      {
        type: 'SEND_SMS',
        params: {
          to: '{{client.phone}}',
          message: 'Thanks for visiting {{business.name}}! We hope your session was great. Book your next appointment at {{business.bookingUrl}}',
        },
      },
    ],
  },
  {
    name: 'Payment Failed Alert',
    description: 'Notify client when a payment fails',
    trigger: 'PAYMENT_FAILED',
    conditions: {},
    actions: [
      {
        type: 'SEND_EMAIL',
        params: {
          to: '{{client.email}}',
          subject: 'Payment Issue — Action Required',
          body: 'Hi {{client.firstName}}, we were unable to process your payment of {{payment.amount}}. Please update your payment method.',
        },
      },
    ],
  },
  {
    name: 'New Client Welcome',
    description: 'Welcome new clients with a friendly email',
    trigger: 'CLIENT_CREATED',
    conditions: {},
    actions: [
      {
        type: 'SEND_EMAIL',
        params: {
          to: '{{client.email}}',
          subject: 'Welcome to {{business.name}}!',
          body: 'Hi {{client.firstName}}, welcome! We\'re excited to have you. Your first appointment is just a few clicks away.',
        },
      },
    ],
  },
];

type ActionForm = { type: string; params: Record<string, string> };

function AutomationRuleModal({
  businessId,
  rule,
  onClose,
  onSaved,
}: {
  businessId: string;
  rule?: any;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [form, setForm] = useState({
    name: rule?.name ?? '',
    description: rule?.description ?? '',
    trigger: rule?.trigger ?? '',
    conditions: rule?.conditions ?? {},
    actions: (rule?.actions as ActionForm[]) ?? [{ type: 'SEND_EMAIL', params: { to: '', subject: '', body: '' } }],
  });

  const create = useCreateAutomationRule(businessId);
  const update = useUpdateAutomationRule(businessId);

  const addAction = () => {
    setForm((f) => ({ ...f, actions: [...f.actions, { type: 'SEND_EMAIL', params: { to: '', subject: '', body: '' } }] }));
  };

  const removeAction = (idx: number) => {
    setForm((f) => ({ ...f, actions: f.actions.filter((_, i) => i !== idx) }));
  };

  const updateAction = (idx: number, field: 'type' | string, value: string) => {
    setForm((f) => {
      const actions = [...f.actions];
      if (field === 'type') {
        const defaults: Record<string, Record<string, string>> = {
          SEND_EMAIL: { to: '', subject: '', body: '' },
          SEND_SMS: { to: '', message: '' },
          ADD_TAG: { tag: '' },
          CREATE_TASK: { title: '', description: '' },
        };
        actions[idx] = { type: value, params: defaults[value] ?? {} };
      } else {
        actions[idx] = { ...actions[idx], params: { ...actions[idx].params, [field]: value } };
      }
      return { ...f, actions };
    });
  };

  const handlePreset = (preset: (typeof PRESET_TEMPLATES)[0]) => {
    setForm((f) => ({ ...f, name: preset.name, description: preset.description, trigger: preset.trigger, conditions: preset.conditions, actions: preset.actions as ActionForm[] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rule) {
      await update.mutateAsync({ id: rule.id, ...form });
    } else {
      await create.mutateAsync(form);
    }
    onSaved?.();
    onClose();
  };

  const isPending = create.isPending || update.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-4">
      <Card className="w-full max-w-2xl mx-4 my-auto">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">{rule ? 'Edit Automation' : 'New Automation Rule'}</h2>

          {!rule && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">Start from a template:</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_TEMPLATES.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handlePreset(preset)}
                    className="text-xs px-2 py-1 rounded-lg border border-border hover:bg-muted"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Rule Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="e.g. Re-engagement campaign"
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional description"
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Trigger (When) *</label>
              <select
                value={form.trigger}
                onChange={(e) => setForm({ ...form, trigger: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select a trigger...</option>
                {TRIGGERS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Actions (Then) *</label>
                <button type="button" onClick={addAction} className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Add Action
                </button>
              </div>
              <div className="space-y-3">
                {form.actions.map((action, idx) => (
                  <div key={idx} className="border border-border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <select
                        value={action.type}
                        onChange={(e) => updateAction(idx, 'type', e.target.value)}
                        className="text-sm px-2 py-1 rounded border border-border bg-background focus:outline-none"
                      >
                        {ACTION_TYPES.map((a) => (
                          <option key={a.value} value={a.value}>{a.label}</option>
                        ))}
                      </select>
                      {form.actions.length > 1 && (
                        <button type="button" onClick={() => removeAction(idx)} className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {(action.type === 'SEND_EMAIL' || action.type === 'SEND_SMS') && (
                      <>
                        <input
                          placeholder="To: {{client.email}} or {{client.phone}}"
                          value={action.params.to ?? ''}
                          onChange={(e) => updateAction(idx, 'to', e.target.value)}
                          className="w-full text-xs px-2 py-1.5 rounded border border-border focus:outline-none"
                        />
                        {action.type === 'SEND_EMAIL' && (
                          <input
                            placeholder="Subject"
                            value={action.params.subject ?? ''}
                            onChange={(e) => updateAction(idx, 'subject', e.target.value)}
                            className="w-full text-xs px-2 py-1.5 rounded border border-border focus:outline-none"
                          />
                        )}
                        <textarea
                          placeholder={action.type === 'SEND_SMS' ? 'Message body...' : 'Email body...'}
                          value={(action.type === 'SEND_SMS' ? action.params.message : action.params.body) ?? ''}
                          onChange={(e) => updateAction(idx, action.type === 'SEND_SMS' ? 'message' : 'body', e.target.value)}
                          rows={3}
                          className="w-full text-xs px-2 py-1.5 rounded border border-border focus:outline-none resize-none"
                        />
                      </>
                    )}
                    {action.type === 'ADD_TAG' && (
                      <input
                        placeholder="Tag name (e.g. vip, follow-up)"
                        value={action.params.tag ?? ''}
                        onChange={(e) => updateAction(idx, 'tag', e.target.value)}
                        className="w-full text-xs px-2 py-1.5 rounded border border-border focus:outline-none"
                      />
                    )}
                    {action.type === 'CREATE_TASK' && (
                      <>
                        <input
                          placeholder="Task title"
                          value={action.params.title ?? ''}
                          onChange={(e) => updateAction(idx, 'title', e.target.value)}
                          className="w-full text-xs px-2 py-1.5 rounded border border-border focus:outline-none"
                        />
                        <input
                          placeholder="Task description (optional)"
                          value={action.params.description ?? ''}
                          onChange={(e) => updateAction(idx, 'description', e.target.value)}
                          className="w-full text-xs px-2 py-1.5 rounded border border-border focus:outline-none"
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
              Use template variables like <code className="font-mono">{'{{client.firstName}}'}</code>, <code className="font-mono">{'{{business.name}}'}</code>, <code className="font-mono">{'{{appointment.date}}'}</code> in message fields.
            </p>

            <div className="flex gap-2">
              <Button type="submit" disabled={isPending} className="flex-1 [background:linear-gradient(135deg,#5D4AA8,#3F2F87)] hover:opacity-90 text-white">
                {isPending ? 'Saving...' : rule ? 'Save Changes' : 'Create Rule'}
              </Button>
              <Button type="button" onClick={onClose} variant="outline">Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function RuleCard({ rule, businessId }: { rule: any; businessId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const toggle = useToggleAutomationRule(businessId);
  const deleteRule = useDeleteAutomationRule(businessId);

  const triggerLabel = TRIGGERS.find((t) => t.value === rule.trigger)?.label ?? rule.trigger;
  const lastRunLabel = rule.lastRunAt
    ? new Date(rule.lastRunAt).toLocaleDateString()
    : 'Never';

  const handleDelete = async () => {
    if (!confirm(`Delete automation rule "${rule.name}"?`)) return;
    await deleteRule.mutateAsync(rule.id);
  };

  return (
    <>
      {editing && (
        <AutomationRuleModal businessId={businessId} rule={rule} onClose={() => setEditing(false)} />
      )}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground hover:text-foreground mt-0.5 flex-shrink-0">
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium truncate">{rule.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${rule.isActive ? 'bg-[#EDE5F4] text-[#5D4AA8]' : 'bg-[#EFE9F2] text-[#7A7090]'}`}>
                    {rule.isActive ? 'Active' : 'Paused'}
                  </span>
                </div>
                {rule.description && <p className="text-sm text-muted-foreground truncate">{rule.description}</p>}
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                  <span>Trigger: <strong>{triggerLabel}</strong></span>
                  <span>Ran {rule.runCount} times</span>
                  <span>Last run: {lastRunLabel}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => toggle.mutate(rule.id)}
                disabled={toggle.isPending}
                title={rule.isActive ? 'Pause rule' : 'Activate rule'}
                className="text-muted-foreground hover:text-primary"
              >
                {rule.isActive ? <ToggleRight className="w-5 h-5 text-[#5D4AA8]" /> : <ToggleLeft className="w-5 h-5 text-[#7A7090]" />}
              </button>
              <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-primary">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={handleDelete} className="text-muted-foreground hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {expanded && (
            <div className="mt-4 border-t border-border pt-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">ACTIONS</p>
                <div className="space-y-1.5">
                  {(rule.actions as ActionForm[]).map((action, idx) => {
                    const ActionIcon = ACTION_TYPES.find((a) => a.value === action.type)?.icon ?? Zap;
                    return (
                      <div key={idx} className="flex items-start gap-2 text-sm bg-muted/50 rounded px-2 py-1.5">
                        <ActionIcon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-primary" />
                        <div className="min-w-0">
                          <span className="font-medium">{ACTION_TYPES.find((a) => a.value === action.type)?.label ?? action.type}</span>
                          {action.params?.subject && <p className="text-xs text-muted-foreground truncate">"{action.params.subject}"</p>}
                          {action.params?.message && <p className="text-xs text-muted-foreground truncate">"{action.params.message}"</p>}
                          {action.params?.tag && <p className="text-xs text-muted-foreground">Tag: {action.params.tag}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {rule.logs?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">RECENT RUNS</p>
                  <div className="space-y-1">
                    {rule.logs.slice(0, 5).map((log: any) => (
                      <div key={log.id} className="flex items-center gap-2 text-xs">
                        {log.status === 'SUCCESS' ? (
                          <CheckCircle className="w-3.5 h-3.5 text-[#5D4AA8] flex-shrink-0" />
                        ) : log.status === 'FAILED' ? (
                          <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        )}
                        <span className="text-muted-foreground">{new Date(log.executedAt).toLocaleString()}</span>
                        <span className={log.status === 'SUCCESS' ? 'text-[#5D4AA8]' : log.status === 'FAILED' ? 'text-red-600' : 'text-[#7A7090]'}>
                          {log.status}
                        </span>
                        {log.errorMessage && <span className="text-red-400 truncate">{log.errorMessage}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

export default function AutomationPage() {
  const businessId = useBusinessId();
  const { data, isLoading } = useAutomationRules(businessId);
  const [showModal, setShowModal] = useState(false);

  const rules = data?.rules ?? [];
  const activeCount = rules.filter((r: any) => r.isActive).length;
  const totalRuns = rules.reduce((s: number, r: any) => s + r.runCount, 0);

  return (
    <div className="space-y-6">
      {showModal && businessId && (
        <AutomationRuleModal businessId={businessId} onClose={() => setShowModal(false)} />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Automation</h1>
          <p className="text-muted-foreground text-sm mt-1">If–then rules that run automatically</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="[background:linear-gradient(135deg,#5D4AA8,#3F2F87)] hover:opacity-90 text-white">
          <Plus className="w-4 h-4 mr-2" />
          New Rule
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Active Rules', value: String(activeCount), icon: Zap, color: 'text-[#5D4AA8] bg-[#EDE5F4]' },
          { label: 'Total Rules', value: String(rules.length), icon: ClipboardList, color: 'text-[#7665C2] bg-[#EDE5F4]' },
          { label: 'Total Executions', value: String(totalRuns), icon: CheckCircle, color: 'text-[#5D4AA8] bg-[#EDE5F4]' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`rounded-xl p-2.5 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading automation rules...</p>}
        {!isLoading && rules.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No automation rules yet</p>
            <p className="text-sm mt-1">Create your first rule or start from a template</p>
            <Button onClick={() => setShowModal(true)} className="mt-4 [background:linear-gradient(135deg,#5D4AA8,#3F2F87)] hover:opacity-90 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create First Rule
            </Button>
          </div>
        )}
        {rules.map((rule: any) => (
          <RuleCard key={rule.id} rule={rule} businessId={businessId!} />
        ))}
      </div>

      {/* How it works */}
      {rules.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold mb-2 text-sm">How Automations Work</h2>
            <p className="text-xs text-muted-foreground">
              Rules are evaluated when their trigger event fires (e.g., an appointment is completed). You can also manually fire triggers via{' '}
              <code className="font-mono bg-muted px-1 rounded">POST /api/automation/trigger</code> from a webhook or external system like Zapier.
              Template variables (<code className="font-mono bg-muted px-1 rounded">{'{{client.email}}'}</code>) are resolved at send time.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
