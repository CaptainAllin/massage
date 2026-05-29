import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Client, ClientFilters, ApiResponse } from '@massage/types';
import { apiClient } from '@/lib/api-client';

export type ClientFilterType = 'all' | 'vip' | 'new' | 'due' | 'inactive';

export interface ClientCounts {
  all: number;
  vip: number;
  newThisMonth: number;
  dueForVisit: number;
  inactive60d: number;
}

// Fetch all clients (returns array — backwards-compatible)
export function useClients(businessId: string | undefined, filters?: ClientFilters) {
  return useQuery({
    queryKey: ['clients', businessId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        businessId: businessId!,
        ...(filters?.isActive !== undefined && { isActive: String(filters.isActive) }),
        ...(filters?.search && { search: filters.search }),
        ...(filters?.page && { page: String(filters.page) }),
        ...(filters?.limit && { limit: String(filters.limit) }),
      });
      const response = await apiClient.get<ApiResponse<Client[]>>(`/clients?${params}`);
      return response.data.data;
    },
    enabled: !!businessId,
  });
}

// Fetch clients with meta + filter support (used by clients page)
// Also returns counts so a second API call is not needed.
export function useClientsWithMeta(
  businessId: string | undefined,
  filters?: { search?: string; page?: number; limit?: number; filter?: ClientFilterType }
) {
  return useQuery({
    queryKey: ['clients-meta', businessId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({ businessId: businessId! });
      if (filters?.search) params.set('search', filters.search);
      if (filters?.page) params.set('page', String(filters.page));
      if (filters?.limit) params.set('limit', String(filters.limit));
      if (filters?.filter && filters.filter !== 'all') params.set('filter', filters.filter);

      const response = await apiClient.get<any>(`/clients?${params}`);
      return {
        data: response.data.data as Client[],
        meta: response.data.meta as { page: number; limit: number; total: number; totalPages: number },
        counts: response.data.counts as ClientCounts | undefined,
      };
    },
    enabled: !!businessId,
    staleTime: 30_000,
  });
}

// Fetch filter counts for the filter chips (kept for backwards compat; prefer useClientsWithMeta.counts)
export function useClientCounts(businessId: string | undefined) {
  return useQuery({
    queryKey: ['clients-counts', businessId],
    queryFn: async () => {
      const params = new URLSearchParams({ businessId: businessId! });
      const response = await apiClient.get<any>(`/clients?${params}&limit=1&page=1`);
      return response.data.counts as ClientCounts;
    },
    enabled: !!businessId,
    staleTime: 60_000,
  });
}

// Fetch single client
export function useClient(clientId: string, businessId: string | undefined) {
  return useQuery({
    queryKey: ['client', clientId, businessId],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Client>>(
        `/clients/${clientId}?businessId=${businessId}`
      );
      return response.data.data;
    },
    enabled: !!clientId && !!businessId,
  });
}

// Create client mutation
export function useCreateClient(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientData: Partial<Client>) => {
      const response = await apiClient.post<ApiResponse<Client>>('/clients', {
        businessId,
        ...clientData,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', businessId] });
    },
  });
}

// Update client mutation
export function useUpdateClient(clientId: string, businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientData: Partial<Client>) => {
      const response = await apiClient.patch<ApiResponse<Client>>(
        `/clients/${clientId}?businessId=${businessId}`,
        clientData
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', clientId, businessId] });
      queryClient.invalidateQueries({ queryKey: ['clients', businessId] });
    },
  });
}

// Delete client mutation
export function useDeleteClient(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientId: string) => {
      const response = await apiClient.delete<ApiResponse<Client>>(
        `/clients/${clientId}?businessId=${businessId}`
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', businessId] });
    },
  });
}
