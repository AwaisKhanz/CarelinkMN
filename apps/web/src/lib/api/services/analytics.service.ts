import { apiService } from '../config';
import {
  ApiResponse,
  ProviderAnalytics,
  ProviderAnalyticsFilters,
} from '@carelink/types';

export interface GetAnalyticsParams {
  providerId: string;
  startDate?: string;
  endDate?: string;
}

export class AnalyticsService {
  async getProviderAnalytics(params: GetAnalyticsParams): Promise<ApiResponse<ProviderAnalytics>> {
    const { providerId, startDate, endDate } = params;
    
    const searchParams = new URLSearchParams();
    if (startDate) searchParams.append('startDate', startDate);
    if (endDate) searchParams.append('endDate', endDate);
    
    const queryString = searchParams.toString();
    const url = `/api/providers/${providerId}/analytics${queryString ? `?${queryString}` : ''}`;
    
    return await apiService.get<ProviderAnalytics>(url);
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;

