import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import jwt from "jsonwebtoken";
import { UserRole } from "@carelink/types";

interface AuthenticatedSocket extends Socket {
  userId: string;
  userRole: UserRole;
  organizationId?: string;
}

interface SocketUser {
  userId: string;
  userRole: UserRole;
  organizationId?: string;
  socketId: string;
  connectedAt: Date;
}

export class SocketServer {
  private io: SocketIOServer;
  private connectedUsers: Map<string, SocketUser> = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    this.setupRedisAdapter();
  }

  /**
   * Setup authentication middleware
   */
  private setupMiddleware() {
    this.io.use(async (socket: Socket, next) => {
      try {
        const token = socket.handshake.auth.token;

        if (!token) {
          return next(new Error("Authentication token required"));
        }

        // Verify JWT token
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || "your-secret-key"
        ) as {
          userId: string;
          role: UserRole;
          organizationId?: string;
        };

        // Attach user info to socket
        (socket as AuthenticatedSocket).userId = decoded.userId;
        (socket as AuthenticatedSocket).userRole = decoded.role;
        (socket as AuthenticatedSocket).organizationId = decoded.organizationId;

        next();
      } catch (error) {
        console.error("Socket authentication error:", error);
        next(new Error("Authentication failed"));
      }
    });
  }

  /**
   * Setup Redis adapter for horizontal scaling
   */
  private async setupRedisAdapter() {
    console.log("⚠️  Redis adapter is disabled. Using in-memory adapter (single server mode).");
    // No adapter setup needed for in-memory, it's the default.
  }

  /**
   * Setup connection and event handlers
   */
  private setupEventHandlers() {
    this.io.on("connection", (socket: Socket) => {
      const authSocket = socket as AuthenticatedSocket;
      
      console.log(`✅ User connected: ${authSocket.userId} (${authSocket.id})`);

      // Track connected user
      this.connectedUsers.set(authSocket.userId, {
        userId: authSocket.userId,
        userRole: authSocket.userRole,
        organizationId: authSocket.organizationId,
        socketId: authSocket.id,
        connectedAt: new Date(),
      });

      // Join user-specific room
      authSocket.join(`user:${authSocket.userId}`);

      // Join organization room if applicable
      if (authSocket.organizationId) {
        authSocket.join(`org:${authSocket.organizationId}`);
      }

      // Emit online status to relevant users
      this.broadcastPresence(authSocket.userId, "online");

      // Handle disconnection
      authSocket.on("disconnect", () => {
        console.log(`❌ User disconnected: ${authSocket.userId} (${authSocket.id})`);
        this.connectedUsers.delete(authSocket.userId);
        this.broadcastPresence(authSocket.userId, "offline");
      });

      // Import and setup event handlers
      this.setupMessageEvents(authSocket);
      this.setupNotificationEvents(authSocket);
      this.setupPresenceEvents(authSocket);
    });
  }

  /**
   * Setup message event handlers
   */
  private setupMessageEvents(socket: AuthenticatedSocket) {
    // Join message thread room
    socket.on("thread:join", (threadId: string) => {
      socket.join(`thread:${threadId}`);
      console.log(`User ${socket.userId} joined thread ${threadId}`);
    });

    // Leave message thread room
    socket.on("thread:leave", (threadId: string) => {
      socket.leave(`thread:${threadId}`);
      console.log(`User ${socket.userId} left thread ${threadId}`);
    });

    // Typing indicator
    socket.on("message:typing", (data: { threadId: string; isTyping: boolean }) => {
      socket.to(`thread:${data.threadId}`).emit("message:typing", {
        userId: socket.userId,
        threadId: data.threadId,
        isTyping: data.isTyping,
      });
    });

    // Message read receipt
    socket.on("message:read", (data: { threadId: string; messageId: string }) => {
      socket.to(`thread:${data.threadId}`).emit("message:read", {
        userId: socket.userId,
        threadId: data.threadId,
        messageId: data.messageId,
        readAt: new Date().toISOString(),
      });
    });
  }

  /**
   * Setup notification event handlers
   */
  private setupNotificationEvents(socket: AuthenticatedSocket) {
    // Notification read
    socket.on("notification:read", (notificationId: string) => {
      // Broadcast to user's other devices
      socket.to(`user:${socket.userId}`).emit("notification:read", {
        notificationId,
        readAt: new Date().toISOString(),
      });
    });

    // All notifications read
    socket.on("notification:read-all", () => {
      socket.to(`user:${socket.userId}`).emit("notification:read-all", {
        readAt: new Date().toISOString(),
      });
    });
  }

  /**
   * Setup presence event handlers
   */
  private setupPresenceEvents(socket: AuthenticatedSocket) {
    // Update user status
    socket.on("presence:status", (status: "online" | "away" | "busy") => {
      this.broadcastPresence(socket.userId, status);
    });

    // Get online users
    socket.on("presence:get-online", (callback) => {
      const onlineUsers = Array.from(this.connectedUsers.values()).map((user) => ({
        userId: user.userId,
        status: "online",
        connectedAt: user.connectedAt,
      }));
      callback(onlineUsers);
    });
  }

  /**
   * Broadcast presence update
   */
  private broadcastPresence(userId: string, status: "online" | "offline" | "away" | "busy") {
    this.io.emit("presence:update", {
      userId,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit new message to thread participants
   */
  public emitNewMessage(threadId: string, message: any) {
    this.io.to(`thread:${threadId}`).emit("message:new", message);
  }

  /**
   * Emit new notification to user
   */
  public emitNewNotification(userId: string, notification: any) {
    this.io.to(`user:${userId}`).emit("notification:new", notification);
  }

  /**
   * Emit data update to organization
   */
  public emitDataUpdate(organizationId: string, event: string, data: any) {
    this.io.to(`org:${organizationId}`).emit(event, data);
  }

  /**
   * Get connected users count
   */
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Check if user is online
   */
  public isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get Socket.IO instance
   */
  public getIO(): SocketIOServer {
    return this.io;
  }
}

// Singleton instance
let socketServer: SocketServer | null = null;

export function initializeSocketServer(httpServer: HTTPServer): SocketServer {
  if (!socketServer) {
    socketServer = new SocketServer(httpServer);
    console.log("🚀 Socket.IO server initialized");
  }
  return socketServer;
}

export function getSocketServer(): SocketServer {
  if (!socketServer) {
    throw new Error("Socket server not initialized. Call initializeSocketServer first.");
  }
  return socketServer;
}
