import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface TaskFilters {
  assignedToId?: string;
  status?: string;
  priority?: string;
  dueBefore?: string;
  dueAfter?: string;
  relatedClientId?: string;
  page?: number;
  limit?: number;
}

async function fetchTasks(businessId: string, filters: TaskFilters = {}) {
  const params = new URLSearchParams({ businessId });
  if (filters.assignedToId) params.set('assignedToId', filters.assignedToId);
  if (filters.status) params.set('status', filters.status);
  if (filters.priority) params.set('priority', filters.priority);
  if (filters.dueBefore) params.set('dueBefore', filters.dueBefore);
  if (filters.dueAfter) params.set('dueAfter', filters.dueAfter);
  if (filters.relatedClientId) params.set('relatedClientId', filters.relatedClientId);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  const r = await fetch(`/api/tasks?${params}`);
  if (!r.ok) throw new Error('Failed to fetch tasks');
  return r.json();
}

export function useTasks(businessId: string | null | undefined, filters: TaskFilters = {}) {
  return useQuery({
    queryKey: ['tasks', businessId, filters],
    queryFn: () => fetchTasks(businessId!, filters),
    enabled: !!businessId,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const r = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error('Failed to create task');
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Record<string, any>) => {
      const r = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error('Failed to update task');
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, businessId }: { id: string; businessId: string }) => {
      const r = await fetch(`/api/tasks/${id}?businessId=${businessId}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('Failed to delete task');
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}
