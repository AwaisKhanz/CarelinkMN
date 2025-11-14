import { apiService } from '../config';
import {
  CaseManager,
  CaseManagerDashboard,
  CaseManagerStats,
  UpdateCaseManagerData,
  ApiResponse,
} from '@carelink/types';

export class CaseManagerService {
  /**
   * Get case manager by user ID
   */
  async getCaseManagerByUserId(userId: string): Promise<ApiResponse<CaseManager>> {
    return apiService.get<CaseManager>(`/api/case-managers/${userId}`);
  }

  /**
   * Update case manager profile
   */
  async updateCaseManager(
    userId: string,
    data: UpdateCaseManagerData
  ): Promise<ApiResponse<CaseManager>> {
    return apiService.put<CaseManager>(`/api/case-managers/${userId}`, data);
  }

  /**
   * Get case manager dashboard
   */
  async getDashboard(userId: string): Promise<ApiResponse<CaseManagerDashboard>> {
    return apiService.get<CaseManagerDashboard>(`/api/case-managers/${userId}/dashboard`);
  }

  /**
   * Get case manager statistics
   */
  async getStats(
    userId: string,
    dateRange?: { startDate?: Date | string; endDate?: Date | string }
  ): Promise<ApiResponse<CaseManagerStats>> {
    const queryParams = new URLSearchParams();
    
    if (dateRange?.startDate) {
      const startDate = dateRange.startDate instanceof Date 
        ? dateRange.startDate.toISOString() 
        : dateRange.startDate;
      queryParams.append('startDate', startDate);
    }
    if (dateRange?.endDate) {
      const endDate = dateRange.endDate instanceof Date 
        ? dateRange.endDate.toISOString() 
        : dateRange.endDate;
      queryParams.append('endDate', endDate);
    }

    const queryString = queryParams.toString();
    const url = `/api/case-managers/${userId}/stats${queryString ? `?${queryString}` : ''}`;
    
    return apiService.get<CaseManagerStats>(url);
  }
}

export const caseManagerService = new CaseManagerService();

