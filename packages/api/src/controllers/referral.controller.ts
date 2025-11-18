import { Request, Response } from "express";
import { ReferralService } from "../services/referral.service";
import { ApiResponse, AuthenticatedRequest } from "../types";
import { validationResult } from "express-validator";
import { ReferralStatus, Urgency, Payer } from "@carelink/types";

export class ReferralController {
  private referralService: ReferralService;

  constructor() {
    this.referralService = new ReferralService();

    // Bind methods to preserve 'this' context
    this.createReferral = this.createReferral.bind(this);
    this.getReferrals = this.getReferrals.bind(this);
    this.getReferralById = this.getReferralById.bind(this);
    this.updateReferral = this.updateReferral.bind(this);
    this.deleteReferral = this.deleteReferral.bind(this);
    this.addToShortlist = this.addToShortlist.bind(this);
    this.updateShortlistStatus = this.updateShortlistStatus.bind(this);
    this.removeFromShortlist = this.removeFromShortlist.bind(this);
    this.getShortlist = this.getShortlist.bind(this);
    this.batchAddToShortlist = this.batchAddToShortlist.bind(this);
    this.batchMessageProviders = this.batchMessageProviders.bind(this);
    this.assignReferral = this.assignReferral.bind(this);
    this.getReferralTimeline = this.getReferralTimeline.bind(this);
  }

