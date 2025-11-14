import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { ApiResponse } from "../types/common";
import { validationResult } from "express-validator";
import { AuthenticatedRequest } from "../types/auth";
import { UserStatus } from "@carelink/types";

export class UserController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
    
    // Bind methods to preserve 'this' context
    this.updateProfile = this.updateProfile.bind(this);
    this.deactivateAccount = this.deactivateAccount.bind(this);
    this.suspendUser = this.suspendUser.bind(this);
    this.activateUser = this.activateUser.bind(this);
  }

  // Update user profile
  async updateProfile(req: Request, res: Response): Promise<void> {
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
  async deactivateAccount(req: Request, res: Response): Promise<void> {
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
  async suspendUser(req: Request, res: Response): Promise<void> {
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
  async activateUser(req: Request, res: Response): Promise<void> {
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
}
