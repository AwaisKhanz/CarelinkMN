import { Request, Response } from "express";
import { MessagingService } from "../services/messaging.service";
import { ApiResponse } from "../types/common";
import { AuthenticatedRequest } from "../types/auth";
import { body, param, query, validationResult } from "express-validator";
import { ThreadStatus } from "@prisma/client";
import { ThreadStatus as ThreadStatusType } from "@carelink/types";

export class MessagingController {
  private messagingService: MessagingService;

  constructor() {
    this.messagingService = new MessagingService();
    // Bind methods to ensure 'this' context is preserved
    this.getThreads = this.getThreads.bind(this);
    this.getThreadById = this.getThreadById.bind(this);
    this.createThread = this.createThread.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.markAsRead = this.markAsRead.bind(this);
    this.updateThreadStatus = this.updateThreadStatus.bind(this);
  }

  /**
   * Get message threads
   * GET /api/messages/threads
   */
  async getThreads(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          message: "Please check your input data",
          details: errors.array(),
        } as ApiResponse);
        return;
      }

      const user = (req as unknown as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const {
        providerId,
        referralId,
        dischargeCaseId,
        status,
        page,
        limit,
        search,
      } = req.query;

      const result = await this.messagingService.getThreads(
        {
          providerId: providerId as string,
          referralId: referralId as string,
          dischargeCaseId: dischargeCaseId as string,
          status: status as ThreadStatusType,
          page: page ? parseInt(page as string) : undefined,
          limit: limit ? parseInt(limit as string) : undefined,
          search: search as string,
        },
        user.id
      );

      res.status(200).json({
        success: true,
        data: result,
        message: "Threads retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get threads error:", error);
      const statusCode =
        error instanceof Error && error.message === "Access denied"
          ? 403
          : error instanceof Error &&
              error.message === "User is not associated with a provider"
            ? 403
            : 500;
      res.status(statusCode).json({
        success: false,
        error: "Thread retrieval failed",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while retrieving threads",
      } as ApiResponse);
    }
  }

  /**
   * Get a single thread with messages
   * GET /api/messages/threads/:threadId
   */
  async getThreadById(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          message: "Please check your input data",
          details: errors.array(),
        } as ApiResponse);
        return;
      }

      const user = (req as unknown as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const { threadId } = req.params;

      const thread = await this.messagingService.getThreadById(
        threadId,
        user.id
      );

      res.status(200).json({
        success: true,
        data: thread,
        message: "Thread retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get thread error:", error);
      const statusCode =
        error instanceof Error && error.message === "Access denied"
          ? 403
          : error instanceof Error && error.message === "Thread not found"
            ? 404
            : 500;
      res.status(statusCode).json({
        success: false,
        error: "Thread retrieval failed",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while retrieving the thread",
      } as ApiResponse);
    }
  }

  /**
   * Create a new thread
   * POST /api/messages/threads
   */
  async createThread(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          message: "Please check your input data",
          details: errors.array(),
        } as ApiResponse);
        return;
      }

      const user = (req as unknown as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const {
        providerId,
        referralId,
        dischargeCaseId,
        initialMessage,
        attachments,
      } = req.body;

      const thread = await this.messagingService.createThread(
        {
          providerId,
          referralId,
          dischargeCaseId,
          initialMessage,
          attachments,
        },
        user.id
      );

      res.status(201).json({
        success: true,
        data: thread,
        message: "Thread created successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Create thread error:", error);
      const statusCode =
        error instanceof Error && error.message === "Access denied to provider"
          ? 403
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Thread creation failed",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while creating the thread",
      } as ApiResponse);
    }
  }

  /**
   * Send a message in a thread
   * POST /api/messages/threads/:threadId/messages
   */
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          message: "Please check your input data",
          details: errors.array(),
        } as ApiResponse);
        return;
      }

      const user = (req as unknown as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const { threadId } = req.params;
      const { content, attachments } = req.body;

      const message = await this.messagingService.sendMessage(
        {
          threadId,
          content,
          attachments,
        },
        user.id
      );

      res.status(201).json({
        success: true,
        data: message,
        message: "Message sent successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Send message error:", error);
      const statusCode =
        error instanceof Error && error.message === "Access denied"
          ? 403
          : error instanceof Error && error.message === "Thread not found"
            ? 404
            : error instanceof Error &&
                error.message === "Cannot send message to a closed thread"
              ? 400
              : 500;
      res.status(statusCode).json({
        success: false,
        error: "Message sending failed",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while sending the message",
      } as ApiResponse);
    }
  }

  /**
   * Mark messages as read
   * POST /api/messages/threads/:threadId/read
   */
  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          message: "Please check your input data",
          details: errors.array(),
        } as ApiResponse);
        return;
      }

      const user = (req as unknown as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const { threadId } = req.params;

      await this.messagingService.markMessagesAsRead(threadId, user.id);

      res.status(200).json({
        success: true,
        message: "Messages marked as read",
      } as ApiResponse);
    } catch (error) {
      console.error("Mark as read error:", error);
      const statusCode =
        error instanceof Error && error.message === "Access denied" ? 403 : 500;
      res.status(statusCode).json({
        success: false,
        error: "Failed to mark messages as read",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while marking messages as read",
      } as ApiResponse);
    }
  }

  /**
   * Update thread status
   * PATCH /api/messages/threads/:threadId/status
   */
  async updateThreadStatus(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          message: "Please check your input data",
          details: errors.array(),
        } as ApiResponse);
        return;
      }

      const user = (req as unknown as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const { threadId } = req.params;
      const { status } = req.body;

      const thread = await this.messagingService.updateThreadStatus(
        threadId,
        status,
        user.id
      );

      res.status(200).json({
        success: true,
        data: thread,
        message: "Thread status updated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Update thread status error:", error);
      const statusCode =
        error instanceof Error && error.message === "Access denied" ? 403 : 500;
      res.status(statusCode).json({
        success: false,
        error: "Failed to update thread status",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while updating thread status",
      } as ApiResponse);
    }
  }
}
