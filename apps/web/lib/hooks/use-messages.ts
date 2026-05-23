import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Message,
  Conversation,
  MessageTemplate,
  CommunicationSettings,
  SendMessageDto,
  SendBulkMessagesDto,
  CreateMessageTemplateDto,
  UpdateMessageTemplateDto,
  UpdateCommunicationSettingsDto,
  PreviewTemplateDto,
  MessageFilters,
  ConversationFilters,
  MessageTemplateFilters,
  MessageStats,
  ApiResponse,
} from '@massage/types';
import { apiClient } from '@/lib/api-client';

// ============================================================================
// CONVERSATIONS
// ============================================================================

export function useConversations(businessId: string | undefined, filters?: ConversationFilters) {
  return useQuery({
    queryKey: ['conversations', businessId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        businessId: businessId!,
        ...(filters?.clientId && { clientId: filters.clientId }),
        ...(filters?.type && { type: Array.isArray(filters.type) ? filters.type.join(',') : filters.type }),
        ...(filters?.status && { status: Array.isArray(filters.status) ? filters.status.join(',') : filters.status }),
        ...(filters?.search && { search: filters.search }),
        ...(filters?.hasUnread !== undefined && { hasUnread: String(filters.hasUnread) }),
        ...(filters?.page && { page: String(filters.page) }),
        ...(filters?.limit && { limit: String(filters.limit) }),
      });

      const response = await apiClient.get<ApiResponse<Conversation[]>>(
        `/conversations?${params}`
      );
      return response.data;
    },
    enabled: !!businessId,
  });
}

export function useConversation(conversationId: string, businessId: string | undefined) {
  return useQuery({
    queryKey: ['conversation', conversationId, businessId],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Conversation>>(
        `/conversations/${conversationId}?businessId=${businessId}`
      );
      return response.data.data;
    },
    enabled: !!conversationId && !!businessId,
  });
}

export function useConversationMessages(
  conversationId: string,
  businessId: string | undefined,
  page = 1,
  limit = 50
) {
  return useQuery({
    queryKey: ['conversation-messages', conversationId, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        businessId: businessId!,
        page: String(page),
        limit: String(limit),
      });

      const response = await apiClient.get<ApiResponse<Message[]>>(
        `/conversations/${conversationId}/messages?${params}`
      );
      return response.data;
    },
    enabled: !!conversationId && !!businessId,
  });
}

export function useMarkConversationRead(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const response = await apiClient.patch<ApiResponse<Conversation>>(
        `/conversations/${conversationId}/read?businessId=${businessId}`
      );
      return response.data.data;
    },
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ['conversations', businessId] });
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['unread-count', businessId] });
    },
  });
}

export function useUnreadCount(businessId: string | undefined) {
  return useQuery({
    queryKey: ['unread-count', businessId],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<{ count: number }>>(
        `/conversations/unread-count?businessId=${businessId}`
      );
      return response.data.data?.count || 0;
    },
    enabled: !!businessId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// ============================================================================
// MESSAGES
// ============================================================================

export function useMessages(businessId: string | undefined, filters?: MessageFilters) {
  return useQuery({
    queryKey: ['messages', businessId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        businessId: businessId!,
        ...(filters?.conversationId && { conversationId: filters.conversationId }),
        ...(filters?.senderId && { senderId: filters.senderId }),
        ...(filters?.recipientId && { recipientId: filters.recipientId }),
        ...(filters?.type && { type: Array.isArray(filters.type) ? filters.type.join(',') : filters.type }),
        ...(filters?.status && { status: Array.isArray(filters.status) ? filters.status.join(',') : filters.status }),
        ...(filters?.direction && { direction: filters.direction }),
        ...(filters?.startDate && { startDate: filters.startDate.toString() }),
        ...(filters?.endDate && { endDate: filters.endDate.toString() }),
        ...(filters?.page && { page: String(filters.page) }),
        ...(filters?.limit && { limit: String(filters.limit) }),
      });

      const response = await apiClient.get<ApiResponse<Message[]>>(`/messages?${params}`);
      return response.data;
    },
    enabled: !!businessId,
  });
}

export function useSendMessage(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageData: SendMessageDto) => {
      const response = await apiClient.post<ApiResponse<Message>>('/messages', messageData);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', businessId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', businessId] });
    },
  });
}

