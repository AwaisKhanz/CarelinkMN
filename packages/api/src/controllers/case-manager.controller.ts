import { Request, Response } from "express";
import { CaseManagerService } from "../services/case-manager.service";
import { ApiResponse, AuthenticatedRequest } from "../types";
import { validationResult } from "express-validator";

export class CaseManagerController {
  private caseManagerService: CaseManagerService;

  constructor() {
    this.caseManagerService = new CaseManagerService();

    // Bind methods to preserve 'this' context
    this.getCaseManagerByUserId = this.getCaseManagerByUserId.bind(this);
    this.updateCaseManager = this.updateCaseManager.bind(this);
    this.getDashboard = this.getDashboard.bind(this);
    this.getStats = this.getStats.bind(this);
  }

  /**
   * Get case manager by user ID
   * GET /api/case-managers/:userId
   */
  async getCaseManagerByUserId(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      // Users can only access their own case manager profile
      if (user.id !== userId) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "You can only access your own case manager profile",
        } as ApiResponse);
        return;
      }

      const caseManager = await this.caseManagerService.getCaseManagerByUserId(
        userId
      );

      if (!caseManager) {
        res.status(404).json({
          success: false,
          error: "Case Manager not found",
          message: "No case manager profile found for this user",
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: caseManager,
        message: "Case manager profile retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get case manager by user ID error:", error);
      res.status(500).json({
        success: false,
        error: "Case manager retrieval failed",
        message: "An error occurred while retrieving the case manager profile",
      } as ApiResponse);
    }
  }

  /**
   * Update case manager profile
   * PUT /api/case-managers/:userId
   */
  async updateCaseManager(req: Request, res: Response): Promise<void> {
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

      const { userId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;
      const updateData = req.body;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      // Users can only update their own case manager profile
      if (user.id !== userId) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "You can only update your own case manager profile",
        } as ApiResponse);
        return;
      }

      const caseManager = await this.caseManagerService.updateCaseManager(
        userId,
        updateData
      );

      res.status(200).json({
        success: true,
        data: caseManager,
        message: "Case manager profile updated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Update case manager error:", error);
      res.status(500).json({
        success: false,
        error: "Case manager update failed",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while updating the case manager profile",
      } as ApiResponse);
    }
  }

  /**
   * Get case manager dashboard
   * GET /api/case-managers/:userId/dashboard
   */
  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      // Users can only access their own dashboard
      if (user.id !== userId) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "You can only access your own dashboard",
        } as ApiResponse);
        return;
      }

      const dashboard = await this.caseManagerService.getCaseManagerDashboard(
        userId
      );

      res.status(200).json({
        success: true,
        data: dashboard,
        message: "Dashboard data retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get dashboard error:", error);
      res.status(500).json({
        success: false,
        error: "Dashboard retrieval failed",
        message: "An error occurred while retrieving dashboard data",
      } as ApiResponse);
    }
  }

  /**
   * Get case manager statistics
   * GET /api/case-managers/:userId/stats
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;
      const { startDate, endDate } = req.query;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      // Users can only access their own stats
      if (user.id !== userId) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "You can only access your own statistics",
        } as ApiResponse);
        return;
      }

      const dateRange =
        startDate || endDate
          ? {
              startDate: startDate ? new Date(startDate as string) : undefined,
              endDate: endDate ? new Date(endDate as string) : undefined,
            }
          : undefined;

      const stats = await this.caseManagerService.getCaseManagerStats(
        userId,
        dateRange
      );

      res.status(200).json({
        success: true,
        data: stats,
        message: "Statistics retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get stats error:", error);
      res.status(500).json({
        success: false,
        error: "Statistics retrieval failed",
        message: "An error occurred while retrieving statistics",
      } as ApiResponse);
    }
  }
}
