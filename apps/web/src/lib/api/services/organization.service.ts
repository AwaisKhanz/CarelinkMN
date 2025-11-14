import { apiService } from '../config';
import {
  Organization,
  OrganizationCreateData,
  OrganizationUpdateData,
  SearchOrganizationsParams,
  GetOrganizationsParams
} from '../types/organization.types';

export class OrganizationService {
  // Search organizations
  async searchOrganizations(params: SearchOrganizationsParams): Promise<Organization[]> {
    const { query, type, limit = 10 } = params;
    
    const searchParams = new URLSearchParams({
      query,
      limit: limit.toString(),
    });
    
    if (type) {
      searchParams.append('type', type);
    }

    const response = await apiService.get<Organization[]>(`/api/organizations/search?${searchParams}`);
    return response.data || [];
  }

  // Get all organizations with pagination
  async getOrganizations(params: GetOrganizationsParams = {}) {
    const { page = 1, limit = 10, type, status } = params;
    
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (type) searchParams.append('type', type);
    if (status) searchParams.append('status', status);

    return await apiService.get(`/api/organizations?${searchParams}`);
  }

  // Get organization by ID
  async getOrganizationById(id: string): Promise<Organization> {
    const response = await apiService.get<Organization>(`/api/organizations/${id}`);
    return response.data!;
  }

  // Create organization
  async createOrganization(data: OrganizationCreateData): Promise<Organization> {
    const response = await apiService.post<Organization>('/api/organizations', data);
    return response.data!;
  }

  // Update organization
  async updateOrganization(id: string, data: OrganizationUpdateData): Promise<Organization> {
    const response = await apiService.put<Organization>(`/api/organizations/${id}`, data);
    return response.data!;
  }

  // Delete organization
  async deleteOrganization(id: string): Promise<void> {
    await apiService.delete(`/api/organizations/${id}`);
  }
}

// Export singleton instance
export const organizationService = new OrganizationService();
export default organizationService;
