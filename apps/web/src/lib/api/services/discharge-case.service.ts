import { apiService } from "../config";
import {
  DischargeCase,
  CreateDischargeCaseData,
  UpdateDischargeCaseData,
  DischargeCaseFilters,
  DischargeInvitation,
  DischargeChecklist,
  PaginatedDischargeCases,
  AIMatchingResult,
  HospitalSWAnalytics,
  Placement,
  ApiResponse,
} from "@carelink/types";

export class DischargeCaseService {
  /**
   * Create a new discharge case
   */
  async createDischargeCase(
    data: CreateDischargeCaseData
  ): Promise<ApiResponse<DischargeCase>> {
    return apiService.post<DischargeCase>("/api/discharge-cases", data);
  }

  /**
   * Get discharge cases with filtering and pagination
   */
  async getDischargeCases(
    params?: DischargeCaseFilters
  ): Promise<ApiResponse<PaginatedDischargeCases>> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);
    if (params?.hospitalId) queryParams.append("hospitalId", params.hospitalId);
    if (params?.socialWorkerId)
      queryParams.append("socialWorkerId", params.socialWorkerId);
    if (params?.search) queryParams.append("search", params.search);
    if (params?.targetDischargeDateFrom) {
      const fromDate =
        params.targetDischargeDateFrom instanceof Date
          ? params.targetDischargeDateFrom.toISOString()
          : params.targetDischargeDateFrom.toString();
      queryParams.append("targetDischargeDateFrom", fromDate);
    }
    if (params?.targetDischargeDateTo) {
      const toDate =
        params.targetDischargeDateTo instanceof Date
          ? params.targetDischargeDateTo.toISOString()
          : params.targetDischargeDateTo.toString();
      queryParams.append("targetDischargeDateTo", toDate);
    }

    const queryString = queryParams.toString();
    const url = `/api/discharge-cases${queryString ? `?${queryString}` : ""}`;

    return apiService.get<PaginatedDischargeCases>(url);
  }

  /**
   * Get discharge case by ID
   */
  async getDischargeCaseById(
    caseId: string
  ): Promise<ApiResponse<DischargeCase>> {
    return apiService.get<DischargeCase>(`/api/discharge-cases/${caseId}`);
  }

  /**
   * Update discharge case
   */
  async updateDischargeCase(
    caseId: string,
    data: UpdateDischargeCaseData
  ): Promise<ApiResponse<DischargeCase>> {
    return apiService.put<DischargeCase>(
      `/api/discharge-cases/${caseId}`,
      data
    );
  }

  /**
   * Delete discharge case
   */
  async deleteDischargeCase(caseId: string): Promise<ApiResponse<void>> {
    return apiService.delete<void>(`/api/discharge-cases/${caseId}`);
  }

  /**
   * Get discharge case invitations
   */
  async getDischargeCaseInvitations(
    caseId: string
  ): Promise<ApiResponse<DischargeInvitation[]>> {
    return apiService.get<DischargeInvitation[]>(
      `/api/discharge-cases/${caseId}/invitations`
    );
  }

  /**
   * Send provider invitations
   */
  async sendProviderInvitations(
    caseId: string,
    providerIds: string[]
  ): Promise<ApiResponse<DischargeInvitation[]>> {
    return apiService.post<DischargeInvitation[]>(
      `/api/discharge-cases/${caseId}/invitations`,
      {
        providerIds,
      }
    );
  }

  /**
   * Get discharge checklist
   */
  async getDischargeChecklist(
    caseId: string
  ): Promise<ApiResponse<DischargeChecklist>> {
    return apiService.get<DischargeChecklist>(
      `/api/discharge-cases/${caseId}/checklist`
    );
  }

  /**
   * Update discharge checklist
   */
  async updateDischargeChecklist(
    caseId: string,
    checklistData: Partial<DischargeChecklist>
  ): Promise<ApiResponse<DischargeChecklist>> {
    return apiService.put<DischargeChecklist>(
      `/api/discharge-cases/${caseId}/checklist`,
      checklistData
    );
  }

  /**
   * Trigger AI matching for discharge case
   */
  async triggerAIMatching(
    caseId: string
  ): Promise<ApiResponse<AIMatchingResult>> {
    return apiService.post<AIMatchingResult>(
      `/api/discharge-cases/${caseId}/ai-matching`
    );
  }

  /**
   * Get Hospital SW analytics
   */
  async getHospitalSWAnalytics(
    startDate?: Date | string,
    endDate?: Date | string
  ): Promise<ApiResponse<HospitalSWAnalytics>> {
    const queryParams = new URLSearchParams();
    if (startDate) {
      const start =
        startDate instanceof Date
          ? startDate.toISOString()
          : startDate.toString();
      queryParams.append("startDate", start);
    }
    if (endDate) {
      const end =
        endDate instanceof Date ? endDate.toISOString() : endDate.toString();
      queryParams.append("endDate", end);
    }

    const queryString = queryParams.toString();
    const url = `/api/hospital-sw/analytics${queryString ? `?${queryString}` : ""}`;

    return apiService.get<HospitalSWAnalytics>(url);
  }

  /**
   * Get provider discharge invitations
   * NOTE: Backend API endpoint needs to be created: GET /providers/:providerId/discharge-invitations
   */
  async getProviderDischargeInvitations(
    providerId: string
  ): Promise<ApiResponse<{ invitations: DischargeInvitation[]; pagination: any }>> {
    return apiService.get<{ invitations: DischargeInvitation[]; pagination: any }>(
      `/api/providers/${providerId}/discharge-invitations`
    );
  }

  /**
   * Respond to discharge invitation
   * NOTE: Backend API endpoint needs to be created: PUT /discharge-invitations/:id/respond
   */
  async respondToDischargeInvitation(
    invitationId: string,
    data: {
      response: string;
      responseNotes?: string;
    }
  ): Promise<ApiResponse<DischargeInvitation>> {
    return apiService.put<DischargeInvitation>(
      `/api/discharge-invitations/${invitationId}/respond`,
      data
    );
  }
  /**
   * Create placement from invitation
   */
  async createPlacementFromInvitation(
    invitationId: string
  ): Promise<ApiResponse<Placement>> {
    return apiService.post<Placement>(
      `/api/discharge-cases/invitations/${invitationId}/placement`,
      {}
    );
  }
}

// Export singleton instance
export const dischargeCaseService = new DischargeCaseService();
