import { useState, useEffect, useCallback } from "react";
import { useSocket } from "../contexts/socket-context";
import { notificationService } from "../lib/api/services/notification.service";
import { Notification, NotificationType, NotificationResponse } from "@carelink/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function useNotifications() {
  const { socket, isConnected } = useSocket();
  const router = useRouter();
  
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const [data, count] = await Promise.all([
        notificationService.getNotifications({ limit: 10 }),
        notificationService.getUnreadCount()
      ]);
      
      setNotifications(data.notifications);
      setUnreadCount(count);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setError("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (isConnected) {
      fetchNotifications();
    }
  }, [isConnected, fetchNotifications]);

  // Listen for real-time events
  useEffect(() => {
    if (!socket) return;

    // New notification received
    socket.on("notification:new", (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      
      // Show toast
      toast.info(notification.title, {
        description: notification.message,
        action: notification.actionUrl ? {
          label: notification.actionLabel || "View",
          onClick: () => router.push(notification.actionUrl!)
        } : undefined,
        duration: 5000,
      });
    });

    // Notification marked as read (synced from other device/tab)
    socket.on("notification:read", ({ notificationId }: { notificationId: string }) => {
      setNotifications((prev) => 
        prev.map((n) => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    });

    // All notifications marked as read
    socket.on("notification:read-all", () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    });

    return () => {
      socket.off("notification:new");
      socket.off("notification:read");
      socket.off("notification:read-all");
    };
  }, [socket, router]);

  // Actions
  const markAsRead = async (id: string) => {
    try {
      // Optimistic update
      setNotifications((prev) => 
        prev.map((n) => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      
      await notificationService.markAsRead(id);
    } catch (err) {
      console.error("Failed to mark as read:", err);
      // Revert on error
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    try {
      // Optimistic update
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      
      await notificationService.markAllAsRead();
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      fetchNotifications();
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      // Optimistic update
      const notification = notifications.find(n => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (notification && !notification.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      
      await notificationService.deleteNotification(id);
    } catch (err) {
      console.error("Failed to delete notification:", err);
      fetchNotifications();
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications
  };
}
