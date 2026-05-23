import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Promotion {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP';
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'CANCELLED';
  subject: string | null;
  body: string;
  recipientFilter: RecipientFilter;
  scheduledFor: string | null;
  sentAt: string | null;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalConverted: number;
  createdAt: string;
  updatedAt: string;
  _count?: { recipients: number };
}

export interface RecipientFilter {
  type: 'all' | 'inactive' | 'custom';
  daysInactive?: number;
  clientIds?: string[];
}

export interface PromotionAnalytics {
  promotionId: string;
  name: string;
  status: string;
  channel: string;
  totalRecipients: number;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalConverted: number;
  byStatus: Record<string, number>;
  openRate: number;
  clickRate: number;
  conversionRate: number;
}

export interface CreatePromotionDto {
  businessId: string;
  name: string;
  description?: string;
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP';
  subject?: string;
  bodyText: string;
  recipientFilter: RecipientFilter;
  scheduledFor?: string;
}

export interface UpdatePromotionDto {
  name?: string;
  description?: string;
  channel?: 'EMAIL' | 'SMS' | 'WHATSAPP';
  subject?: string;
  bodyText?: string;
  recipientFilter?: RecipientFilter;
  scheduledFor?: string | null;
  status?: 'DRAFT' | 'SCHEDULED' | 'CANCELLED';
}

export function usePromotions(businessId: string | undefined, filters?: { status?: string; channel?: string }) {
  return useQuery({
    queryKey: ['promotions', businessId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({ businessId: businessId! });
      if (filters?.status) params.set('status', filters.status);
      if (filters?.channel) params.set('channel', filters.channel);
      const response = await apiClient.get<{ success: boolean; data: Promotion[] }>(`/promotions?${params}`);
      return response.data.data;
    },
    enabled: !!businessId,
  });
}

export function usePromotion(id: string | undefined, businessId: string | undefined) {
  return useQuery({
    queryKey: ['promotion', id, businessId],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: Promotion }>(
        `/promotions/${id}?businessId=${businessId}`
      );
      return response.data.data;
    },
    enabled: !!id && !!businessId,
  });
}

export function usePromotionAnalytics(id: string | undefined, businessId: string | undefined) {
  return useQuery({
    queryKey: ['promotion-analytics', id, businessId],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: PromotionAnalytics }>(
        `/promotions/${id}/analytics?businessId=${businessId}`
      );
      return response.data.data;
    },
    enabled: !!id && !!businessId,
  });
}

export function useCreatePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreatePromotionDto) => {
      const response = await apiClient.post<{ success: boolean; data: Promotion }>('/promotions', dto);
      return response.data.data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['promotions', vars.businessId] });
    },
  });
}

export function useUpdatePromotion(id: string, businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: UpdatePromotionDto) => {
      const response = await apiClient.put<{ success: boolean; data: Promotion }>(
        `/promotions/${id}?businessId=${businessId}`,
        dto
      );
      return response.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['promotions', businessId] });
      qc.invalidateQueries({ queryKey: ['promotion', id, businessId] });
    },
  });
}

export function useDeletePromotion(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/promotions/${id}?businessId=${businessId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['promotions', businessId] });
    },
  });
}

export function useSendPromotion(id: string, businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (opts?: { preview?: boolean; previewEmail?: string }) => {
      const response = await apiClient.post<{ success: boolean; data: any }>(
        `/promotions/${id}/send?businessId=${businessId}`,
        opts ?? {}
      );
      return response.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['promotions', businessId] });
      qc.invalidateQueries({ queryKey: ['promotion', id, businessId] });
      qc.invalidateQueries({ queryKey: ['promotion-analytics', id, businessId] });
    },
  });
}
