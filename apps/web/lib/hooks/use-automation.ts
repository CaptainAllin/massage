import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useAutomationRules(businessId: string | undefined) {
  return useQuery({
    queryKey: ['automation', businessId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/automation?businessId=${businessId}`);
      return data as { rules: any[] };
    },
    enabled: !!businessId,
  });
}

export function useCreateAutomationRule(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; trigger: string; conditions?: any; actions: any[] }) => {
      const res = await apiClient.post('/automation', { ...data, businessId });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['automation', businessId] }),
  });
}

export function useUpdateAutomationRule(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; description?: string; trigger?: string; conditions?: any; actions?: any[] }) => {
      const res = await apiClient.patch(`/automation/${id}`, data);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['automation', businessId] }),
  });
}

export function useToggleAutomationRule(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/automation/${id}/toggle`, {});
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['automation', businessId] }),
  });
}

export function useDeleteAutomationRule(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/automation/${id}`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['automation', businessId] }),
  });
}

export function useAutomationLogs(businessId: string | undefined, page = 1) {
  return useQuery({
    queryKey: ['automation-logs', businessId, page],
    queryFn: async () => {
      const { data } = await apiClient.get(`/automation/logs?businessId=${businessId}&page=${page}&limit=50`);
      return data as { logs: any[]; meta: { page: number; limit: number; total: number; totalPages: number } };
    },
    enabled: !!businessId,
  });
}

export function useRerunAutomation(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (logId: string) => {
      const res = await apiClient.post('/automation/logs/rerun', { logId });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['automation-logs', businessId] }),
  });
}
