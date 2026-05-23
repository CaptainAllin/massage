import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  IntakeForm,
  IntakeFormTemplate,
  IntakeFormFilters,
  ApiResponse,
} from '@massage/types';
import { apiClient } from '@/lib/api-client';

// Fetch all intake forms
export function useIntakeForms(businessId: string | undefined, filters?: IntakeFormFilters) {
  return useQuery({
    queryKey: ['intake-forms', businessId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        businessId: businessId!,
        ...(filters?.clientId && { clientId: filters.clientId }),
        ...(filters?.templateId && { templateId: filters.templateId }),
        ...(filters?.startDate && { startDate: filters.startDate.toISOString() }),
        ...(filters?.endDate && { endDate: filters.endDate.toISOString() }),
        ...(filters?.page && { page: String(filters.page) }),
        ...(filters?.limit && { limit: String(filters.limit) }),
      });

      const response = await apiClient.get(`/intake-forms?${params}`);
      return response.data;
    },
    enabled: !!businessId,
  });
}

// Fetch single intake form
export function useIntakeForm(formId: string, businessId: string | undefined) {
  return useQuery({
    queryKey: ['intake-form', formId, businessId],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<IntakeForm>>(
        `/intake-forms/${formId}?businessId=${businessId}`
      );
      return response.data.data;
    },
    enabled: !!formId && !!businessId,
  });
}

// Fetch all intake form templates
export function useIntakeFormTemplates(businessId: string | undefined) {
  return useQuery({
    queryKey: ['intake-form-templates', businessId],
    queryFn: async () => {
      const response = await apiClient.get(`/intake-form-templates?businessId=${businessId}`);
      return response.data;
    },
    enabled: !!businessId,
  });
}

// Create intake form mutation
export function useCreateIntakeForm(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: {
      clientId: string;
      templateId?: string;
      formData: any;
    }) => {
      const response = await apiClient.post<ApiResponse<IntakeForm>>('/intake-forms', {
        businessId,
        ...formData,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intake-forms', businessId] });
    },
  });
}

// Create intake form template mutation
export function useCreateIntakeFormTemplate(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateData: {
      name: string;
      description?: string;
      fields: any[];
      isDefault?: boolean;
    }) => {
      const response = await apiClient.post<ApiResponse<IntakeFormTemplate>>(
        '/intake-form-templates',
        { businessId, ...templateData }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intake-form-templates', businessId] });
    },
  });
}

// Update intake form template mutation
export function useUpdateIntakeFormTemplate(templateId: string, businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateData: Partial<IntakeFormTemplate>) => {
      const response = await apiClient.patch<ApiResponse<IntakeFormTemplate>>(
        `/intake-form-templates/${templateId}?businessId=${businessId}`,
        templateData
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intake-form-templates', businessId] });
    },
  });
}
