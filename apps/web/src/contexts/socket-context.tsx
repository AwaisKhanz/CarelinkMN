"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./auth-context";
import { toast } from "sonner";

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  reconnectAttempts: number;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  isConnecting: false,
  error: null,
  reconnectAttempts: 0,
});

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}

interface SocketProviderProps {
  children: React.ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!user || !token) {
      console.log("⚠️  No user or token, skipping socket connection");
      return;
    }

    if (socket?.connected) {
      console.log("ℹ️  Socket already connected");
      return;
    }

    setIsConnecting(true);
    setError(null);

    const socketUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

    console.log(`🔌 Connecting to WebSocket server at ${socketUrl}...`);

    const newSocket = io(socketUrl, {
      auth: {
        token,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
    });

    // Connection successful
    newSocket.on("connect", () => {
      console.log("✅ WebSocket connected:", newSocket.id);
      console.log("🔌 Socket instance:", newSocket);
      // Expose to window for debugging
      if (typeof window !== "undefined") {
        (window as any).socket = newSocket;
      }
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
      setReconnectAttempts(0);
      
      // Show success toast only after reconnection
      if (reconnectAttempts > 0) {
        // toast.success("Reconnected to server");
      }
    });

    // Connection error
    newSocket.on("connect_error", (err) => {
      console.error("❌ WebSocket connection error:", err.message);
      setIsConnecting(false);
      setError(err.message);
      
      // Don't show toast on initial connection failure
      if (reconnectAttempts > 0) {
        // toast.error("Connection lost. Reconnecting...");
      }
    });

    // Disconnection
    newSocket.on("disconnect", (reason) => {
      console.log("❌ WebSocket disconnected:", reason);
      setIsConnected(false);
      
      if (reason === "io server disconnect") {
        // Server disconnected the socket, need to reconnect manually
        newSocket.connect();
      }
    });

    // Reconnection attempt
    newSocket.io.on("reconnect_attempt", (attempt) => {
      console.log(`🔄 Reconnection attempt ${attempt}...`);
      setReconnectAttempts(attempt);
    });

    // Reconnection successful
    newSocket.io.on("reconnect", (attempt) => {
      console.log(`✅ Reconnected after ${attempt} attempts`);
      setReconnectAttempts(0);
    });

    // Reconnection failed
    newSocket.io.on("reconnect_failed", () => {
      console.error("❌ Reconnection failed");
      setError("Failed to reconnect to server");
      // toast.error("Unable to connect to server. Please refresh the page.");
    });

    setSocket(newSocket);

    return () => {
      console.log("🔌 Cleaning up socket connection");
      newSocket.close();
    };
  }, [user, token, reconnectAttempts]);

  // Connect when user logs in
  useEffect(() => {
    if (user && token) {
      connect();
    }

    return () => {
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [user, token, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const value: SocketContextValue = {
    socket,
    isConnected,
    isConnecting,
    error,
    reconnectAttempts,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}
