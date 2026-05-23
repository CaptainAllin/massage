import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PackagePurchase,
  PackagePurchaseFilters,
  ApiResponse,
  PaginatedResponse,
  CreatePackagePurchaseDto,
  UpdatePackagePurchaseDto,
} from '@massage/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

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

      const response = await fetch(`${API_URL}/packages?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch packages');
      const result: PaginatedResponse<PackagePurchase> = await response.json();
      return result;
    },
    enabled: !!businessId,
  });
}

export function usePackage(id: string, businessId: string | undefined) {
  return useQuery({
    queryKey: ['package', id, businessId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/packages/${id}?businessId=${businessId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch package');
      const data: ApiResponse<PackagePurchase> = await response.json();
      return data.data;
    },
    enabled: !!id && !!businessId,
  });
}

export function useCreatePackage(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (packageData: CreatePackagePurchaseDto) => {
      const response = await fetch(`${API_URL}/packages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ ...packageData, businessId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create package');
      }
      const data: ApiResponse<PackagePurchase> = await response.json();
      return data.data;
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
      const response = await fetch(`${API_URL}/packages/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(packageData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update package');
      }
      const data: ApiResponse<PackagePurchase> = await response.json();
      return data.data;
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
      const response = await fetch(`${API_URL}/packages/${packageId}/redeem-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ appointmentId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to redeem session');
      }
      const data: ApiResponse<PackagePurchase> = await response.json();
      return data.data;
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
      const response = await fetch(`${API_URL}/packages/${packageId}/sessions-remaining`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch sessions remaining');
      const data: ApiResponse<any> = await response.json();
      return data.data;
    },
    enabled: !!packageId && !!businessId,
  });
}
