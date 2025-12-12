import { Request, Response } from "express";
import { licenseTypeService } from "../services/license-type.service";

export class LicenseTypeController {
  /**
   * Get all license types
   * GET /api/license-types
   */
  async getAllLicenseTypes(req: Request, res: Response) {
    try {
      const includeInactive = req.query.includeInactive === "true";
      const licenseTypes = await licenseTypeService.getAllLicenseTypes(
        includeInactive
      );

      res.json({
        success: true,
        data: licenseTypes,
      });
    } catch (error) {
      console.error("Get all license types error:", error);
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to retrieve license types",
      });
    }
  }

  /**
   * Get license types by category
   * GET /api/license-types/category/:categoryId
   */
  async getLicenseTypesByCategory(req: Request, res: Response) {
    try {
      const { categoryId } = req.params;
      const includeInactive = req.query.includeInactive === "true";

      const licenseTypes = await licenseTypeService.getLicenseTypesByCategory(
        categoryId,
        includeInactive
      );

      res.json({
        success: true,
        data: licenseTypes,
      });
    } catch (error) {
      console.error("Get license types by category error:", error);
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to retrieve license types",
      });
    }
  }

  /**
   * Get grouped license types (by category)
   * GET /api/license-types/grouped
   */
  async getGroupedLicenseTypes(req: Request, res: Response) {
    try {
      const includeInactive = req.query.includeInactive === "true";
      const grouped = await licenseTypeService.getGroupedLicenseTypes(
        includeInactive
      );

      res.json({
        success: true,
        data: grouped,
      });
    } catch (error) {
      console.error("Get grouped license types error:", error);
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to retrieve grouped license types",
      });
    }
  }

  /**
   * Get license type by ID
   * GET /api/license-types/:id
   */
  async getLicenseTypeById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const licenseType = await licenseTypeService.getLicenseTypeById(id);

      res.json({
        success: true,
        data: licenseType,
      });
    } catch (error) {
      console.error("Get license type by ID error:", error);
      res.status(404).json({
        success: false,
        error:
          error instanceof Error ? error.message : "License type not found",
      });
    }
  }

  /**
   * Create a new license type
   * POST /api/license-types
   */
  async createLicenseType(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
        });
      }

      const licenseType = await licenseTypeService.createLicenseType(
        req.body,
        userId
      );

      res.status(201).json({
        success: true,
        data: licenseType,
        message: "License type created successfully",
      });
    } catch (error) {
      console.error("Create license type error:", error);
      res.status(400).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create license type",
      });
    }
  }

  /**
   * Update a license type
   * PUT /api/license-types/:id
   */
  async updateLicenseType(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
        });
      }

      const licenseType = await licenseTypeService.updateLicenseType(
        id,
        req.body,
        userId
      );

      res.json({
        success: true,
        data: licenseType,
        message: "License type updated successfully",
      });
    } catch (error) {
      console.error("Update license type error:", error);
      res.status(400).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update license type",
      });
    }
  }

  /**
   * Delete a license type
   * DELETE /api/license-types/:id
   */
  async deleteLicenseType(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
        });
      }

      await licenseTypeService.deleteLicenseType(id, userId);

      res.json({
        success: true,
        message: "License type deleted successfully",
      });
    } catch (error) {
      console.error("Delete license type error:", error);
      res.status(400).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete license type",
      });
    }
  }

  /**
   * Reorder license types
   * POST /api/license-types/reorder
   */
  async reorderLicenseTypes(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
        });
      }

      const { typeOrders } = req.body;

      if (!Array.isArray(typeOrders)) {
        return res.status(400).json({
          success: false,
          error: "typeOrders must be an array",
        });
      }

      await licenseTypeService.reorderLicenseTypes(typeOrders, userId);

      res.json({
        success: true,
        message: "License types reordered successfully",
      });
    } catch (error) {
      console.error("Reorder license types error:", error);
      res.status(400).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to reorder license types",
      });
    }
  }

  /**
   * Get license type statistics
   * GET /api/license-types/stats
   */
  async getLicenseTypeStats(req: Request, res: Response) {
    try {
      const stats = await licenseTypeService.getLicenseTypeStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Get license type stats error:", error);
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to retrieve statistics",
      });
    }
  }
}

export const licenseTypeController = new LicenseTypeController();
