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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Fetch all therapist availability records
 */
export function useTherapistAvailability(
  businessId: string,
  filters?: TherapistAvailabilityFilters
) {
  return useQuery({
    queryKey: ['therapist-availability', businessId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        businessId,
        ...(filters?.therapistId && { therapistId: filters.therapistId }),
        ...(filters?.dayOfWeek !== undefined && { dayOfWeek: String(filters.dayOfWeek) }),
        ...(filters?.isActive !== undefined && { isActive: String(filters.isActive) }),
      });

      const response = await fetch(`${API_URL}/therapist-availability?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch therapist availability');
      const data: ApiResponse<TherapistAvailability[]> = await response.json();
      return data.data;
    },
    enabled: !!businessId,
  });
}

/**
 * Fetch single availability record by ID
 */
export function useAvailabilityById(id: string, businessId: string) {
  return useQuery({
    queryKey: ['therapist-availability', id, businessId],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/therapist-availability/${id}?businessId=${businessId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch availability');
      const data: ApiResponse<TherapistAvailability> = await response.json();
      return data.data;
    },
    enabled: !!id && !!businessId,
  });
}

/**
 * Create or update therapist availability
 */
export function useCreateAvailability(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (availabilityData: CreateAvailabilityDto) => {
      const response = await fetch(`${API_URL}/therapist-availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ businessId, ...availabilityData }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create availability');
      }
      const data: ApiResponse<TherapistAvailability> = await response.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapist-availability', businessId] });
    },
  });
}

/**
 * Update therapist availability
 */
export function useUpdateAvailability(id: string, businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (availabilityData: UpdateAvailabilityDto) => {
      const response = await fetch(
        `${API_URL}/therapist-availability/${id}?businessId=${businessId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(availabilityData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update availability');
      }
      const data: ApiResponse<TherapistAvailability> = await response.json();
      return data.data;
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
export function useDeleteAvailability(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (availabilityId: string) => {
      const response = await fetch(
        `${API_URL}/therapist-availability/${availabilityId}?businessId=${businessId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete availability');
      }
      const data: ApiResponse<TherapistAvailability> = await response.json();
      return data.data;
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
  businessId: string,
  filters?: TherapistTimeOffFilters
) {
  return useQuery({
    queryKey: ['therapist-time-off', businessId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        businessId,
        ...(filters?.therapistId && { therapistId: filters.therapistId }),
        ...(filters?.startDate && { startDate: filters.startDate.toString() }),
        ...(filters?.endDate && { endDate: filters.endDate.toString() }),
      });

      const response = await fetch(
        `${API_URL}/therapist-availability/time-off?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch therapist time off');
      const data: ApiResponse<TherapistTimeOff[]> = await response.json();
      return data.data;
    },
    enabled: !!businessId,
  });
}

/**
 * Create time off period
 */
export function useCreateTimeOff(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (timeOffData: CreateTimeOffDto) => {
      const response = await fetch(`${API_URL}/therapist-availability/time-off`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ businessId, ...timeOffData }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create time off');
      }
      const data: ApiResponse<TherapistTimeOff> = await response.json();
      return data.data;
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
export function useDeleteTimeOff(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (timeOffId: string) => {
      const response = await fetch(
        `${API_URL}/therapist-availability/time-off/${timeOffId}?businessId=${businessId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete time off');
      }
      const data: ApiResponse<TherapistTimeOff> = await response.json();
      return data.data;
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

      const response = await fetch(
        `${API_URL}/therapist-availability/slots?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch available slots');
      const data: ApiResponse<TimeSlot[]> = await response.json();
      return data.data;
    },
    enabled: !!therapistId && !!date,
    staleTime: 60000, // Keep fresh for 1 minute
  });
}