  /**
   * Create a new referral
   * POST /api/referrals
   */
  async createReferral(req: Request, res: Response): Promise<void> {
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

      const referral = await this.referralService.createReferral(
        user.id,
        req.body
      );

      res.status(201).json({
        success: true,
        data: referral,
        message: "Referral created successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Create referral error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create referral",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while creating the referral",
      } as ApiResponse);
    }
  }

  /**
   * Get all referrals for the authenticated user
   * GET /api/referrals
   */
  async getReferrals(req: Request, res: Response): Promise<void> {
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

      const {
        status,
        urgency,
        payer,
        page = "1",
        limit = "20",
        search,
      } = req.query;

      const filters: any = {};
      if (status) filters.status = status as ReferralStatus;
      if (urgency) filters.urgency = urgency as Urgency;
      if (payer) filters.primaryPayer = payer as Payer;
      if (search) filters.search = search as string;

      const referrals = await this.referralService.getReferrals(user.id, {
        ...filters,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
      });

      res.status(200).json({
        success: true,
        data: referrals,
        message: "Referrals retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get referrals error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve referrals",
        message: "An error occurred while retrieving referrals",
      } as ApiResponse);
    }
  }

  /**
   * Get referral by ID
   * GET /api/referrals/:id
   */
  async getReferralById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const referral = await this.referralService.getReferralById(id, user.id);

      res.status(200).json({
        success: true,
        data: referral,
        message: "Referral retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get referral by ID error:", error);
      const statusCode =
        error instanceof Error && error.message.includes("not found")
          ? 404
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Failed to retrieve referral",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while retrieving the referral",
      } as ApiResponse);
    }
  }

  /**
   * Update referral
   * PUT /api/referrals/:id
   */
  async updateReferral(req: Request, res: Response): Promise<void> {
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

      const { id: referralId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const referral = await this.referralService.updateReferral(
        referralId,
        user.id,
        req.body
      );

      res.status(200).json({
        success: true,
        data: referral,
        message: "Referral updated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Update referral error:", error);
      const statusCode =
        error instanceof Error && error.message.includes("not found")
          ? 404
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Failed to update referral",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while updating the referral",
      } as ApiResponse);
    }
  }

  /**
   * Delete referral
   * DELETE /api/referrals/:id
   */
  async deleteReferral(req: Request, res: Response): Promise<void> {
    try {
      const { id: referralId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      await this.referralService.deleteReferral(referralId, user.id);

      res.status(200).json({
        success: true,
        message: "Referral deleted successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Delete referral error:", error);
      const statusCode =
        error instanceof Error && error.message.includes("not found")
          ? 404
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Failed to delete referral",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while deleting the referral",
      } as ApiResponse);
    }
  }

  /**
   * Add provider to shortlist
   * POST /api/referrals/:id/shortlist
   */
  async addToShortlist(req: Request, res: Response): Promise<void> {
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

      const { id: referralId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const shortlist = await this.referralService.addToShortlist(
        referralId,
        user.id,
        req.body
      );

      res.status(201).json({
        success: true,
        data: shortlist,
        message: "Provider added to shortlist successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Add to shortlist error:", error);
      const statusCode =
        error instanceof Error && error.message.includes("not found")
          ? 404
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Failed to add provider to shortlist",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while adding provider to shortlist",
      } as ApiResponse);
    }
  }

  /**
   * Update shortlist status
   * PATCH /api/referrals/:id/shortlist/:shortlistId
   */
  async updateShortlistStatus(req: Request, res: Response): Promise<void> {
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

      const { id: referralId, shortlistId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const shortlist = await this.referralService.updateShortlistStatus(
        shortlistId,
        user.id,
        req.body
      );

      res.status(200).json({
        success: true,
        data: shortlist,
        message: "Shortlist status updated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Update shortlist status error:", error);
      const statusCode =
        error instanceof Error && error.message.includes("not found")
          ? 404
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Failed to update shortlist status",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while updating shortlist status",
      } as ApiResponse);
    }
  }

  /**
   * Remove provider from shortlist
   * DELETE /api/referrals/:id/shortlist/:shortlistId
   */
  async removeFromShortlist(req: Request, res: Response): Promise<void> {
    try {
      const { id: referralId, shortlistId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      await this.referralService.removeFromShortlist(shortlistId, user.id);

      res.status(200).json({
        success: true,
        message: "Provider removed from shortlist successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Remove from shortlist error:", error);
      const statusCode =
        error instanceof Error && error.message.includes("not found")
          ? 404
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Failed to remove provider from shortlist",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while removing provider from shortlist",
      } as ApiResponse);
    }
  }

  /**
   * Get shortlist for a referral
   * GET /api/referrals/:id/shortlist
   */
  async getShortlist(req: Request, res: Response): Promise<void> {
    try {
      const { id: referralId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const shortlist = await this.referralService.getShortlist(
        referralId,
        user.id
      );

      res.status(200).json({
        success: true,
        data: shortlist,
        message: "Shortlist retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get shortlist error:", error);
      const statusCode =
        error instanceof Error && error.message.includes("not found")
          ? 404
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Failed to retrieve shortlist",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while retrieving the shortlist",
      } as ApiResponse);
    }
  }

  /**
   * Batch add providers to shortlist
   * POST /api/referrals/:id/shortlist/batch
   */
  async batchAddToShortlist(req: Request, res: Response): Promise<void> {
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

      const { id: referralId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const shortlist = await this.referralService.batchAddToShortlist(
        referralId,
        user.id,
        req.body
      );

      res.status(201).json({
        success: true,
        data: shortlist,
        message: "Providers added to shortlist successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Batch add to shortlist error:", error);
      const statusCode =
        error instanceof Error && error.message.includes("not found")
          ? 404
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Failed to add providers to shortlist",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while adding providers to shortlist",
      } as ApiResponse);
    }
  }

  /**
   * Batch message providers
   * POST /api/referrals/batch-message
   */
  async batchMessageProviders(req: Request, res: Response): Promise<void> {
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

      const result = await this.referralService.batchMessageProviders(
        req.body,
        user.id
      );

      res.status(200).json({
        success: true,
        data: result,
        message: "Batch message sent successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Batch message providers error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to send batch message",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while sending batch message",
      } as ApiResponse);
    }
  }

  /**
   * Assign referral to another case manager
   * POST /api/referrals/:id/assign
   */
  async assignReferral(req: Request, res: Response): Promise<void> {
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

      const { id: referralId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const { assignedToUserId, notes } = req.body;

      const referral = await this.referralService.assignReferral(
        referralId,
        user.id,
        assignedToUserId,
        notes
      );

      res.status(200).json({
        success: true,
        data: referral,
        message: "Referral assigned successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Assign referral error:", error);
      const statusCode =
        error instanceof Error &&
        (error.message.includes("not found") ||
          error.message.includes("Access denied") ||
          error.message.includes("not a case manager"))
          ? 400
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Failed to assign referral",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while assigning the referral",
      } as ApiResponse);
    }
  }

  /**
   * Get referral timeline events
   * GET /api/referrals/:id/timeline
   */
  async getReferralTimeline(req: Request, res: Response): Promise<void> {
    try {
      const { id: referralId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const timeline = await this.referralService.getReferralTimeline(
        referralId,
        user.id
      );

      res.status(200).json({
        success: true,
        data: timeline,
        message: "Referral timeline retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get referral timeline error:", error);
      const statusCode =
        error instanceof Error && error.message.includes("not found")
          ? 404
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Failed to retrieve referral timeline",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while retrieving the referral timeline",
      } as ApiResponse);
    }
  }
}
