import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface MessageLogFilters {
  channel?: string;
  status?: string;
  clientId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

async function fetchMessageLogs(businessId: string, filters: MessageLogFilters = {}) {
  const params = new URLSearchParams({ businessId });
  if (filters.channel) params.set('channel', filters.channel);
  if (filters.status) params.set('status', filters.status);
  if (filters.clientId) params.set('clientId', filters.clientId);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));

  const res = await fetch(`/api/message-logs?${params}`);
  if (!res.ok) throw new Error('Failed to fetch message logs');
  return res.json();
}

export function useMessageLogs(businessId: string | null | undefined, filters: MessageLogFilters = {}) {
  return useQuery({
    queryKey: ['message-logs', businessId, filters],
    queryFn: () => fetchMessageLogs(businessId!, filters),
    enabled: !!businessId,
    refetchInterval: 30000,
  });
}

export function useRetryMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch('/api/message-logs/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Retry failed');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['message-logs'] }),
  });
}

export function useResolveMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch('/api/message-logs/retry', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'resolve' }),
      });
      if (!res.ok) throw new Error('Resolve failed');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['message-logs'] }),
  });
}