export function useSendBulkMessages(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bulkData: SendBulkMessagesDto) => {
      const response = await apiClient.post<ApiResponse<any>>('/messages/bulk', bulkData);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', businessId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', businessId] });
    },
  });
}

export function useMessageStats(businessId: string | undefined, startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ['message-stats', businessId, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        businessId: businessId!,
        ...(startDate && { startDate: startDate.toISOString() }),
        ...(endDate && { endDate: endDate.toISOString() }),
      });

      const response = await apiClient.get<ApiResponse<MessageStats>>(
        `/messages/stats?${params}`
      );
      return response.data.data;
    },
    enabled: !!businessId,
  });
}

// ============================================================================
// MESSAGE TEMPLATES
// ============================================================================

export function useMessageTemplates(businessId: string | undefined, filters?: MessageTemplateFilters) {
  return useQuery({
    queryKey: ['message-templates', businessId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        businessId: businessId!,
        ...(filters?.type && { type: Array.isArray(filters.type) ? filters.type.join(',') : filters.type }),
        ...(filters?.category && { category: filters.category }),
        ...(filters?.isActive !== undefined && { isActive: String(filters.isActive) }),
        ...(filters?.search && { search: filters.search }),
        ...(filters?.page && { page: String(filters.page) }),
        ...(filters?.limit && { limit: String(filters.limit) }),
      });

      const response = await apiClient.get<ApiResponse<MessageTemplate[]>>(
        `/message-templates?${params}`
      );
      return response.data;
    },
    enabled: !!businessId,
  });
}

export function useMessageTemplate(templateId: string, businessId: string | undefined) {
  return useQuery({
    queryKey: ['message-template', templateId, businessId],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<MessageTemplate>>(
        `/message-templates/${templateId}?businessId=${businessId}`
      );
      return response.data.data;
    },
    enabled: !!templateId && !!businessId,
  });
}

export function useCreateTemplate(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateData: CreateMessageTemplateDto) => {
      const response = await apiClient.post<ApiResponse<MessageTemplate>>(
        '/message-templates',
        templateData
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates', businessId] });
    },
  });
}

export function useUpdateTemplate(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ templateId, data }: { templateId: string; data: UpdateMessageTemplateDto }) => {
      const response = await apiClient.patch<ApiResponse<MessageTemplate>>(
        `/message-templates/${templateId}?businessId=${businessId}`,
        data
      );
      return response.data.data;
    },
    onSuccess: (_, { templateId }) => {
      queryClient.invalidateQueries({ queryKey: ['message-templates', businessId] });
      queryClient.invalidateQueries({ queryKey: ['message-template', templateId] });
    },
  });
}

export function useDeleteTemplate(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      await apiClient.delete(
        `/message-templates/${templateId}?businessId=${businessId}`
      );
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates', businessId] });
    },
  });
}

export function usePreviewTemplate(businessId: string | undefined) {
  return useMutation({
    mutationFn: async (previewData: PreviewTemplateDto) => {
      const response = await apiClient.post<ApiResponse<any>>(
        `/message-templates/preview?businessId=${businessId}`,
        previewData
      );
      return response.data.data;
    },
  });
}

// ============================================================================
// COMMUNICATION SETTINGS
// ============================================================================

export function useCommunicationSettings(businessId: string | undefined) {
  return useQuery({
    queryKey: ['communication-settings', businessId],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<CommunicationSettings>>(
        `/communication-settings?businessId=${businessId}`
      );
      return response.data.data;
    },
    enabled: !!businessId,
  });
}

export function useUpdateCommunicationSettings(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settingsData: UpdateCommunicationSettingsDto) => {
      const response = await apiClient.patch<ApiResponse<CommunicationSettings>>(
        `/communication-settings?businessId=${businessId}`,
        settingsData
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-settings', businessId] });
    },
  });
}

export function useTestProviderConnection(businessId: string | undefined) {
  return useMutation({
    mutationFn: async (provider: 'twilio' | 'sendgrid' | 'whatsapp') => {
      const response = await apiClient.post<ApiResponse<{ success: boolean; message: string }>>(
        `/communication-settings/test-${provider}?businessId=${businessId}`
      );
      return response.data;
    },
  });
}
