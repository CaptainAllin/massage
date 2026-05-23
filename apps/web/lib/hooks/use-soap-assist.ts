import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../api-client';

// Enums matching backend
export enum SOAPSection {
  SUBJECTIVE = 'subjective',
  OBJECTIVE = 'objective',
  ASSESSMENT = 'assessment',
  PLAN = 'plan',
}

export enum AIProvider {
  OPENAI = 'openai',
  CLAUDE = 'claude',
}

// Request/Response types
interface SOAPAssistResponse {
  text: string;
  provider: string;
  model: string;
  usage: {
    tokens: number;
    cost: number;
  };
}

interface FormattedSOAPResponse {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  provider: string;
  model: string;
  usage: {
    tokens: number;
    cost: number;
  };
}

interface AutocompleteParams {
  context: string;
  section: SOAPSection;
  userId: string;
  provider?: AIProvider;
}

interface ImproveTextParams {
  text: string;
  section: SOAPSection;
  userId: string;
  provider?: AIProvider;
}

interface FormatToSOAPParams {
  rawText: string;
  userId: string;
  provider?: AIProvider;
}

/**
 * Hook for getting AI autocomplete suggestions while typing SOAP notes
 */
export function useSOAPAutocomplete() {
  return useMutation<SOAPAssistResponse, Error, AutocompleteParams>({
    mutationFn: async (params) => {
      const response = await apiClient.post('/ai/soap-assist/autocomplete', params);
      return response.data;
    },
  });
}

/**
 * Hook for improving existing SOAP note text
 */
export function useSOAPImprove() {
  return useMutation<SOAPAssistResponse, Error, ImproveTextParams>({
    mutationFn: async (params) => {
      const response = await apiClient.post('/ai/soap-assist/improve', params);
      return response.data;
    },
  });
}

/**
 * Hook for formatting raw text into SOAP structure
 */
export function useSOAPFormat() {
  return useMutation<FormattedSOAPResponse, Error, FormatToSOAPParams>({
    mutationFn: async (params) => {
      const response = await apiClient.post('/ai/soap-assist/format', params);
      return response.data;
    },
  });
}

export type {
  SOAPAssistResponse,
  FormattedSOAPResponse,
  AutocompleteParams,
  ImproveTextParams,
  FormatToSOAPParams,
};
