import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NoteTemplate, CommunityTemplate } from '@massage/types';
import { apiClient } from '@/lib/api-client';

export function useNoteTemplates(
  businessId: string | undefined,
  options?: { category?: string; includeArchived?: boolean }
) {
  return useQuery({
    queryKey: ['note-templates', businessId, options],
    queryFn: async () => {
      const params = new URLSearchParams({ businessId: businessId! });
      if (options?.category) params.set('category', options.category);
      if (options?.includeArchived) params.set('includeArchived', 'true');
      const response = await apiClient.get(`/note-templates?${params}`);
      return response.data.data as NoteTemplate[];
    },
    enabled: !!businessId,
  });
}

export function useCreateNoteTemplate(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; category: string; fields: any[] }) => {
      const response = await apiClient.post('/note-templates', { businessId, ...data });
      return response.data.data as NoteTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note-templates', businessId] });
    },
  });
}

export function useUpdateNoteTemplate(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: { id: string; name?: string; category?: string; fields?: any[]; isArchived?: boolean }) => {
      const response = await apiClient.patch(`/note-templates/${id}?businessId=${businessId}`, {
        businessId,
        ...data,
      });
      return response.data.data as NoteTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note-templates', businessId] });
    },
  });
}

export function useDeleteNoteTemplate(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/note-templates/${id}?businessId=${businessId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note-templates', businessId] });
    },
  });
}

export function useDuplicateNoteTemplate(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (template: NoteTemplate) => {
      const response = await apiClient.post('/note-templates', {
        businessId,
        name: `${template.name} (Copy)`,
        category: template.category,
        fields: template.fields,
      });
      return response.data.data as NoteTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note-templates', businessId] });
    },
  });
}

// Community Template hooks

export function useCommunityTemplates(options?: {
  category?: string;
  search?: string;
  page?: number;
}) {
  return useQuery({
    queryKey: ['community-templates', options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.category) params.set('category', options.category);
      if (options?.search) params.set('search', options.search);
      if (options?.page) params.set('page', String(options.page));
      const response = await apiClient.get(`/community-templates?${params}`);
      return response.data.data as { templates: CommunityTemplate[]; total: number; page: number; limit: number };
    },
  });
}

export function useShareTemplate(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { templateId: string; description?: string }) => {
      const response = await apiClient.post('/community-templates', {
        businessId,
        ...data,
      });
      return response.data.data as CommunityTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-templates'] });
    },
  });
}

export function useImportCommunityTemplate(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (communityTemplateId: string) => {
      const response = await apiClient.post(`/community-templates/${communityTemplateId}`, {
        businessId,
      });
      return response.data.data as NoteTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note-templates', businessId] });
    },
  });
}

export function useAdminCommunityTemplates(status: string = 'PENDING') {
  return useQuery({
    queryKey: ['admin-community-templates', status],
    queryFn: async () => {
      const response = await apiClient.get(`/admin/community-templates?status=${status}`);
      return response.data.data as { templates: CommunityTemplate[]; total: number };
    },
  });
}

export function useModerateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: string; action: 'approve' | 'reject'; rejectionReason?: string }) => {
      const { id, ...body } = data;
      const response = await apiClient.patch(`/admin/community-templates/${id}`, body);
      return response.data.data as CommunityTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-community-templates'] });
    },
  });
}
