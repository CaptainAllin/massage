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
  RefreshCw,
  History,
  Globe,
  Bell,
  UserCog,
  Hash,
  Sheet,
  Users,
  Building2,
  GitBranch,
  BarChart2,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import {
  useAutomationRules,
  useCreateAutomationRule,
  useUpdateAutomationRule,
  useToggleAutomationRule,
  useDeleteAutomationRule,
  useAutomationLogs,
  useRerunAutomation,
  useAutomationAnalytics,
} from '@/lib/hooks/use-automation';
import type { ConditionGroup, ConditionRule, ComparatorType } from '@/lib/automation';

// ─── Constants ────────────────────────────────────────────────────────────

const TRIGGERS = [
  { value: 'APPOINTMENT_BOOKED', label: 'Appointment Booked' },
  { value: 'APPOINTMENT_COMPLETED', label: 'Appointment Completed' },
  { value: 'APPOINTMENT_CANCELLED', label: 'Appointment Cancelled' },
  { value: 'APPOINTMENT_NO_SHOW', label: 'Appointment No-Show' },
  { value: 'ONLINE_BOOKING_REQUEST', label: 'Online Booking Request (Client Self-Books)' },
  { value: 'RECURRING_SERIES_CREATED', label: 'Recurring Series Created' },
  { value: 'APPOINTMENT_REMINDER_24H', label: 'Appointment Reminder — 24 Hours Before' },
  { value: 'APPOINTMENT_REMINDER_2H', label: 'Appointment Reminder — 2 Hours Before' },
  { value: 'APPOINTMENT_REMINDER_CUSTOM', label: 'Appointment Reminder — Custom Offset' },
  { value: 'APPOINTMENT_FOLLOWUP', label: 'Post-Appointment Follow-Up' },
  { value: 'CLIENT_CREATED', label: 'New Client Created' },
  { value: 'CLIENT_FIRST_APPOINTMENT', label: 'Client First Appointment' },
  { value: 'CLIENT_INACTIVE', label: 'Client Inactive (30+ days)' },
  { value: 'CLIENT_RECALL_DUE', label: 'Client Recall Due' },
  { value: 'CLIENT_BIRTHDAY', label: 'Client Birthday' },
  { value: 'WAITLIST_SPOT_AVAILABLE', label: 'Waitlist Spot Available' },
  { value: 'PAYMENT_RECEIVED', label: 'Payment Received' },
  { value: 'PAYMENT_FAILED', label: 'Payment Failed' },
  { value: 'INVOICE_OVERDUE', label: 'Invoice Overdue' },
  { value: 'REFUND_ISSUED', label: 'Refund Issued' },
  { value: 'GIFT_CARD_REDEEMED', label: 'Gift Card Redeemed' },
  { value: 'PACKAGE_LOW_CREDITS', label: 'Package Low Credits (≤ 2 sessions)' },
  { value: 'MEMBERSHIP_RENEWED', label: 'Membership Renewed' },
  { value: 'MEMBERSHIP_EXPIRY_SOON', label: 'Membership Expiring Soon (7 days)' },
  { value: 'MEMBERSHIP_CANCELLED', label: 'Membership Cancelled' },
  { value: 'INTAKE_FORM_SUBMITTED', label: 'Intake Form Submitted' },
  { value: 'INTAKE_FORM_NOT_COMPLETED', label: 'Intake Form Not Completed' },
  { value: 'DAILY_SLACK_SUMMARY', label: 'Daily Slack Summary (6pm)' },
];

const TRIGGER_FIELDS: Record<string, string[]> = {
  APPOINTMENT_BOOKED: ['serviceType', 'clientId', 'therapistId'],
  APPOINTMENT_COMPLETED: ['serviceType', 'clientId', 'therapistId'],
  APPOINTMENT_CANCELLED: ['serviceType', 'clientId', 'therapistId'],
  APPOINTMENT_NO_SHOW: ['serviceType', 'clientId'],
  APPOINTMENT_FOLLOWUP: ['clientId', 'appointmentId'],
  CLIENT_CREATED: ['clientId'],
  CLIENT_INACTIVE: ['clientId', 'daysSinceLastVisit'],
  CLIENT_RECALL_DUE: ['clientId', 'daysSinceLastVisit'],
  CLIENT_BIRTHDAY: ['clientId'],
  PAYMENT_RECEIVED: ['amount', 'clientId', 'invoiceId'],
  PAYMENT_FAILED: ['amount', 'clientId'],
  INVOICE_OVERDUE: ['clientId', 'invoiceId'],
  PACKAGE_LOW_CREDITS: ['clientId', 'sessionsRemaining'],
  MEMBERSHIP_RENEWED: ['clientId', 'membershipId'],
  MEMBERSHIP_CANCELLED: ['clientId', 'membershipId'],
  INTAKE_FORM_NOT_COMPLETED: ['clientId', 'intakeFormId', 'daysSinceSent'],
  DAILY_SLACK_SUMMARY: ['bookingCount', 'revenue', 'date'],
};

const COMPARATORS: { value: ComparatorType; label: string }[] = [
  { value: 'equals', label: 'equals' },
  { value: 'not_equals', label: 'not equals' },
  { value: 'contains', label: 'contains' },
  { value: 'greater_than', label: 'greater than' },
  { value: 'less_than', label: 'less than' },
  { value: 'is_empty', label: 'is empty' },
  { value: 'is_not_empty', label: 'is not empty' },
];

