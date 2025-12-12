import { apiService } from '../config';
import { ApiResponse, Service } from '@carelink/types';

export interface CreateServiceInput {
  code: string;
  name: string;
  description?: string;
  category: string;
  licenseTypeIds: string[];
  isActive?: boolean;
}

export interface UpdateServiceInput {
  name?: string;
  description?: string;
  category?: string;
  licenseTypeIds?: string[];
  isActive?: boolean;
}

export class ServiceService {
  // Get all services
  async getAllServices(filters?: {
    category?: string;
    isActive?: boolean;
    includeInactive?: boolean;
  }): Promise<ApiResponse<Service[]>> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters?.includeInactive) params.append('includeInactive', 'true');

    const queryString = params.toString();
    return apiService.get<Service[]>(`/api/services${queryString ? `?${queryString}` : ''}`);
  }

  // Get service by ID
  async getServiceById(id: string): Promise<ApiResponse<Service>> {
    return apiService.get<Service>(`/api/services/${id}`);
  }

  // Create service
  async createService(data: CreateServiceInput): Promise<ApiResponse<Service>> {
    return apiService.post<Service>('/api/services', data);
  }

  // Update service
  async updateService(id: string, data: UpdateServiceInput): Promise<ApiResponse<Service>> {
    return apiService.put<Service>(`/api/services/${id}`, data);
  }

  // Delete service
  async deleteService(id: string): Promise<ApiResponse<void>> {
    return apiService.delete<void>(`/api/services/${id}`);
  }

  // Get services for provider (filtered by licenses)
  async getServicesForProvider(providerId: string): Promise<ApiResponse<Service[]>> {
    return apiService.get<Service[]>(`/api/services/provider/${providerId}`);
  }

  // Get service categories
  async getServiceCategories(): Promise<ApiResponse<string[]>> {
    return apiService.get<string[]>('/api/services/categories');
  }
}

export const serviceService = new ServiceService();
