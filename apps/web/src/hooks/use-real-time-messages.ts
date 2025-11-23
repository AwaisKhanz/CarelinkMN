"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useSocket } from "@/contexts/socket-context";
import { Message } from "@carelink/types";
import { toast } from "sonner";

interface UseRealTimeMessagesOptions {
  threadId: string | null;
  onNewMessage?: (message: Message) => void;
  onMessageRead?: (data: { messageId: string; userId: string; readAt: string }) => void;
  onTyping?: (data: { userId: string; isTyping: boolean }) => void;
}

export function useRealTimeMessages({
  threadId,
  onNewMessage,
  onMessageRead,
  onTyping,
}: UseRealTimeMessagesOptions) {
  const { socket, isConnected } = useSocket();
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Join thread room when threadId changes
  useEffect(() => {
    if (!socket || !isConnected || !threadId) return;

    console.log(`📨 Joining thread room: ${threadId}`);
    socket.emit("thread:join", threadId);

    return () => {
      console.log(`📨 Leaving thread room: ${threadId}`);
      socket.emit("thread:leave", threadId);
    };
  }, [socket, isConnected, threadId]);

  // Listen for new messages
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewMessage = (message: Message) => {
      console.log("📨 New message received:", message);
      
      // Only process if it's for the current thread
      if (message.threadId === threadId) {
        onNewMessage?.(message);
        
        // Show toast notification if message is from another user
        // (You can add user ID check here)
        // toast.info("New message received");
      }
    };

    socket.on("message:new", handleNewMessage);

    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [socket, isConnected, threadId, onNewMessage]);

  // Listen for message read receipts
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleMessageRead = (data: { messageId: string; userId: string; readAt: string; threadId: string }) => {
      console.log("✓ Message read:", data);
      
      if (data.threadId === threadId) {
        onMessageRead?.(data);
      }
    };

    socket.on("message:read", handleMessageRead);

    return () => {
      socket.off("message:read", handleMessageRead);
    };
  }, [socket, isConnected, threadId, onMessageRead]);

  // Listen for typing indicators
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleTyping = (data: { userId: string; threadId: string; isTyping: boolean }) => {
      console.log("⌨️  Typing indicator:", data);
      
      if (data.threadId === threadId) {
        if (data.isTyping) {
          setTypingUsers((prev) => new Set(prev).add(data.userId));
          
          // Clear existing timeout for this user
          const existingTimeout = typingTimeoutRef.current.get(data.userId);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }
          
          // Set new timeout to remove typing indicator after 3 seconds
          const timeout = setTimeout(() => {
            setTypingUsers((prev) => {
              const newSet = new Set(prev);
              newSet.delete(data.userId);
              return newSet;
            });
            typingTimeoutRef.current.delete(data.userId);
          }, 3000);
          
          typingTimeoutRef.current.set(data.userId, timeout);
        } else {
          setTypingUsers((prev) => {
            const newSet = new Set(prev);
            newSet.delete(data.userId);
            return newSet;
          });
          
          // Clear timeout
          const existingTimeout = typingTimeoutRef.current.get(data.userId);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
            typingTimeoutRef.current.delete(data.userId);
          }
        }
        
        onTyping?.(data);
      }
    };

    socket.on("message:typing", handleTyping);

    return () => {
      socket.off("message:typing", handleTyping);
      
      // Clear all timeouts
      typingTimeoutRef.current.forEach((timeout) => clearTimeout(timeout));
      typingTimeoutRef.current.clear();
    };
  }, [socket, isConnected, threadId, onTyping]);

  // Send typing indicator
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!socket || !isConnected || !threadId) return;

    socket.emit("message:typing", { threadId, isTyping });
  }, [socket, isConnected, threadId]);

  // Mark message as read
  const markMessageAsRead = useCallback((messageId: string) => {
    if (!socket || !isConnected || !threadId) return;

    socket.emit("message:read", { threadId, messageId });
  }, [socket, isConnected, threadId]);

  return {
    sendTypingIndicator,
    markMessageAsRead,
    typingUsers: Array.from(typingUsers),
    isConnected,
  };
}
