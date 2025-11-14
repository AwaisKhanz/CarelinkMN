import { apiService } from '../config';
import { Service, HomeService as HomeServiceType, ApiResponse } from '@carelink/types';

export interface HomePhoto {
  id: string;
  homeId: string;
  url: string;
  caption?: string;
  isPrimary: boolean;
  order: number;
  createdAt: string;
}

export interface HomeAmenity {
  id: string;
  homeId: string;
  amenityType: string;
  description?: string;
}

export interface Home {
  id: string;
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  latitude: number;
  longitude: number;
  capacity: number;
  currentOccupancy: number;
  // Accessibility features
  wheelchairAccessible: boolean;
  singleLevel: boolean;
  hasElevator: boolean;
  hasRollInShower: boolean;
  // Media
  virtualTourUrl?: string;
  photos: HomePhoto[];
  amenities: HomeAmenity[];
  // Services
  services: Array<HomeServiceType>;
  // Settings
  acceptingNew: boolean;
  isActive: boolean;
  providerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHomeData {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  latitude: number;
  longitude: number;
  capacity: number;
  currentOccupancy?: number;
  // Accessibility features
  wheelchairAccessible?: boolean;
  singleLevel?: boolean;
  hasElevator?: boolean;
  hasRollInShower?: boolean;
  // Media
  virtualTourUrl?: string;
  photos?: Array<{ url: string; caption?: string; isPrimary?: boolean; order?: number }>;
  // Amenities
  amenities?: Array<{ amenityType: string; description?: string }>;
  // Settings
  acceptingNew?: boolean;
  isActive?: boolean;
}

export interface UpdateHomeData extends Partial<CreateHomeData> {
  id: string;
}

export interface GetHomesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  city?: string;
  state?: string;
}

export interface ProviderHomesResponse {
  homes: Home[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export class HomeService {
  // Get provider homes
  async getProviderHomes(providerId: string, params: GetHomesParams = {}) {
    const { page = 1, limit = 10, search, status, city, state } = params;
    
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (search) searchParams.append('search', search);
    if (status) searchParams.append('status', status);
    if (city) searchParams.append('city', city);
    if (state) searchParams.append('state', state);

    return await apiService.get<ProviderHomesResponse>(
      `/api/providers/${providerId}/homes?${searchParams}`
    );
  }

  // Get home by ID
  async getHomeById(homeId: string): Promise<Home> {
    const response = await apiService.get<Home>(`/api/homes/${homeId}`);
    return response.data!;
  }

  // Create home
  async createHome(providerId: string, data: CreateHomeData): Promise<Home> {
    const response = await apiService.post<Home>(`/api/providers/${providerId}/homes`, data);
    return response.data!;
  }

  // Update home
  async updateHome(homeId: string, data: UpdateHomeData): Promise<Home> {
    const response = await apiService.put<Home>(`/api/homes/${homeId}`, data);
    return response.data!;
  }

  // Delete home
  async deleteHome(homeId: string): Promise<void> {
    await apiService.delete(`/api/homes/${homeId}`);
  }

  // Get home services
  async getHomeServices(homeId: string) {
    return await apiService.get(`/api/homes/${homeId}/services`);
  }

  // Update home services
  async updateHomeServices(homeId: string, serviceIds: string[]): Promise<void> {
    await apiService.put(`/api/homes/${homeId}/services`, { serviceIds });
  }

  // Get available services
  async getAvailableServices(): Promise<ApiResponse<Service[]>> {
    return await apiService.get<Service[]>('/api/services');
  }

  // Get home analytics
  async getHomeAnalytics(homeId: string) {
    return await apiService.get(`/api/homes/${homeId}/analytics`);
  }
}

// Export singleton instance
export const homeService = new HomeService();
export default homeService;
