import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { ApiResponse } from "../types/common";
import { validationResult } from "express-validator";
import { AuthenticatedRequest } from "../types/auth";
import { UserStatus, NotificationPreferences } from "@carelink/types";

export class UserController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  // Update user profile
  updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as unknown as AuthenticatedRequest).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const profileData = req.body;
      const updatedUser = await this.authService.updateProfile(userId, profileData);

      res.status(200).json({
        success: true,
        data: { user: updatedUser },
        message: "Profile updated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({
        success: false,
        error: "Profile update failed",
        message: "An error occurred while updating profile",
      } as ApiResponse);
    }
  }

  // Deactivate user account
  deactivateAccount = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as unknown as AuthenticatedRequest).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      await this.authService.updateUserStatus(userId, UserStatus.DEACTIVATED);

      res.status(200).json({
        success: true,
        message: "Account deactivated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Deactivate account error:", error);
      res.status(500).json({
        success: false,
        error: "Account deactivation failed",
        message: "An error occurred while deactivating account",
      } as ApiResponse);
    }
  }

  // Suspend user (admin only)
  suspendUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const currentUser = (req as unknown as AuthenticatedRequest).user;
      if (!currentUser || !['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "Insufficient permissions",
        } as ApiResponse);
        return;
      }

      const { userId } = req.params;
      const { reason } = req.body;

      await this.authService.updateUserStatus(userId, UserStatus.SUSPENDED, reason);

      res.status(200).json({
        success: true,
        message: "User suspended successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Suspend user error:", error);
      res.status(500).json({
        success: false,
        error: "User suspension failed",
        message: "An error occurred while suspending user",
      } as ApiResponse);
    }
  }

  // Activate user (admin only)
  activateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const currentUser = (req as unknown as AuthenticatedRequest).user;
      if (!currentUser || !['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "Insufficient permissions",
        } as ApiResponse);
        return;
      }

      const { userId } = req.params;
      await this.authService.updateUserStatus(userId, UserStatus.ACTIVE);

      res.status(200).json({
        success: true,
        message: "User activated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Activate user error:", error);
      res.status(500).json({
        success: false,
        error: "User activation failed",
        message: "An error occurred while activating user",
      } as ApiResponse);
    }
  }

  // Get notification preferences
  getNotificationPreferences = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as unknown as AuthenticatedRequest).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const preferences = await this.authService.getNotificationPreferences(userId);

      res.status(200).json({
        success: true,
        data: { notificationPreferences: preferences },
        message: "Notification preferences retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get notification preferences error:", error);
      res.status(500).json({
        success: false,
        error: "Notification preferences retrieval failed",
        message: "An error occurred while retrieving notification preferences",
      } as ApiResponse);
    }
  }

  // Update notification preferences
  updateNotificationPreferences = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as unknown as AuthenticatedRequest).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const preferences: NotificationPreferences = req.body;
      const updatedPreferences = await this.authService.updateNotificationPreferences(userId, preferences);

      res.status(200).json({
        success: true,
        data: { notificationPreferences: updatedPreferences },
        message: "Notification preferences updated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Update notification preferences error:", error);
      res.status(500).json({
        success: false,
        error: "Notification preferences update failed",
        message: "An error occurred while updating notification preferences",
      } as ApiResponse);
    }
  }
}
