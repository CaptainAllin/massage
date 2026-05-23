import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  VoiceNote,
  VoiceNoteFilters,
  VoiceNoteSearchDto,
  ApiResponse,
  PaginatedResponse,
} from '@massage/types';

const API_URL = '/api/voice-notes';

// ========== Upload Voice Note ==========

interface UploadVoiceNoteParams {
  audioFile: Blob;
  businessId: string | undefined;
  clientId: string;
  therapistId: string;
  appointmentId?: string;
  audioDuration?: number;
}

export const useVoiceNoteUpload = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UploadVoiceNoteParams) => {
      const formData = new FormData();
      formData.append('audio', params.audioFile);
      formData.append('businessId', params.businessId || '');
      formData.append('clientId', params.clientId);
      formData.append('therapistId', params.therapistId);
      if (params.appointmentId) {
        formData.append('appointmentId', params.appointmentId);
      }
      if (params.audioDuration) {
        formData.append('audioDuration', params.audioDuration.toString());
      }

      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload voice note');
      }

      return response.json() as Promise<ApiResponse<VoiceNote>>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice-notes'] });
    },
  });
};

// ========== Transcribe Voice Note ==========

interface TranscribeParams {
  voiceNoteId: string;
  businessId?: string;
}

export const useVoiceTranscribe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: TranscribeParams) => {
      const response = await fetch(`${API_URL}/${params.voiceNoteId}/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: params.businessId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to transcribe voice note');
      }

      return response.json() as Promise<ApiResponse<VoiceNote>>;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['voice-notes'] });
      queryClient.invalidateQueries({
        queryKey: ['voice-note', variables.voiceNoteId],
      });
    },
  });
};

// ========== Generate SOAP from Voice Note ==========

interface GenerateSOAPParams {
  voiceNoteId: string;
  provider?: 'openai' | 'claude';
}

interface SOAPResult {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  usage: {
    tokens: number;
    cost: number;
  };
}

export const useVoiceToSOAP = () => {
  return useMutation({
    mutationFn: async (params: GenerateSOAPParams) => {
      const response = await fetch(
        `${API_URL}/${params.voiceNoteId}/generate-soap`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider: params.provider }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate SOAP notes');
      }

      return response.json() as Promise<ApiResponse<SOAPResult>>;
    },
  });
};

// ========== Fetch Voice Notes ==========

export const useVoiceNotes = (filters?: VoiceNoteFilters) => {
  return useQuery({
    queryKey: ['voice-notes', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              value.forEach((v) => params.append(key, v.toString()));
            } else {
              params.set(key, value.toString());
            }
          }
        });
      }

      const response = await fetch(`${API_URL}?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch voice notes');
      }

      return response.json() as Promise<PaginatedResponse<VoiceNote>>;
    },
    staleTime: 30000, // 30 seconds
  });
};

// ========== Fetch Single Voice Note ==========

export const useVoiceNote = (id: string | undefined) => {
  return useQuery({
    queryKey: ['voice-note', id],
    queryFn: async () => {
      if (!id) throw new Error('Voice note ID is required');

      const response = await fetch(`${API_URL}/${id}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch voice note');
      }

      return response.json() as Promise<ApiResponse<VoiceNote>>;
    },
    enabled: !!id,
  });
};

// ========== Delete Voice Note ==========

export const useVoiceNoteDelete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (voiceNoteId: string) => {
      const response = await fetch(`${API_URL}/${voiceNoteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete voice note');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice-notes'] });
    },
  });
};

// ========== Get Download URL ==========

export const useVoiceNoteDownload = () => {
  return useMutation({
    mutationFn: async (voiceNoteId: string) => {
      const response = await fetch(`${API_URL}/${voiceNoteId}/download`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get download URL');
      }

      const result = (await response.json()) as ApiResponse<{ url: string }>;
      return result.data?.url;
    },
  });
};

// ========== Search Voice Notes ==========

export const useVoiceNoteSearch = (searchDto: VoiceNoteSearchDto) => {
  return useQuery({
    queryKey: ['voice-notes-search', searchDto],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(searchDto).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.set(key, value.toString());
        }
      });

      const response = await fetch(`${API_URL}/search?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to search voice notes');
      }

      return response.json() as Promise<{
        success: boolean;
        data: VoiceNote[];
        meta: { total: number };
      }>;
    },
    enabled: !!searchDto.query && searchDto.query.length >= 3,
    staleTime: 60000, // 1 minute
  });
};
