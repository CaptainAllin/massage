'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, Button } from '@massage/ui';
import { ArrowLeft, Bell, Save, Loader2, Check, ToggleLeft, ToggleRight } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useAutomationRules, useToggleAutomationRule, useUpdateAutomationRule } from '@/lib/hooks/use-automation';

const REMINDER_TRIGGERS = [
  'APPOINTMENT_BOOKED',
  'APPOINTMENT_REMINDER_24H',
  'APPOINTMENT_REMINDER_2H',
  'APPOINTMENT_FOLLOWUP',
  'APPOINTMENT_CANCELLED',
  'APPOINTMENT_NO_SHOW',
  'CLIENT_BIRTHDAY',
  'CLIENT_RECALL_DUE',
  'INVOICE_OVERDUE',
  'PACKAGE_LOW_CREDITS',
];

const TRIGGER_LABELS: Record<string, string> = {
  APPOINTMENT_BOOKED: 'Booking Confirmation',
  APPOINTMENT_REMINDER_24H: '24-Hour Reminder',
  APPOINTMENT_REMINDER_2H: '2-Hour Reminder',
  APPOINTMENT_FOLLOWUP: 'Post-Visit Follow-Up',
  APPOINTMENT_CANCELLED: 'Cancellation Confirmation',
  APPOINTMENT_NO_SHOW: 'No-Show Follow-Up',
  CLIENT_BIRTHDAY: 'Birthday Messages',
  CLIENT_RECALL_DUE: 'Re-engagement',
  INVOICE_OVERDUE: 'Overdue Invoice',
  PACKAGE_LOW_CREDITS: 'Package Running Low',
};

type ActionType = 'SEND_EMAIL' | 'SEND_SMS' | 'CREATE_TASK' | 'SEND_PUSH';

interface Action {
  type: ActionType;
  params: Record<string, string>;
}

interface Rule {
  id: string;
  name: string;
  description: string;
  trigger: string;
  isActive: boolean;
  actions: Action[];
}

