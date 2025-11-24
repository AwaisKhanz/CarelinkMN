import { db } from "@carelink/database";
import { Prisma, NotificationType } from "@prisma/client";
import { EmailService } from "./email.service";
import { getSocketServer } from "../websocket/socket.server";

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: NotificationType;
}

export interface NotificationResponse {
  id: string;
  type: NotificationType;
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

export class NotificationService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(
    userId: string,
    params: GetNotificationsParams = {}
  ): Promise<{
    notifications: NotificationResponse[];
    pagination: {
      total: number;
      pages: number;
      page: number;
      limit: number;
    };
    unreadCount: number;
  }> {
    try {
      const { page = 1, limit = 20, isRead, type } = params;
      const skip = (page - 1) * limit;

      const where: Prisma.NotificationWhereInput = {
        userId,
      };

      if (isRead !== undefined) {
        where.isRead = isRead;
      }

      if (type) {
        where.type = type;
      }

      const [notifications, total, unreadCount] = await Promise.all([
        db.notification.findMany({
          where,
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: limit,
        }),
        db.notification.count({ where }),
        db.notification.count({
          where: {
            userId,
            isRead: false,
          },
        }),
      ]);

      const pages = Math.ceil(total / limit);

      return {
        notifications: notifications.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          channels: n.channels,
          isRead: n.isRead,
          readAt: n.readAt?.toISOString(),
          actionUrl: n.actionUrl ?? undefined,
          createdAt: n.createdAt.toISOString(),
          emailSentAt: n.emailSentAt?.toISOString(),
          smsSentAt: n.smsSentAt?.toISOString(),
        })),
        pagination: {
          total,
          pages,
          page,
          limit,
        },
        unreadCount,
      };
    } catch (error) {
      console.error("Get notifications error:", error);
      throw new Error("Failed to retrieve notifications");
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      const notification = await db.notification.findFirst({
        where: {
          id: notificationId,
          userId,
        },
      });

      if (!notification) {
        throw new Error("Notification not found or access denied");
      }

      if (!notification.isRead) {
        await db.notification.update({
          where: { id: notificationId },
          data: {
            isRead: true,
            readAt: new Date(),
          },
        });

        // Emit read event via Socket.IO
        try {
          const socketServer = getSocketServer();
          socketServer.getIO().to(`user:${userId}`).emit("notification:read", {
            notificationId,
            readAt: new Date().toISOString(),
          });
        } catch (socketError) {
          console.warn("Socket.IO not available:", socketError);
        }
      }
    } catch (error) {
      console.error("Mark notification as read error:", error);
      throw new Error("Failed to mark notification as read");
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      await db.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      // Emit read-all event via Socket.IO
      try {
        const socketServer = getSocketServer();
        socketServer.getIO().to(`user:${userId}`).emit("notification:read-all", {
          readAt: new Date().toISOString(),
        });
      } catch (socketError) {
        console.warn("Socket.IO not available:", socketError);
      }
    } catch (error) {
      console.error("Mark all notifications as read error:", error);
      throw new Error("Failed to mark all notifications as read");
    }
  }

  /**
   * Create a notification and send via configured channels
   */
  async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    channels?: string[];
    actionUrl?: string;
    actionLabel?: string;
    metadata?: Record<string, any>;
    expiresAt?: Date;
  }): Promise<void> {
    try {
      // Get user to send email if needed
      const user = await db.user.findUnique({
        where: { id: data.userId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Create notification in database
      const notification = await db.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          channels: data.channels || ["IN_APP"],
          actionUrl: data.actionUrl,
          actionLabel: data.actionLabel,
          metadata: data.metadata || Prisma.JsonNull,
          expiresAt: data.expiresAt,
        },
      });

      // Emit real-time notification via Socket.IO
      try {
        const socketServer = getSocketServer();
        socketServer.emitNewNotification(data.userId, notification);
      } catch (socketError) {
        console.warn("Socket.IO not available, notification created but not emitted:", socketError);
      }

      // Send via configured channels
      const channels = data.channels || ["IN_APP"];
      const emailSent = channels.includes("EMAIL");
      const smsSent = channels.includes("SMS");

      if (emailSent) {
        try {
          await this.emailService.sendNotificationEmail({
            to: user.email,
            subject: data.title,
            message: data.message,
            actionUrl: data.actionUrl,
            userName: `${user.firstName} ${user.lastName}`,
          });

          // Update notification with email sent timestamp
          await db.notification.update({
            where: { id: notification.id },
            data: { emailSentAt: new Date() },
          });
        } catch (emailError) {
          console.error("Failed to send notification email:", emailError);
          // Don't throw - notification is still created in DB
        }
      }

      if (smsSent) {
        // TODO: Implement SMS sending
        // For now, just log
        console.log(`SMS notification would be sent to ${user.phone}`);
        // Update notification with SMS sent timestamp when implemented
      }
    } catch (error) {
      console.error("Create notification error:", error);
      throw new Error("Failed to create notification");
    }
  }

  /**
   * Create multiple notifications in batch
   */
  async createBatchNotifications(notifications: Array<{
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    channels?: string[];
    actionUrl?: string;
    actionLabel?: string;
    metadata?: Record<string, any>;
  }>): Promise<void> {
    try {
      await Promise.all(
        notifications.map((data) => this.createNotification(data))
      );
    } catch (error) {
      console.error("Batch create notifications error:", error);
      throw new Error("Failed to create batch notifications");
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      return await db.notification.count({
        where: {
          userId,
          isRead: false,
        },
      });
    } catch (error) {
      console.error("Get unread count error:", error);
      throw new Error("Failed to get unread count");
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    try {
      const notification = await db.notification.findFirst({
        where: {
          id: notificationId,
          userId,
        },
      });

      if (!notification) {
        throw new Error("Notification not found or access denied");
      }

      await db.notification.delete({
        where: { id: notificationId },
      });
    } catch (error) {
      console.error("Delete notification error:", error);
      throw new Error("Failed to delete notification");
    }
  }

  /**
   * Delete all read notifications for a user
   */
  async deleteAllRead(userId: string): Promise<void> {
    try {
      await db.notification.deleteMany({
        where: {
          userId,
          isRead: true,
        },
      });
    } catch (error) {
      console.error("Delete all read notifications error:", error);
      throw new Error("Failed to delete all read notifications");
    }
  }

  /**
   * Clean up expired notifications (for cron job)
   */
  async cleanupExpired(): Promise<number> {
    try {
      const result = await db.notification.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      console.log(`Cleaned up ${result.count} expired notifications`);
      return result.count;
    } catch (error) {
      console.error("Cleanup expired notifications error:", error);
      throw new Error("Failed to cleanup expired notifications");
    }
  }
}
