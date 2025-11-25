import { apiService } from '../config';
import {
  License,
  CreateLicenseData,
  UpdateLicenseData,
  LicenseStatus,
  ApiResponse,
  Referral,
  ProviderService as ProviderServiceType,
  Service,
  SubscriptionTier,
} from '@carelink/types';

import { Home, ProviderHomesResponse } from './home.service';

export interface Provider {
  id: string;
  organizationId: string;
  primaryLicenseType: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  acceptsReferrals: boolean;
  responseTimeHours?: number;
  verified?: boolean;
  verifiedAt?: string | null;
  verificationNotes?: string | null;
  subscriptionTier?: SubscriptionTier;
  subscriptionId?: string | null;
  createdAt: string;
  updatedAt: string;
  organization?: {
    id: string;
    name: string;
    type: string;
    email: string;
    phone: string;
    city: string;
    state: string;
    county: string;
    addressLine1: string;
    addressLine2?: string;
    zipCode: string;
    website?: string;
  };
  licenses?: ProviderLicense[];
  homes?: Home[];
}

export interface ProviderLicense {
  id: string;
  providerId: string;
  licenseType: string;
  licenseNumber: string;
  issueDate: string;
  expirationDate: string;
  documentUrl?: string;
  fileName?: string;
  status: LicenseStatus;
  verifiedAt?: string;
  verifiedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProviderData {
  organizationId: string;
  primaryLicenseType: string;
  description: string;
  acceptsReferrals?: boolean;
  responseTimeHours?: number;
}

export interface UpdateProviderData extends Partial<CreateProviderData> {
  id?: string;
}

export interface CreateProviderLicenseData {
  licenseType: string;
  licenseNumber: string;
  issueDate: string;
  expirationDate: string;
  documentUrl: string;
  fileName?: string;
}

export interface UpdateProviderLicenseData extends Partial<CreateProviderLicenseData> {
  id: string;
}

export interface GetProvidersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  organizationType?: string;
  city?: string;
  state?: string;
  county?: string;
}

