'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, CardContent, Input } from '@massage/ui';
import {
  Webhook, Plus, Trash2, RefreshCw, ChevronDown, ChevronUp,
  Check, X, Send, AlertTriangle, ArrowLeft, Copy
} from 'lucide-react';
import Link from 'next/link';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { apiClient } from '@/lib/api-client';

interface WebhookItem {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastTriggeredAt: string | null;
  failureCount: number;
  createdAt: string;
}

interface Delivery {
  id: string;
  event: string;
  statusCode: number | null;
  responseBody: string | null;
  attemptedAt: string;
  succeeded: boolean;
}

const EVENT_LABELS: Record<string, string> = {
  'appointment.created': 'Appointment Created',
  'appointment.updated': 'Appointment Updated',
  'appointment.cancelled': 'Appointment Cancelled',
  'client.created': 'Client Created',
  'client.updated': 'Client Updated',
  'invoice.created': 'Invoice Created',
  'invoice.paid': 'Invoice Paid',
  'treatment_note.completed': 'Treatment Note Completed',
};

export default function WebhooksPage() {
  const businessId = useBusinessId();
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [availableEvents, setAvailableEvents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<Record<string, Delivery[]>>({});
  const [testResults, setTestResults] = useState<Record<string, { succeeded: boolean; statusCode: number | null }>>({});
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const [form, setForm] = useState({ url: '', events: [] as string[] });

  const load = useCallback(async () => {
    if (!businessId) return;
    try {
      const res = await apiClient.get(`/developer/webhooks?businessId=${businessId}`);
      setWebhooks(res.data.data.webhooks);
      setAvailableEvents(res.data.data.availableEvents);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => { load(); }, [load]);

  const toggleEvent = (event: string) => {
    setForm(f => ({
      ...f,
      events: f.events.includes(event) ? f.events.filter(e => e !== event) : [...f.events, event],
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId || !form.url || !form.events.length) return;
    setCreating(true);
    try {
      const res = await apiClient.post('/developer/webhooks', { businessId, url: form.url, events: form.events });
      setNewSecret(res.data.data.secret);
      setForm({ url: '', events: [] });
      setShowCreate(false);
      load();
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this webhook endpoint? All delivery history will also be removed.')) return;
    await apiClient.delete(`/developer/webhooks/${id}`);
    setWebhooks(w => w.filter(wh => wh.id !== id));
  };

  const handleToggle = async (id: string, current: boolean) => {
    await apiClient.patch(`/developer/webhooks/${id}`, { isActive: !current });
    setWebhooks(w => w.map(wh => wh.id === id ? { ...wh, isActive: !current } : wh));
  };

  const loadDeliveries = async (id: string) => {
    if (deliveries[id]) return;
    const res = await apiClient.get(`/developer/webhooks/${id}/deliveries`);
    setDeliveries(d => ({ ...d, [id]: res.data.data.deliveries }));
  };

  const handleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      loadDeliveries(id);
    }
  };

  const handleTest = async (id: string) => {
    const res = await apiClient.post(`/developer/webhooks/${id}/test`);
    setTestResults(r => ({ ...r, [id]: { succeeded: res.data.data.succeeded, statusCode: res.data.data.statusCode } }));
    // Refresh deliveries
    const d = await apiClient.get(`/developer/webhooks/${id}/deliveries`);
    setDeliveries(prev => ({ ...prev, [id]: d.data.data.deliveries }));
    setTimeout(() => setTestResults(r => { const copy = { ...r }; delete copy[id]; return copy; }), 5000);
  };

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/settings/integrations">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Webhook className="h-6 w-6" /> Webhooks
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Receive real-time events when appointments, clients, or invoices change.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Endpoint
        </Button>
      </div>

      {newSecret && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-green-800 dark:text-green-200">Webhook signing secret — copy it now</p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-0.5">
                  Use this to verify the <code className="text-xs">X-Webhook-Signature</code> header (HMAC-SHA256).
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <code className="flex-1 bg-white dark:bg-gray-900 border rounded px-3 py-2 text-sm font-mono break-all">
                    {newSecret}
                  </code>
                  <Button variant="outline" size="sm" onClick={() => copySecret(newSecret)}>
                    {copiedSecret ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setNewSecret(null)}>Dismiss</Button>
          </CardContent>
        </Card>
      )}

      {showCreate && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Add Endpoint</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Endpoint URL</label>
                <Input
                  type="url"
                  value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  placeholder="https://example.com/webhook"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Events to subscribe</label>
                <div className="grid grid-cols-2 gap-2">
                  {availableEvents.map(event => (
                    <label key={event} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={form.events.includes(event)}
                        onChange={() => toggleEvent(event)}
                        className="rounded"
                      />
                      {EVENT_LABELS[event] || event}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="primary" disabled={creating || !form.events.length}>
                  {creating ? 'Creating…' : 'Add Endpoint'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : webhooks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Webhook className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No webhook endpoints yet.</p>
            </CardContent>
          </Card>
        ) : (
          webhooks.map(wh => (
            <Card key={wh.id}>
              <CardContent className="p-0">
                <div className="flex items-center gap-4 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${wh.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span className="font-mono text-sm truncate">{wh.url}</span>
                      {wh.failureCount > 0 && (
                        <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded">
                          {wh.failureCount} failures
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {(wh.events as string[]).map(event => (
                        <span key={event} className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {EVENT_LABELS[event] || event}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {testResults[wh.id] !== undefined && (
                      <span className={`text-xs px-2 py-0.5 rounded ${testResults[wh.id].succeeded ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {testResults[wh.id].succeeded ? '✓' : '✗'} {testResults[wh.id].statusCode}
                      </span>
                    )}
                    <Button variant="ghost" size="sm" title="Send test ping" onClick={() => handleTest(wh.id)}>
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleToggle(wh.id, wh.isActive)}>
                      {wh.isActive ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(wh.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleExpand(wh.id)}>
                      {expandedId === wh.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {expandedId === wh.id && (
                  <div className="border-t px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium">Delivery Log</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeliveries(d => { const c = { ...d }; delete c[wh.id]; return c; });
                          loadDeliveries(wh.id);
                        }}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" /> Refresh
                      </Button>
                    </div>
                    {!deliveries[wh.id] ? (
                      <p className="text-xs text-muted-foreground">Loading…</p>
                    ) : deliveries[wh.id].length === 0 ? (
                      <p className="text-xs text-muted-foreground">No deliveries yet.</p>
                    ) : (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-muted-foreground">
                            <th className="text-left py-1 pr-4">Event</th>
                            <th className="text-left py-1 pr-4">Status</th>
                            <th className="text-left py-1 pr-4">Response</th>
                            <th className="text-left py-1">Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {deliveries[wh.id].map(d => (
                            <tr key={d.id}>
                              <td className="py-1.5 pr-4 font-mono">{d.event}</td>
                              <td className="py-1.5 pr-4">
                                <span className={`px-1.5 py-0.5 rounded ${d.succeeded ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                  {d.statusCode ?? 'ERR'}
                                </span>
                              </td>
                              <td className="py-1.5 pr-4 max-w-xs truncate text-muted-foreground">
                                {d.responseBody || '—'}
                              </td>
                              <td className="py-1.5 text-muted-foreground">
                                {new Date(d.attemptedAt).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-3">Verifying signatures</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Every delivery includes an <code className="text-xs bg-muted px-1 py-0.5 rounded">X-Webhook-Signature</code> header.
            Verify it using your signing secret:
          </p>
          <pre className="bg-muted rounded p-4 text-sm font-mono overflow-x-auto">{`// Node.js example
const crypto = require('crypto');

function verify(secret, payload, signature) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature), Buffer.from(expected)
  );
}`}</pre>
        </CardContent>
      </Card>
    </div>
  );
}
