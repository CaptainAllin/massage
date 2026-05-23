import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// --- Insurance Providers ---

export function useInsuranceProviders(businessId: string | undefined) {
  return useQuery({
    queryKey: ['insurance-providers', businessId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/insurance/providers?businessId=${businessId}`);
      return data as { providers: any[] };
    },
    enabled: !!businessId,
  });
}

export function useCreateInsuranceProvider(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/insurance/providers', { ...data, businessId });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['insurance-providers', businessId] }),
  });
}

export function useUpdateInsuranceProvider(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await apiClient.patch(`/insurance/providers/${id}`, data);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['insurance-providers', businessId] }),
  });
}

export function useDeleteInsuranceProvider(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/insurance/providers/${id}`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['insurance-providers', businessId] }),
  });
}

// --- Insurance Claims ---

export function useInsuranceClaims(businessId: string | undefined, filters?: { status?: string; clientId?: string }) {
  const params = new URLSearchParams({ businessId: businessId ?? '' });
  if (filters?.status) params.set('status', filters.status);
  if (filters?.clientId) params.set('clientId', filters.clientId);

  return useQuery({
    queryKey: ['insurance-claims', businessId, filters],
    queryFn: async () => {
      const { data } = await apiClient.get(`/insurance/claims?${params.toString()}`);
      return data as { claims: any[] };
    },
    enabled: !!businessId,
  });
}

export function useInsuranceClaim(id: string | undefined) {
  return useQuery({
    queryKey: ['insurance-claim', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/insurance/claims/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useClaimCMS1500(id: string | undefined) {
  return useQuery({
    queryKey: ['insurance-claim-cms1500', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/insurance/claims/${id}/cms1500`);
      return data as { cms1500: any };
    },
    enabled: !!id,
  });
}

export function useCreateInsuranceClaim(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/insurance/claims', { ...data, businessId });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['insurance-claims', businessId] }),
  });
}

export function useUpdateInsuranceClaim(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await apiClient.patch(`/insurance/claims/${id}`, data);
      return res.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['insurance-claims', businessId] });
      queryClient.invalidateQueries({ queryKey: ['insurance-claim', id] });
    },
  });
}

export function useDeleteInsuranceClaim(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/insurance/claims/${id}`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['insurance-claims', businessId] }),
  });
}

// --- Reimbursements ---

export function useClaimReimbursements(businessId: string | undefined, claimId?: string) {
  const params = new URLSearchParams({ businessId: businessId ?? '' });
  if (claimId) params.set('claimId', claimId);

  return useQuery({
    queryKey: ['claim-reimbursements', businessId, claimId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/insurance/reimbursements?${params.toString()}`);
      return data as { reimbursements: any[] };
    },
    enabled: !!businessId,
  });
}

export function useCreateReimbursement(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/insurance/reimbursements', { ...data, businessId });
      return res.data;
    },
    onSuccess: (_, { claimId }) => {
      queryClient.invalidateQueries({ queryKey: ['claim-reimbursements', businessId] });
      queryClient.invalidateQueries({ queryKey: ['insurance-claims', businessId] });
      queryClient.invalidateQueries({ queryKey: ['insurance-claim', claimId] });
    },
  });
}

export function useUpdateReimbursement(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await apiClient.patch(`/insurance/reimbursements/${id}`, data);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['claim-reimbursements', businessId] }),
  });
}
