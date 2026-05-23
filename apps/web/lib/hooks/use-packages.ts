import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PackagePurchase,
  PackagePurchaseFilters,
  ApiResponse,
  PaginatedResponse,
  CreatePackagePurchaseDto,
  UpdatePackagePurchaseDto,
} from '@massage/types';
import { apiClient } from '@/lib/api-client';

export function usePackages(businessId: string | undefined, filters?: PackagePurchaseFilters) {
  return useQuery({
    queryKey: ['packages', businessId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        businessId: businessId!,
        ...(filters?.clientId && { clientId: filters.clientId }),
        ...(filters?.status && {
          status: Array.isArray(filters.status) ? filters.status.join(',') : filters.status,
        }),
        ...(filters?.expiringSoon && { expiringSoon: 'true' }),
        ...(filters?.page && { page: String(filters.page) }),
        ...(filters?.limit && { limit: String(filters.limit) }),
      });

      const result = await apiClient.get<PaginatedResponse<PackagePurchase>>(`/packages?${params}`);
      return result.data;
    },
    enabled: !!businessId,
  });
}

export function usePackage(id: string, businessId: string | undefined) {
  return useQuery({
    queryKey: ['package', id, businessId],
    queryFn: async () => {
      const result = await apiClient.get<ApiResponse<PackagePurchase>>(
        `/packages/${id}?businessId=${businessId}`
      );
      return result.data.data;
    },
    enabled: !!id && !!businessId,
  });
}

export function useCreatePackage(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (packageData: CreatePackagePurchaseDto) => {
      const result = await apiClient.post<ApiResponse<PackagePurchase>>('/packages', {
        ...packageData,
        businessId,
      });
      return result.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages', businessId] });
    },
  });
}

export function useUpdatePackage(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...packageData }: UpdatePackagePurchaseDto & { id: string }) => {
      const result = await apiClient.patch<ApiResponse<PackagePurchase>>(
        `/packages/${id}`,
        packageData
      );
      return result.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['packages', businessId] });
      queryClient.invalidateQueries({ queryKey: ['package', variables.id, businessId] });
    },
  });
}

export function useRedeemPackageSession(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ packageId, appointmentId }: { packageId: string; appointmentId: string }) => {
      const result = await apiClient.post<ApiResponse<PackagePurchase>>(
        `/packages/${packageId}/redeem-session`,
        { appointmentId }
      );
      return result.data.data;
    },
    onSuccess: (_, { packageId }) => {
      queryClient.invalidateQueries({ queryKey: ['packages', businessId] });
      queryClient.invalidateQueries({ queryKey: ['package', packageId, businessId] });
    },
  });
}

export function usePackageSessionsRemaining(packageId: string, businessId: string | undefined) {
  return useQuery({
    queryKey: ['package-sessions-remaining', packageId, businessId],
    queryFn: async () => {
      const result = await apiClient.get<ApiResponse<any>>(
        `/packages/${packageId}/sessions-remaining`
      );
      return result.data.data;
    },
    enabled: !!packageId && !!businessId,
  });
}