export interface ProviderReferralsResponse {
  referrals: Referral[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface GetProvidersResponse {
  providers: Provider[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export class ProviderService {
  // Get all providers with pagination and filters
  async getProviders(params: GetProvidersParams = {}): Promise<ApiResponse<GetProvidersResponse>> {
    const { page = 1, limit = 10, search, status, organizationType, city, state, county } = params;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) searchParams.append('search', search);
    if (status) searchParams.append('status', status);
    if (organizationType) searchParams.append('organizationType', organizationType);
    if (city) searchParams.append('city', city);
    if (state) searchParams.append('state', state);
    if (county) searchParams.append('county', county);

    return await apiService.get<GetProvidersResponse>(`/api/providers?${searchParams}`);
  }

  // Get provider by ID
  async getProviderById(id: string): Promise<Provider> {
    const response = await apiService.get<Provider>(`/api/providers/${id}`);
    return response.data!;
  }

  // Get provider public profile (for case managers)
  async getProviderProfile(id: string): Promise<ApiResponse<Provider>> {
    return apiService.get<Provider>(`/api/providers/${id}/public-profile`);
  }

  // Get provider by user ID
  async getProviderByUserId(userId: string): Promise<Provider> {
    const response = await apiService.get<Provider>(`/api/providers/by-user/${userId}`);
    if (!response.success || !response.data) {
      throw new Error(response.message || "Provider not found");
    }
    // Validate response matches schema
    const { validateProviderResponse } = await import("@/lib/utils/api-validation");
    return validateProviderResponse(response.data);
  }

  // Get provider by organization ID
  async getProviderByOrganizationId(organizationId: string): Promise<Provider> {
    const response = await apiService.get<Provider>(`/api/providers/organization/${organizationId}`);
    return response.data!;
  }

  // Create provider
  async createProvider(data: CreateProviderData): Promise<Provider> {
    const response = await apiService.post<Provider>('/api/providers', data);
    return response.data!;
  }

  // Update provider
  async updateProvider(id: string, data: UpdateProviderData): Promise<Provider> {
    const response = await apiService.put<Provider>(`/api/providers/${id}`, data);
    return response.data!;
  }

  // Delete provider
  async deleteProvider(id: string): Promise<void> {
    await apiService.delete(`/api/providers/${id}`);
  }

  // Get provider licenses
  async getProviderLicenses(providerId: string, status?: LicenseStatus): Promise<ApiResponse<License[]>> {
    const url = status
      ? `/api/providers/${providerId}/licenses?status=${status}`
      : `/api/providers/${providerId}/licenses`;
    const response = await apiService.get<License[]>(url);
    
    // Validate response if successful
    if (response.success && response.data) {
      const { validateLicensesResponse } = await import("@/lib/utils/api-validation");
      try {
        response.data = validateLicensesResponse(response.data);
      } catch (error) {
        console.error("License validation failed:", error);
        // Return original response but log warning
      }
    }
    
    return response;
  }

  // Create provider license
  async createProviderLicense(providerId: string, data: CreateLicenseData): Promise<ApiResponse<License>> {
    return await apiService.post<License>(`/api/providers/${providerId}/licenses`, data);
  }

  // Update provider license
  async updateProviderLicense(providerId: string, licenseId: string, data: UpdateLicenseData): Promise<ApiResponse<License>> {
    return await apiService.put<License>(`/api/providers/${providerId}/licenses/${licenseId}`, data);
  }

  // Delete provider license
  async deleteProviderLicense(providerId: string, licenseId: string): Promise<ApiResponse<void>> {
    return await apiService.delete<void>(`/api/providers/${providerId}/licenses/${licenseId}`);
  }

  // Get provider homes
  async getProviderHomes(providerId: string, params: GetProvidersParams = {}) {
    const { page = 1, limit = 10, search, status } = params;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) searchParams.append('search', search);
    if (status) searchParams.append('status', status);

    return await apiService.get<ProviderHomesResponse>(
      `/api/providers/${providerId}/homes?${searchParams}`
    );
  }

  // Get provider analytics
  async getProviderAnalytics(providerId: string) {
    return await apiService.get(`/api/providers/${providerId}/analytics`);
  }

  // Get provider referrals
  async getProviderReferrals(providerId: string, params: GetProvidersParams = {}) {
    const { page = 1, limit = 10, status } = params;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status) searchParams.append('status', status);

    return await apiService.get<ProviderReferralsResponse>(
      `/api/providers/${providerId}/referrals?${searchParams}`
    );
  }

  // Get single provider referral detail
  async getProviderReferralById(providerId: string, referralId: string) {
    return await apiService.get<Referral>(
      `/api/providers/${providerId}/referrals/${referralId}`
    );
  }

  // Get provider services
  async getProviderServices(providerId: string): Promise<ApiResponse<ProviderServiceType[]>> {
    return await apiService.get<ProviderServiceType[]>(`/api/providers/${providerId}/services`);
  }

  // Update provider services
  async updateProviderServices(providerId: string, serviceIds: string[]): Promise<void> {
    await apiService.put(`/api/providers/${providerId}/services`, { serviceIds });
  }

  // Get available services for providers
  // If providerId is provided, filters services based on provider's active licenses
  async getAvailableServices(providerId?: string): Promise<ApiResponse<Service[]>> {
    const url = providerId 
      ? `/api/services?providerId=${providerId}`
      : '/api/services';
    return await apiService.get<Service[]>(url);
  }

  // Update provider profile
  async updateProviderProfile(providerId: string, data: {
    description?: string;
    logo?: string;
    coverImage?: string;
    acceptsReferrals?: boolean;
    responseTimeHours?: number;
  }): Promise<Provider> {
    const response = await apiService.put<Provider>(`/api/providers/${providerId}/profile`, data);
    return response.data!;
  }

  // Staff management methods
  async getOrganizationStaff(providerId: string): Promise<ApiResponse<StaffMember[]>> {
    return await apiService.get<StaffMember[]>(`/api/providers/${providerId}/staff`);
  }

  async inviteStaff(providerId: string, data: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }): Promise<ApiResponse<StaffMember>> {
    return await apiService.post<StaffMember>(`/api/providers/${providerId}/staff`, data);
  }

  async removeStaff(providerId: string, staffUserId: string): Promise<ApiResponse<void>> {
    return await apiService.delete<void>(`/api/providers/${providerId}/staff/${staffUserId}`);
  }

  async resendStaffInvite(
    providerId: string,
    staffUserId: string
  ): Promise<ApiResponse<void>> {
    return await apiService.post<void>(
      `/api/providers/${providerId}/staff/${staffUserId}/resend-invite`,
      {}
    );
  }

  // Respond to referral - Update provider's own shortlist status
  async respondToReferral(
    providerId: string,
    referralId: string,
    data: {
      status: string;
      notes?: string;
    }
  ): Promise<ApiResponse<any>> {
    return await apiService.post<any>(
      `/api/providers/${providerId}/referrals/${referralId}/respond`,
      data
    );
  }
}

export interface StaffMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  status: string;
  createdAt: string;
  lastLoginAt?: string | null;
  updatedAt?: string;
}

// Export singleton instance
export const providerService = new ProviderService();
export default providerService;