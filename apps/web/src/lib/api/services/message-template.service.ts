import { apiService } from '../config';
import { ApiResponse } from '@carelink/types';

export interface MessageTemplate {
  id: string;
  userId: string;
  organizationId?: string;
  name: string;
  subject?: string;
  content: string;
  category?: string;
  variables?: string[];
  usageCount: number;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMessageTemplateData {
  name: string;
  subject?: string;
  content: string;
  category?: string;
  variables?: string[];
  organizationId?: string;
}

export interface UpdateMessageTemplateData {
  name?: string;
  subject?: string;
  content?: string;
  category?: string;
  variables?: string[];
}

export class MessageTemplateService {
  /**
   * Get all templates for the authenticated user
   */
  async getTemplates(includeOrganization: boolean = true): Promise<ApiResponse<MessageTemplate[]>> {
    const queryParams = new URLSearchParams();
    if (!includeOrganization) {
      queryParams.append('includeOrganization', 'false');
    }
    const queryString = queryParams.toString();
    const url = `/api/message-templates${queryString ? `?${queryString}` : ''}`;
    return apiService.get<MessageTemplate[]>(url);
  }

  /**
   * Get template by ID
   */
  async getTemplateById(templateId: string): Promise<ApiResponse<MessageTemplate>> {
    return apiService.get<MessageTemplate>(`/api/message-templates/${templateId}`);
  }

  /**
   * Create a new template
   */
  async createTemplate(data: CreateMessageTemplateData): Promise<ApiResponse<MessageTemplate>> {
    return apiService.post<MessageTemplate>('/api/message-templates', data);
  }

  /**
   * Update a template
   */
  async updateTemplate(
    templateId: string,
    data: UpdateMessageTemplateData
  ): Promise<ApiResponse<MessageTemplate>> {
    return apiService.put<MessageTemplate>(`/api/message-templates/${templateId}`, data);
  }

  /**
   * Delete a template
   */
  async deleteTemplate(templateId: string): Promise<ApiResponse<void>> {
    return apiService.delete<void>(`/api/message-templates/${templateId}`);
  }

  /**
   * Replace template variables with actual values
   */
  replaceVariables(
    template: string,
    variables: Record<string, string | number | undefined>
  ): string {
    let result = template;

    // Replace variables in format {variableName}
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, String(value || ''));
    });

    return result;
  }
}

export const messageTemplateService = new MessageTemplateService();

