import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api-client';

export function useVideoSession(appointmentId: string) {
  return useQuery({
    queryKey: ['video-session', appointmentId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/video-sessions/appointment/${appointmentId}`);
      return data;
    },
    enabled: !!appointmentId,
  });
}

export function useCreateVideoSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const { data } = await apiClient.post(`/video-sessions/appointment/${appointmentId}`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['video-session', data.appointmentId] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useJoinVideoSession() {
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data } = await apiClient.get(`/video-sessions/${sessionId}/join`);
      return data;
    },
  });
}
