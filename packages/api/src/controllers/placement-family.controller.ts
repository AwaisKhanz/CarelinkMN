import { Request, Response } from "express";
import { PlacementFamilyService } from "../services/placement-family.service";
import { ApiResponse, AuthenticatedRequest } from "../types";
import { validationResult } from "express-validator";
import { UpdateCategory } from "@prisma/client";

export class PlacementFamilyController {
  private familyService: PlacementFamilyService;

  constructor() {
    this.familyService = new PlacementFamilyService();
  }

  /**
   * Add a family contact
   * POST /api/placements/:placementId/family-contacts
   */
  async addFamilyContact(req: Request, res: Response): Promise<void> {
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

      const contact = await this.familyService.addFamilyContact(
        placementId,
        req.body,
        user.id
      );

      res.status(201).json({
        success: true,
        data: contact,
        message: "Family contact added successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Add family contact error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to add family contact",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while adding the family contact",
      } as ApiResponse);
    }
  }

  /**
   * Get family contacts for a placement
   * GET /api/placements/:placementId/family-contacts
   */
  async getFamilyContacts(req: Request, res: Response): Promise<void> {
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

      const contacts = await this.familyService.getFamilyContacts(
        placementId,
        user.id
      );

      res.status(200).json({
        success: true,
        data: contacts,
        message: "Family contacts retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get family contacts error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve family contacts",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while retrieving family contacts",
      } as ApiResponse);
    }
  }

  /**
   * Update a family contact
   * PATCH /api/family-contacts/:contactId
   */
  async updateFamilyContact(req: Request, res: Response): Promise<void> {
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

      const { contactId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const contact = await this.familyService.updateFamilyContact(
        contactId,
        req.body,
        user.id
      );

      res.status(200).json({
        success: true,
        data: contact,
        message: "Family contact updated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Update family contact error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update family contact",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while updating the family contact",
      } as ApiResponse);
    }
  }

  /**
   * Delete a family contact
   * DELETE /api/family-contacts/:contactId
   */
  async deleteFamilyContact(req: Request, res: Response): Promise<void> {
    try {
      const { contactId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      await this.familyService.deleteFamilyContact(contactId, user.id);

      res.status(200).json({
        success: true,
        message: "Family contact deleted successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Delete family contact error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete family contact",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while deleting the family contact",
      } as ApiResponse);
    }
  }

  /**
   * Create an update
   * POST /api/placements/:placementId/updates
   */
  async createUpdate(req: Request, res: Response): Promise<void> {
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

      const update = await this.familyService.createUpdate(
        placementId,
        req.body,
        user.id
      );

      res.status(201).json({
        success: true,
        data: update,
        message: "Update created successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Create update error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create update",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while creating the update",
      } as ApiResponse);
    }
  }

  /**
   * Get updates for a placement
   * GET /api/placements/:placementId/updates
   */
  async getUpdates(req: Request, res: Response): Promise<void> {
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

      const updates = await this.familyService.getUpdates(placementId, user.id);

      res.status(200).json({
        success: true,
        data: updates,
        message: "Updates retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get updates error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve updates",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while retrieving updates",
      } as ApiResponse);
    }
  }

  /**
   * Delete an update
   * DELETE /api/updates/:updateId
   */
  async deleteUpdate(req: Request, res: Response): Promise<void> {
    try {
      const { updateId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      await this.familyService.deleteUpdate(updateId, user.id);

      res.status(200).json({
        success: true,
        message: "Update deleted successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Delete update error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete update",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while deleting the update",
      } as ApiResponse);
    }
  }
}
