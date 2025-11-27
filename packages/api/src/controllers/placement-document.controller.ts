import { Request, Response } from "express";
import { PlacementDocumentService } from "../services/placement-document.service";
import { ApiResponse, AuthenticatedRequest } from "../types";
import { validationResult } from "express-validator";
import { DocumentCategory } from "@prisma/client";

export class PlacementDocumentController {
  private documentService: PlacementDocumentService;

  constructor() {
    this.documentService = new PlacementDocumentService();
  }

  /**
   * Upload a document
   * POST /api/placements/:placementId/documents
   */
  async uploadDocument(req: Request, res: Response): Promise<void> {
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

      // File upload data should come from multer middleware
      // For now, we'll accept it from body (in production, use multer)
      const document = await this.documentService.uploadDocument(
        placementId,
        req.body,
        user.id
      );

      res.status(201).json({
        success: true,
        data: document,
        message: "Document uploaded successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Upload document error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to upload document",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while uploading the document",
      } as ApiResponse);
    }
  }

  /**
   * Get documents for a placement
   * GET /api/placements/:placementId/documents
   */
  async getDocuments(req: Request, res: Response): Promise<void> {
    try {
      const { placementId } = req.params;
      const { category } = req.query;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      let documents;
      if (category && typeof category === "string") {
        documents = await this.documentService.getDocumentsByCategory(
          placementId,
          category as DocumentCategory,
          user.id
        );
      } else {
        documents = await this.documentService.getDocuments(placementId, user.id);
      }

      res.status(200).json({
        success: true,
        data: documents,
        message: "Documents retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get documents error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve documents",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while retrieving documents",
      } as ApiResponse);
    }
  }

  /**
   * Get a single document
   * GET /api/documents/:documentId
   */
  async getDocumentById(req: Request, res: Response): Promise<void> {
    try {
      const { documentId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const document = await this.documentService.getDocumentById(
        documentId,
        user.id
      );

      res.status(200).json({
        success: true,
        data: document,
        message: "Document retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get document error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve document",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while retrieving the document",
      } as ApiResponse);
    }
  }

  /**
   * Delete a document
   * DELETE /api/documents/:documentId
   */
  async deleteDocument(req: Request, res: Response): Promise<void> {
    try {
      const { documentId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      await this.documentService.deleteDocument(documentId, user.id);

      res.status(200).json({
        success: true,
        message: "Document deleted successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Delete document error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete document",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while deleting the document",
      } as ApiResponse);
    }
  }

  /**
   * Get expiring documents
   * GET /api/placements/:placementId/documents/expiring
   */
  async getExpiringDocuments(req: Request, res: Response): Promise<void> {
    try {
      const { placementId } = req.params;
      const { days = "30" } = req.query;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const daysAhead = parseInt(days as string, 10);
      const documents = await this.documentService.getExpiringDocuments(
        placementId,
        daysAhead,
        user.id
      );

      res.status(200).json({
        success: true,
        data: documents,
        message: "Expiring documents retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get expiring documents error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve expiring documents",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while retrieving expiring documents",
      } as ApiResponse);
    }
  }
}
