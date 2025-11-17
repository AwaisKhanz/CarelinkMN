import { Request, Response } from "express";
import { OrganizationService } from "../services/organization.service";
import { CaseManagerService } from "../services/case-manager.service";
import { ApiResponse } from "../types";
import { AuthenticatedRequest } from "../types/auth";

export class OrganizationController {
  private organizationService: OrganizationService;
  private caseManagerService: CaseManagerService;

  constructor() {
    this.organizationService = new OrganizationService();
    this.caseManagerService = new CaseManagerService();
  }

  // Get all organizations
  async getOrganizations(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, type, status } = req.query;

      const organizations = await this.organizationService.getOrganizations({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        type: type as string,
        status: status as string,
      });

      res.status(200).json({
        success: true,
        data: organizations,
        message: "Organizations retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get organizations error:", error);
      res.status(500).json({
        success: false,
        error: "Organization retrieval failed",
        message: "An error occurred while retrieving organizations",
      } as ApiResponse);
    }
  }

  // Get organization by ID
  async getOrganizationById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const organization = await this.organizationService.getOrganizationById(id);

      if (!organization) {
        res.status(404).json({
          success: false,
          error: "Organization not found",
          message: "No organization found with the provided ID",
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: organization,
        message: "Organization retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get organization by ID error:", error);
      res.status(500).json({
        success: false,
        error: "Organization retrieval failed",
        message: "An error occurred while retrieving the organization",
      } as ApiResponse);
    }
  }

  // Create organization
  async createOrganization(req: Request, res: Response): Promise<void> {
    try {
      const organizationData = req.body;
      const userId = (req as unknown as AuthenticatedRequest).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const organization = await this.organizationService.createOrganization(
        organizationData,
        userId
      );

      res.status(201).json({
        success: true,
        data: organization,
        message: "Organization created successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Create organization error:", error);
      res.status(400).json({
        success: false,
        error: "Organization creation failed",
        message: error instanceof Error ? error.message : "An error occurred while creating the organization",
      } as ApiResponse);
    }
  }

  // Search organizations
  async searchOrganizations(req: Request, res: Response): Promise<void> {
    try {
      const { query, type, limit = 10 } = req.query;

      if (!query || typeof query !== 'string') {
        res.status(400).json({
          success: false,
          error: "Invalid query",
          message: "Search query is required",
        } as ApiResponse);
        return;
      }

      const organizations = await this.organizationService.searchOrganizations(
        query,
        type as string,
        parseInt(limit as string)
      );

      res.status(200).json({
        success: true,
        data: organizations,
        message: "Organizations retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Search organizations error:", error);
      res.status(500).json({
        success: false,
        error: "Organization search failed",
        message: "An error occurred while searching organizations",
      } as ApiResponse);
    }
  }

  // Update organization
  async updateOrganization(req: Request, res: Response): Promise<void> {
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

      // Verify user has access to this organization
      let hasAccess = user.organizationId === id || user.role === "ADMIN";
      
      // For case managers, also check if the organization belongs to their case manager record
      if (!hasAccess && user.role === "CASE_MANAGER") {
        try {
          const caseManager = await this.caseManagerService.getCaseManagerByUserId(user.id);
          if (caseManager?.organizationId === id) {
            hasAccess = true;
          }
        } catch (err) {
          // If we can't fetch case manager, deny access
          console.error("Error checking case manager organization:", err);
        }
      }

      if (!hasAccess) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "You do not have permission to update this organization",
        } as ApiResponse);
        return;
      }

      // Prevent organization type from being changed - it's set during registration based on user role
      if (req.body.type || req.body.organizationType) {
        res.status(400).json({
          success: false,
          error: "Invalid update",
          message: "Organization type cannot be changed. It is determined by your registration role.",
        } as ApiResponse);
        return;
      }

      const organizationData = req.body;
      const organization = await this.organizationService.updateOrganization(
        id,
        organizationData
      );

      res.status(200).json({
        success: true,
        data: organization,
        message: "Organization updated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Update organization error:", error);
      
      // Handle unique constraint violation (e.g., duplicate EIN)
      if (error && typeof error === 'object' && 'code' in error && error.code === "P2002") {
        const field = (error as any).meta?.target?.[0] || "field";
        res.status(400).json({
          success: false,
          error: "Duplicate entry",
          message: `An organization with this ${field} already exists. Please use a different ${field} or contact support.`,
        } as ApiResponse);
        return;
      }

      res.status(400).json({
        success: false,
        error: "Organization update failed",
        message: error instanceof Error ? error.message : "An error occurred while updating the organization",
      } as ApiResponse);
    }
  }
}
