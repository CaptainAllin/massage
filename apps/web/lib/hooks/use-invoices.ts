import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Invoice,
  InvoiceFilters,
  ApiResponse,
  PaginatedResponse,
  CreateInvoiceDto,
  UpdateInvoiceDto,
  AddLineItemDto,
  InvoiceStats,
} from '@massage/types';
import { apiClient } from '@/lib/api-client';

export function useInvoices(businessId: string | undefined, filters?: InvoiceFilters) {
  return useQuery({
    queryKey: ['invoices', businessId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        businessId: businessId!,
        ...(filters?.clientId && { clientId: filters.clientId }),
        ...(filters?.status && {
          status: Array.isArray(filters.status) ? filters.status.join(',') : filters.status,
        }),
        ...(filters?.startDate && { startDate: filters.startDate.toString() }),
        ...(filters?.endDate && { endDate: filters.endDate.toString() }),
        ...(filters?.overdue && { overdue: 'true' }),
        ...(filters?.page && { page: String(filters.page) }),
        ...(filters?.limit && { limit: String(filters.limit) }),
      });

      const response = await apiClient.get<PaginatedResponse<Invoice>>(`/invoices?${params}`);
      return response.data;
    },
    enabled: !!businessId,
  });
}

export function useInvoice(id: string, businessId: string | undefined) {
  return useQuery({
    queryKey: ['invoice', id, businessId],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Invoice>>(
        `/invoices/${id}?businessId=${businessId}`
      );
      return response.data.data;
    },
    enabled: !!id && !!businessId,
  });
}

export function useCreateInvoice(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceData: Omit<CreateInvoiceDto, 'businessId'>) => {
      const response = await apiClient.post<ApiResponse<Invoice>>('/invoices', {
        ...invoiceData,
        businessId,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', businessId] });
    },
  });
}

export function useUpdateInvoice(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...invoiceData }: UpdateInvoiceDto & { id: string }) => {
      const response = await apiClient.patch<ApiResponse<Invoice>>(
        `/invoices/${id}`,
        invoiceData
      );
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices', businessId] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.id, businessId] });
    },
  });
}

export function useDeleteInvoice(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/invoices/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', businessId] });
    },
  });
}

export function useAddLineItem(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invoiceId, ...lineItem }: AddLineItemDto & { invoiceId: string }) => {
      const response = await apiClient.post<ApiResponse<Invoice>>(
        `/invoices/${invoiceId}/line-items`,
        lineItem
      );
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId, businessId] });
    },
  });
}

export function useMarkInvoiceAsPaid(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const response = await apiClient.post<ApiResponse<Invoice>>(
        `/invoices/${invoiceId}/mark-paid`
      );
      return response.data.data;
    },
    onSuccess: (_, invoiceId) => {
      queryClient.invalidateQueries({ queryKey: ['invoices', businessId] });
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId, businessId] });
    },
  });
}

export function useSendInvoice(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const response = await apiClient.post(`/invoices/${invoiceId}/send`, { businessId });
      return response.data;
    },
    onSuccess: (_, invoiceId) => {
      queryClient.invalidateQueries({ queryKey: ['invoices', businessId] });
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId, businessId] });
    },
  });
}

export function useSendInvoiceSms(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ invoiceId, channel }: { invoiceId: string; channel: 'SMS' | 'WHATSAPP' }) => {
      const response = await apiClient.post(`/invoices/${invoiceId}/send-sms`, { businessId, channel });
      return response.data;
    },
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: ['invoices', businessId] });
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId, businessId] });
    },
  });
}

export function useInvoiceStats(businessId: string | undefined) {
  return useQuery({
    queryKey: ['invoice-stats', businessId],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<InvoiceStats>>(
        '/invoices/stats/summary'
      );
      return response.data.data;
    },
    enabled: !!businessId,
  });
}
