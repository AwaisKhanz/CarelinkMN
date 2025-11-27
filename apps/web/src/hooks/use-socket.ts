"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/contexts/auth-context";

interface UseSocketOptions {
  onNewMessage?: (message: any) => void;
  onMessageRead?: (data: { threadId: string; messageId: string }) => void;
  onThreadUpdate?: (thread: any) => void;
}

export function useSocket({ onNewMessage, onMessageRead, onThreadUpdate }: UseSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const { user, token } = useAuth();

  useEffect(() => {
    if (!user?.id || !token) return;

    // Connect to socket server
    const socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001", {
      auth: {
        token: token, // Use JWT token for authentication
      },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    // Listen for new messages
    if (onNewMessage) {
      socket.on("message:new", onNewMessage);
    }

    // Listen for message read events
    if (onMessageRead) {
      socket.on("message:read", onMessageRead);
    }

    // Listen for thread updates
    if (onThreadUpdate) {
      socket.on("thread:update", onThreadUpdate);
    }

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id, token, onNewMessage, onMessageRead, onThreadUpdate]);

  // Helper methods to interact with socket
  const joinThread = (threadId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("thread:join", threadId);
      console.log("Joined thread:", threadId);
    }
  };

  const leaveThread = (threadId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("thread:leave", threadId);
      console.log("Left thread:", threadId);
    }
  };

  const emitTyping = (threadId: string, isTyping: boolean) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("message:typing", { threadId, isTyping });
    }
  };

  const joinPlacement = (placementId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("placement:join", placementId);
      console.log("Joined placement:", placementId);
    }
  };

  const leavePlacement = (placementId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("placement:leave", placementId);
      console.log("Left placement:", placementId);
    }
  };

  return {
    socket: socketRef.current,
    joinThread,
    leaveThread,
    emitTyping,
    joinPlacement,
    leavePlacement,
  };
}
