import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

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
  const r = await apiClient.get(`/tasks?${params}`);
  return r.data;
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
      const r = await apiClient.post('/tasks', data);
      return r.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Record<string, any>) => {
      const r = await apiClient.patch(`/tasks/${id}`, data);
      return r.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, businessId }: { id: string; businessId: string }) => {
      const r = await apiClient.delete(`/tasks/${id}?businessId=${businessId}`);
      return r.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}
