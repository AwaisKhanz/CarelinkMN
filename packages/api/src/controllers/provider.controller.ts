import { Request, Response } from "express";
import { ProviderService } from "../services/provider.service";
import { LicenseService } from "../services/license.service";
import { ApiResponse } from "../types/common";
import { validationResult } from "express-validator";
import { AuthenticatedRequest } from "../types/auth";
import { UserRole } from "@carelink/types";

export class ProviderController {
  private providerService: ProviderService;
  private licenseService: LicenseService;

  constructor() {
    this.providerService = new ProviderService();
    this.licenseService = new LicenseService();

    // Bind methods to preserve 'this' context
    this.createProvider = this.createProvider.bind(this);
    this.getProvider = this.getProvider.bind(this);
    this.updateProvider = this.updateProvider.bind(this);
    this.getProviderProfile = this.getProviderProfile.bind(this);
    this.updateProviderProfile = this.updateProviderProfile.bind(this);
    this.uploadLicense = this.uploadLicense.bind(this);
    this.verifyLicense = this.verifyLicense.bind(this);
    this.getProviderLicenses = this.getProviderLicenses.bind(this);
    this.updateLicense = this.updateLicense.bind(this);
    this.deleteLicense = this.deleteLicense.bind(this);
    this.getProviderByUserId = this.getProviderByUserId.bind(this);
    this.getProviderByOrganizationId =
      this.getProviderByOrganizationId.bind(this);
    this.getProviderReferrals = this.getProviderReferrals.bind(this);
    this.getProviderServices = this.getProviderServices.bind(this);
    this.updateProviderServices = this.updateProviderServices.bind(this);
    this.getOrganizationStaff = this.getOrganizationStaff.bind(this);
    this.inviteStaff = this.inviteStaff.bind(this);
    this.removeStaff = this.removeStaff.bind(this);
    this.resendStaffInvite = this.resendStaffInvite.bind(this);
    this.getProviderStats = this.getProviderStats.bind(this);
    this.respondToReferral = this.respondToReferral.bind(this);
  }

  // Create new provider
  async createProvider(req: Request, res: Response): Promise<void> {
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

      const {
        organizationId,
        primaryLicenseType,
        description,
        logo,
        coverImage,
        acceptsReferrals = true,
        responseTimeHours,
      } = req.body;

      const providerData = {
        organizationId,
        primaryLicenseType,
        description,
        logo,
        coverImage,
        acceptsReferrals,
        responseTimeHours,
      };

      const result = await this.providerService.createProvider(providerData);

      res.status(201).json({
        success: true,
        data: result,
        message: "Provider created successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Create provider error:", error);
      res.status(500).json({
        success: false,
        error: "Provider creation failed",
        message: "An error occurred while creating the provider",
      } as ApiResponse);
    }
  }

  // Get provider by ID
  async getProvider(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        includeHomes = false,
        includeServices = false,
        includeOpenings = false,
      } = req.query;

      const provider = await this.providerService.getProvider(id, {
        includeHomes: includeHomes === "true",
        includeServices: includeServices === "true",
        includeOpenings: includeOpenings === "true",
      });

      if (!provider) {
        res.status(404).json({
          success: false,
          error: "Provider not found",
          message: "The requested provider could not be found",
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: provider,
        message: "Provider retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get provider error:", error);
      res.status(500).json({
        success: false,
        error: "Provider retrieval failed",
        message: "An error occurred while retrieving the provider",
      } as ApiResponse);
    }
  }

  // Update provider
  async updateProvider(req: Request, res: Response): Promise<void> {
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

      // Only PROVIDER_OWNER can update provider
      if (user.role !== UserRole.PROVIDER_OWNER) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "Only provider owners can update provider settings",
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

      const updateData = req.body;
      const result = await this.providerService.updateProvider(
        id,
        updateData,
        user.id
      );

      res.status(200).json({
        success: true,
        data: result,
        message: "Provider updated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Update provider error:", error);
      res.status(500).json({
        success: false,
        error: "Provider update failed",
        message: "An error occurred while updating the provider",
      } as ApiResponse);
    }
  }

  // Get provider public profile
  async getProviderProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const profile = await this.providerService.getProviderPublicProfile(id);

      if (!profile) {
        res.status(404).json({
          success: false,
          error: "Provider profile not found",
          message: "The requested provider profile could not be found",
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: profile,
        message: "Provider profile retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get provider profile error:", error);
      res.status(500).json({
        success: false,
        error: "Profile retrieval failed",
        message: "An error occurred while retrieving the provider profile",
      } as ApiResponse);
    }
  }

