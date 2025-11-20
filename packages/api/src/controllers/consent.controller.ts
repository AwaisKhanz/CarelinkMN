import { Request, Response } from "express";
import { ConsentService } from "../services/consent.service";
import { ApiResponse, AuthenticatedRequest } from "../types";
import { CreateConsentData, UpdateConsentData } from "@carelink/types";

export class ConsentController {
  private consentService: ConsentService;

  constructor() {
    this.consentService = new ConsentService();
  }

  /**
   * Create consent
   */
  createConsent = async (req: Request, res: Response): Promise<void> => {
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

      const { dischargeCaseId } = req.params;
      const data = req.body as Omit<CreateConsentData, "userId" | "dischargeCaseId">;
      // Ensure userId matches authenticated user and set dischargeCaseId from params
      const consentData: CreateConsentData = {
        ...data,
        userId: user.id,
        dischargeCaseId,
      };

      const consent = await this.consentService.createConsent(user.id, consentData);

      res.status(201).json({
        success: true,
        data: consent,
        message: "Consent created successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Create consent error:", error);
      const statusCode =
        error instanceof Error &&
        (error.message.includes("not found") ||
          error.message.includes("Access denied") ||
          error.message.includes("already exists"))
          ? 400
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Failed to create consent",
        message:
          error instanceof Error ? error.message : "An error occurred while creating consent",
      } as ApiResponse);
    }
  };

  /**
   * Get consent by discharge case ID
   */
  getConsentByDischargeCaseId = async (req: Request, res: Response): Promise<void> => {
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

      const { dischargeCaseId } = req.params;
      const consent = await this.consentService.getConsentByDischargeCaseId(
        dischargeCaseId,
        user.id
      );

      if (!consent) {
        res.status(404).json({
          success: false,
          error: "Not Found",
          message: "Consent not found",
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: consent,
      } as ApiResponse);
    } catch (error) {
      console.error("Get consent error:", error);
      const statusCode =
        error instanceof Error && error.message.includes("Access denied")
          ? 403
          : error instanceof Error && error.message.includes("not found")
          ? 404
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Failed to get consent",
        message:
          error instanceof Error ? error.message : "An error occurred while getting consent",
      } as ApiResponse);
    }
  };

  /**
   * Update consent
   */
  updateConsent = async (req: Request, res: Response): Promise<void> => {
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
      const data = req.body as UpdateConsentData;
      const consent = await this.consentService.updateConsent(id, user.id, data);

      res.status(200).json({
        success: true,
        data: consent,
        message: "Consent updated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Update consent error:", error);
      const statusCode =
        error instanceof Error &&
        (error.message.includes("not found") || error.message.includes("Access denied"))
          ? 400
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Failed to update consent",
        message:
          error instanceof Error ? error.message : "An error occurred while updating consent",
      } as ApiResponse);
    }
  };
}