const ACTION_TYPES = [
  { value: 'SEND_EMAIL', label: 'Send Email', icon: Mail },
  { value: 'SEND_SMS', label: 'Send SMS', icon: MessageSquare },
  { value: 'ADD_TAG', label: 'Add Tag to Client', icon: Tag },
  { value: 'CREATE_TASK', label: 'Create Task', icon: ClipboardList },
  { value: 'HTTP_REQUEST', label: 'HTTP Request', icon: Globe },
  { value: 'SEND_SLACK', label: 'Send Slack Message', icon: Hash },
  { value: 'SEND_PUSH', label: 'Push Notification', icon: Bell },
  { value: 'UPDATE_CLIENT', label: 'Update Client Field', icon: UserCog },
  { value: 'APPEND_SHEET', label: 'Append to Google Sheet', icon: Sheet },
  { value: 'ADD_TO_EMAIL_LIST', label: 'Add to Mailchimp List', icon: Users },
  { value: 'SYNC_TO_HUBSPOT', label: 'Sync to HubSpot CRM', icon: Building2 },
  { value: 'BRANCH', label: 'Branch (If / Else)', icon: GitBranch },
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
          body: 'Hi {{client.firstName}}, we were unable to process your payment. Please update your payment method.',
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
  {
    name: 'New Booking → Slack',
    description: 'Post a Slack message when a new appointment is booked',
    trigger: 'APPOINTMENT_BOOKED',
    conditions: {},
    actions: [
      {
        type: 'SEND_SLACK',
        params: {
          channel: '',
          message: 'New booking: {{client.firstName}} {{client.lastName}} — {{appointment.service}} on {{appointment.date}} at {{appointment.time}}',
        },
      },
    ],
  },
  {
    name: 'Payment Received → Slack',
    description: 'Notify your team on Slack when a payment is received',
    trigger: 'PAYMENT_RECEIVED',
    conditions: {},
    actions: [
      {
        type: 'SEND_SLACK',
        params: {
          channel: '',
          message: 'Payment received from {{client.firstName}} {{client.lastName}}: {{invoice.amount}}',
        },
      },
    ],
  },
  {
    name: 'No-Show → Slack Alert',
    description: 'Alert your team on Slack when a client no-shows',
    trigger: 'APPOINTMENT_NO_SHOW',
    conditions: {},
    actions: [
      {
        type: 'SEND_SLACK',
        params: {
          channel: '',
          message: 'No-show: {{client.firstName}} {{client.lastName}} missed their appointment on {{appointment.date}} at {{appointment.time}}.',
        },
      },
    ],
  },
  {
    name: 'Membership Cancelled → Win-Back',
    description: 'Send a win-back offer email when a membership is cancelled',
    trigger: 'MEMBERSHIP_CANCELLED',
    conditions: {},
    actions: [
      {
        type: 'SEND_EMAIL',
        params: {
          to: '{{client.email}}',
          subject: 'We\'d love to have you back — {{business.name}}',
          body: 'Hi {{client.firstName}},\n\nWe\'re sorry to see your membership go. If there\'s anything we can do better, please let us know.\n\nWe\'d love to welcome you back — book a session anytime at {{business.bookingUrl}}.\n\n{{business.name}}',
        },
      },
    ],
  },
  {
    name: 'New Client → Google Sheet',
    description: 'Log new clients to a Google Sheet for tracking',
    trigger: 'CLIENT_CREATED',
    conditions: {},
    actions: [
      {
        type: 'APPEND_SHEET',
        params: {
          spreadsheetId: '',
          sheetName: 'Clients',
          columns: JSON.stringify(['{{client.firstName}} {{client.lastName}}', '{{client.email}}', '{{client.phone}}', '{{business.name}}']),
        },
      },
    ],
  },
  {
    name: 'New Appointment → Google Sheet',
    description: 'Log all new appointments to a Google Sheet',
    trigger: 'APPOINTMENT_BOOKED',
    conditions: {},
    actions: [
      {
        type: 'APPEND_SHEET',
        params: {
          spreadsheetId: '',
          sheetName: 'Appointments',
          columns: JSON.stringify(['{{client.firstName}} {{client.lastName}}', '{{appointment.date}}', '{{appointment.time}}', '{{appointment.service}}', '{{appointment.therapistName}}']),
        },
      },
    ],
  },
  {
    name: 'Daily Summary → Slack',
    description: 'Post today\'s booking count and revenue to Slack every evening',
    trigger: 'DAILY_SLACK_SUMMARY',
    conditions: {},
    actions: [
      {
        type: 'SEND_SLACK',
        params: {
          channel: '',
          message: 'Daily Summary for {{business.name}} — {{summary.date}}: {{summary.bookingCount}} bookings · {{summary.revenue}} revenue',
        },
      },
    ],
  },
  {
    name: 'New Client → Mailchimp',
    description: 'Add new clients to your Mailchimp audience automatically',
    trigger: 'CLIENT_CREATED',
    conditions: {},
    actions: [
      {
        type: 'ADD_TO_EMAIL_LIST',
        params: {
          email: '{{client.email}}',
          firstName: '{{client.firstName}}',
          lastName: '{{client.lastName}}',
          listId: '',
          tags: '[]',
        },
      },
    ],
  },
];

// ─── Types ────────────────────────────────────────────────────────────────

type ActionForm = {
  type: string;
  params: Record<string, any>;
  delayHours?: number;
  cancelIfEvent?: string;
};

type HeaderPair = { key: string; value: string };

// ─── Sub-components ───────────────────────────────────────────────────────