  // Update provider profile
  async updateProviderProfile(req: Request, res: Response): Promise<void> {
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

      // Only PROVIDER_OWNER can update provider profile
      if (user.role !== UserRole.PROVIDER_OWNER) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "Only provider owners can update provider profile",
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

      const profileData = req.body;
      const result = await this.providerService.updateProviderProfile(
        id,
        profileData,
        user.id
      );

      res.status(200).json({
        success: true,
        data: result,
        message: "Provider profile updated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Update provider profile error:", error);
      res.status(500).json({
        success: false,
        error: "Profile update failed",
        message: "An error occurred while updating the provider profile",
      } as ApiResponse);
    }
  }

  // Upload license document
  async uploadLicense(req: Request, res: Response): Promise<void> {
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

      // Only PROVIDER_OWNER can upload licenses
      if (user.role !== UserRole.PROVIDER_OWNER) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "Only provider owners can upload licenses",
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

      const {
        licenseType,
        licenseNumber,
        issueDate,
        expirationDate,
        documentUrl,
      } = req.body;

      const licenseData = {
        licenseType,
        licenseNumber,
        issueDate: new Date(issueDate),
        expirationDate: new Date(expirationDate),
        documentUrl: documentUrl,
      };

      const result = await this.licenseService.createLicense(
        providerId,
        licenseData,
        user.id
      );

      res.status(201).json({
        success: true,
        data: result,
        message: "License uploaded successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Upload license error:", error);
      res.status(500).json({
        success: false,
        error: "License upload failed",
        message: "An error occurred while uploading the license",
      } as ApiResponse);
    }
  }

  // Verify license
  async verifyLicense(req: Request, res: Response): Promise<void> {
    try {
      const { licenseId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      // Only admins can verify licenses
      if (
        ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(user.role as UserRole)
      ) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "Only administrators can verify licenses",
        } as ApiResponse);
        return;
      }

      const { status, verificationNotes } = req.body;

