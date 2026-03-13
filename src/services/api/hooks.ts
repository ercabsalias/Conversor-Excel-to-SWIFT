/**
 * API Hooks using React Query
 * Provides easy-to-use hooks for data fetching and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { endpoints } from './endpoints';
import { env } from '@/config/env';
import { Parameters, Mapping, ColumnMapping } from '@/types';
import { setOfflineMode, loadParametersFromStorage, loadMappingsFromStorage } from '@/services/seed';

// ============ Authentication ============

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: string;
  companyId: string;
  // additional fields for user info
  id: string;
  username: string;
  firstName: string;
  lastName: string;
}

export const useLogin = () => {
  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      // simulate login without backend
      if (env.enableLogging) {
        console.log('login mutation payload', credentials);
      }

      // In a real scenario we would call the API; here we just return dummy data
      const fakeResponse: LoginResponse = {
        token: 'fake-token',
        userId: 'user_001',
        companyId: 'DEMO_001',
        id: 'user_001',
        username: credentials.username,
        firstName: 'Demo',
        lastName: 'User',
      };

      // small delay to mimic network
      await new Promise((r) => setTimeout(r, 200));
      return fakeResponse;
    },
  });
};

// ============ Parameters ============

export const useParameters = (companyId: string) => {
  return useQuery({
    queryKey: ['parameters', companyId],
    queryFn: async () => {
      try {
        const response = await apiClient.get<Parameters>(
          endpoints.parameters.getByCompany(companyId)
        );
        if (!response.success) throw new Error(response.error?.message);
        return response.data;
      } catch (error) {
        // Fallback to offline mode and return saved seed
        setOfflineMode(true);
        const fallback = loadParametersFromStorage();
        return fallback;
      }
    },
    retry: 1,
  });
};

export const useUpdateParameters = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: Parameters) => {
      const response = await apiClient.put<Parameters>(
        endpoints.parameters.update(params.companyId),
        { body: params }
      );
      if (!response.success) throw new Error(response.error?.message);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['parameters', data.companyId] });
    },
  });
};

// ============ Mappings ============

export const useMappings = (companyId: string) => {
  return useQuery({
    queryKey: ['mappings', companyId],
    queryFn: async () => {
      try {
        const response = await apiClient.get<Mapping[]>(
          endpoints.mappings.listByCompany(companyId)
        );
        if (!response.success) throw new Error(response.error?.message);
        return response.data || [];
      } catch (error) {
        // Fallback to offline mode and return saved seed mappings
        setOfflineMode(true);
        return loadMappingsFromStorage();
      }
    },
    retry: 1,
  });
};

export const useCreateMapping = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mapping: Mapping) => {
      const response = await apiClient.post<Mapping>(endpoints.mappings.create, {
        body: mapping,
      });
      if (!response.success) throw new Error(response.error?.message);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mappings', data.companyId] });
    },
  });
};

export const useUpdateMapping = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mapping: Mapping) => {
      const response = await apiClient.put<Mapping>(
        endpoints.mappings.update(mapping.id),
        { body: mapping }
      );
      if (!response.success) throw new Error(response.error?.message);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mappings', data.companyId] });
    },
  });
};

export const useDeleteMapping = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mappingId: string) => {
      const response = await apiClient.delete(endpoints.mappings.delete(mappingId));
      if (!response.success) throw new Error(response.error?.message);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mappings'] });
    },
  });
};

// ============ Column Mappings ============

export const useColumnMapping = (companyId: string, sheetName: string) => {
  return useQuery({
    queryKey: ['columnMapping', companyId, sheetName],
    queryFn: async () => {
      try {
        const response = await apiClient.get<ColumnMapping>(
          endpoints.columnMappings.getByCompanyAndSheet(companyId, sheetName)
        );
        if (!response.success) throw new Error(response.error?.message);
        return response.data;
      } catch {
        // Can return null if not found
        return null;
      }
    },
    retry: 1,
  });
};

export const useSaveColumnMapping = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (columnMapping: ColumnMapping) => {
      const response = await apiClient.post<ColumnMapping>(
        endpoints.columnMappings.save,
        {
          body: columnMapping,
        }
      );
      if (!response.success) throw new Error(response.error?.message);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['columnMapping', data.companyId, data.sheetName],
      });
    },
  });
};

// ============ Company ============

export interface Company {
  id: string;
  name: string;
  code: string;
}

export const useCompany = (companyId: string) => {
  return useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      try {
        const response = await apiClient.get<Company>(
          endpoints.company.get(companyId)
        );
        if (!response.success) throw new Error(response.error?.message);
        return response.data;
      } catch (error) {
        // Fallback to offline mode
        setOfflineMode(true);
        throw error;
      }
    },
    retry: 1,
  });
};