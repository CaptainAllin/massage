'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, CardContent, Input } from '@massage/ui';
import { Key, Plus, Trash2, Copy, AlertTriangle, Check, Code, ExternalLink } from 'lucide-react';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { apiClient } from '@/lib/api-client';

interface ApiKey {
  id: string;
  name: string;
  permissions: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

const SCOPE_LABELS: Record<string, string> = {
  'appointments:read': 'Read Appointments',
  'appointments:write': 'Write Appointments',
  'clients:read': 'Read Clients',
  'clients:write': 'Write Clients',
  'invoices:read': 'Read Invoices',
  'invoices:write': 'Write Invoices',
  'treatment-notes:read': 'Read Treatment Notes',
  'treatment-notes:write': 'Write Treatment Notes',
};

export default function ApiKeysPage() {
  const businessId = useBusinessId();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [scopes, setScopes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState<{ key: string; name: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [form, setForm] = useState({ name: '', permissions: [] as string[], expiresInDays: '' });

  const load = useCallback(async () => {
    if (!businessId) return;
    try {
      const res = await apiClient.get(`/api-keys?businessId=${businessId}`);
      setKeys(res.data.data.keys);
      setScopes(res.data.data.scopes);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => { load(); }, [load]);

  const toggleScope = (scope: string) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(scope)
        ? f.permissions.filter(p => p !== scope)
        : [...f.permissions, scope],
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId || !form.name) return;
    setCreating(true);
    try {
      const res = await apiClient.post('/api-keys', {
        businessId,
        name: form.name,
        permissions: form.permissions,
        expiresInDays: form.expiresInDays ? parseInt(form.expiresInDays) : undefined,
      });
      setNewKey({ key: res.data.data.key, name: form.name });
      setForm({ name: '', permissions: [], expiresInDays: '' });
      setShowCreate(false);
      load();
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Revoke this API key? This cannot be undone.')) return;
    await apiClient.delete(`/api-keys/${id}`);
    setKeys(k => k.filter(key => key.id !== id));
  };

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Key className="h-6 w-6" /> Developer API
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage API keys and access the developer documentation.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/api/developer/openapi"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm">
              <Code className="h-4 w-4 mr-2" /> OpenAPI Spec <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </a>
          <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" /> New API Key
          </Button>
        </div>
      </div>

      {newKey && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-green-800 dark:text-green-200">
                  API key created — copy it now
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-0.5">
                  This key is shown only once. Store it securely.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <code className="flex-1 bg-white dark:bg-gray-900 border rounded px-3 py-2 text-sm font-mono break-all">
                    {newKey.key}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copy(newKey.key, 'new')}
                  >
                    {copiedId === 'new' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setNewKey(null)}>
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {showCreate && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Create API Key</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Key name</label>
                <Input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Zapier Integration"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Permissions</label>
                <div className="grid grid-cols-2 gap-2">
                  {scopes.map(scope => (
                    <label key={scope} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={form.permissions.includes(scope)}
                        onChange={() => toggleScope(scope)}
                        className="rounded"
                      />
                      {SCOPE_LABELS[scope] || scope}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Leave empty to grant read-only access to all resources.</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expires in (days, optional)</label>
                <Input
                  type="number"
                  value={form.expiresInDays}
                  onChange={e => setForm(f => ({ ...f, expiresInDays: e.target.value }))}
                  placeholder="e.g. 365"
                  min="1"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="primary" disabled={creating}>
                  {creating ? 'Creating…' : 'Create Key'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading…</p>
          ) : keys.length === 0 ? (
            <div className="p-10 text-center">
              <Key className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No API keys yet. Create one to get started.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Permissions</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Last used</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Expires</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {keys.map(key => (
                  <tr key={key.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{key.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {(key.permissions as string[]).length === 0
                        ? 'All (read-only)'
                        : (key.permissions as string[]).map(p => SCOPE_LABELS[p] || p).join(', ')}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {key.expiresAt ? new Date(key.expiresAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${key.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {key.isActive ? 'Active' : 'Revoked'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevoke(key.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-3">Authentication</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Include your API key in the <code className="text-xs bg-muted px-1 py-0.5 rounded">Authorization</code> header:
          </p>
          <div className="relative">
            <pre className="bg-muted rounded p-4 text-sm font-mono overflow-x-auto">
              {`curl https://your-domain.com/api/appointments?businessId=... \\
  -H "Authorization: ApiKey mk_your_key_here"`}
            </pre>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => copy('Authorization: ApiKey mk_your_key_here', 'curl')}
            >
              {copiedId === 'curl' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            <strong>Rate limit:</strong> 1,000 requests per hour per key.
            View the full <a href="/api/developer/openapi" target="_blank" className="text-primary hover:underline">OpenAPI specification</a> for all available endpoints.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
