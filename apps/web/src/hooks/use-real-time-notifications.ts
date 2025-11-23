"use client";

import { useEffect, useCallback, useState } from "react";
import { useSocket } from "@/contexts/socket-context";
import { Notification } from "@/lib/api";
import { toast } from "sonner";

interface UseRealTimeNotificationsOptions {
  onNewNotification?: (notification: Notification) => void;
  onNotificationRead?: (notificationId: string) => void;
  onAllNotificationsRead?: () => void;
  showToast?: boolean;
}

export function useRealTimeNotifications({
  onNewNotification,
  onNotificationRead,
  onAllNotificationsRead,
  showToast = true,
}: UseRealTimeNotificationsOptions = {}) {
  const { socket, isConnected } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);

  // Listen for new notifications
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewNotification = (notification: Notification) => {
      console.log("🔔 New notification received:", notification);
      
      onNewNotification?.(notification);
      setUnreadCount((prev) => prev + 1);
      
      // Show toast notification
      if (showToast) {
        toast(notification.title, {
          description: notification.message,
          action: notification.actionUrl ? {
            label: "View",
            onClick: () => {
              window.location.href = notification.actionUrl!;
            },
          } : undefined,
        });
      }
    };

    socket.on("notification:new", handleNewNotification);

    return () => {
      socket.off("notification:new", handleNewNotification);
    };
  }, [socket, isConnected, onNewNotification, showToast]);

  // Listen for notification read events (from other devices)
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNotificationRead = (data: { notificationId: string; readAt: string }) => {
      console.log("✓ Notification read:", data);
      
      onNotificationRead?.(data.notificationId);
      setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    socket.on("notification:read", handleNotificationRead);

    return () => {
      socket.off("notification:read", handleNotificationRead);
    };
  }, [socket, isConnected, onNotificationRead]);

  // Listen for all notifications read events (from other devices)
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleAllNotificationsRead = () => {
      console.log("✓ All notifications read");
      
      onAllNotificationsRead?.();
      setUnreadCount(0);
    };

    socket.on("notification:read-all", handleAllNotificationsRead);

    return () => {
      socket.off("notification:read-all", handleAllNotificationsRead);
    };
  }, [socket, isConnected, onAllNotificationsRead]);

  // Emit notification read event
  const markNotificationAsRead = useCallback((notificationId: string) => {
    if (!socket || !isConnected) return;

    socket.emit("notification:read", notificationId);
  }, [socket, isConnected]);

  // Emit all notifications read event
  const markAllNotificationsAsRead = useCallback(() => {
    if (!socket || !isConnected) return;

    socket.emit("notification:read-all");
  }, [socket, isConnected]);

  return {
    markNotificationAsRead,
    markAllNotificationsAsRead,
    unreadCount,
    isConnected,
  };
}
