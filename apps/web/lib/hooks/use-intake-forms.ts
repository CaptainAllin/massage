import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  IntakeForm,
  IntakeFormTemplate,
  IntakeFormFilters,
  ApiResponse,
  PaginatedResponse,
} from '@massage/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Fetch all intake forms
export function useIntakeForms(businessId: string, filters?: IntakeFormFilters) {
  return useQuery({
    queryKey: ['intake-forms', businessId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        businessId,
        ...(filters?.clientId && { clientId: filters.clientId }),
        ...(filters?.templateId && { templateId: filters.templateId }),
        ...(filters?.startDate && { startDate: filters.startDate.toISOString() }),
        ...(filters?.endDate && { endDate: filters.endDate.toISOString() }),
        ...(filters?.page && { page: String(filters.page) }),
        ...(filters?.limit && { limit: String(filters.limit) }),
      });

      const response = await fetch(`${API_URL}/intake-forms?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch intake forms');
      return await response.json();
    },
    enabled: !!businessId,
  });
}

// Fetch single intake form
export function useIntakeForm(formId: string, businessId: string) {
  return useQuery({
    queryKey: ['intake-form', formId, businessId],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/intake-forms/${formId}?businessId=${businessId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch intake form');
      const data: ApiResponse<IntakeForm> = await response.json();
      return data.data;
    },
    enabled: !!formId && !!businessId,
  });
}

// Fetch all intake form templates
export function useIntakeFormTemplates(businessId: string) {
  return useQuery({
    queryKey: ['intake-form-templates', businessId],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/intake-form-templates?businessId=${businessId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch templates');
      return await response.json();
    },
    enabled: !!businessId,
  });
}

// Create intake form mutation
export function useCreateIntakeForm(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: {
      clientId: string;
      templateId?: string;
      formData: any;
    }) => {
      const response = await fetch(`${API_URL}/intake-forms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ businessId, ...formData }),
      });

      if (!response.ok) throw new Error('Failed to create intake form');
      const data: ApiResponse<IntakeForm> = await response.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intake-forms', businessId] });
    },
  });
}

// Create intake form template mutation
export function useCreateIntakeFormTemplate(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateData: {
      name: string;
      description?: string;
      fields: any[];
      isDefault?: boolean;
    }) => {
      const response = await fetch(`${API_URL}/intake-form-templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ businessId, ...templateData }),
      });

      if (!response.ok) throw new Error('Failed to create template');
      const data: ApiResponse<IntakeFormTemplate> = await response.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intake-form-templates', businessId] });
    },
  });
}

// Update intake form template mutation
export function useUpdateIntakeFormTemplate(templateId: string, businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateData: Partial<IntakeFormTemplate>) => {
      const response = await fetch(
        `${API_URL}/intake-form-templates/${templateId}?businessId=${businessId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(templateData),
        }
      );

      if (!response.ok) throw new Error('Failed to update template');
      const data: ApiResponse<IntakeFormTemplate> = await response.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intake-form-templates', businessId] });
    },
  });
}
