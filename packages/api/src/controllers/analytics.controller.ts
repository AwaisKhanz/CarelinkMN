import { Request, Response } from "express";
import { AnalyticsService } from "../services/analytics.service";
import { ApiResponse } from "../types/common";
import { AuthenticatedRequest } from "../types/auth";
import { param, query, validationResult } from "express-validator";
import { db } from "@carelink/database";

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  /**
   * Get provider analytics
   * GET /api/providers/:providerId/analytics
   */
  async getProviderAnalytics(req: Request, res: Response): Promise<void> {
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

      const { providerId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      // Verify user has access to this provider
      const provider = await db.provider.findFirst({
        where: {
          id: providerId,
          organization: {
            users: {
              some: {
                id: user.id,
              },
            },
          },
        },
      });

      if (!provider) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "You do not have access to this provider's analytics",
        } as ApiResponse);
        return;
      }

      // Parse date filters
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined;
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined;

      const analytics = await this.analyticsService.getProviderAnalytics({
        providerId,
        startDate,
        endDate,
      });

      res.status(200).json({
        success: true,
        data: analytics,
        message: "Analytics retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get provider analytics error:", error);
      res.status(500).json({
        success: false,
        error: "Analytics retrieval failed",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while retrieving analytics",
      } as ApiResponse);
    }
  }
}

