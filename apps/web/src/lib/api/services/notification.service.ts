import { apiService } from "../config";
import { 
  ApiResponse, 
  GetNotificationsParams, 
  PaginatedNotifications,
  NotificationType
} from "@carelink/types";

export const notificationService = {
  /**
   * Get notifications for the authenticated user
   */
  getNotifications: async (params: GetNotificationsParams = {}): Promise<PaginatedNotifications> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.isRead !== undefined) queryParams.append("isRead", params.isRead.toString());
    if (params.type) queryParams.append("type", params.type);

    const response = await apiService.get<PaginatedNotifications>(
      `/api/notifications?${queryParams.toString()}`
    );
    
    if (!response.data) {
      throw new Error("No data received from notification service");
    }
    
    return response.data;
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async (): Promise<number> => {
    const response = await apiService.get<{ count: number }>(
      "/api/notifications/unread-count"
    );
    return response.data?.count || 0;
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (notificationId: string): Promise<void> => {
    await apiService.patch<void>(`/api/notifications/${notificationId}/read`);
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<void> => {
    await apiService.patch<void>("/api/notifications/read-all");
  },

  /**
   * Delete a notification
   */
  deleteNotification: async (notificationId: string): Promise<void> => {
    await apiService.delete<void>(`/api/notifications/${notificationId}`);
  },

  /**
   * Delete all read notifications
   */
  deleteAllRead: async (): Promise<void> => {
    await apiService.delete<void>("/api/notifications/read");
  }
};
