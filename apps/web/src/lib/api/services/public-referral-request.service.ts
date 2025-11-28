import { apiService } from "../config";
import {
  ApiResponse,
  CreateReferralRequestData,
  UpdateReferralRequestData,
  ReferralRequest,
  ReferralRequestStats,
  GetRequestsParams,
  GetRequestsResponse,
} from "@carelink/types";

// ============================================
// PUBLIC REFERRAL REQUEST SERVICE
// ============================================

export const publicReferralRequestService = {
  /**
   * Create a new referral request (auth required)
   */
  async createRequest(
    data: CreateReferralRequestData
  ): Promise<ApiResponse<ReferralRequest>> {
    return apiService.post<ReferralRequest>("/api/public-requests", data);
  },

  /**
   * Get all requests for the authenticated user (auth required)
   */
  async getRequests(
    params?: GetRequestsParams
  ): Promise<ApiResponse<GetRequestsResponse>> {
    const searchParams = new URLSearchParams();

    if (params?.status) {
      searchParams.append("status", params.status);
    }
    if (params?.page) {
      searchParams.append("page", params.page.toString());
    }
    if (params?.limit) {
      searchParams.append("limit", params.limit.toString());
    }

    const query = searchParams.toString();
    return apiService.get<GetRequestsResponse>(
      `/api/public-requests${query ? `?${query}` : ""}`
    );
  },

  /**
   * Get a single request by ID (auth required)
   */
  async getRequest(id: string): Promise<ApiResponse<ReferralRequest>> {
    return apiService.get<ReferralRequest>(`/api/public-requests/${id}`);
  },

  /**
   * Update a request (auth required)
   */
  async updateRequest(
    id: string,
    data: UpdateReferralRequestData
  ): Promise<ApiResponse<ReferralRequest>> {
    return apiService.put<ReferralRequest>(`/api/public-requests/${id}`, data);
  },

  /**
   * Cancel a request (auth required)
   */
  async cancelRequest(id: string): Promise<ApiResponse<void>> {
    return apiService.delete<void>(`/api/public-requests/${id}`);
  },

  /**
   * Get request statistics (auth required)
   */
  async getStats(): Promise<ApiResponse<ReferralRequestStats>> {
    return apiService.get<ReferralRequestStats>("/api/public-requests/stats");
  },

  /**
   * Get queue of pending requests (Case Managers only)
   */
  async getQueue(
    params?: GetRequestsParams
  ): Promise<ApiResponse<GetRequestsResponse>> {
    const searchParams = new URLSearchParams();

    if (params?.status) {
      searchParams.append("status", params.status);
    }
    if (params?.urgency) {
      searchParams.append("urgency", params.urgency);
    }
    if (params?.page) {
      searchParams.append("page", params.page.toString());
    }
    if (params?.limit) {
      searchParams.append("limit", params.limit.toString());
    }

    const query = searchParams.toString();
    return apiService.get<GetRequestsResponse>(
      `/api/public-requests/queue${query ? `?${query}` : ""}`
    );
  },

  /**
   * Claim a request (Case Managers only)
   */
  async claimRequest(id: string): Promise<ApiResponse<ReferralRequest>> {
    return apiService.post<ReferralRequest>(`/api/public-requests/${id}/claim`, {});
  },
};
