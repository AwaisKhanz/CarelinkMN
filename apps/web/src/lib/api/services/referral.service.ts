import { apiService } from '../config';
import {
  Referral,
  CreateReferralData,
  UpdateReferralData,
  ReferralShortlist,
  AddToShortlistData,
  UpdateShortlistData,
  BatchMessageData,
  BatchShortlistData,
  GetReferralsParams,
  PaginatedReferrals,
  ApiResponse,
  MessageThread,
} from '@carelink/types';

export class ReferralService {
  /**
   * Create a new referral
   */
  async createReferral(data: CreateReferralData): Promise<ApiResponse<Referral>> {
    return apiService.post<Referral>('/api/referrals', data);
  }

  /**
   * Get referrals with filtering and pagination
   */
  async getReferrals(params?: GetReferralsParams): Promise<ApiResponse<PaginatedReferrals>> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.urgency) queryParams.append('urgency', params.urgency);
    if (params?.primaryPayer) queryParams.append('primaryPayer', params.primaryPayer);
    if (params?.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const url = `/api/referrals${queryString ? `?${queryString}` : ''}`;
    
    return apiService.get<PaginatedReferrals>(url);
  }

  /**
   * Get referral by ID
   */
  async getReferralById(referralId: string): Promise<ApiResponse<Referral>> {
    return apiService.get<Referral>(`/api/referrals/${referralId}`);
  }

  /**
   * Update referral
   */
  async updateReferral(referralId: string, data: UpdateReferralData): Promise<ApiResponse<Referral>> {
    return apiService.put<Referral>(`/api/referrals/${referralId}`, data);
  }

  /**
   * Delete referral
   */
  async deleteReferral(referralId: string): Promise<ApiResponse<void>> {
    return apiService.delete<void>(`/api/referrals/${referralId}`);
  }

  /**
   * Add providers to shortlist
   */
  async addToShortlist(
    referralId: string,
    data: AddToShortlistData
  ): Promise<ApiResponse<ReferralShortlist[]>> {
    return apiService.post<ReferralShortlist[]>(`/api/referrals/${referralId}/shortlist`, data);
  }

  /**
   * Update shortlist status
   */
  async updateShortlistStatus(
    referralId: string,
    shortlistId: string,
    data: UpdateShortlistData
  ): Promise<ApiResponse<ReferralShortlist>> {
    return apiService.put<ReferralShortlist>(
      `/api/referrals/${referralId}/shortlist/${shortlistId}`,
      data
    );
  }

  /**
   * Remove provider from shortlist
   */
  async removeFromShortlist(
    referralId: string,
    shortlistId: string
  ): Promise<ApiResponse<void>> {
    return apiService.delete<void>(`/api/referrals/${referralId}/shortlist/${shortlistId}`);
  }

  /**
   * Assign referral to another case manager
   */
  async assignReferral(
    referralId: string,
    assignedToUserId: string,
    notes?: string
  ): Promise<ApiResponse<Referral>> {
    return apiService.post<Referral>(`/api/referrals/${referralId}/assign`, {
      assignedToUserId,
      notes,
    });
  }

  /**
   * Get shortlist for a referral
   */
  async getShortlist(referralId: string): Promise<ApiResponse<ReferralShortlist[]>> {
    return apiService.get<ReferralShortlist[]>(`/api/referrals/${referralId}/shortlist`);
  }

  /**
   * Get referral timeline events
   */
  async getReferralTimeline(
    referralId: string
  ): Promise<ApiResponse<Array<{
    id: string;
    eventType: string;
    title: string;
    description: string;
    timestamp: string;
    userId?: string;
    userName?: string;
    eventData?: any;
  }>>> {
    return apiService.get(`/api/referrals/${referralId}/timeline`);
  }

  /**
   * Batch add to shortlist
   */
  async batchAddToShortlist(
    referralId: string,
    providerIds: string[],
    notes?: string
  ): Promise<ApiResponse<ReferralShortlist[]>> {
    return apiService.post<ReferralShortlist[]>(
      `/api/referrals/${referralId}/shortlist/batch`,
      { providerIds, notes }
    );
  }

  /**
   * Batch message providers
   */
  async batchMessageProviders(data: BatchMessageData): Promise<ApiResponse<MessageThread[]>> {
    return apiService.post<MessageThread[]>(`/api/referrals/batch-message`, data);
  }
}

export const referralService = new ReferralService();