function HeaderEditor({ value, onChange }: { value: string; onChange: (json: string) => void }) {
  const parsePairs = (v: string): HeaderPair[] => {
    try {
      const obj = JSON.parse(v || '{}');
      return Object.entries(obj).map(([key, val]) => ({ key, value: String(val) }));
    } catch {
      return [];
    }
  };

  const [pairs, setPairs] = React.useState<HeaderPair[]>(() => parsePairs(value));

  const commit = (newPairs: HeaderPair[]) => {
    setPairs(newPairs);
    const obj: Record<string, string> = {};
    newPairs.filter((p) => p.key.trim()).forEach((p) => { obj[p.key] = p.value; });
    onChange(JSON.stringify(obj));
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Request Headers</span>
        <button
          type="button"
          onClick={() => commit([...pairs, { key: '', value: '' }])}
          className="text-xs text-primary hover:underline flex items-center gap-0.5"
        >
          <Plus className="w-3 h-3" /> Add header
        </button>
      </div>
      {pairs.length === 0 && (
        <p className="text-xs text-muted-foreground italic px-1">No custom headers</p>
      )}
      {pairs.map((pair, i) => (
        <div key={i} className="flex gap-1">
          <input
            placeholder="Header name"
            value={pair.key}
            onChange={(e) => {
              const p = [...pairs];
              p[i] = { ...pair, key: e.target.value };
              commit(p);
            }}
            className="flex-1 text-xs px-2 py-1.5 rounded border border-border focus:outline-none"
          />
          <input
            placeholder="Value (supports {{variables}})"
            value={pair.value}
            onChange={(e) => {
              const p = [...pairs];
              p[i] = { ...pair, value: e.target.value };
              commit(p);
            }}
            className="flex-1 text-xs px-2 py-1.5 rounded border border-border focus:outline-none"
          />
          <button
            type="button"
            onClick={() => commit(pairs.filter((_, j) => j !== i))}
            className="text-red-400 hover:text-red-600 px-1"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Template variable picker ─────────────────────────────────────────────

const TEMPLATE_VARIABLES = [
  { category: 'Client', vars: [
    { label: 'First Name', value: '{{client.firstName}}' },
    { label: 'Last Name', value: '{{client.lastName}}' },
    { label: 'Email', value: '{{client.email}}' },
    { label: 'Phone', value: '{{client.phone}}' },
  ]},
  { category: 'Appointment', vars: [
    { label: 'Date', value: '{{appointment.date}}' },
    { label: 'Time', value: '{{appointment.time}}' },
    { label: 'Service', value: '{{appointment.service}}' },
    { label: 'Therapist', value: '{{appointment.therapistName}}' },
  ]},
  { category: 'Invoice', vars: [
    { label: 'Amount', value: '{{invoice.amount}}' },
    { label: 'Due Date', value: '{{invoice.dueDate}}' },
    { label: 'Number', value: '{{invoice.number}}' },
  ]},
  { category: 'Business', vars: [
    { label: 'Name', value: '{{business.name}}' },
    { label: 'Phone', value: '{{business.phone}}' },
    { label: 'Address', value: '{{business.address}}' },
    { label: 'Booking URL', value: '{{business.bookingUrl}}' },
  ]},
  { category: 'Therapist', vars: [
    { label: 'Email', value: '{{therapist.email}}' },
  ]},
  { category: 'Summary', vars: [
    { label: 'Bookings', value: '{{summary.bookingCount}}' },
    { label: 'Revenue', value: '{{summary.revenue}}' },
    { label: 'Date', value: '{{summary.date}}' },
  ]},
];

function VarPanel({ onInsert }: { onInsert: (v: string) => void }) {
  return (
    <div className="mt-1 p-2 border border-border rounded-lg bg-muted/30 text-xs space-y-1.5">
      {TEMPLATE_VARIABLES.map((group) => (
        <div key={group.category} className="flex flex-wrap items-center gap-1">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide w-14 flex-shrink-0">
            {group.category}
          </span>
          {group.vars.map((v) => (
            <button
              key={v.value}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onInsert(v.value); }}
              title={v.value}
              className="px-1.5 py-0.5 rounded bg-[#EDE5F4] text-[#5D4AA8] text-[10px] hover:bg-[#5D4AA8] hover:text-white transition-colors font-medium"
            >
              {v.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

function TextareaWithPicker({
  value,
  onChange,
  placeholder,
  rows = 3,
  mono = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  mono?: boolean;
}) {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const [open, setOpen] = React.useState(false);

  const insert = (v: string) => {
    const el = ref.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    onChange(value.substring(0, start) + v + value.substring(end));
    setOpen(false);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + v.length, start + v.length);
    });
  };

  return (
    <div>
      <div className="relative">
        <textarea
          ref={ref}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className={`w-full text-xs px-2 py-1.5 pr-10 rounded border border-border focus:outline-none resize-none${mono ? ' font-mono' : ''}`}
        />
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); setOpen((o) => !o); }}
          title="Insert template variable"
          className="absolute top-1.5 right-1.5 text-[10px] px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground hover:bg-[#EDE5F4] hover:text-[#5D4AA8] font-mono leading-none"
        >
          {'{x}'}
        </button>
      </div>
      {open && <VarPanel onInsert={insert} />}
    </div>
  );
}

function InputWithPicker({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const ref = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);

  const insert = (v: string) => {
    const el = ref.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    onChange(value.substring(0, start) + v + value.substring(end));
    setOpen(false);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + v.length, start + v.length);
    });
  };

  return (
    <div>
      <div className="flex gap-1">
        <input
          ref={ref}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 min-w-0 text-xs px-2 py-1.5 rounded border border-border focus:outline-none"
        />
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); setOpen((o) => !o); }}
          title="Insert template variable"
          className="flex-shrink-0 text-[10px] px-1.5 py-1 rounded border border-border bg-muted/50 text-muted-foreground hover:bg-[#EDE5F4] hover:text-[#5D4AA8] hover:border-[#5D4AA8] font-mono"
        >
          {'{x}'}
        </button>
      </div>
      {open && <VarPanel onInsert={insert} />}
    </div>
  );
}

function SpreadsheetPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const businessId = useBusinessId();
  const [sheets, setSheets] = React.useState<{ id: string; name: string }[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const fetchSheets = async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/integrations/google-sheets/sheets?businessId=${businessId}`);
      const data = await r.json();
      setSheets(data.sheets ?? []);
    } catch {
      setSheets([]);
    } finally {
      setLoading(false);
      setOpen(true);
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        <input
          placeholder="Spreadsheet ID (from Google Sheets URL)"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 min-w-0 text-xs px-2 py-1.5 rounded border border-border focus:outline-none"
        />
        <button
          type="button"
          onClick={fetchSheets}
          disabled={loading}
          className="flex-shrink-0 text-xs px-2 py-1 rounded border border-border bg-muted/50 text-muted-foreground hover:bg-muted disabled:opacity-50"
        >
          {loading ? '…' : 'Browse'}
        </button>
      </div>
      {open && sheets !== null && (
        sheets.length > 0 ? (
          <div className="border border-border rounded-lg bg-background divide-y divide-border/50 max-h-40 overflow-y-auto">
            {sheets.map((sheet) => (
              <button
                key={sheet.id}
                type="button"
                onClick={() => { onChange(sheet.id); setOpen(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-muted text-xs flex justify-between gap-2 items-center"
              >
                <span className="font-medium truncate">{sheet.name}</span>
                <span className="text-muted-foreground font-mono text-[10px] flex-shrink-0 truncate max-w-[8rem]">{sheet.id}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No spreadsheets found. Connect Google Sheets in Settings → Integrations first.</p>
        )
      )}
    </div>
  );
}

function ConditionsBuilder({
  trigger,
  value,
  onChange,
}: {
  trigger: string;
  value: any;
  onChange: (v: ConditionGroup) => void;
}) {
  const emptyGroup: ConditionGroup = { operator: 'AND', rules: [] };

  const parsed: ConditionGroup = React.useMemo(() => {
    if (value && 'operator' in value && 'rules' in value) return value as ConditionGroup;
    return emptyGroup;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [group, setGroup] = React.useState<ConditionGroup>(parsed);

  const suggestedFields = TRIGGER_FIELDS[trigger] ?? [];

  const update = (g: ConditionGroup) => {
    setGroup(g);
    onChange(g);
  };

  const addRule = () => {
    update({ ...group, rules: [...group.rules, { field: suggestedFields[0] ?? '', comparator: 'equals', value: '' }] });
  };

  const removeRule = (i: number) => {
    update({ ...group, rules: group.rules.filter((_, j) => j !== i) });
  };

  const updateRule = (i: number, patch: Partial<ConditionRule>) => {
    const rules = [...group.rules];
    rules[i] = { ...rules[i], ...patch };
    update({ ...group, rules });
  };

  const needsValue = (c: ComparatorType) => c !== 'is_empty' && c !== 'is_not_empty';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Conditions (optional)</span>
        <div className="flex items-center gap-2">
          {group.rules.length > 1 && (
            <div className="flex rounded border border-border overflow-hidden text-xs">
              {(['AND', 'OR'] as const).map((op) => (
                <button
                  key={op}
                  type="button"
                  onClick={() => update({ ...group, operator: op })}
                  className={`px-2 py-0.5 ${group.operator === op ? 'bg-primary text-white' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                >
                  {op}
                </button>
              ))}
            </div>
          )}
          <button type="button" onClick={addRule} className="text-xs text-primary hover:underline flex items-center gap-0.5">
            <Plus className="w-3 h-3" /> Add condition
          </button>
        </div>
      </div>

      {group.rules.length === 0 && (
        <p className="text-xs text-muted-foreground italic px-1">No conditions — rule fires on every trigger</p>
      )}

      {group.rules.map((rule, i) => (
        <div key={i} className="flex gap-1 items-center">
          {i > 0 && (
            <span className="text-xs text-muted-foreground w-6 text-center flex-shrink-0">{group.operator}</span>
          )}
          {i === 0 && <span className="w-6 flex-shrink-0" />}
          <input
            list={`fields-${i}`}
            placeholder="field"
            value={rule.field}
            onChange={(e) => updateRule(i, { field: e.target.value })}
            className="flex-1 text-xs px-2 py-1.5 rounded border border-border focus:outline-none min-w-0"
          />
          {suggestedFields.length > 0 && (
            <datalist id={`fields-${i}`}>
              {suggestedFields.map((f) => <option key={f} value={f} />)}
            </datalist>
          )}
          <select
            value={rule.comparator}
            onChange={(e) => updateRule(i, { comparator: e.target.value as ComparatorType })}
            className="text-xs px-1.5 py-1.5 rounded border border-border bg-background focus:outline-none"
          >
            {COMPARATORS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          {needsValue(rule.comparator) && (
            <input
              placeholder="value"
              value={rule.value}
              onChange={(e) => updateRule(i, { value: e.target.value })}
              className="flex-1 text-xs px-2 py-1.5 rounded border border-border focus:outline-none min-w-0"
            />
          )}
          <button type="button" onClick={() => removeRule(i)} className="text-red-400 hover:text-red-600 flex-shrink-0">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

function ActionCard({
  action,
  idx,
  canRemove,
  onUpdate,
  onRemove,
}: {
  action: ActionForm;
  idx: number;
  canRemove: boolean;
  onUpdate: (field: string, value: any) => void;
  onRemove: () => void;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const p = action.params;

  const handleTypeChange = (type: string) => {
    onUpdate('__type__', type);
  };

  return (
    <div className="border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <select
          value={action.type}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="text-sm px-2 py-1 rounded border border-border bg-background focus:outline-none"
        >
          {ACTION_TYPES.map((a) => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5"
            title="Delay / conditions"
          >
            <Clock className="w-3 h-3" />
          </button>
          {canRemove && (
            <button type="button" onClick={onRemove} className="text-red-400 hover:text-red-600">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Advanced: delay + cancelIfEvent */}
      {showAdvanced && (
        <div className="bg-muted/40 rounded p-2 space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <input
              type="number"
              min="0"
              placeholder="Delay (hours, 0 = immediate)"
              value={action.delayHours ?? 0}
              onChange={(e) => onUpdate('delayHours', parseFloat(e.target.value) || 0)}
              className="flex-1 text-xs px-2 py-1 rounded border border-border focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <select
              value={action.cancelIfEvent ?? ''}
              onChange={(e) => onUpdate('cancelIfEvent', e.target.value || undefined)}
              className="flex-1 text-xs px-2 py-1 rounded border border-border bg-background focus:outline-none"
            >
              <option value="">Don't cancel (always fire)</option>
              {TRIGGERS.map((t) => (
                <option key={t.value} value={t.value}>Cancel if: {t.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Action-specific fields */}
      {(action.type === 'SEND_EMAIL' || action.type === 'SEND_SMS') && (
        <>
          <InputWithPicker
            placeholder={action.type === 'SEND_EMAIL' ? 'To: {{client.email}}' : 'To: {{client.phone}}'}
            value={p.to ?? ''}
            onChange={(v) => onUpdate('to', v)}
          />
          {action.type === 'SEND_EMAIL' && (
            <InputWithPicker
              placeholder="Subject"
              value={p.subject ?? ''}
              onChange={(v) => onUpdate('subject', v)}
            />
          )}
          <TextareaWithPicker
            placeholder={action.type === 'SEND_SMS' ? 'Message body...' : 'Email body...'}
            value={(action.type === 'SEND_SMS' ? p.message : p.body) ?? ''}
            onChange={(v) => onUpdate(action.type === 'SEND_SMS' ? 'message' : 'body', v)}
            rows={3}
          />
        </>
      )}

      {action.type === 'ADD_TAG' && (
        <input
          placeholder="Tag name (e.g. vip, follow-up)"
          value={p.tag ?? ''}
          onChange={(e) => onUpdate('tag', e.target.value)}
          className="w-full text-xs px-2 py-1.5 rounded border border-border focus:outline-none"
        />
      )}

      {action.type === 'CREATE_TASK' && (
        <>
          <InputWithPicker
            placeholder="Task title"
            value={p.title ?? ''}
            onChange={(v) => onUpdate('title', v)}
          />
          <InputWithPicker
            placeholder="Task description (optional)"
            value={p.description ?? ''}
            onChange={(v) => onUpdate('description', v)}
          />
        </>
      )}

      {action.type === 'HTTP_REQUEST' && (
        <>
          <div className="flex gap-2">
            <select
              value={p.method ?? 'POST'}
              onChange={(e) => onUpdate('method', e.target.value)}
              className="text-xs px-2 py-1.5 rounded border border-border bg-background focus:outline-none w-20"
            >
              <option value="POST">POST</option>
              <option value="GET">GET</option>
              <option value="PUT">PUT</option>
            </select>
            <input
              placeholder="https://api.example.com/webhook"
              value={p.url ?? ''}
              onChange={(e) => onUpdate('url', e.target.value)}
              className="flex-1 text-xs px-2 py-1.5 rounded border border-border focus:outline-none"
            />
          </div>
          <HeaderEditor
            key={`headers-${idx}`}
            value={p.headers ?? '{}'}
            onChange={(v) => onUpdate('headers', v)}
          />
          <TextareaWithPicker
            placeholder='Body — JSON template, e.g. {"client": "{{client.firstName}}"}'
            value={p.body ?? ''}
            onChange={(v) => onUpdate('body', v)}
            rows={3}
          />
        </>
      )}

      {action.type === 'SEND_SLACK' && (
        <>
          <input
            placeholder="Channel (leave blank to use default from settings)"
            value={p.channel ?? ''}
            onChange={(e) => onUpdate('channel', e.target.value)}
            className="w-full text-xs px-2 py-1.5 rounded border border-border focus:outline-none"
          />
          <TextareaWithPicker
            placeholder="Message body (supports {{template.variables}})"
            value={p.message ?? ''}
            onChange={(v) => onUpdate('message', v)}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">Connect Slack in Settings → Integrations first.</p>
        </>
      )}

      {action.type === 'SEND_PUSH' && (
        <>
          <input
            placeholder="Recipient user ID or ALL_STAFF"
            value={p.recipientUserId ?? 'ALL_STAFF'}
            onChange={(e) => onUpdate('recipientUserId', e.target.value)}
            className="w-full text-xs px-2 py-1.5 rounded border border-border focus:outline-none"
          />
          <InputWithPicker
            placeholder="Notification title"
            value={p.title ?? ''}
            onChange={(v) => onUpdate('title', v)}
          />
          <InputWithPicker
            placeholder="Notification body (supports {{template.variables}})"
            value={p.body ?? ''}
            onChange={(v) => onUpdate('body', v)}
          />
        </>
      )}

      {action.type === 'UPDATE_CLIENT' && (
        <>
          <select
            value={p.field ?? 'goals'}
            onChange={(e) => onUpdate('field', e.target.value)}
            className="w-full text-xs px-2 py-1.5 rounded border border-border bg-background focus:outline-none"
          >
            <option value="goals">Goals</option>
            <option value="occupation">Occupation</option>
            <option value="primaryPhysician">Primary Physician</option>
            <option value="insuranceProvider">Insurance Provider</option>
            <option value="insurancePolicyNumber">Insurance Policy #</option>
          </select>
          <InputWithPicker
            placeholder="New value (supports {{template.variables}})"
            value={p.value ?? ''}
            onChange={(v) => onUpdate('value', v)}
          />
        </>
      )}

      {action.type === 'APPEND_SHEET' && (
        <>
          <SpreadsheetPicker
            value={p.spreadsheetId ?? ''}
            onChange={(id) => onUpdate('spreadsheetId', id)}
          />
          <input
            placeholder="Sheet name (e.g. Sheet1)"
            value={p.sheetName ?? 'Sheet1'}
            onChange={(e) => onUpdate('sheetName', e.target.value)}
            className="w-full text-xs px-2 py-1.5 rounded border border-border focus:outline-none"
          />
          <TextareaWithPicker
            placeholder='Column values as JSON array, e.g. ["{{client.firstName}}", "{{appointment.date}}"]'
            value={p.columns ?? '[]'}
            onChange={(v) => onUpdate('columns', v)}
            rows={2}
            mono
          />
          <p className="text-xs text-muted-foreground">Connect Google Sheets in Settings → Integrations first.</p>
        </>
      )}

      {action.type === 'ADD_TO_EMAIL_LIST' && (
        <>
          <InputWithPicker
            placeholder="Email (default: {{client.email}})"
            value={p.email ?? '{{client.email}}'}
            onChange={(v) => onUpdate('email', v)}
          />
          <div className="flex gap-2">
            <InputWithPicker
              placeholder="First name ({{client.firstName}})"
              value={p.firstName ?? '{{client.firstName}}'}
              onChange={(v) => onUpdate('firstName', v)}
            />
            <InputWithPicker
              placeholder="Last name ({{client.lastName}})"
              value={p.lastName ?? '{{client.lastName}}'}
              onChange={(v) => onUpdate('lastName', v)}
            />
          </div>
          <input
            placeholder="Audience ID (leave blank to use default from settings)"
            value={p.listId ?? ''}
            onChange={(e) => onUpdate('listId', e.target.value)}
            className="w-full text-xs px-2 py-1.5 rounded border border-border focus:outline-none"
          />
          <p className="text-xs text-muted-foreground">Connect Mailchimp in Settings → Integrations first.</p>
        </>
      )}

      {action.type === 'SYNC_TO_HUBSPOT' && (
        <>
          <InputWithPicker
            placeholder="Email (default: {{client.email}})"
            value={p.email ?? '{{client.email}}'}
            onChange={(v) => onUpdate('email', v)}
          />
          <div className="flex gap-2">
            <InputWithPicker
              placeholder="First name"
              value={p.firstName ?? '{{client.firstName}}'}
              onChange={(v) => onUpdate('firstName', v)}
            />
            <InputWithPicker
              placeholder="Last name"
              value={p.lastName ?? '{{client.lastName}}'}
              onChange={(v) => onUpdate('lastName', v)}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`createDeal-${idx}`}
              checked={p.createDeal === 'true'}
              onChange={(e) => onUpdate('createDeal', e.target.checked ? 'true' : 'false')}
              className="rounded"
            />
            <label htmlFor={`createDeal-${idx}`} className="text-xs text-muted-foreground">Create a deal in HubSpot</label>
          </div>
          {p.createDeal === 'true' && (
            <InputWithPicker
              placeholder="Deal name (e.g. Payment from {{client.firstName}})"
              value={p.dealName ?? ''}
              onChange={(v) => onUpdate('dealName', v)}
            />
          )}
          <p className="text-xs text-muted-foreground">Connect HubSpot in Settings → Integrations first.</p>
        </>
      )}

      {action.type === 'BRANCH' && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">IF condition</p>
          <div className="flex gap-1">
            <input
              placeholder="field (e.g. serviceType)"
              value={p.conditionField ?? ''}
              onChange={(e) => onUpdate('conditionField', e.target.value)}
              className="flex-1 text-xs px-2 py-1.5 rounded border border-border focus:outline-none"
            />
            <select
              value={p.conditionComparator ?? 'equals'}
              onChange={(e) => onUpdate('conditionComparator', e.target.value)}
              className="text-xs px-1.5 py-1.5 rounded border border-border bg-background focus:outline-none"
            >
              {COMPARATORS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            {p.conditionComparator !== 'is_empty' && p.conditionComparator !== 'is_not_empty' && (
              <input
                placeholder="value"
                value={p.conditionValue ?? ''}
                onChange={(e) => onUpdate('conditionValue', e.target.value)}
                className="flex-1 text-xs px-2 py-1.5 rounded border border-border focus:outline-none"
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="border border-green-200 rounded p-2 space-y-1">
              <p className="text-xs font-medium text-green-700">THEN</p>
              <textarea
                placeholder='JSON array of actions, e.g. [{"type":"SEND_EMAIL","params":{...}}]'
                value={Array.isArray(p.thenActions) ? JSON.stringify(p.thenActions, null, 2) : (p.thenActions ?? '[]')}
                onChange={(e) => {
                  try { onUpdate('thenActions', JSON.parse(e.target.value)); } catch { /* ignore */ }
                }}
                rows={4}
                className="w-full text-xs px-2 py-1.5 rounded border border-border focus:outline-none resize-none font-mono"
              />
            </div>
            <div className="border border-orange-200 rounded p-2 space-y-1">
              <p className="text-xs font-medium text-orange-700">ELSE</p>
              <textarea
                placeholder='JSON array of actions, e.g. [{"type":"ADD_TAG","params":{...}}]'
                value={Array.isArray(p.elseActions) ? JSON.stringify(p.elseActions, null, 2) : (p.elseActions ?? '[]')}
                onChange={(e) => {
                  try { onUpdate('elseActions', JSON.parse(e.target.value)); } catch { /* ignore */ }
                }}
                rows={4}
                className="w-full text-xs px-2 py-1.5 rounded border border-border focus:outline-none resize-none font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {(action.delayHours ?? 0) > 0 && !showAdvanced && (
        <p className="text-xs text-primary flex items-center gap-1">
          <Clock className="w-3 h-3" /> Fires {action.delayHours}h after trigger
          {action.cancelIfEvent && ` · cancels if ${TRIGGERS.find((t) => t.value === action.cancelIfEvent)?.label ?? action.cancelIfEvent}`}
        </p>
      )}
    </div>
  );
}

// ─── Rule modal ───────────────────────────────────────────────────────────

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
  const defaultActions: ActionForm[] = [{ type: 'SEND_EMAIL', params: { to: '', subject: '', body: '' } }];

  const [form, setForm] = useState({
    name: rule?.name ?? '',
    description: rule?.description ?? '',
    trigger: rule?.trigger ?? '',
    conditions: rule?.conditions ?? {},
    actions: (rule?.actions as ActionForm[]) ?? defaultActions,
  });

  const create = useCreateAutomationRule(businessId);
  const update = useUpdateAutomationRule(businessId);

  const addAction = () => {
    setForm((f) => ({ ...f, actions: [...f.actions, { type: 'SEND_EMAIL', params: { to: '', subject: '', body: '' } }] }));
  };

  const removeAction = (idx: number) => {
    setForm((f) => ({ ...f, actions: f.actions.filter((_, i) => i !== idx) }));
  };

  const updateAction = (idx: number, field: string, value: any) => {
    setForm((f) => {
      const actions = [...f.actions];
      if (field === '__type__') {
        const typeDefaults: Record<string, Record<string, any>> = {
          SEND_EMAIL: { to: '', subject: '', body: '' },
          SEND_SMS: { to: '', message: '' },
          ADD_TAG: { tag: '' },
          CREATE_TASK: { title: '', description: '' },
          HTTP_REQUEST: { url: '', method: 'POST', headers: '{}', body: '' },
          SEND_SLACK: { channel: '', message: '' },
          SEND_PUSH: { recipientUserId: 'ALL_STAFF', title: '', body: '' },
          UPDATE_CLIENT: { field: 'goals', value: '' },
          APPEND_SHEET: { spreadsheetId: '', sheetName: 'Sheet1', columns: '[]' },
          ADD_TO_EMAIL_LIST: { email: '{{client.email}}', firstName: '{{client.firstName}}', lastName: '{{client.lastName}}', listId: '', tags: '[]' },
          SYNC_TO_HUBSPOT: { email: '{{client.email}}', firstName: '{{client.firstName}}', lastName: '{{client.lastName}}', createDeal: 'false', dealName: '' },
          BRANCH: { conditionField: '', conditionComparator: 'equals', conditionValue: '', thenActions: [], elseActions: [] },
        };
        actions[idx] = { type: value, params: typeDefaults[value] ?? {}, delayHours: actions[idx].delayHours, cancelIfEvent: actions[idx].cancelIfEvent };
      } else if (field === 'delayHours' || field === 'cancelIfEvent') {
        actions[idx] = { ...actions[idx], [field]: value };
      } else {
        actions[idx] = { ...actions[idx], params: { ...actions[idx].params, [field]: value } };
      }
      return { ...f, actions };
    });
  };

  const handlePreset = (preset: (typeof PRESET_TEMPLATES)[0]) => {
    setForm((f) => ({
      ...f,
      name: preset.name,
      description: preset.description,
      trigger: preset.trigger,
      conditions: preset.conditions,
      actions: preset.actions as ActionForm[],
    }));
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

            {/* Conditions Builder */}
            <div>
              <ConditionsBuilder
                trigger={form.trigger}
                value={form.conditions}
                onChange={(v) => setForm((f) => ({ ...f, conditions: v }))}
              />
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
                  <ActionCard
                    key={idx}
                    action={action}
                    idx={idx}
                    canRemove={form.actions.length > 1}
                    onUpdate={(field, value) => updateAction(idx, field, value)}
                    onRemove={() => removeAction(idx)}
                  />
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
              Click <code className="font-mono bg-muted px-1 rounded">{'{x}'}</code> next to any message field to insert a template variable — or type manually, e.g. <code className="font-mono">{'{{client.firstName}}'}</code>, <code className="font-mono">{'{{business.name}}'}</code>, <code className="font-mono">{'{{appointment.date}}'}</code>.
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

// ─── Rule card ────────────────────────────────────────────────────────────

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
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{ACTION_TYPES.find((a) => a.value === action.type)?.label ?? action.type}</span>
                            {(action.delayHours ?? 0) > 0 && (
                              <span className="text-xs text-primary flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" /> +{action.delayHours}h
                              </span>
                            )}
                          </div>
                          {action.params?.subject && <p className="text-xs text-muted-foreground truncate">"{action.params.subject}"</p>}
                          {action.params?.message && <p className="text-xs text-muted-foreground truncate">"{action.params.message}"</p>}
                          {action.params?.tag && <p className="text-xs text-muted-foreground">Tag: {action.params.tag}</p>}
                          {action.cancelIfEvent && (
                            <p className="text-xs text-orange-500">Cancels if: {TRIGGERS.find((t) => t.value === action.cancelIfEvent)?.label ?? action.cancelIfEvent}</p>
                          )}
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

// ─── Run history tab ──────────────────────────────────────────────────────

function RunHistoryTab({ businessId }: { businessId: string }) {
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data, isLoading } = useAutomationLogs(businessId, page);
  const rerun = useRerunAutomation(businessId);

  const logs = data?.logs ?? [];
  const meta = data?.meta;

  const statusIcon = (status: string) => {
    if (status === 'SUCCESS') return <CheckCircle className="w-3.5 h-3.5 text-[#5D4AA8] flex-shrink-0" />;
    if (status === 'FAILED') return <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />;
    return <AlertCircle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />;
  };

  return (
    <div className="space-y-3">
      {isLoading && <p className="text-sm text-muted-foreground">Loading run history...</p>}
      {!isLoading && logs.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No runs yet</p>
          <p className="text-sm mt-1">Logs will appear here once your automation rules fire</p>
        </div>
      )}
      {logs.map((log: any) => (
        <Card key={log.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <button
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                className="flex items-start gap-3 flex-1 min-w-0 text-left"
              >
                {statusIcon(log.status)}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{log.rule?.name ?? 'Unknown Rule'}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                    <span className="font-mono bg-muted px-1 rounded">{log.rule?.trigger}</span>
                    <span>{new Date(log.executedAt).toLocaleString()}</span>
                    <span className={log.status === 'SUCCESS' ? 'text-[#5D4AA8]' : log.status === 'FAILED' ? 'text-red-600' : 'text-[#7A7090]'}>
                      {log.status}
                    </span>
                  </div>
                  {log.errorMessage && (
                    <p className="text-xs text-red-500 mt-0.5 truncate">{log.errorMessage}</p>
                  )}
                </div>
              </button>
              {log.status === 'FAILED' && (
                <button
                  onClick={() => rerun.mutate(log.id)}
                  disabled={rerun.isPending}
                  title="Re-run with same data"
                  className="text-muted-foreground hover:text-primary flex-shrink-0"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
            {expandedId === log.id && (
              <div className="mt-3 border-t border-border pt-3 space-y-2">
                {log.result && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">ACTION RESULTS</p>
                    <div className="space-y-1">
                      {(log.result as any[]).map((r: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs bg-muted/50 rounded px-2 py-1">
                          <span className="font-mono text-muted-foreground">{r.type}</span>
                          <span className={r.status === 'sent' || r.status === 'created' || r.status === 'tagged' || r.status === 'scheduled' ? 'text-[#5D4AA8]' : r.status === 'failed' ? 'text-red-500' : 'text-[#7A7090]'}>
                            {r.status}
                          </span>
                          {r.executeAt && <span className="text-muted-foreground">at {new Date(r.executeAt).toLocaleString()}</span>}
                          {r.error && <span className="text-red-400 truncate">{r.error}</span>}
                          {r.reason && <span className="text-[#7A7090] truncate">{r.reason}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {log.triggerData && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">TRIGGER DATA</p>
                    <pre className="text-xs bg-muted rounded p-2 overflow-auto max-h-32">
                      {JSON.stringify(log.triggerData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
          <span>{meta.total} total runs</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 rounded border border-border disabled:opacity-40 hover:bg-muted">
              Prev
            </button>
            <span className="px-2 py-1">{page} / {meta.totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages} className="px-2 py-1 rounded border border-border disabled:opacity-40 hover:bg-muted">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Analytics tab ────────────────────────────────────────────────────────

function AnalyticsTab({ businessId }: { businessId: string }) {
  const { data, isLoading } = useAutomationAnalytics(businessId);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading analytics...</p>;

  const stats = [
    {
      label: 'Active Rules',
      value: String(data?.rulesActive ?? 0),
      icon: Zap,
      color: 'text-[#5D4AA8] bg-[#EDE5F4]',
    },
    {
      label: 'Runs This Month',
      value: String(data?.runsThisMonth ?? 0),
      icon: BarChart2,
      color: 'text-[#7665C2] bg-[#EDE5F4]',
    },
    {
      label: 'Success Rate',
      value: `${data?.successRate ?? 0}%`,
      icon: CheckCircle,
      color: 'text-[#5D4AA8] bg-[#EDE5F4]',
    },
    {
      label: 'Re-engaged Clients',
      value: String(data?.revenueAttributed ?? 0),
      icon: TrendingUp,
      color: 'text-[#5D4AA8] bg-[#EDE5F4]',
      description: 'Clients who booked within 7 days of a re-engagement automation',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, description }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className={`rounded-xl p-2.5 flex-shrink-0 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold">{value}</p>
                {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(data?.failedThisMonth ?? 0) > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm font-medium text-red-700">
                {data?.failedThisMonth} failed run{(data?.failedThisMonth ?? 0) !== 1 ? 's' : ''} this month
              </p>
              <p className="text-xs text-red-500 ml-1">— check Run History for details</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-[#5D4AA8]" />
            <p className="text-sm font-semibold">Revenue Attribution</p>
          </div>
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{data?.revenueAttributed ?? 0} clients</strong> booked an appointment within 7 days of receiving a re-engagement automation
            (re-engagement, recall, or birthday campaigns).
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Attribution window: 60-day lookback, 7-day conversion window. Triggers counted: CLIENT_RECALL_DUE, CLIENT_INACTIVE, CLIENT_BIRTHDAY.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function AutomationPage() {
  const businessId = useBusinessId();
  const { data, isLoading } = useAutomationRules(businessId);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'rules' | 'history' | 'analytics'>('rules');

  const rules = data?.rules ?? [];
  const activeCount = rules.filter((r: any) => r.isActive).length;
  const totalRuns = rules.reduce((s: number, r: any) => s + r.runCount, 0);

  return (
    <div className="space-y-6">
      {showModal && businessId && (
        <AutomationRuleModal businessId={businessId} onClose={() => setShowModal(false)} />
      )}

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#5D4AA8', letterSpacing: '1.4px' }}>Communications</p>
          <h1 className="text-2xl font-semibold font-display" style={{ color: '#1E1830', letterSpacing: '-0.4px' }}>Automation</h1>
          <p className="text-sm mt-0.5" style={{ color: '#7A7090' }}>If–then rules that run automatically</p>
        </div>
        <Button onClick={() => setShowModal(true)} size="sm" className="[background:linear-gradient(135deg,#5D4AA8,#3F2F87)] hover:opacity-90 text-white">
          <Plus className="w-4 h-4 mr-2" />
          New Rule
        </Button>
      </div>

      {/* Quick stats */}
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

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {[
          { key: 'rules', label: 'Rules' },
          { key: 'history', label: 'Run History' },
          { key: 'analytics', label: 'Analytics' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-[#5D4AA8] text-[#5D4AA8]'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Rules Tab */}
      {activeTab === 'rules' && (
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
      )}

      {/* Run History Tab */}
      {activeTab === 'history' && businessId && (
        <RunHistoryTab businessId={businessId} />
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && businessId && (
        <AnalyticsTab businessId={businessId} />
      )}
    </div>
  );
}
