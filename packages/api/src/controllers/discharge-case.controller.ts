import { Request, Response } from "express";
import { DischargeCaseService } from "../services/discharge-case.service";
import { ApiResponse, AuthenticatedRequest } from "../types";
import { validationResult } from "express-validator";
import { DischargeStatus } from "@carelink/types";

export class DischargeCaseController {
  private dischargeCaseService: DischargeCaseService;

  constructor() {
    this.dischargeCaseService = new DischargeCaseService();

    // Bind methods to preserve 'this' context
    this.createDischargeCase = this.createDischargeCase.bind(this);
    this.getDischargeCases = this.getDischargeCases.bind(this);
    this.getDischargeCaseById = this.getDischargeCaseById.bind(this);
    this.updateDischargeCase = this.updateDischargeCase.bind(this);
    this.deleteDischargeCase = this.deleteDischargeCase.bind(this);
    this.getDischargeCaseInvitations = this.getDischargeCaseInvitations.bind(this);
    this.sendProviderInvitations = this.sendProviderInvitations.bind(this);
    this.getDischargeChecklist = this.getDischargeChecklist.bind(this);
    this.updateDischargeChecklist = this.updateDischargeChecklist.bind(this);
    this.triggerAIMatching = this.triggerAIMatching.bind(this);
  }

