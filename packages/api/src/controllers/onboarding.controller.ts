import { Request, Response } from "express";
import { OnboardingService } from "../services/onboarding.service";
import { ProviderService } from "../services/provider.service";
import { OrganizationService } from "../services/organization.service";
import { storageService } from "../services/storage.service";
import { ApiResponse } from "../types/common";
import { AuthenticatedRequest } from "../types/auth";
import { UserRole } from "@carelink/types";
import { validationResult } from "express-validator";
import multer from "multer";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: any, file: any, cb: any) => {
    // Allow only specific file types
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPEG, PNG, and PDF files are allowed."
        )
      );
    }
  },
});

export class OnboardingController {
  private onboardingService: OnboardingService;
  private providerService: ProviderService;
  private organizationService: OrganizationService;

  constructor() {
    this.onboardingService = new OnboardingService();
    this.providerService = new ProviderService();
    this.organizationService = new OrganizationService();

    // Bind methods
    this.getOnboardingState = this.getOnboardingState.bind(this);
    this.updateOnboardingStep = this.updateOnboardingStep.bind(this);
    this.uploadDocument = this.uploadDocument.bind(this);
    this.completeOnboarding = this.completeOnboarding.bind(this);
    this.reviewOnboarding = this.reviewOnboarding.bind(this);
    this.getPendingReviews = this.getPendingReviews.bind(this);
    this.resetOnboarding = this.resetOnboarding.bind(this);
  }

