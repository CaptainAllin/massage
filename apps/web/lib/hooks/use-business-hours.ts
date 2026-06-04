import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface BusinessHoursDay {
  id: string | null;
  businessId: string;
  locationId: string | null;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface BusinessClosure {
  id: string;
  businessId: string;
  date: string;
  reason: string | null;
  notifyClients: boolean;
  isRecurringAnnual: boolean;
  createdAt: string;
}

export function useBusinessHours(businessId: string | undefined, locationId?: string | null) {
  return useQuery({
    queryKey: ['business-hours', businessId, locationId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (locationId) params.set('locationId', locationId);
      const r = await apiClient.get<{ success: boolean; data: BusinessHoursDay[] }>(
        `/businesses/${businessId}/hours${params.toString() ? `?${params}` : ''}`
      );
      return r.data.data;
    },
    enabled: !!businessId,
  });
}

export function useUpdateBusinessHours(businessId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (days: Omit<BusinessHoursDay, 'id' | 'businessId'>[]) => {
      const r = await apiClient.put<{ success: boolean; data: BusinessHoursDay[] }>(
        `/businesses/${businessId}/hours`,
        days
      );
      return r.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['business-hours', businessId] });
    },
  });
}

export function useBusinessClosures(businessId: string | undefined) {
  return useQuery({
    queryKey: ['business-closures', businessId],
    queryFn: async () => {
      const r = await apiClient.get<{ success: boolean; data: BusinessClosure[] }>(
        `/businesses/${businessId}/closures`
      );
      return r.data.data;
    },
    enabled: !!businessId,
  });
}

export function useCreateBusinessClosure(businessId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { date: string; reason?: string; notifyClients?: boolean; isRecurringAnnual?: boolean }) => {
      const r = await apiClient.post<{ success: boolean; data: BusinessClosure }>(
        `/businesses/${businessId}/closures`,
        data
      );
      return r.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['business-closures', businessId] });
    },
  });
}

export function useDeleteBusinessClosure(businessId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (closureId: string) => {
      const r = await apiClient.delete<{ success: boolean; data: { deleted: boolean } }>(
        `/businesses/${businessId}/closures/${closureId}`
      );
      return r.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['business-closures', businessId] });
    },
  });
}