  /**
   * Create a new discharge case
   * POST /api/discharge-cases
   */
  async createDischargeCase(req: Request, res: Response): Promise<void> {
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

      const dischargeCase = await this.dischargeCaseService.createDischargeCase(
        user.id,
        req.body
      );

      res.status(201).json({
        success: true,
        data: dischargeCase,
        message: "Discharge case created successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Create discharge case error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create discharge case",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while creating the discharge case",
      } as ApiResponse);
    }
  }

  /**
   * Get all discharge cases for the authenticated user
   * GET /api/discharge-cases
   */
  async getDischargeCases(req: Request, res: Response): Promise<void> {
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
        hospitalId,
        socialWorkerId,
        search,
        targetDischargeDateFrom,
        targetDischargeDateTo,
        page,
        limit,
      } = req.query;

      const filters = {
        status: status as DischargeStatus | undefined,
        hospitalId: hospitalId as string | undefined,
        socialWorkerId: socialWorkerId as string | undefined,
        search: search as string | undefined,
        targetDischargeDateFrom: targetDischargeDateFrom
          ? new Date(targetDischargeDateFrom as string)
          : undefined,
        targetDischargeDateTo: targetDischargeDateTo
          ? new Date(targetDischargeDateTo as string)
          : undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      };

      const result = await this.dischargeCaseService.getDischargeCases(
        user.id,
        filters
      );

      res.status(200).json({
        success: true,
        data: result,
      } as ApiResponse);
    } catch (error) {
      console.error("Get discharge cases error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve discharge cases",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while retrieving discharge cases",
      } as ApiResponse);
    }
  }

  /**
   * Get discharge case by ID
   * GET /api/discharge-cases/:id
   */
  async getDischargeCaseById(req: Request, res: Response): Promise<void> {
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

      const { id } = req.params;
      const dischargeCase = await this.dischargeCaseService.getDischargeCaseById(
        id,
        user.id
      );

      res.status(200).json({
        success: true,
        data: dischargeCase,
      } as ApiResponse);
    } catch (error) {
      console.error("Get discharge case by ID error:", error);
      const statusCode =
        error instanceof Error && error.message === "Discharge case not found"
          ? 404
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Failed to retrieve discharge case",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while retrieving the discharge case",
      } as ApiResponse);
    }
  }

  /**
   * Update discharge case
   * PUT /api/discharge-cases/:id
   */
  async updateDischargeCase(req: Request, res: Response): Promise<void> {
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
      const dischargeCase = await this.dischargeCaseService.updateDischargeCase(
        id,
        user.id,
        req.body
      );

      res.status(200).json({
        success: true,
        data: dischargeCase,
        message: "Discharge case updated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Update discharge case error:", error);
      const statusCode =
        error instanceof Error && error.message === "Discharge case not found"
          ? 404
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Failed to update discharge case",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while updating the discharge case",
      } as ApiResponse);
    }
  }

  /**
   * Delete discharge case
   * DELETE /api/discharge-cases/:id
   */
  async deleteDischargeCase(req: Request, res: Response): Promise<void> {
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

      const { id } = req.params;
      await this.dischargeCaseService.deleteDischargeCase(id, user.id);

      res.status(200).json({
        success: true,
        message: "Discharge case deleted successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Delete discharge case error:", error);
      const statusCode =
        error instanceof Error && error.message === "Discharge case not found"
          ? 404
          : error instanceof Error &&
            error.message.includes("Cannot delete")
          ? 400
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Failed to delete discharge case",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while deleting the discharge case",
      } as ApiResponse);
    }
  }

  /**
   * Get discharge case invitations
   * GET /api/discharge-cases/:id/invitations
   */
  async getDischargeCaseInvitations(req: Request, res: Response): Promise<void> {
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

      const { id } = req.params;
      const invitations =
        await this.dischargeCaseService.getDischargeCaseInvitations(id, user.id);

      res.status(200).json({
        success: true,
        data: invitations,
      } as ApiResponse);
    } catch (error) {
      console.error("Get discharge case invitations error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve invitations",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while retrieving invitations",
      } as ApiResponse);
    }
  }

  /**
   * Send provider invitations
   * POST /api/discharge-cases/:id/invitations
   */
  async sendProviderInvitations(req: Request, res: Response): Promise<void> {
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
      const { providerIds } = req.body;

      if (!providerIds || !Array.isArray(providerIds) || providerIds.length === 0) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          message: "providerIds must be a non-empty array",
        } as ApiResponse);
        return;
      }

      const invitations =
        await this.dischargeCaseService.sendProviderInvitations(
          id,
          user.id,
          providerIds
        );

      res.status(200).json({
        success: true,
        data: invitations,
        message: "Invitations sent successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Send provider invitations error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to send invitations",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while sending invitations",
      } as ApiResponse);
    }
  }

  /**
   * Get discharge checklist
   * GET /api/discharge-cases/:id/checklist
   */
  async getDischargeChecklist(req: Request, res: Response): Promise<void> {
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

      const { id } = req.params;
      const checklist = await this.dischargeCaseService.getDischargeChecklist(
        id,
        user.id
      );

      res.status(200).json({
        success: true,
        data: checklist,
      } as ApiResponse);
    } catch (error) {
      console.error("Get discharge checklist error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve checklist",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while retrieving the checklist",
      } as ApiResponse);
    }
  }

  /**
   * Update discharge checklist
   * PUT /api/discharge-cases/:id/checklist
   */
  async updateDischargeChecklist(req: Request, res: Response): Promise<void> {
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
      const checklist =
        await this.dischargeCaseService.updateDischargeChecklist(
          id,
          user.id,
          req.body
        );

      res.status(200).json({
        success: true,
        data: checklist,
        message: "Checklist updated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Update discharge checklist error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update checklist",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while updating the checklist",
      } as ApiResponse);
    }
  }

  /**
   * Trigger AI matching for discharge case
   * POST /api/discharge-cases/:id/ai-matching
   */
  async triggerAIMatching(req: Request, res: Response): Promise<void> {
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

      const { id } = req.params;
      const result = await this.dischargeCaseService.triggerAIMatching(
        id,
        user.id
      );

      res.status(200).json({
        success: true,
        data: result,
        message: "AI matching completed",
      } as ApiResponse);
    } catch (error) {
      console.error("Trigger AI matching error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to trigger AI matching",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while triggering AI matching",
      } as ApiResponse);
    }
  }

  /**
   * Get Hospital SW analytics
   * GET /api/hospital-sw/analytics
   */
  async getHospitalSWAnalytics(req: Request, res: Response): Promise<void> {
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

      const { startDate, endDate } = req.query;

      const analytics = await this.dischargeCaseService.getHospitalSWAnalytics(
        user.id,
        startDate ? (startDate as string) : undefined,
        endDate ? (endDate as string) : undefined
      );

      res.status(200).json({
        success: true,
        data: analytics,
        message: "Analytics retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get Hospital SW analytics error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve analytics",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while retrieving analytics",
      } as ApiResponse);
    }
  }
}

