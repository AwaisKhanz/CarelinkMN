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

      const referralData = req.body;
      const referral = await this.referralService.createReferral(
        user.id,
        referralData
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
        error: "Referral creation failed",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while creating the referral",
      } as ApiResponse);
    }
  }

  /**
   * Get referrals with filtering and pagination
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
        page,
        limit,
        status,
        urgency,
        primaryPayer,
        search,
      } = req.query;

      const filters = {
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        status: status ? (status as ReferralStatus) : undefined,
        urgency: urgency ? (urgency as Urgency) : undefined,
        primaryPayer: primaryPayer ? (primaryPayer as Payer) : undefined,
        search: search as string | undefined,
      };

      const result = await this.referralService.getReferrals(user.id, filters);

      res.status(200).json({
        success: true,
        data: result,
        message: "Referrals retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get referrals error:", error);
      res.status(500).json({
        success: false,
        error: "Referral retrieval failed",
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
        error instanceof Error && error.message === "Referral not found"
          ? 404
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Referral retrieval failed",
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

      const { id } = req.params;
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

      const referral = await this.referralService.updateReferral(
        id,
        user.id,
        updateData
      );

      res.status(200).json({
        success: true,
        data: referral,
        message: "Referral updated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Update referral error:", error);
      const statusCode =
        error instanceof Error &&
        error.message === "Referral not found or access denied"
          ? 404
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Referral update failed",
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

      await this.referralService.deleteReferral(id, user.id);

      res.status(200).json({
        success: true,
        message: "Referral deleted successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Delete referral error:", error);
      const statusCode =
        error instanceof Error &&
        error.message === "Referral not found or access denied"
          ? 404
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Referral deletion failed",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while deleting the referral",
      } as ApiResponse);
    }
  }

  /**
   * Add providers to shortlist
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

      const { id } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;
      const { providerIds, notes } = req.body;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const shortlist = await this.referralService.addToShortlist(id, user.id, {
        providerIds,
        notes,
      });

      res.status(200).json({
        success: true,
        data: shortlist,
        message: "Providers added to shortlist successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Add to shortlist error:", error);
      const statusCode =
        error instanceof Error &&
        error.message === "Referral not found or access denied"
          ? 404
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Shortlist update failed",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while adding providers to shortlist",
      } as ApiResponse);
    }
  }

  /**
   * Update shortlist status
   * PUT /api/referrals/:id/shortlist/:shortlistId
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

      const { id, shortlistId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;
      const { status, notes } = req.body;

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
        {
          status,
          notes,
        }
      );

      res.status(200).json({
        success: true,
        data: shortlist,
        message: "Shortlist status updated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Update shortlist status error:", error);
      const statusCode =
        error instanceof Error &&
        error.message === "Shortlist not found or access denied"
          ? 404
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Shortlist update failed",
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
      const { id, shortlistId } = req.params;
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
        error instanceof Error &&
        error.message === "Shortlist not found or access denied"
          ? 404
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Shortlist removal failed",
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

      const shortlist = await this.referralService.getShortlist(id, user.id);

      res.status(200).json({
        success: true,
        data: shortlist,
        message: "Shortlist retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get shortlist error:", error);
      const statusCode =
        error instanceof Error &&
        error.message === "Referral not found or access denied"
          ? 404
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Shortlist retrieval failed",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while retrieving shortlist",
      } as ApiResponse);
    }
  }

  /**
   * Batch add to shortlist
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

      const { id } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;
      const { providerIds, notes } = req.body;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const shortlist = await this.referralService.batchAddToShortlist(
        id,
        user.id,
        providerIds,
        notes
      );

      res.status(200).json({
        success: true,
        data: shortlist,
        message: "Providers added to shortlist successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Batch add to shortlist error:", error);
      const statusCode =
        error instanceof Error &&
        error.message === "Referral not found or access denied"
          ? 404
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Batch shortlist update failed",
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
      const { referralIds, providerIds, message, attachments } = req.body;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const threads = await this.referralService.batchMessageProviders(
        {
          referralIds,
          providerIds,
          message,
          attachments,
        },
        user.id
      );

      res.status(200).json({
        success: true,
        data: threads,
        message: "Messages sent successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Batch message providers error:", error);
      const statusCode =
        error instanceof Error &&
        error.message === "Some referrals not found or access denied"
          ? 404
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Batch messaging failed",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while sending batch messages",
      } as ApiResponse);
    }
  }
}

