import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function usePayrollPeriods(businessId: string | undefined) {
  return useQuery({
    queryKey: ['payroll', businessId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/payroll?businessId=${businessId}`);
      return data as { periods: any[] };
    },
    enabled: !!businessId,
  });
}

export function usePayrollPeriod(id: string | undefined) {
  return useQuery({
    queryKey: ['payroll-period', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/payroll/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreatePayrollPeriod(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { startDate: string; endDate: string; notes?: string }) => {
      const res = await apiClient.post('/payroll', { ...data, businessId });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payroll', businessId] }),
  });
}

export function useUpdatePayrollPeriod(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; status?: string; notes?: string; paidAt?: string | null }) => {
      const res = await apiClient.patch(`/payroll/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll', businessId] });
    },
  });
}

export function useDeletePayrollPeriod(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/payroll/${id}`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payroll', businessId] }),
  });
}

export function useUpdatePayrollRecord(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ periodId, recordId, ...data }: { periodId: string; recordId: string; bonusAmount?: number; deductions?: number; commissionRate?: number; notes?: string }) => {
      const res = await apiClient.patch(`/payroll/${periodId}/records`, { recordId, ...data });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payroll', businessId] }),
  });
}
