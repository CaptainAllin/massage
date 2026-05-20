import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Client, ClientFilters, ApiResponse, PaginatedResponse } from '@massage/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Fetch all clients
export function useClients(businessId: string, filters?: ClientFilters) {
  return useQuery({
    queryKey: ['clients', businessId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        businessId,
        ...(filters?.isActive !== undefined && { isActive: String(filters.isActive) }),
        ...(filters?.search && { search: filters.search }),
        ...(filters?.page && { page: String(filters.page) }),
        ...(filters?.limit && { limit: String(filters.limit) }),
      });

      const response = await fetch(`${API_URL}/clients?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch clients');
      const data: ApiResponse<Client[]> = await response.json();
      return data.data;
    },
    enabled: !!businessId,
  });
}

// Fetch single client
export function useClient(clientId: string, businessId: string) {
  return useQuery({
    queryKey: ['client', clientId, businessId],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/clients/${clientId}?businessId=${businessId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch client');
      const data: ApiResponse<Client> = await response.json();
      return data.data;
    },
    enabled: !!clientId && !!businessId,
  });
}

// Create client mutation
export function useCreateClient(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientData: Partial<Client>) => {
      const response = await fetch(`${API_URL}/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ businessId, ...clientData }),
      });

      if (!response.ok) throw new Error('Failed to create client');
      const data: ApiResponse<Client> = await response.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', businessId] });
    },
  });
}

// Update client mutation
export function useUpdateClient(clientId: string, businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientData: Partial<Client>) => {
      const response = await fetch(
        `${API_URL}/clients/${clientId}?businessId=${businessId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(clientData),
        }
      );

      if (!response.ok) throw new Error('Failed to update client');
      const data: ApiResponse<Client> = await response.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', clientId, businessId] });
      queryClient.invalidateQueries({ queryKey: ['clients', businessId] });
    },
  });
}

// Delete client mutation
export function useDeleteClient(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientId: string) => {
      const response = await fetch(
        `${API_URL}/clients/${clientId}?businessId=${businessId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to delete client');
      const data: ApiResponse<Client> = await response.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', businessId] });
    },
  });
}
