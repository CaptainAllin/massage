import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Payment,
  PaymentFilters,
  ApiResponse,
  PaginatedResponse,
  CreatePaymentDto,
  ProcessStripePaymentDto,
  ProcessCashPaymentDto,
  ProcessCheckPaymentDto,
  RefundPaymentDto,
  PaymentStats,
} from '@massage/types';
import { apiClient } from '@/lib/api-client';

/**
 * Fetch all payments with filters
 */
export function usePayments(businessId: string | undefined, filters?: PaymentFilters) {
  return useQuery({
    queryKey: ['payments', businessId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        businessId: businessId!,
        ...(filters?.clientId && { clientId: filters.clientId }),
        ...(filters?.status && {
          status: Array.isArray(filters.status) ? filters.status.join(',') : filters.status,
        }),
        ...(filters?.paymentMethod && {
          paymentMethod: Array.isArray(filters.paymentMethod)
            ? filters.paymentMethod.join(',')
            : filters.paymentMethod,
        }),
        ...(filters?.startDate && { startDate: filters.startDate.toString() }),
        ...(filters?.endDate && { endDate: filters.endDate.toString() }),
        ...(filters?.minAmount !== undefined && { minAmount: String(filters.minAmount) }),
        ...(filters?.maxAmount !== undefined && { maxAmount: String(filters.maxAmount) }),
        ...(filters?.page && { page: String(filters.page) }),
        ...(filters?.limit && { limit: String(filters.limit) }),
      });

      const response = await apiClient.get<PaginatedResponse<Payment>>(`/payments?${params}`);
      return response.data;
    },
    enabled: !!businessId,
  });
}

/**
 * Fetch single payment by ID
 */
export function usePayment(id: string, businessId: string | undefined) {
  return useQuery({
    queryKey: ['payment', id, businessId],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Payment>>(
        `/payments/${id}?businessId=${businessId}`
      );
      return response.data.data;
    },
    enabled: !!id && !!businessId,
  });
}

/**
 * Create payment
 */
export function useCreatePayment(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentData: CreatePaymentDto) => {
      const response = await apiClient.post<ApiResponse<Payment>>('/payments', {
        ...paymentData,
        businessId,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', businessId] });
    },
  });
}

/**
 * Process Stripe payment
 */
export function useProcessStripePayment(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProcessStripePaymentDto) => {
      const response = await apiClient.post('/payments/process-stripe', { ...data, businessId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', businessId] });
    },
  });
}

/**
 * Process cash payment
 */
export function useProcessCashPayment(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ProcessCashPaymentDto) => {
      const response = await apiClient.post<ApiResponse<Payment>>(
        '/payments/process-cash',
        payload
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', businessId] });
    },
  });
}

/**
 * Process check payment
 */
export function useProcessCheckPayment(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ProcessCheckPaymentDto) => {
      const response = await apiClient.post<ApiResponse<Payment>>(
        '/payments/process-check',
        payload
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', businessId] });
    },
  });
}

/**
 * Refund payment
 */
export function useRefundPayment(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ paymentId, ...refundData }: RefundPaymentDto) => {
      const response = await apiClient.post<ApiResponse<Payment>>(
        `/payments/${paymentId}/refund`,
        { ...refundData, businessId }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', businessId] });
    },
  });
}

/**
 * Saved payment methods
 */
export function useSavedPaymentMethods(businessId: string | undefined, clientId: string | undefined) {
  return useQuery({
    queryKey: ['saved-payment-methods', businessId, clientId],
    queryFn: async () => {
      const response = await apiClient.get(
        `/payments/saved-methods?businessId=${businessId}&clientId=${clientId}`
      );
      return response.data.data as Array<{
        id: string;
        stripePaymentMethodId: string;
        brand: string | null;
        last4: string | null;
        expMonth: number | null;
        expYear: number | null;
        isDefault: boolean;
      }>;
    },
    enabled: !!businessId && !!clientId,
  });
}

export function useCreateSetupIntent(businessId: string | undefined) {
  return useMutation({
    mutationFn: async (clientId: string) => {
      const response = await apiClient.post('/payments/setup-intent', { businessId, clientId });
      return response.data.data as { clientSecret: string; customerId: string };
    },
  });
}

export function useSavePaymentMethod(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, stripePaymentMethodId }: { clientId: string; stripePaymentMethodId: string }) => {
      const response = await apiClient.post('/payments/saved-methods', {
        businessId,
        clientId,
        stripePaymentMethodId,
      });
      return response.data.data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['saved-payment-methods', businessId, vars.clientId] });
    },
  });
}

export function useDeleteSavedPaymentMethod(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, clientId }: { id: string; clientId: string }) => {
      await apiClient.delete(`/payments/saved-methods/${id}?businessId=${businessId}`);
      return clientId;
    },
    onSuccess: (clientId) => {
      queryClient.invalidateQueries({ queryKey: ['saved-payment-methods', businessId, clientId] });
    },
  });
}

export function useSetDefaultPaymentMethod(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, clientId }: { id: string; clientId: string }) => {
      await apiClient.patch(`/payments/saved-methods/${id}`, { businessId });
      return clientId;
    },
    onSuccess: (clientId) => {
      queryClient.invalidateQueries({ queryKey: ['saved-payment-methods', businessId, clientId] });
    },
  });
}

/**
 * Revenue report
 */
export function useRevenueReport(
  businessId: string | undefined,
  type: 'daily' | 'monthly' | 'tax',
  startDate?: string,
  endDate?: string,
) {
  return useQuery({
    queryKey: ['revenue-report', businessId, type, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        businessId: businessId!,
        type,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });
      const response = await apiClient.get(`/payments/revenue-report?${params}`);
      return response.data.data;
    },
    enabled: !!businessId,
  });
}

/**
 * Payment reconciliation
 */
export function useReconciliation(businessId: string | undefined) {
  return useQuery({
    queryKey: ['reconciliation', businessId],
    queryFn: async () => {
      const response = await apiClient.get(`/payments/reconciliation?businessId=${businessId}`);
      return response.data.data;
    },
    enabled: !!businessId,
  });
}

/**
 * Fetch payment statistics
 */
export function usePaymentStats(businessId: string | undefined, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['payment-stats', businessId, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        businessId: businessId!,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      const response = await apiClient.get<ApiResponse<PaymentStats>>(
        `/payments/stats/summary?${params}`
      );
      return response.data.data;
    },
    enabled: !!businessId,
  });
}
