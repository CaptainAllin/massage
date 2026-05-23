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
      const response = await apiClient.post('/payments/process-stripe', data);
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
        refundData
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', businessId] });
    },
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
