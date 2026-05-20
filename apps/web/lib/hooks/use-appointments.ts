import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Appointment,
  AppointmentFilters,
  ApiResponse,
  PaginatedResponse,
  CreateAppointmentDto,
  UpdateAppointmentDto,
  CancelAppointmentDto,
  AvailabilityCheck,
} from '@massage/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Fetch all appointments with filters
 */
export function useAppointments(businessId: string, filters?: AppointmentFilters) {
  return useQuery({
    queryKey: ['appointments', businessId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        businessId,
        ...(filters?.status && {
          status: Array.isArray(filters.status) ? filters.status.join(',') : filters.status,
        }),
        ...(filters?.therapistId && { therapistId: filters.therapistId }),
        ...(filters?.clientId && { clientId: filters.clientId }),
        ...(filters?.startDate && { startDate: filters.startDate.toString() }),
        ...(filters?.endDate && { endDate: filters.endDate.toString() }),
        ...(filters?.page && { page: String(filters.page) }),
        ...(filters?.limit && { limit: String(filters.limit) }),
        ...(filters?.sortBy && { sortBy: filters.sortBy }),
        ...(filters?.sortOrder && { sortOrder: filters.sortOrder }),
      });

      const response = await fetch(`${API_URL}/appointments?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch appointments');
      const result: PaginatedResponse<Appointment> = await response.json();
      return result;
    },
    enabled: !!businessId,
  });
}

/**
 * Fetch single appointment by ID
 */
export function useAppointment(id: string, businessId: string) {
  return useQuery({
    queryKey: ['appointment', id, businessId],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/appointments/${id}?businessId=${businessId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch appointment');
      const data: ApiResponse<Appointment> = await response.json();
      return data.data;
    },
    enabled: !!id && !!businessId,
  });
}

/**
 * Create appointment mutation
 */
export function useCreateAppointment(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentData: CreateAppointmentDto) => {
      const response = await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ businessId, ...appointmentData }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create appointment');
      }
      const data: ApiResponse<Appointment> = await response.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', businessId] });
    },
  });
}

/**
 * Update appointment mutation
 */
export function useUpdateAppointment(id: string, businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentData: UpdateAppointmentDto) => {
      const response = await fetch(
        `${API_URL}/appointments/${id}?businessId=${businessId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(appointmentData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update appointment');
      }
      const data: ApiResponse<Appointment> = await response.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment', id, businessId] });
      queryClient.invalidateQueries({ queryKey: ['appointments', businessId] });
    },
  });
}

/**
 * Confirm appointment mutation (SCHEDULED -> CONFIRMED)
 */
export function useConfirmAppointment(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const response = await fetch(
        `${API_URL}/appointments/${appointmentId}/confirm?businessId=${businessId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to confirm appointment');
      }
      const data: ApiResponse<Appointment> = await response.json();
      return data.data;
    },
    onSuccess: (_, appointmentId) => {
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId, businessId] });
      queryClient.invalidateQueries({ queryKey: ['appointments', businessId] });
    },
  });
}

/**
 * Start appointment mutation (CONFIRMED -> IN_PROGRESS)
 */
export function useStartAppointment(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const response = await fetch(
        `${API_URL}/appointments/${appointmentId}/start?businessId=${businessId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to start appointment');
      }
      const data: ApiResponse<Appointment> = await response.json();
      return data.data;
    },
    onSuccess: (_, appointmentId) => {
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId, businessId] });
      queryClient.invalidateQueries({ queryKey: ['appointments', businessId] });
    },
  });
}

/**
 * Complete appointment mutation (IN_PROGRESS -> COMPLETED)
 */
export function useCompleteAppointment(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const response = await fetch(
        `${API_URL}/appointments/${appointmentId}/complete?businessId=${businessId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to complete appointment');
      }
      const data: ApiResponse<Appointment> = await response.json();
      return data.data;
    },
    onSuccess: (_, appointmentId) => {
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId, businessId] });
      queryClient.invalidateQueries({ queryKey: ['appointments', businessId] });
    },
  });
}

/**
 * Mark appointment as no-show mutation
 */
export function useMarkNoShowAppointment(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const response = await fetch(
        `${API_URL}/appointments/${appointmentId}/no-show?businessId=${businessId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to mark appointment as no-show');
      }
      const data: ApiResponse<Appointment> = await response.json();
      return data.data;
    },
    onSuccess: (_, appointmentId) => {
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId, businessId] });
      queryClient.invalidateQueries({ queryKey: ['appointments', businessId] });
    },
  });
}

/**
 * Cancel appointment mutation
 */
export function useCancelAppointment(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      appointmentId,
      cancellationData,
    }: {
      appointmentId: string;
      cancellationData: CancelAppointmentDto;
    }) => {
      const response = await fetch(
        `${API_URL}/appointments/${appointmentId}/cancel?businessId=${businessId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(cancellationData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel appointment');
      }
      const data: ApiResponse<Appointment> = await response.json();
      return data.data;
    },
    onSuccess: (_, { appointmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId, businessId] });
      queryClient.invalidateQueries({ queryKey: ['appointments', businessId] });
    },
  });
}

/**
 * Check availability for a time slot (debounced for real-time checking)
 */
export function useCheckAvailability(
  therapistId: string,
  startTime: Date | null,
  endTime: Date | null,
  excludeAppointmentId?: string
) {
  return useQuery({
    queryKey: ['availability-check', therapistId, startTime, endTime, excludeAppointmentId],
    queryFn: async () => {
      if (!therapistId || !startTime || !endTime) {
        return { available: true };
      }

      const params = new URLSearchParams({
        therapistId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        ...(excludeAppointmentId && { excludeAppointmentId }),
      });

      const response = await fetch(
        `${API_URL}/appointments/availability/check?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to check availability');
      const data: ApiResponse<AvailabilityCheck> = await response.json();
      return data.data;
    },
    enabled: !!therapistId && !!startTime && !!endTime,
    staleTime: 1000, // Keep fresh for 1 second
  });
}
