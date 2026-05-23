import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Client, ClientFilters, ApiResponse } from '@massage/types';
import { apiClient } from '@/lib/api-client';

// Fetch all clients
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
