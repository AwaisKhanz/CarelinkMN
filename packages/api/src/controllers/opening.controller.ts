import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { OpeningService } from "../services/opening.service";
import { ApiResponse } from "../types";
import { AuthenticatedRequest } from "../types/auth";
import { OpeningStatus } from "@prisma/client";
import { db } from "@carelink/database";

export class OpeningController {
  private openingService: OpeningService;

  constructor() {
    this.openingService = new OpeningService();
  }

  // Create a new opening
  async createOpening(req: Request, res: Response): Promise<void> {
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

      const { homeId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;
      const openingData = req.body;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      // Verify user has access to this home
      if (!(await this.openingService.verifyHomeAccess(user.id, homeId))) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "You don't have access to this home",
        } as ApiResponse);
        return;
      }

      // Get home to get providerId
      const home = await db.home.findUnique({
        where: { id: homeId },
        select: { providerId: true },
      });

      if (!home) {
        res.status(404).json({
          success: false,
          error: "Not found",
          message: "Home not found",
        } as ApiResponse);
        return;
      }

      const opening = await this.openingService.createOpening(home.providerId, {
        ...openingData,
        homeId,
      });

      res.status(201).json({
        success: true,
        data: opening,
        message: "Opening created successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Create opening error:", error);
      res.status(500).json({
        success: false,
        error: "Opening creation failed",
        message:
          error instanceof Error ? error.message : "An error occurred while creating the opening",
      } as ApiResponse);
    }
  }

  // Get openings with filters
  async getOpenings(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as unknown as AuthenticatedRequest).user;
      const {
        homeId,
        status,
        providerId,
        page = 1,
        limit = 20,
        includeExpired = false,
        search,
      } = req.query;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const filters = {
        homeId: homeId as string,
        status: status as OpeningStatus | undefined,
        providerId: providerId as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        includeExpired: includeExpired === "true",
        search: search as string,
      };

      const result = await this.openingService.getOpenings(filters, user.id);

      res.status(200).json({
        success: true,
        data: result,
        message: "Openings retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get openings error:", error);
      res.status(500).json({
        success: false,
        error: "Opening retrieval failed",
        message:
          error instanceof Error ? error.message : "An error occurred while retrieving openings",
      } as ApiResponse);
    }
  }

  // Get openings grouped by status (for Kanban board)
  async getOpeningsByStatus(req: Request, res: Response): Promise<void> {
    try {
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

      const groupedOpenings = await this.openingService.getOpeningsByStatus(
        providerId,
        user.id
      );

      res.status(200).json({
        success: true,
        data: groupedOpenings,
        message: "Openings retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get openings by status error:", error);
      res.status(500).json({
        success: false,
        error: "Opening retrieval failed",
        message:
          error instanceof Error ? error.message : "An error occurred while retrieving openings",
      } as ApiResponse);
    }
  }

  // Get a specific opening by ID
  async getOpeningById(req: Request, res: Response): Promise<void> {
    try {
      const { openingId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const opening = await this.openingService.getOpeningById(openingId, user.id);

      if (!opening) {
        res.status(404).json({
          success: false,
          error: "Not found",
          message: "Opening not found",
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: opening,
        message: "Opening retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get opening by ID error:", error);
      res.status(500).json({
        success: false,
        error: "Opening retrieval failed",
        message: "An error occurred while retrieving the opening",
      } as ApiResponse);
    }
  }

  // Update an opening
  async updateOpening(req: Request, res: Response): Promise<void> {
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

      const { openingId } = req.params;
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

      const opening = await this.openingService.updateOpening(openingId, updateData, user.id);

      if (!opening) {
        res.status(404).json({
          success: false,
          error: "Not found",
          message: "Opening not found",
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: opening,
        message: "Opening updated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Update opening error:", error);
      res.status(500).json({
        success: false,
        error: "Opening update failed",
        message:
          error instanceof Error ? error.message : "An error occurred while updating the opening",
      } as ApiResponse);
    }
  }

  // Update opening status (for Kanban board)
  async updateOpeningStatus(req: Request, res: Response): Promise<void> {
    try {
      const { openingId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;
      const { status } = req.body;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      if (!status || !Object.values(OpeningStatus).includes(status)) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          message: "Invalid status",
        } as ApiResponse);
        return;
      }

      const opening = await this.openingService.updateOpeningStatus(
        openingId,
        status,
        user.id
      );

      if (!opening) {
        res.status(404).json({
          success: false,
          error: "Not found",
          message: "Opening not found",
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: opening,
        message: "Opening status updated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Update opening status error:", error);
      res.status(500).json({
        success: false,
        error: "Opening status update failed",
        message: "An error occurred while updating the opening status",
      } as ApiResponse);
    }
  }

  // Refresh opening (update freshness timestamp)
  async refreshOpening(req: Request, res: Response): Promise<void> {
    try {
      const { openingId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const opening = await this.openingService.refreshOpening(openingId, user.id);

      if (!opening) {
        res.status(404).json({
          success: false,
          error: "Not found",
          message: "Opening not found",
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: opening,
        message: "Opening refreshed successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Refresh opening error:", error);
      res.status(500).json({
        success: false,
        error: "Opening refresh failed",
        message: "An error occurred while refreshing the opening",
      } as ApiResponse);
    }
  }

  // Delete an opening
  async deleteOpening(req: Request, res: Response): Promise<void> {
    try {
      const { openingId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const deleted = await this.openingService.deleteOpening(openingId, user.id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: "Not found",
          message: "Opening not found",
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: "Opening deleted successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Delete opening error:", error);
      res.status(500).json({
        success: false,
        error: "Opening deletion failed",
        message:
          error instanceof Error ? error.message : "An error occurred while deleting the opening",
      } as ApiResponse);
    }
  }
}

