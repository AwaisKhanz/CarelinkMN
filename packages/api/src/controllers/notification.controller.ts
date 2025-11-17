import { Request, Response } from "express";
import { NotificationService } from "../services/notification.service";
import { ApiResponse, AuthenticatedRequest } from "../types";
import { validate } from "../middleware/validation.middleware";
import { query, param } from "express-validator";
import { validationResult } from "express-validator";
import { NotificationType } from "@prisma/client";

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
    this.getNotifications = this.getNotifications.bind(this);
    this.markAsRead = this.markAsRead.bind(this);
    this.markAllAsRead = this.markAllAsRead.bind(this);
  }

  /**
   * Get notifications for the authenticated user
   * GET /api/notifications
   */
  async getNotifications(req: Request, res: Response): Promise<void> {
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

      const { page, limit, isRead, type } = req.query;

      const result = await this.notificationService.getNotifications(user.id, {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        isRead: isRead === "true" ? true : isRead === "false" ? false : undefined,
        type: type ? (type as NotificationType) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: "Notifications retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({
        success: false,
        error: "Notification retrieval failed",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while retrieving notifications",
      } as ApiResponse);
    }
  }

  /**
   * Mark a notification as read
   * PATCH /api/notifications/:id/read
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

      const { id } = req.params;

      await this.notificationService.markAsRead(id, user.id);

      res.status(200).json({
        success: true,
        message: "Notification marked as read",
      } as ApiResponse);
    } catch (error) {
      console.error("Mark notification as read error:", error);
      const statusCode =
        error instanceof Error && error.message === "Notification not found or access denied"
          ? 404
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Failed to mark notification as read",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while marking notification as read",
      } as ApiResponse);
    }
  }

  /**
   * Mark all notifications as read for the authenticated user
   * PATCH /api/notifications/read-all
   */
  async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as unknown as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      await this.notificationService.markAllAsRead(user.id);

      res.status(200).json({
        success: true,
        message: "All notifications marked as read",
      } as ApiResponse);
    } catch (error) {
      console.error("Mark all notifications as read error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to mark all notifications as read",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while marking all notifications as read",
      } as ApiResponse);
    }
  }
}

