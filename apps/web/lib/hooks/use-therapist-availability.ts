import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  TherapistAvailability,
  TherapistTimeOff,
  TimeSlot,
  ApiResponse,
  CreateAvailabilityDto,
  UpdateAvailabilityDto,
  CreateTimeOffDto,
  TherapistAvailabilityFilters,
  TherapistTimeOffFilters,
} from '@massage/types';
import { apiClient } from '@/lib/api-client';

/**
 * Fetch all therapist availability records
 */
export function useTherapistAvailability(
  businessId: string | undefined,
  filters?: TherapistAvailabilityFilters
) {
  return useQuery({
    queryKey: ['therapist-availability', businessId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        businessId: businessId!,
        ...(filters?.therapistId && { therapistId: filters.therapistId }),
        ...(filters?.dayOfWeek !== undefined && { dayOfWeek: String(filters.dayOfWeek) }),
        ...(filters?.isActive !== undefined && { isActive: String(filters.isActive) }),
      });

      const response = await apiClient.get<ApiResponse<TherapistAvailability[]>>(
        `/therapist-availability?${params}`
      );
      return response.data.data;
    },
    enabled: !!businessId,
  });
}

/**
 * Fetch single availability record by ID
 */
export function useAvailabilityById(id: string, businessId: string | undefined) {
  return useQuery({
    queryKey: ['therapist-availability', id, businessId],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<TherapistAvailability>>(
        `/therapist-availability/${id}?businessId=${businessId}`
      );
      return response.data.data;
    },
    enabled: !!id && !!businessId,
  });
}

/**
 * Create or update therapist availability
 */
export function useCreateAvailability(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (availabilityData: CreateAvailabilityDto) => {
      const response = await apiClient.post<ApiResponse<TherapistAvailability>>(
        '/therapist-availability',
        availabilityData
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapist-availability', businessId] });
    },
  });
}

/**
 * Update therapist availability
 */
export function useUpdateAvailability(id: string, businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (availabilityData: UpdateAvailabilityDto) => {
      const response = await apiClient.patch<ApiResponse<TherapistAvailability>>(
        `/therapist-availability/${id}?businessId=${businessId}`,
        availabilityData
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapist-availability', id, businessId] });
      queryClient.invalidateQueries({ queryKey: ['therapist-availability', businessId] });
    },
  });
}

/**
 * Delete therapist availability
 */
export function useDeleteAvailability(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (availabilityId: string) => {
      const response = await apiClient.delete<ApiResponse<TherapistAvailability>>(
        `/therapist-availability/${availabilityId}?businessId=${businessId}`
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapist-availability', businessId] });
    },
  });
}

/**
 * Fetch all therapist time off records
 */
export function useTherapistTimeOff(
  businessId: string | undefined,
  filters?: TherapistTimeOffFilters
) {
  return useQuery({
    queryKey: ['therapist-time-off', businessId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        businessId: businessId!,
        ...(filters?.therapistId && { therapistId: filters.therapistId }),
        ...(filters?.startDate && { startDate: filters.startDate.toString() }),
        ...(filters?.endDate && { endDate: filters.endDate.toString() }),
      });

      const response = await apiClient.get<ApiResponse<TherapistTimeOff[]>>(
        `/therapist-availability/time-off?${params}`
      );
      return response.data.data;
    },
    enabled: !!businessId,
  });
}

/**
 * Create time off period
 */
export function useCreateTimeOff(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (timeOffData: CreateTimeOffDto) => {
      const response = await apiClient.post<ApiResponse<TherapistTimeOff>>(
        '/therapist-availability/time-off',
        timeOffData
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapist-time-off', businessId] });
      queryClient.invalidateQueries({ queryKey: ['availability-slots'] });
    },
  });
}

/**
 * Delete time off period
 */
export function useDeleteTimeOff(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (timeOffId: string) => {
      const response = await apiClient.delete<ApiResponse<TherapistTimeOff>>(
        `/therapist-availability/time-off/${timeOffId}?businessId=${businessId}`
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapist-time-off', businessId] });
      queryClient.invalidateQueries({ queryKey: ['availability-slots'] });
    },
  });
}

/**
 * Get available time slots for a therapist on a specific date
 */
export function useAvailableSlots(
  therapistId: string,
  date: Date | null,
  duration?: number
) {
  return useQuery({
    queryKey: ['availability-slots', therapistId, date, duration],
    queryFn: async () => {
      if (!therapistId || !date) return [];

      const params = new URLSearchParams({
        therapistId,
        date: date.toISOString(),
        ...(duration && { duration: String(duration) }),
      });

      const response = await apiClient.get<ApiResponse<TimeSlot[]>>(
        `/therapist-availability/slots?${params}`
      );
      return response.data.data;
    },
    enabled: !!therapistId && !!date,
    staleTime: 60000, // Keep fresh for 1 minute
  });
}
