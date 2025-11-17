import { apiService } from "../config";
import { ApiResponse } from "@carelink/types";

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  channels: string[];
  isRead: boolean;
  readAt?: string;
  actionUrl?: string;
  createdAt: string;
  emailSentAt?: string;
  smsSentAt?: string;
}

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: string;
}

export interface GetNotificationsResponse {
  notifications: Notification[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
  unreadCount: number;
}

class NotificationServiceClass {
  /**
   * Get notifications for the authenticated user
   */
  async getNotifications(
    params: GetNotificationsParams = {}
  ): Promise<ApiResponse<GetNotificationsResponse>> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.isRead !== undefined) queryParams.append("isRead", params.isRead.toString());
    if (params.type) queryParams.append("type", params.type);

    const response = await apiService.get<GetNotificationsResponse>(
      `/api/notifications?${queryParams.toString()}`
    );
    return response;
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<ApiResponse<void>> {
    const response = await apiService.patch<void>(`/api/notifications/${notificationId}/read`);
    return response;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<ApiResponse<void>> {
    const response = await apiService.patch<void>("/api/notifications/read-all");
    return response;
  }
}

export const notificationService = new NotificationServiceClass();

