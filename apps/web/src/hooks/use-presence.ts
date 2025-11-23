"use client";

import { useEffect, useCallback, useState } from "react";
import { useSocket } from "@/contexts/socket-context";

interface PresenceUpdate {
  userId: string;
  status: "online" | "offline" | "away" | "busy";
  timestamp: string;
}

interface OnlineUser {
  userId: string;
  status: "online";
  connectedAt: Date;
}

export function usePresence() {
  const { socket, isConnected } = useSocket();
  const [onlineUsers, setOnlineUsers] = useState<Map<string, PresenceUpdate>>(new Map());

  // Listen for presence updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handlePresenceUpdate = (update: PresenceUpdate) => {
      console.log("👤 Presence update:", update);
      
      setOnlineUsers((prev) => {
        const newMap = new Map(prev);
        
        if (update.status === "offline") {
          newMap.delete(update.userId);
        } else {
          newMap.set(update.userId, update);
        }
        
        return newMap;
      });
    };

    socket.on("presence:update", handlePresenceUpdate);

    return () => {
      socket.off("presence:update", handlePresenceUpdate);
    };
  }, [socket, isConnected]);

  // Get online users on mount
  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit("presence:get-online", (users: OnlineUser[]) => {
      console.log("👥 Online users:", users);
      
      const userMap = new Map<string, PresenceUpdate>();
      users.forEach((user) => {
        userMap.set(user.userId, {
          userId: user.userId,
          status: "online",
          timestamp: user.connectedAt.toString(),
        });
      });
      
      setOnlineUsers(userMap);
    });
  }, [socket, isConnected]);

  // Update user status
  const updateStatus = useCallback((status: "online" | "away" | "busy") => {
    if (!socket || !isConnected) return;

    socket.emit("presence:status", status);
  }, [socket, isConnected]);

  // Check if user is online
  const isUserOnline = useCallback((userId: string) => {
    const user = onlineUsers.get(userId);
    return user?.status === "online";
  }, [onlineUsers]);

  // Get user status
  const getUserStatus = useCallback((userId: string) => {
    return onlineUsers.get(userId)?.status || "offline";
  }, [onlineUsers]);

  return {
    onlineUsers: Array.from(onlineUsers.values()),
    isUserOnline,
    getUserStatus,
    updateStatus,
    isConnected,
  };
}
