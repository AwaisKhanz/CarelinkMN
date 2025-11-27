import { apiService } from "../config";
import {
  Consent,
  CreateConsentData,
  UpdateConsentData,
  ApiResponse,
} from "@carelink/types";

export class ConsentService {
  /**
   * Get consent for a discharge case
   */
  async getConsentByCaseId(
    caseId: string
  ): Promise<ApiResponse<Consent | null>> {
    return apiService.get<Consent | null>(
      `/api/discharge-cases/${caseId}/consent`
    );
  }

  /**
   * Get consent for a referral
   */
  async getConsentByReferralId(
    referralId: string
  ): Promise<ApiResponse<Consent | null>> {
    return apiService.get<Consent | null>(
      `/api/referrals/${referralId}/consent`
    );
  }

  /**
   * Create a consent record
   */
  async createConsent(
    caseId: string,
    data: CreateConsentData
  ): Promise<ApiResponse<Consent>> {
    return apiService.post<Consent>(
      `/api/discharge-cases/${caseId}/consent`,
      data
    );
  }

  /**
   * Update a consent record
   */
  async updateConsent(
    consentId: string,
    data: UpdateConsentData
  ): Promise<ApiResponse<Consent>> {
    return apiService.patch<Consent>(`/api/consents/${consentId}`, data);
  }

  /**
   * Revoke a consent record
   */
  async revokeConsent(
    consentId: string,
    reason?: string
  ): Promise<ApiResponse<Consent>> {
    return apiService.patch<Consent>(`/api/consents/${consentId}/revoke`, {
      revokedReason: reason,
    });
  }
}

// Export singleton instance
export const consentService = new ConsentService();