function RuleCard({
  rule,
  businessId,
}: {
  rule: Rule;
  businessId: string;
}) {
  const toggle = useToggleAutomationRule(businessId);
  const update = useUpdateAutomationRule(businessId);

  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editedActions, setEditedActions] = useState<Action[]>(rule.actions);

  useEffect(() => {
    setEditedActions(rule.actions);
  }, [rule.actions]);

  const handleToggle = () => toggle.mutate(rule.id);

  const handleSave = async () => {
    await update.mutateAsync({ id: rule.id, actions: editedActions });
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateActionParam = (actionIdx: number, param: string, value: string) => {
    setEditedActions((prev) =>
      prev.map((a, i) =>
        i === actionIdx ? { ...a, params: { ...a.params, [param]: value } } : a,
      ),
    );
  };

  const editableActions = editedActions.filter(
    (a) => a.type === 'SEND_EMAIL' || a.type === 'SEND_SMS',
  );

  return (
    <Card className="border border-border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-foreground">{rule.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
                {TRIGGER_LABELS[rule.trigger] ?? rule.trigger}
              </span>
            </div>
            {rule.description && (
              <p className="text-sm text-muted-foreground">{rule.description}</p>
            )}
          </div>
          <button
            onClick={handleToggle}
            disabled={toggle.isPending}
            className="flex-shrink-0 mt-0.5"
            aria-label={rule.isActive ? 'Disable rule' : 'Enable rule'}
          >
            {rule.isActive ? (
              <ToggleRight className="h-7 w-7 text-green-600" />
            ) : (
              <ToggleLeft className="h-7 w-7 text-muted-foreground" />
            )}
          </button>
        </div>

        {editableActions.length > 0 && (
          <div className="mt-3 border-t border-border pt-3 space-y-3">
            {editableActions.map((action, actionIdx) => {
              const realIdx = editedActions.indexOf(action);
              return (
                <div key={actionIdx}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {action.type === 'SEND_EMAIL' ? 'Email' : 'SMS'}
                    </span>
                    {!editing && (
                      <button
                        onClick={() => setEditing(true)}
                        className="text-xs text-primary hover:underline"
                      >
                        Edit message
                      </button>
                    )}
                  </div>

                  {action.type === 'SEND_EMAIL' && (
                    <>
                      {editing ? (
                        <>
                          <input
                            className="w-full text-sm border border-border rounded px-2 py-1.5 mb-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder="Subject"
                            value={editedActions[realIdx].params.subject ?? ''}
                            onChange={(e) => updateActionParam(realIdx, 'subject', e.target.value)}
                          />
                          <textarea
                            className="w-full text-sm border border-border rounded px-2 py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                            rows={4}
                            placeholder="Email body"
                            value={editedActions[realIdx].params.body ?? ''}
                            onChange={(e) => updateActionParam(realIdx, 'body', e.target.value)}
                          />
                        </>
                      ) : (
                        <div className="text-sm text-muted-foreground bg-muted/40 rounded px-2 py-1.5 line-clamp-2">
                          {action.params.subject || '(no subject)'}
                        </div>
                      )}
                    </>
                  )}

                  {action.type === 'SEND_SMS' && (
                    <>
                      {editing ? (
                        <textarea
                          className="w-full text-sm border border-border rounded px-2 py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                          rows={2}
                          placeholder="SMS message"
                          value={editedActions[realIdx].params.message ?? ''}
                          onChange={(e) => updateActionParam(realIdx, 'message', e.target.value)}
                        />
                      ) : (
                        <div className="text-sm text-muted-foreground bg-muted/40 rounded px-2 py-1.5 line-clamp-2">
                          {action.params.message || '(no message)'}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}

            {editing && (
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleSave}
                  disabled={update.isPending}
                >
                  {update.isPending ? (
                    <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" />Saving…</>
                  ) : saved ? (
                    <><Check className="h-3 w-3 mr-1.5" />Saved</>
                  ) : (
                    <><Save className="h-3 w-3 mr-1.5" />Save</>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    setEditedActions(rule.actions);
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function RemindersPage() {
  const searchParams = useSearchParams();
  const hookBusinessId = useBusinessId();
  const businessId = searchParams?.get('businessId') || hookBusinessId || '';

  const { data, isLoading } = useAutomationRules(businessId || undefined);

  const reminderRules: Rule[] = (data?.rules ?? []).filter((r: Rule) =>
    REMINDER_TRIGGERS.includes(r.trigger),
  );

  // Group by trigger label for display
  const grouped = REMINDER_TRIGGERS.reduce<Record<string, Rule[]>>((acc, trigger) => {
    const rules = reminderRules.filter((r) => r.trigger === trigger);
    if (rules.length > 0) acc[trigger] = rules;
    return acc;
  }, {});

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-start gap-3">
        <Link
          href="/settings"
          className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground mt-0.5"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#5D4AA8', letterSpacing: '1.4px' }}>Tools</p>
          <h1 className="text-2xl font-semibold font-display" style={{ color: '#1E1830', letterSpacing: '-0.4px' }}>Reminders &amp; Notifications</h1>
          <p className="text-sm mt-0.5" style={{ color: '#7A7090' }}>Toggle and customise automated messages sent to clients and staff.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Loading…
        </div>
      ) : reminderRules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium text-foreground mb-1">No reminder rules found</p>
            <p className="text-sm text-muted-foreground">
              Default rules are created automatically for new businesses. You can also create custom rules in the{' '}
              <Link href="/automation" className="underline">Automation</Link> page.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([trigger, rules]) => (
            <div key={trigger}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {TRIGGER_LABELS[trigger] ?? trigger}
              </h2>
              <div className="space-y-2">
                {rules.map((rule) => (
                  <RuleCard key={rule.id} rule={rule} businessId={businessId} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Use <span className="font-mono">{'{{client.firstName}}'}</span>, <span className="font-mono">{'{{appointment.date}}'}</span>, and other variables in your messages.{' '}
        <Link href="/automation" className="underline">View all automation rules</Link>
      </p>
    </div>
  );
}
