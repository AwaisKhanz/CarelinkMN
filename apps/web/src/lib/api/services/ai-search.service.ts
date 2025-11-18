import { apiService } from '../config';
import { ApiResponse } from '@carelink/types';

export interface ParsedQueryFilters {
  counties?: string[];
  cities?: string[];
  licenseTypes?: string[];
  services?: string[];
  payers?: string[];
  maxDistance?: number;
  hasAvailability?: boolean;
}

export interface ParseQueryResponse {
  query: string;
  filters: ParsedQueryFilters;
  explanation?: string;
}

export class AISearchService {
  /**
   * Parse natural language query into structured filters
   */
  async parseQuery(query: string): Promise<ApiResponse<ParseQueryResponse>> {
    return apiService.post<ParseQueryResponse>('/api/ai-search/parse', { query });
  }
}

export const aiSearchService = new AISearchService();

