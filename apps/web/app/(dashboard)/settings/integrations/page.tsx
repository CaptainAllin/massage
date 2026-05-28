'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, CardContent } from '@massage/ui';
import {
  ArrowLeft, X, RefreshCw, Link2, Link2Off, AlertTriangle,
  ChevronDown, ChevronUp, Loader2, GitMerge, ArrowUpDown, Webhook, Key, Hash
} from 'lucide-react';
import Link from 'next/link';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { apiClient } from '@/lib/api-client';

type IntegrationStatus = 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
type Provider = 'XERO' | 'QUICKBOOKS';

interface Integration {
  id: string;
  provider: Provider;
  status: IntegrationStatus;
  tenantName: string | null;
  lastSyncAt: string | null;
  syncEnabled: boolean;
}

interface SyncLog {
  id: string;
  entityType: string;
  entityId: string;
  externalId: string | null;
  direction: 'OUTBOUND' | 'INBOUND';
  status: string;
  errorMessage: string | null;
  createdAt: string;
  integration: { provider: Provider; tenantName: string | null };
}

interface Conflict extends SyncLog {
  localSnapshot: any;
  externalSnapshot: any;
  resolvedBy: string | null;
  resolvedAt: string | null;
}

function statusColor(status: IntegrationStatus) {
  if (status === 'CONNECTED') return '#16a34a';
  if (status === 'ERROR') return '#dc2626';
  return '#6b7280';
}

function statusLabel(status: IntegrationStatus) {
  if (status === 'CONNECTED') return 'Connected';
  if (status === 'ERROR') return 'Error';
  return 'Not connected';
}

function syncLogStatusColor(status: string) {
  switch (status) {
    case 'SUCCESS': return '#16a34a';
    case 'FAILED': return '#dc2626';
    case 'CONFLICT': return '#d97706';
    case 'RESOLVED': return '#2563eb';
    default: return '#6b7280';
  }
}

// ─── Conflict Resolution Modal ────────────────────────────────────────────────

