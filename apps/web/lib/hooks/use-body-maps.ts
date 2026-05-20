import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BodyMap, BodyMapFilters, ApiResponse } from '@massage/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Fetch all body maps
export function useBodyMaps(businessId: string, filters?: BodyMapFilters) {
  return useQuery({
    queryKey: ['body-maps', businessId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        businessId,
        ...(filters?.clientId && { clientId: filters.clientId }),
        ...(filters?.appointmentId && { appointmentId: filters.appointmentId }),
        ...(filters?.treatmentNoteId && { treatmentNoteId: filters.treatmentNoteId }),
        ...(filters?.view && { view: filters.view }),
        ...(filters?.page && { page: String(filters.page) }),
        ...(filters?.limit && { limit: String(filters.limit) }),
      });

      const response = await fetch(`${API_URL}/body-maps?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch body maps');
      return await response.json();
    },
    enabled: !!businessId,
  });
}

// Fetch single body map
export function useBodyMap(bodyMapId: string, businessId: string) {
  return useQuery({
    queryKey: ['body-map', bodyMapId, businessId],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/body-maps/${bodyMapId}?businessId=${businessId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch body map');
      const data: ApiResponse<BodyMap> = await response.json();
      return data.data;
    },
    enabled: !!bodyMapId && !!businessId,
  });
}

// Create body map mutation
export function useCreateBodyMap(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bodyMapData: {
      clientId: string;
      appointmentId?: string;
      treatmentNoteId?: string;
      view: string;
      regions: any[];
      notes?: string;
    }) => {
      const response = await fetch(`${API_URL}/body-maps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ businessId, ...bodyMapData }),
      });

      if (!response.ok) throw new Error('Failed to create body map');
      const data: ApiResponse<BodyMap> = await response.json();
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['body-maps', businessId] });
      if (variables.clientId) {
        queryClient.invalidateQueries({ queryKey: ['body-maps', businessId, { clientId: variables.clientId }] });
      }
    },
  });
}

// Update body map mutation
export function useUpdateBodyMap(bodyMapId: string, businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bodyMapData: {
      view?: string;
      regions?: any[];
      notes?: string;
    }) => {
      const response = await fetch(
        `${API_URL}/body-maps/${bodyMapId}?businessId=${businessId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(bodyMapData),
        }
      );

      if (!response.ok) throw new Error('Failed to update body map');
      const data: ApiResponse<BodyMap> = await response.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['body-map', bodyMapId, businessId] });
      queryClient.invalidateQueries({ queryKey: ['body-maps', businessId] });
    },
  });
}

// Delete body map mutation
export function useDeleteBodyMap(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bodyMapId: string) => {
      const response = await fetch(
        `${API_URL}/body-maps/${bodyMapId}?businessId=${businessId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to delete body map');
      const data: ApiResponse<BodyMap> = await response.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['body-maps', businessId] });
    },
  });
}