      const result = await this.licenseService.verifyLicense(licenseId, {
        status,
        verificationNotes,
        verifiedBy: user.id,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: "License verification updated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Verify license error:", error);
      res.status(500).json({
        success: false,
        error: "License verification failed",
        message: "An error occurred while verifying the license",
      } as ApiResponse);
    }
  }

  // Get provider licenses
  async getProviderLicenses(req: Request, res: Response): Promise<void> {
    try {
      const { providerId } = req.params;
      const { status } = req.query;

      const licenses = await this.licenseService.getProviderLicenses(
        providerId,
        {
          status: status as string,
        }
      );

      res.status(200).json({
        success: true,
        data: licenses,
        message: "Provider licenses retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get provider licenses error:", error);
      res.status(500).json({
        success: false,
        error: "License retrieval failed",
        message: "An error occurred while retrieving the licenses",
      } as ApiResponse);
    }
  }

  // Update license
  async updateLicense(req: Request, res: Response): Promise<void> {
    try {
      const { licenseId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      // Only PROVIDER_OWNER can update licenses
      if (user.role !== UserRole.PROVIDER_OWNER) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "Only provider owners can update licenses",
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

      // Verify license exists and user has access
      const license = await this.licenseService.getLicense(licenseId);
      if (!license) {
        res.status(404).json({
          success: false,
          error: "License not found",
          message: "License not found",
        } as ApiResponse);
        return;
      }

      // Verify user has access to this provider
      const hasAccess = await this.providerService.verifyProviderAccess(
        user.id,
        license.providerId
      );
      if (!hasAccess) {
        res.status(403).json({
          success: false,
          error: "Access denied",
          message: "You do not have access to this license",
        } as ApiResponse);
        return;
      }

      const {
        licenseType,
        licenseNumber,
        issueDate,
        expirationDate,
        documentUrl,
      } = req.body;

      const updateData: any = {};
      if (licenseType) updateData.licenseType = licenseType;
      if (licenseNumber) updateData.licenseNumber = licenseNumber;
      if (issueDate) updateData.issueDate = new Date(issueDate);
      if (expirationDate) updateData.expirationDate = new Date(expirationDate);
      if (documentUrl) updateData.documentUrl = documentUrl;

      const result = await this.licenseService.updateLicense(
        licenseId,
        updateData,
        user.id
      );

      res.status(200).json({
        success: true,
        data: result,
        message: "License updated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Update license error:", error);
      const statusCode =
        error instanceof Error && error.message === "License not found"
          ? 404
          : error instanceof Error && error.message === "Access denied"
            ? 403
            : 500;
      res.status(statusCode).json({
        success: false,
        error: "License update failed",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while updating the license",
      } as ApiResponse);
    }
  }

  // Delete license
  async deleteLicense(req: Request, res: Response): Promise<void> {
    try {
      const { licenseId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      // Only PROVIDER_OWNER can delete licenses
      if (user.role !== UserRole.PROVIDER_OWNER) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "Only provider owners can delete licenses",
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

      await this.licenseService.deleteLicense(licenseId, user.id);

      res.status(200).json({
        success: true,
        message: "License deleted successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Delete license error:", error);
      const statusCode =
        error instanceof Error && error.message === "License not found"
          ? 404
          : error instanceof Error && error.message === "Access denied"
            ? 403
            : 500;
      res.status(statusCode).json({
        success: false,
        error: "License deletion failed",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while deleting the license",
      } as ApiResponse);
    }
  }

  // Get provider by user ID
  async getProviderByUserId(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      // Users can only access their own provider profile
      if (user.id !== userId) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "You can only access your own provider profile",
        } as ApiResponse);
        return;
      }

      const provider = await this.providerService.getProviderByUserId(userId);

      if (!provider) {
        res.status(404).json({
          success: false,
          error: "Provider not found",
          message: "No provider profile found for this user",
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: provider,
        message: "Provider profile retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get provider by user ID error:", error);
      res.status(500).json({
        success: false,
        error: "Provider retrieval failed",
        message: "An error occurred while retrieving the provider profile",
      } as ApiResponse);
    }
  }

  // Get provider by organization ID
  async getProviderByOrganizationId(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { organizationId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      // Verify user belongs to this organization
      if (user.organizationId !== organizationId) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "You can only access providers for your own organization",
        } as ApiResponse);
        return;
      }

      const provider =
        await this.providerService.getProviderByOrganizationId(organizationId);

      if (!provider) {
        res.status(404).json({
          success: false,
          error: "Provider not found",
          message: "No provider profile found for this organization",
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: provider,
        message: "Provider profile retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get provider by organization ID error:", error);
      res.status(500).json({
        success: false,
        error: "Provider retrieval failed",
        message: "An error occurred while retrieving the provider profile",
      } as ApiResponse);
    }
  }

  // Get provider services
  async getProviderServices(req: Request, res: Response): Promise<void> {
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

      const services = await this.providerService.getProviderServices(
        providerId,
        user.id
      );

      res.status(200).json({
        success: true,
        data: services,
        message: "Provider services retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get provider services error:", error);
      res.status(500).json({
        success: false,
        error: "Service retrieval failed",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while retrieving provider services",
      } as ApiResponse);
    }
  }

  // Update provider services
  async updateProviderServices(req: Request, res: Response): Promise<void> {
    try {
      const { providerId } = req.params;
      const { serviceIds } = req.body;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      // Only PROVIDER_OWNER can update provider services
      if (user.role !== UserRole.PROVIDER_OWNER) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "Only provider owners can update provider services",
        } as ApiResponse);
        return;
      }

      if (!Array.isArray(serviceIds)) {
        res.status(400).json({
          success: false,
          error: "Invalid request",
          message: "serviceIds must be an array",
        } as ApiResponse);
        return;
      }

      const success = await this.providerService.updateProviderServices(
        providerId,
        serviceIds,
        user.id
      );

      if (!success) {
        res.status(404).json({
          success: false,
          error: "Provider not found",
          message: "Provider not found or you don't have access to it",
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: "Provider services updated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Update provider services error:", error);

      // Handle validation errors with 400 status (bad request)
      if (error instanceof Error) {
        const errorMessage = error.message;
        if (
          errorMessage.includes("not allowed by provider licenses") ||
          errorMessage.includes(
            "require licenses that your provider does not have"
          ) ||
          errorMessage.includes("invalid or inactive")
        ) {
          res.status(400).json({
            success: false,
            error: "Validation failed",
            message: errorMessage,
          } as ApiResponse);
          return;
        }
      }

      // Handle other errors with 500 status
      res.status(500).json({
        success: false,
        error: "Service update failed",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while updating provider services",
      } as ApiResponse);
    }
  }

  // Get provider referrals
  async getProviderReferrals(req: Request, res: Response): Promise<void> {
    try {
      const { providerId } = req.params;
      const { page = 1, limit = 10, status } = req.query;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      // Verify user has access to this provider
      const hasAccess = await this.providerService.verifyProviderAccess(
        user.id,
        providerId
      );
      if (!hasAccess) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "You do not have access to this provider's referrals",
        } as ApiResponse);
        return;
      }

      const result = await this.providerService.getProviderReferrals(
        providerId,
        {
          page: Number(page),
          limit: Number(limit),
          status: status as string | undefined,
        }
      );

      res.status(200).json({
        success: true,
        data: result,
        message: "Provider referrals retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get provider referrals error:", error);
      res.status(500).json({
        success: false,
        error: "Referral retrieval failed",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while retrieving provider referrals",
      } as ApiResponse);
    }
  }

  /**
   * Get all staff members for a provider's organization
   * GET /api/providers/:providerId/staff
   */
  async getOrganizationStaff(req: Request, res: Response): Promise<void> {
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

      const staff = await this.providerService.getOrganizationStaff(
        providerId,
        user.id
      );

      res.status(200).json({
        success: true,
        data: staff,
        message: "Staff members retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get organization staff error:", error);
      res.status(500).json({
        success: false,
        error: "Staff retrieval failed",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while retrieving staff members",
      } as ApiResponse);
    }
  }

  /**
   * Invite a new staff member
   * POST /api/providers/:providerId/staff
   */
  async inviteStaff(req: Request, res: Response): Promise<void> {
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

      const { providerId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;
      const { email, firstName, lastName, phone } = req.body;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      // Verify user is PROVIDER_OWNER
      if (user.role !== UserRole.PROVIDER_OWNER) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "Only provider owners can invite staff",
        } as ApiResponse);
        return;
      }

      const staff = await this.providerService.inviteStaff(
        providerId,
        user.id,
        {
          email,
          firstName,
          lastName,
          phone,
        }
      );

      res.status(201).json({
        success: true,
        data: staff,
        message: "Staff member invited successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Invite staff error:", error);
      const statusCode =
        error instanceof Error &&
        (error.message.includes("already exists") ||
          error.message.includes("Only provider owners") ||
          error.message.includes("Access denied"))
          ? 400
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Staff invitation failed",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while inviting staff member",
      } as ApiResponse);
    }
  }

  /**
   * Remove a staff member
   * DELETE /api/providers/:providerId/staff/:staffUserId
   */
  async removeStaff(req: Request, res: Response): Promise<void> {
    try {
      const { providerId, staffUserId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      // Verify user is PROVIDER_OWNER
      if (user.role !== UserRole.PROVIDER_OWNER) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "Only provider owners can remove staff",
        } as ApiResponse);
        return;
      }

      await this.providerService.removeStaff(providerId, user.id, staffUserId);

      res.status(200).json({
        success: true,
        message: "Staff member removed successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Remove staff error:", error);
      const statusCode =
        error instanceof Error &&
        (error.message.includes("Only provider owners") ||
          error.message.includes("Access denied") ||
          error.message.includes("not found"))
          ? 400
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Staff removal failed",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while removing staff member",
      } as ApiResponse);
    }
  }

  /**
   * Resend a staff invitation
   * POST /api/providers/:providerId/staff/:staffUserId/resend-invite
   */
  async resendStaffInvite(req: Request, res: Response): Promise<void> {
    try {
      const { providerId, staffUserId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      if (user.role !== UserRole.PROVIDER_OWNER) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "Only provider owners can resend invitations",
        } as ApiResponse);
        return;
      }

      await this.providerService.resendStaffInvite(
        providerId,
        user.id,
        staffUserId
      );

      res.status(200).json({
        success: true,
        message: "Invitation resent successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Resend staff invite error:", error);
      const statusCode =
        error instanceof Error &&
        (error.message.includes("Only provider owners") ||
          error.message.includes("Access denied") ||
          error.message.includes("already activated") ||
          error.message.includes("not found"))
          ? 400
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Resend invitation failed",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while resending the invitation",
      } as ApiResponse);
    }
  }

  /**
   * Get provider statistics
   * GET /api/providers/:providerId/stats
   */
  async getProviderStats(req: Request, res: Response): Promise<void> {
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

      // Verify user has access to this provider
      const hasAccess = await this.providerService.verifyProviderAccess(
        user.id,
        providerId
      );
      if (!hasAccess) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "You do not have access to this provider's statistics",
        } as ApiResponse);
        return;
      }

      const stats = await this.providerService.getProviderStats(providerId);

      res.status(200).json({
        success: true,
        data: stats,
        message: "Provider statistics retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get provider stats error:", error);
      res.status(500).json({
        success: false,
        error: "Statistics retrieval failed",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while retrieving provider statistics",
      } as ApiResponse);
    }
  }

  /**
   * Respond to a referral - Update provider's own shortlist status
   * POST /api/providers/:providerId/referrals/:referralId/respond
   */
  async respondToReferral(req: Request, res: Response): Promise<void> {
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

      const { providerId, referralId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const result = await this.providerService.respondToReferral(
        providerId,
        referralId,
        user.id,
        req.body
      );

      res.status(200).json({
        success: true,
        data: result,
        message: "Referral response updated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Respond to referral error:", error);
      const statusCode =
        error instanceof Error && error.message.includes("not found")
          ? 404
          : error instanceof Error && error.message.includes("Access denied")
          ? 403
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Failed to respond to referral",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while responding to referral",
      } as ApiResponse);
    }
  }
}