function ConflictModal({
  conflict,
  onResolve,
  onClose,
}: {
  conflict: Conflict;
  onResolve: (winner: 'local' | 'external') => Promise<void>;
  onClose: () => void;
}) {
  const [resolving, setResolving] = useState<'local' | 'external' | null>(null);

  const local = conflict.localSnapshot || {};
  const external = conflict.externalSnapshot || {};
  const providerLabel = conflict.integration.provider === 'XERO' ? 'Xero' : 'QuickBooks';

  const handleResolve = async (winner: 'local' | 'external') => {
    setResolving(winner);
    try {
      await onResolve(winner);
    } finally {
      setResolving(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold">Resolve Sync Conflict</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Both the local record and {providerLabel} were modified after the last sync.
            Choose which version to keep — the other will be discarded.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border-2 border-border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Local (this app)</span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleResolve('local')}
                  disabled={!!resolving}
                >
                  {resolving === 'local' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Keep this'}
                </Button>
              </div>
              <pre className="text-xs bg-muted p-2 rounded-lg overflow-auto max-h-48">
                {JSON.stringify(local, null, 2)}
              </pre>
            </div>

            <div className="rounded-xl border-2 border-border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{providerLabel}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleResolve('external')}
                  disabled={!!resolving}
                >
                  {resolving === 'external' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Keep this'}
                </Button>
              </div>
              <pre className="text-xs bg-muted p-2 rounded-lg overflow-auto max-h-48">
                {JSON.stringify(external, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Provider Card ────────────────────────────────────────────────────────────

function ProviderCard({
  provider,
  logo,
  description,
  integration,
  onConnect,
  onDisconnect,
  onSync,
  loading,
}: {
  provider: Provider;
  logo: React.ReactNode;
  description: string;
  integration: Integration | undefined;
  onConnect: () => void;
  onDisconnect: () => Promise<void>;
  onSync: () => Promise<void>;
  loading: boolean;
}) {
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncResult, setSyncResult] = useState<{ synced: number; failed: number } | null>(null);

  const status = integration?.status ?? 'DISCONNECTED';
  const isConnected = status === 'CONNECTED';

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      await onSync();
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm(`Disconnect ${provider === 'XERO' ? 'Xero' : 'QuickBooks'}? Sync will stop.`)) return;
    setDisconnecting(true);
    try {
      await onDisconnect();
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted text-lg font-bold">
              {logo}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">
                  {provider === 'XERO' ? 'Xero' : 'QuickBooks'}
                </h3>
                <span
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: isConnected ? '#dcfce7' : status === 'ERROR' ? '#fef2f2' : '#f3f4f6',
                    color: statusColor(status),
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: statusColor(status) }}
                  />
                  {statusLabel(status)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {isConnected ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSync}
                  disabled={syncing}
                >
                  {syncing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Force sync
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                >
                  {disconnecting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Link2Off className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Disconnect
                </Button>
              </>
            ) : (
              <Button variant="primary" size="sm" onClick={onConnect} disabled={loading}>
                <Link2 className="h-3.5 w-3.5 mr-1.5" />
                Connect
              </Button>
            )}
          </div>
        </div>

        {isConnected && integration && (
          <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">Organisation</span>
              <p className="font-medium mt-0.5">{integration.tenantName || 'Unknown'}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Last synced</span>
              <p className="font-medium mt-0.5">
                {integration.lastSyncAt
                  ? new Date(integration.lastSyncAt).toLocaleString()
                  : 'Never'}
              </p>
            </div>
          </div>
        )}

        {syncResult && (
          <div className="mt-3 text-xs px-3 py-2 rounded-lg bg-muted">
            Sync complete: {syncResult.synced} succeeded, {syncResult.failed} failed
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Slack Card ───────────────────────────────────────────────────────────────

function SlackCard({ businessId }: { businessId: string }) {
  const [connected, setConnected] = useState(false);
  const [channel, setChannel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await apiClient.get(`/api/integrations/slack/status?businessId=${businessId}`);
      setConnected(res.data?.data?.connected ?? false);
      setChannel(res.data?.data?.channel ?? null);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // Handle OAuth callback result
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const slackResult = params.get('slack');
    if (slackResult) {
      fetchStatus();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [fetchStatus]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await apiClient.get(`/api/integrations/slack/connect?businessId=${businessId}`);
      if (res.data?.data?.authUrl) window.location.href = res.data.data.authUrl;
    } catch {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Slack? Automation Slack actions will stop working.')) return;
    setDisconnecting(true);
    try {
      await apiClient.post('/api/integrations/slack/disconnect', { businessId });
      setConnected(false);
      setChannel(null);
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted">
              <Hash className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">Slack</h3>
                {!loading && (
                  <span
                    className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: connected ? '#dcfce7' : '#f3f4f6',
                      color: connected ? '#16a34a' : '#6b7280',
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: connected ? '#16a34a' : '#6b7280' }} />
                    {connected ? 'Connected' : 'Not connected'}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Send Slack messages from automation rules. Used by the SEND_SLACK action.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : connected ? (
              <Button variant="outline" size="sm" onClick={handleDisconnect} disabled={disconnecting}>
                {disconnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Link2Off className="h-3.5 w-3.5 mr-1.5" />}
                Disconnect
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={handleConnect} disabled={connecting}>
                {connecting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Link2 className="h-3.5 w-3.5 mr-1.5" />}
                Connect
              </Button>
            )}
          </div>
        </div>

        {connected && channel && (
          <div className="mt-4 pt-4 border-t border-border text-sm">
            <span className="text-muted-foreground text-xs">Default channel</span>
            <p className="font-medium mt-0.5 font-mono">{channel}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const businessId = useBusinessId();

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [, setLoadingIntegrations] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [activeConflict, setActiveConflict] = useState<Conflict | null>(null);
  const [logsExpanded, setLogsExpanded] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState<Provider | null>(null);

  const fetchIntegrations = useCallback(async () => {
    if (!businessId) return;
    try {
      const res = await apiClient.get(`/api/integrations?businessId=${businessId}`);
      setIntegrations(res.data?.data || []);
    } finally {
      setLoadingIntegrations(false);
    }
  }, [businessId]);

  const fetchLogs = useCallback(async () => {
    if (!businessId) return;
    try {
      const [logsRes, conflictsRes] = await Promise.all([
        apiClient.get(`/api/integrations/sync-logs?businessId=${businessId}&limit=20`),
        apiClient.get(`/api/integrations/conflicts?businessId=${businessId}`),
      ]);
      setSyncLogs(logsRes.data?.data?.logs || []);
      setConflicts(conflictsRes.data?.data || []);
    } finally {
      setLoadingLogs(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchIntegrations();
    fetchLogs();
  }, [fetchIntegrations, fetchLogs]);

  // Handle OAuth callback query params on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const xeroResult = params.get('xero');
    const qbResult = params.get('quickbooks');
    if (xeroResult || qbResult) {
      fetchIntegrations();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [fetchIntegrations]);

  const handleConnect = async (provider: Provider) => {
    if (!businessId) return;
    setConnectingProvider(provider);
    try {
      const endpoint = provider === 'XERO' ? '/api/integrations/xero/connect' : '/api/integrations/quickbooks/connect';
      const res = await apiClient.get(`${endpoint}?businessId=${businessId}`);
      if (res.data?.data?.authUrl) {
        window.location.href = res.data.data.authUrl;
      }
    } catch {
      setConnectingProvider(null);
    }
  };

  const handleDisconnect = async (provider: Provider) => {
    if (!businessId) return;
    const endpoint = provider === 'XERO' ? '/api/integrations/xero/disconnect' : '/api/integrations/quickbooks/disconnect';
    await apiClient.post(endpoint, { businessId });
    await fetchIntegrations();
  };

  const handleSync = async (provider: Provider) => {
    if (!businessId) return;
    const endpoint = provider === 'XERO' ? '/api/integrations/xero/sync' : '/api/integrations/quickbooks/sync';
    await apiClient.post(endpoint, { businessId });
    await Promise.all([fetchIntegrations(), fetchLogs()]);
  };

  const handleResolveConflict = async (winner: 'local' | 'external') => {
    if (!activeConflict || !businessId) return;
    await apiClient.post('/api/integrations/conflicts', {
      businessId,
      conflictId: activeConflict.id,
      winner,
    });
    setActiveConflict(null);
    await fetchLogs();
  };

  const getIntegration = (provider: Provider) => integrations.find((i) => i.provider === provider);

  const xeroIntegration = getIntegration('XERO');
  const qbIntegration = getIntegration('QUICKBOOKS');

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Connect your accounting software for two-way invoice and payment sync.
          </p>
        </div>
      </div>

      {/* Conflicts banner */}
      {conflicts.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              {conflicts.length} sync conflict{conflicts.length !== 1 ? 's' : ''} need attention
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
              Both the local record and your accounting software were modified. Review and resolve below.
            </p>
          </div>
        </div>
      )}

      {/* Provider cards */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Accounting</h2>
        <ProviderCard
          provider="XERO"
          logo="X"
          description="Two-way invoice and payment sync with Xero. Changes in either system sync automatically via webhook."
          integration={xeroIntegration}
          onConnect={() => handleConnect('XERO')}
          onDisconnect={() => handleDisconnect('XERO')}
          onSync={() => handleSync('XERO')}
          loading={connectingProvider === 'XERO'}
        />

        <ProviderCard
          provider="QUICKBOOKS"
          logo="QB"
          description="Two-way invoice and payment sync with QuickBooks Online. Real-time updates via webhook."
          integration={qbIntegration}
          onConnect={() => handleConnect('QUICKBOOKS')}
          onDisconnect={() => handleDisconnect('QUICKBOOKS')}
          onSync={() => handleSync('QUICKBOOKS')}
          loading={connectingProvider === 'QUICKBOOKS'}
        />
      </div>

      {/* Messaging integrations */}
      {businessId && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Messaging</h2>
          <SlackCard businessId={businessId} />
        </div>
      )}

      {/* Developer tools */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Developer Tools</h2>
        <div className="grid grid-cols-2 gap-4">
          <Link href="/settings/integrations/webhooks">
            <Card className="cursor-pointer hover:bg-muted/40 transition-colors">
              <CardContent className="p-5 flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted">
                  <Webhook className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-sm">Webhooks</p>
                  <p className="text-xs text-muted-foreground">Receive real-time events</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/settings/api">
            <Card className="cursor-pointer hover:bg-muted/40 transition-colors">
              <CardContent className="p-5 flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-sm">API Keys</p>
                  <p className="text-xs text-muted-foreground">Manage developer access</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Conflicts list */}
      {conflicts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <GitMerge className="h-4 w-4 text-amber-500" />
            Pending Conflicts
          </h2>
          {conflicts.map((conflict) => (
            <div
              key={conflict.id}
              className="rounded-xl border border-amber-200 dark:border-amber-800 p-4 flex items-center justify-between gap-4"
            >
              <div className="space-y-0.5">
                <p className="text-sm font-medium">
                  {conflict.entityType} — {conflict.entityId.slice(0, 8)}…
                </p>
                <p className="text-xs text-muted-foreground">
                  {conflict.integration.provider === 'XERO' ? 'Xero' : 'QuickBooks'}
                  {' · '}
                  {new Date(conflict.createdAt).toLocaleString()}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveConflict(conflict)}
              >
                Resolve
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Sync logs */}
      <div className="space-y-3">
        <button
          className="flex items-center gap-2 text-sm font-semibold text-foreground w-full text-left"
          onClick={() => setLogsExpanded((v) => !v)}
        >
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          Sync Logs
          {logsExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground ml-auto" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto" />
          )}
        </button>

        {logsExpanded && (
          <div className="rounded-xl border border-border overflow-hidden">
            {loadingLogs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : syncLogs.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No sync events yet
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Entity</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Provider</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Direction</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {syncLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-xs">
                        {log.entityType} {log.entityId.slice(0, 8)}…
                      </td>
                      <td className="px-4 py-2.5 text-xs">
                        {log.integration.provider === 'XERO' ? 'Xero' : 'QuickBooks'}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        {log.direction === 'OUTBOUND' ? '→ Out' : '← In'}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: `${syncLogStatusColor(log.status)}18`,
                            color: syncLogStatusColor(log.status),
                          }}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Conflict resolution modal */}
      {activeConflict && (
        <ConflictModal
          conflict={activeConflict}
          onResolve={handleResolveConflict}
          onClose={() => setActiveConflict(null)}
        />
      )}
    </div>
  );
}
