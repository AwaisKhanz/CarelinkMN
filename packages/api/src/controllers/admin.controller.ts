import { Request, Response } from "express";
import { adminService } from "../services/admin.service";
import { ApiResponse } from "../types/common";
import { AuthenticatedRequest } from "../types/auth";
import { LicenseStatus } from "@carelink/types";

export class AdminController {
  /**
   * USERS
   */
  getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        page,
        limit,
        search,
        role,
        status,
        organizationId,
      } = req.query;

      const result = await adminService.getUsers({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        search: search as string,
        role: role as any,
        status: status as any,
        organizationId: organizationId as string,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: "Users retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Admin getUsers error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to load users",
        message: "An error occurred while retrieving users",
      } as ApiResponse);
    }
  };

  getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const user = await adminService.getUserById(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          error: "User not found",
          message: "User does not exist",
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: user,
        message: "User retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Admin getUserById error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to load user",
        message: "An error occurred while retrieving the user",
      } as ApiResponse);
    }
  };

  updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const actingUserId = (req as unknown as AuthenticatedRequest).user?.id as string;

      const updatedUser = await adminService.updateUser(
        userId,
        req.body,
        actingUserId
      );

      res.status(200).json({
        success: true,
        data: updatedUser,
        message: "User updated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Admin updateUser error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update user",
        message: "An error occurred while updating the user",
      } as ApiResponse);
    }
  };

  deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const actingUserId = (req as unknown as AuthenticatedRequest).user?.id as string;

      await adminService.deleteUser(userId, actingUserId);

      res.status(200).json({
        success: true,
        message: "User deleted successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Admin deleteUser error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete user",
        message: "An error occurred while deleting the user",
      } as ApiResponse);
    }
  };

  /**
   * ORGANIZATIONS
   */
  getOrganizations = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit, search, type, status } = req.query;

      const result = await adminService.getOrganizations({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        search: search as string,
        type: type as any,
        status: status as any,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: "Organizations retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Admin getOrganizations error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to load organizations",
        message: "An error occurred while retrieving organizations",
      } as ApiResponse);
    }
  };

  getOrganizationById = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { organizationId } = req.params;
      const organization = await adminService.getOrganizationById(
        organizationId
      );

      if (!organization) {
        res.status(404).json({
          success: false,
          error: "Organization not found",
          message: "Organization does not exist",
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: organization,
        message: "Organization retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Admin getOrganizationById error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to load organization",
        message: "An error occurred while retrieving the organization",
      } as ApiResponse);
    }
  };

  updateOrganization = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { organizationId } = req.params;
      const actingUserId = (req as unknown as AuthenticatedRequest).user?.id as string;

      const organization = await adminService.updateOrganization(
        organizationId,
        req.body,
        actingUserId
      );

      res.status(200).json({
        success: true,
        data: organization,
        message: "Organization updated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Admin updateOrganization error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update organization",
        message: "An error occurred while updating the organization",
      } as ApiResponse);
    }
  };

  /**
   * LICENSES
   */
  getLicenses = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit, search, status, providerId, verified } = req.query;

      const result = await adminService.getLicenses({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        search: search as string,
        status: status as any,
        providerId: providerId as string,
        verified:
          verified !== undefined ? verified === "true" : undefined,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: "Licenses retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Admin getLicenses error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to load licenses",
        message: "An error occurred while retrieving licenses",
      } as ApiResponse);
    }
  };

  getLicenseById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { licenseId } = req.params;
      const license = await adminService.getLicenseById(licenseId);

      if (!license) {
        res.status(404).json({
          success: false,
          error: "License not found",
          message: "License does not exist",
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: license,
        message: "License retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Admin getLicenseById error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to load license",
        message: "An error occurred while retrieving the license",
      } as ApiResponse);
    }
  };

  verifyLicense = async (req: Request, res: Response): Promise<void> => {
    try {
      const { licenseId } = req.params;
      const { status, verificationNotes } = req.body;
      const actingUserId = (req as unknown as AuthenticatedRequest).user?.id as string;

      const result = await adminService.verifyLicense(
        licenseId,
        status as LicenseStatus,
        verificationNotes,
        actingUserId
      );

      res.status(200).json({
        success: true,
        data: result,
        message: "License verification updated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Admin verifyLicense error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to verify license",
        message: "An error occurred while verifying the license",
      } as ApiResponse);
    }
  };

  /**
   * COMPLIANCE
   */
  getComplianceIssues = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { page, limit, severity, type, status, search } = req.query;

      const result = await adminService.getComplianceIssues({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        severity: severity as string,
        type: type as string,
        status: status as string,
        search: search as string,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: "Compliance issues retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Admin getComplianceIssues error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to load compliance issues",
        message: "An error occurred while retrieving compliance issues",
      } as ApiResponse);
    }
  };

  /**
   * ANALYTICS
   */
  getPlatformAnalytics = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;

      const analytics = await adminService.getPlatformAnalytics({
        startDate: startDate as string,
        endDate: endDate as string,
      });

      res.status(200).json({
        success: true,
        data: analytics,
        message: "Analytics retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Admin getPlatformAnalytics error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to load analytics",
        message: "An error occurred while retrieving analytics",
      } as ApiResponse);
    }
  };
}

export const adminController = new AdminController();