  /**
   * Get onboarding state for current provider
   */
  async getOnboardingState(req: Request, res: Response): Promise<void> {
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

      // Check if user is a provider role
      const isProviderRole =
        user.role === UserRole.PROVIDER_OWNER ||
        user.role === UserRole.PROVIDER_STAFF;

      if (!isProviderRole) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "Only providers can access onboarding",
        } as ApiResponse);
        return;
      }

      // Get provider ID from user
      // Organization and Provider are created during registration, so they should always exist
      const provider = await this.providerService.getProviderByUserId(user.id);

      if (!provider) {
        res.status(404).json({
          success: false,
          error: "Provider not found",
          message: "Provider profile not found. Please contact support.",
        } as ApiResponse);
        return;
      }

      const onboardingState = await this.onboardingService.getOnboardingState(
        provider.id
      );

      res.status(200).json({
        success: true,
        data: onboardingState,
        message: "Onboarding state retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get onboarding state error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: "Failed to get onboarding state",
      } as ApiResponse);
    }
  }

  /**
   * Update onboarding step data
   */
  async updateOnboardingStep(req: Request, res: Response): Promise<void> {
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

      const { step, data, isComplete = false } = req.body;

      // Validate step number
      if (typeof step !== "number" || step < 0 || step > 4) {
        res.status(400).json({
          success: false,
          error: "Invalid step",
          message: "Step must be a number between 0 and 4",
        } as ApiResponse);
        return;
      }

      // Get provider ID from user
      // Organization and Provider are created during registration, so they should always exist
      const provider = await this.providerService.getProviderByUserId(user.id);

      if (!provider) {
        res.status(404).json({
          success: false,
          error: "Provider not found",
          message: "Provider profile not found. Please contact support.",
        } as ApiResponse);
        return;
      }

      // Update onboarding step
      const updatedState = await this.onboardingService.updateOnboardingStep(
        provider.id,
        {
          step,
          data,
          isComplete,
        }
      );

      // If this is step 0 (organization setup), update the organization
      if (step === 0 && data && user.organizationId) {
        try {
          const organizationData = data as any;
          await this.organizationService.updateOrganization(
            user.organizationId,
            {
              name: organizationData.name,
              type: organizationData.type,
              email: organizationData.email,
              phone: organizationData.phone,
              addressLine1: organizationData.addressLine1,
              addressLine2: organizationData.addressLine2,
              city: organizationData.city,
              state: organizationData.state,
              zipCode: organizationData.zipCode,
              county: organizationData.county,
              ein: organizationData.ein || undefined, // Use undefined instead of empty string
              npi: organizationData.npi || undefined,
              website: organizationData.website,
              fax: organizationData.fax,
            }
          );
        } catch (orgError: any) {
          console.error("Error updating organization:", orgError);

          // Handle unique constraint violation (e.g., duplicate EIN)
          if (orgError.code === "P2002") {
            const field = orgError.meta?.target?.[0] || "field";
            res.status(400).json({
              success: false,
              error: "Duplicate entry",
              message: `An organization with this ${field} already exists. Please use a different ${field} or contact support.`,
            } as ApiResponse);
            return;
          }

          // Don't fail the whole request for other errors, but log them
        }
      }

      res.status(200).json({
        success: true,
        data: updatedState,
        message: "Onboarding step updated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Update onboarding step error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: "Failed to update onboarding step",
      } as ApiResponse);
    }
  }

  /**
   * Upload document (license, etc.)
   */
  async uploadDocument(req: Request, res: Response): Promise<void> {
    try {
      const uploadSingle = upload.single("document");

      uploadSingle(req, res, async (err) => {
        if (err) {
          console.error("File upload error:", err);
          res.status(400).json({
            success: false,
            error: "File upload failed",
            message: err.message,
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

        if (!req.file) {
          res.status(400).json({
            success: false,
            error: "No file uploaded",
            message: "Please select a file to upload",
          } as ApiResponse);
          return;
        }

        const { documentType = "license" } = req.body;

        // Get provider ID from user
        const provider = await this.providerService.getProviderByUserId(
          user.id
        );
        if (!provider) {
          res.status(404).json({
            success: false,
            error: "Provider not found",
            message: "No provider profile found for this user",
          } as ApiResponse);
          return;
        }

        // Upload file to Supabase
        const uploadResult = await storageService.uploadFile(
          req.file.buffer,
          req.file.originalname,
          {
            folder: `providers/${provider.id}/${documentType}s`,
            allowedTypes: [
              "image/jpeg",
              "image/png",
              "image/jpg",
              "application/pdf",
            ],
            maxFileSize: 10 * 1024 * 1024, // 10MB
          }
        );

        if (!uploadResult.success) {
          res.status(400).json({
            success: false,
            error: "File upload failed",
            message: uploadResult.error,
          } as ApiResponse);
          return;
        }

        res.status(200).json({
          success: true,
          data: {
            url: uploadResult.url,
            fileName: uploadResult.fileName,
            fileSize: uploadResult.fileSize,
            documentType,
          },
          message: "Document uploaded successfully",
        } as ApiResponse);
      });
    } catch (error) {
      console.error("Upload document error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: "Failed to upload document",
      } as ApiResponse);
    }
  }

  /**
   * Complete onboarding process
   */
  async completeOnboarding(req: Request, res: Response): Promise<void> {
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

      // Get provider ID from user
      const provider = await this.providerService.getProviderByUserId(user.id);
      if (!provider) {
        res.status(404).json({
          success: false,
          error: "Provider not found",
          message: "No provider profile found for this user",
        } as ApiResponse);
        return;
      }

      // Complete onboarding
      const completedState = await this.onboardingService.completeOnboarding(
        provider.id
      );

      res.status(200).json({
        success: true,
        data: completedState,
        message:
          "Onboarding completed successfully. Your application is now under review.",
      } as ApiResponse);
    } catch (error) {
      console.error("Complete onboarding error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: "Failed to complete onboarding",
      } as ApiResponse);
    }
  }

  /**
   * Admin: Review onboarding application
   */
  async reviewOnboarding(req: Request, res: Response): Promise<void> {
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

      // Check admin permissions
      if (
        ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(user.role as UserRole)
      ) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "Only administrators can review onboarding applications",
        } as ApiResponse);
        return;
      }

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

      const { providerId } = req.params;
      const { status, notes } = req.body;

      const reviewedState = await this.onboardingService.reviewOnboarding(
        providerId,
        {
          status,
          reviewedBy: user.id,
          notes,
        }
      );

      res.status(200).json({
        success: true,
        data: reviewedState,
        message: "Onboarding review completed successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Review onboarding error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: "Failed to review onboarding",
      } as ApiResponse);
    }
  }

  /**
   * Admin: Get pending onboarding reviews
   */
  async getPendingReviews(req: Request, res: Response): Promise<void> {
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

      // Check admin permissions
      if (
        ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(user.role as UserRole)
      ) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "Only administrators can view pending reviews",
        } as ApiResponse);
        return;
      }

      const pendingReviews = await this.onboardingService.getPendingReviews();

      res.status(200).json({
        success: true,
        data: pendingReviews,
        message: "Pending reviews retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get pending reviews error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: "Failed to get pending reviews",
      } as ApiResponse);
    }
  }

  /**
   * Admin: Reset onboarding (for changes needed)
   */
  async resetOnboarding(req: Request, res: Response): Promise<void> {
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

      // Check admin permissions
      if (
        ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(user.role as UserRole)
      ) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "Only administrators can reset onboarding",
        } as ApiResponse);
        return;
      }

      const { providerId } = req.params;

      const resetState =
        await this.onboardingService.resetOnboarding(providerId);

      res.status(200).json({
        success: true,
        data: resetState,
        message: "Onboarding reset successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Reset onboarding error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: "Failed to reset onboarding",
      } as ApiResponse);
    }
  }
}
