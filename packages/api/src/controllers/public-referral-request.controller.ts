import { Request, Response } from "express";
import { PublicReferralRequestService } from "../services/public-referral-request.service";
import { ApiResponse } from "../types/common";
import { validationResult } from "express-validator";
import { AuthenticatedRequest } from "../types/auth";
import { UserRole } from "@carelink/types";
import { RequestStatus } from "@prisma/client";

export class PublicReferralRequestController {
  private service: PublicReferralRequestService;

  constructor() {
    this.service = new PublicReferralRequestService();

    // Bind methods
    this.createRequest = this.createRequest.bind(this);
    this.getRequests = this.getRequests.bind(this);
    this.getRequest = this.getRequest.bind(this);
    this.updateRequest = this.updateRequest.bind(this);
    this.cancelRequest = this.cancelRequest.bind(this);
    this.getStats = this.getStats.bind(this);
  }

  // Create a new referral request
  async createRequest(req: Request, res: Response): Promise<void> {
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

      // Only PUBLIC role can create requests
      if (user.role !== UserRole.PUBLIC) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "Only family members can create referral requests",
        } as ApiResponse);
        return;
      }

      const request = await this.service.createRequest(req.body, user.id);

      res.status(201).json({
        success: true,
        data: request,
        message: "Referral request created successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Create request error:", error);
      res.status(500).json({
        success: false,
        error: "Request creation failed",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while creating the request",
      } as ApiResponse);
    }
  }

  // Get all requests for the authenticated user
  async getRequests(req: Request, res: Response): Promise<void> {
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

      const { status, page, limit } = req.query;

      const result = await this.service.getRequestsByUser(user.id, {
        status: status as RequestStatus,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: "Requests retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get requests error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve requests",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while retrieving requests",
      } as ApiResponse);
    }
  }

  // Get a single request by ID
  async getRequest(req: Request, res: Response): Promise<void> {
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

      const request = await this.service.getRequestById(id, user.id);

      res.status(200).json({
        success: true,
        data: request,
        message: "Request retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get request error:", error);
      const statusCode =
        error instanceof Error && error.message === "Request not found"
          ? 404
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Failed to retrieve request",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while retrieving the request",
      } as ApiResponse);
    }
  }

  // Update a request
  async updateRequest(req: Request, res: Response): Promise<void> {
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

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const request = await this.service.updateRequest(id, req.body, user.id);

      res.status(200).json({
        success: true,
        data: request,
        message: "Request updated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Update request error:", error);
      const statusCode =
        error instanceof Error && error.message === "Request not found"
          ? 404
          : error instanceof Error &&
              error.message === "Cannot update request in current status"
            ? 400
            : 500;
      res.status(statusCode).json({
        success: false,
        error: "Request update failed",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while updating the request",
      } as ApiResponse);
    }
  }

  // Cancel a request
  async cancelRequest(req: Request, res: Response): Promise<void> {
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

      await this.service.cancelRequest(id, user.id);

      res.status(200).json({
        success: true,
        data: null,
        message: "Request cancelled successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Cancel request error:", error);
      const statusCode =
        error instanceof Error && error.message === "Request not found"
          ? 404
          : error instanceof Error &&
              error.message === "Cannot cancel a converted request"
            ? 400
            : 500;
      res.status(statusCode).json({
        success: false,
        error: "Request cancellation failed",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while cancelling the request",
      } as ApiResponse);
    }
  }

  // Get request statistics
  async getStats(req: Request, res: Response): Promise<void> {
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

      const stats = await this.service.getRequestStats(user.id);

      res.status(200).json({
        success: true,
        data: stats,
        message: "Statistics retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get stats error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve statistics",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while retrieving statistics",
      } as ApiResponse);
    }
  }
}
