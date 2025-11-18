import { Request, Response } from "express";
import { PlacementService } from "../services/placement.service";
import { body, param, query, validationResult } from "express-validator";
import { PlacementStatus } from "@prisma/client";
import { ApiResponse } from "@carelink/types";
import { AuthenticatedRequest } from "../types/auth";

export class PlacementController {
  private placementService: PlacementService;

  constructor() {
    this.placementService = new PlacementService();
  }

  async createPlacement(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          message: errors.array()[0].msg,
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

      const {
        openingId,
        referralId,
        dischargeCaseId,
        placementDate,
        moveInDate,
      } = req.body;

      const placement = await this.placementService.createPlacement(
        {
          openingId,
          referralId,
          dischargeCaseId,
          placementDate,
          moveInDate,
        },
        user.id
      );

      res.status(201).json({
        success: true,
        data: placement,
        message: "Placement created successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Create placement error:", error);
      res.status(500).json({
        success: false,
        error: "Placement creation failed",
        message:
          error instanceof Error ? error.message : "An error occurred while creating placement",
      } as ApiResponse);
    }
  }

  async getPlacements(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          message: errors.array()[0].msg,
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

      const {
        providerId,
        openingId,
        referralId,
        dischargeCaseId,
        status,
        page = 1,
        limit = 20,
        search,
      } = req.query;

      const filters = {
        providerId: providerId as string,
        openingId: openingId as string,
        referralId: referralId as string,
        dischargeCaseId: dischargeCaseId as string,
        status: status as PlacementStatus | undefined,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string,
      };

      const result = await this.placementService.getPlacements(filters, user.id);

      res.status(200).json({
        success: true,
        data: result,
        message: "Placements retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get placements error:", error);
      res.status(500).json({
        success: false,
        error: "Placement retrieval failed",
        message:
          error instanceof Error ? error.message : "An error occurred while retrieving placements",
      } as ApiResponse);
    }
  }

  async getPlacementById(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          message: errors.array()[0].msg,
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

      const { placementId } = req.params;

      const placement = await this.placementService.getPlacementById(placementId, user.id);

      res.status(200).json({
        success: true,
        data: placement,
        message: "Placement retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get placement by ID error:", error);
      const statusCode =
        error instanceof Error && error.message === "Access denied"
          ? 403
          : error instanceof Error && error.message === "Placement not found"
          ? 404
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Placement retrieval failed",
        message:
          error instanceof Error ? error.message : "An error occurred while retrieving placement",
      } as ApiResponse);
    }
  }

  async updatePlacement(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          message: errors.array()[0].msg,
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

      const { placementId } = req.params;
      const { status, placementDate, moveInDate } = req.body;

      const placement = await this.placementService.updatePlacement(
        placementId,
        {
          status,
          placementDate,
          moveInDate,
        },
        user.id
      );

      res.status(200).json({
        success: true,
        data: placement,
        message: "Placement updated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Update placement error:", error);
      const statusCode =
        error instanceof Error && error.message === "Access denied"
          ? 403
          : error instanceof Error && error.message === "Placement not found"
          ? 404
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Placement update failed",
        message:
          error instanceof Error ? error.message : "An error occurred while updating placement",
      } as ApiResponse);
    }
  }

  async updatePlacementStatus(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          message: errors.array()[0].msg,
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

      const { placementId } = req.params;
      const { status } = req.body;

      const placement = await this.placementService.updatePlacement(
        placementId,
        { status },
        user.id
      );

      res.status(200).json({
        success: true,
        data: placement,
        message: "Placement status updated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Update placement status error:", error);
      const statusCode =
        error instanceof Error && error.message === "Access denied"
          ? 403
          : error instanceof Error && error.message === "Placement not found"
          ? 404
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Placement status update failed",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while updating placement status",
      } as ApiResponse);
    }
  }

  async cancelPlacement(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          message: errors.array()[0].msg,
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

      const { placementId } = req.params;
      const { reason } = req.body;

      const placement = await this.placementService.cancelPlacement(placementId, user.id, reason);

      res.status(200).json({
        success: true,
        data: placement,
        message: "Placement cancelled successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Cancel placement error:", error);
      const statusCode =
        error instanceof Error && error.message === "Access denied"
          ? 403
          : error instanceof Error && error.message === "Placement not found"
          ? 404
          : error instanceof Error && error.message.includes("already cancelled")
          ? 400
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Placement cancellation failed",
        message:
          error instanceof Error ? error.message : "An error occurred while cancelling placement",
      } as ApiResponse);
    }
  }

  async generatePacket(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          message: errors.array()[0].msg,
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

      const { placementId } = req.params;

      const result = await this.placementService.generatePacket(placementId, user.id);

      res.status(200).json({
        success: true,
        data: result,
        message: "Placement packet generated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Generate packet error:", error);
      const statusCode =
        error instanceof Error && error.message === "Access denied"
          ? 403
          : error instanceof Error && error.message === "Placement not found"
          ? 404
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Packet generation failed",
        message:
          error instanceof Error ? error.message : "An error occurred while generating packet",
      } as ApiResponse);
    }
  }

  async getPacketAccessLogs(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          message: errors.array()[0].msg,
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

      const { placementId } = req.params;

      const logs = await this.placementService.getPacketAccessLogs(
        placementId,
        user.id
      );

      res.status(200).json({
        success: true,
        data: logs,
        message: "Packet access logs retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get packet access logs error:", error);
      const statusCode =
        error instanceof Error && error.message === "Access denied"
          ? 403
          : error instanceof Error && error.message === "Placement not found"
          ? 404
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Failed to retrieve packet access logs",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while retrieving packet access logs",
      } as ApiResponse);
    }
  }
}

