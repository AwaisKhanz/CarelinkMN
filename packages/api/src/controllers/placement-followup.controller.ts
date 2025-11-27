import { Request, Response } from "express";
import { PlacementFollowUpService } from "../services/placement-followup.service";
import { ApiResponse, AuthenticatedRequest } from "../types";
import { validationResult } from "express-validator";
import { FollowUpType, FollowUpOutcome } from "@prisma/client";

export class PlacementFollowUpController {
  private followUpService: PlacementFollowUpService;

  constructor() {
    this.followUpService = new PlacementFollowUpService();
  }

  /**
   * Create a follow-up
   * POST /api/placements/:placementId/follow-ups
   */
  async createFollowUp(req: Request, res: Response): Promise<void> {
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

      const { placementId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const followUp = await this.followUpService.createFollowUp(
        placementId,
        req.body,
        user.id
      );

      res.status(201).json({
        success: true,
        data: followUp,
        message: "Follow-up created successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Create follow-up error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create follow-up",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while creating the follow-up",
      } as ApiResponse);
    }
  }

  /**
   * Get follow-ups for a placement
   * GET /api/placements/:placementId/follow-ups
   */
  async getFollowUps(req: Request, res: Response): Promise<void> {
    try {
      const { placementId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const followUps = await this.followUpService.getFollowUps(
        placementId,
        user.id
      );

      res.status(200).json({
        success: true,
        data: followUps,
        message: "Follow-ups retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get follow-ups error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve follow-ups",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while retrieving follow-ups",
      } as ApiResponse);
    }
  }

  /**
   * Complete a follow-up
   * PATCH /api/follow-ups/:followUpId/complete
   */
  async completeFollowUp(req: Request, res: Response): Promise<void> {
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

      const { followUpId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const followUp = await this.followUpService.completeFollowUp(
        followUpId,
        req.body,
        user.id
      );

      res.status(200).json({
        success: true,
        data: followUp,
        message: "Follow-up completed successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Complete follow-up error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to complete follow-up",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while completing the follow-up",
      } as ApiResponse);
    }
  }

  /**
   * Get upcoming follow-ups
   * GET /api/follow-ups/upcoming
   */
  async getUpcomingFollowUps(req: Request, res: Response): Promise<void> {
    try {
      const { providerId } = req.query;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      if (!providerId || typeof providerId !== "string") {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          message: "Provider ID is required",
        } as ApiResponse);
        return;
      }

      const followUps = await this.followUpService.getUpcomingFollowUps(
        providerId,
        user.id
      );

      res.status(200).json({
        success: true,
        data: followUps,
        message: "Upcoming follow-ups retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get upcoming follow-ups error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve upcoming follow-ups",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while retrieving upcoming follow-ups",
      } as ApiResponse);
    }
  }

  /**
   * Delete a follow-up
   * DELETE /api/follow-ups/:followUpId
   */
  async deleteFollowUp(req: Request, res: Response): Promise<void> {
    try {
      const { followUpId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      await this.followUpService.deleteFollowUp(followUpId, user.id);

      res.status(200).json({
        success: true,
        message: "Follow-up deleted successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Delete follow-up error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete follow-up",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while deleting the follow-up",
      } as ApiResponse);
    }
  }
}
