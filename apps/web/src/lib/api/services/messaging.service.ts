import { apiService } from '../config';
import {
  ApiResponse,
  MessageThread,
  Message,
  CreateMessageData,
  CreateThreadData,
  GetThreadsParams,
} from '@carelink/types';

export interface GetThreadsResponse {
  threads: MessageThread[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
}

export class MessagingService {
  /**
   * Get message threads
   */
  async getThreads(params: GetThreadsParams): Promise<ApiResponse<GetThreadsResponse>> {
    const searchParams = new URLSearchParams();
    
    if (params.providerId) searchParams.append('providerId', params.providerId);
    if (params.referralId) searchParams.append('referralId', params.referralId);
    if (params.dischargeCaseId) searchParams.append('dischargeCaseId', params.dischargeCaseId);
    if (params.status) searchParams.append('status', params.status);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);

    const queryString = searchParams.toString();
    const url = `/api/messages/threads${queryString ? `?${queryString}` : ''}`;
    
    return await apiService.get<GetThreadsResponse>(url);
  }

  /**
   * Get a single thread with messages
   */
  async getThreadById(threadId: string): Promise<ApiResponse<MessageThread>> {
    return await apiService.get<MessageThread>(`/api/messages/threads/${threadId}`);
  }

  /**
   * Create a new thread
   */
  async createThread(data: CreateThreadData): Promise<ApiResponse<MessageThread>> {
    return await apiService.post<MessageThread>('/api/messages/threads', data);
  }

  /**
   * Send a message in a thread
   */
  async sendMessage(data: CreateMessageData): Promise<ApiResponse<Message>> {
    return await apiService.post<Message>(
      `/api/messages/threads/${data.threadId}/messages`,
      {
        content: data.content,
        attachments: data.attachments,
      }
    );
  }

  /**
   * Mark messages as read
   */
  async markAsRead(threadId: string): Promise<ApiResponse<void>> {
    return await apiService.post<void>(`/api/messages/threads/${threadId}/read`, {});
  }

  /**
   * Update thread status
   */
  async updateThreadStatus(
    threadId: string,
    status: string
  ): Promise<ApiResponse<MessageThread>> {
    return await apiService.patch<MessageThread>(
      `/api/messages/threads/${threadId}/status`,
      { status }
    );
  }
}

export const messagingService = new MessagingService();
export default messagingService;

