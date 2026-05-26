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
  GroupBookingWithClient,
  GroupBookingStatus,
} from '@massage/types';
import { apiClient } from '@/lib/api-client';

/**
 * Fetch all appointments with filters
 */
export function useAppointments(businessId: string | undefined, filters?: AppointmentFilters) {
  return useQuery({
    queryKey: ['appointments', businessId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        businessId: businessId!,
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

      const response = await apiClient.get<PaginatedResponse<Appointment>>(
        `/appointments?${params}`
      );
      return response.data;
    },
    enabled: !!businessId,
  });
}

/**
 * Fetch single appointment by ID
 */
export function useAppointment(id: string, businessId: string | undefined) {
  return useQuery({
    queryKey: ['appointment', id, businessId],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Appointment>>(
        `/appointments/${id}?businessId=${businessId}`
      );
      return response.data.data;
    },
    enabled: !!id && !!businessId,
  });
}

/**
 * Create appointment mutation
 */
export function useCreateAppointment(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentData: CreateAppointmentDto) => {
      const response = await apiClient.post<ApiResponse<Appointment>>(
        '/appointments',
        appointmentData
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', businessId] });
    },
  });
}

/**
 * Update appointment mutation
 */
export function useUpdateAppointment(id: string, businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentData: UpdateAppointmentDto) => {
      const response = await apiClient.patch<ApiResponse<Appointment>>(
        `/appointments/${id}?businessId=${businessId}`,
        appointmentData
      );
      return response.data.data;
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
export function useConfirmAppointment(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const response = await apiClient.patch<ApiResponse<Appointment>>(
        `/appointments/${appointmentId}/confirm?businessId=${businessId}`
      );
      return response.data.data;
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
export function useStartAppointment(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const response = await apiClient.patch<ApiResponse<Appointment>>(
        `/appointments/${appointmentId}/start?businessId=${businessId}`
      );
      return response.data.data;
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
export function useCompleteAppointment(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const response = await apiClient.patch<ApiResponse<Appointment>>(
        `/appointments/${appointmentId}/complete?businessId=${businessId}`
      );
      return response.data.data;
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
export function useMarkNoShowAppointment(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const response = await apiClient.patch<ApiResponse<Appointment>>(
        `/appointments/${appointmentId}/no-show?businessId=${businessId}`
      );
      return response.data.data;
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
export function useCancelAppointment(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      appointmentId,
      cancellationData,
    }: {
      appointmentId: string;
      cancellationData: CancelAppointmentDto;
    }) => {
      const response = await apiClient.patch<ApiResponse<Appointment>>(
        `/appointments/${appointmentId}/cancel?businessId=${businessId}`,
        cancellationData
      );
      return response.data.data;
    },
    onSuccess: (_, { appointmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId, businessId] });
      queryClient.invalidateQueries({ queryKey: ['appointments', businessId] });
    },
  });
}

/**
 * Fetch group bookings for a group appointment
 */
export function useGroupBookings(appointmentId: string | undefined, businessId: string | undefined) {
  return useQuery({
    queryKey: ['group-bookings', appointmentId, businessId],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<GroupBookingWithClient[]>>(
        `/appointments/${appointmentId}/group-bookings?businessId=${businessId}`
      );
      return response.data.data ?? [];
    },
    enabled: !!appointmentId && !!businessId,
  });
}

/**
 * Add a client to a group session
 */
export function useAddGroupBooking(appointmentId: string, businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientId: string) => {
      const response = await apiClient.post<ApiResponse<GroupBookingWithClient>>(
        `/appointments/${appointmentId}/group-bookings`,
        { businessId, clientId }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-bookings', appointmentId, businessId] });
      queryClient.invalidateQueries({ queryKey: ['appointments', businessId] });
    },
  });
}

/**
 * Update a group booking status (attended / no-show / cancelled)
 */
export function useUpdateGroupBooking(appointmentId: string, businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: GroupBookingStatus }) => {
      const response = await apiClient.patch<ApiResponse<GroupBookingWithClient>>(
        `/appointments/${appointmentId}/group-bookings/${bookingId}`,
        { businessId, status }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-bookings', appointmentId, businessId] });
      queryClient.invalidateQueries({ queryKey: ['appointments', businessId] });
    },
  });
}

/**
 * Remove a client from a group session
 */
export function useRemoveGroupBooking(appointmentId: string, businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      await apiClient.delete(`/appointments/${appointmentId}/group-bookings/${bookingId}?businessId=${businessId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-bookings', appointmentId, businessId] });
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

      const response = await apiClient.get<ApiResponse<AvailabilityCheck>>(
        `/appointments/availability/check?${params}`
      );
      return response.data.data;
    },
    enabled: !!therapistId && !!startTime && !!endTime,
    staleTime: 1000, // Keep fresh for 1 second
  });
}
