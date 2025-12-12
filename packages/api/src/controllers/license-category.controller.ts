import { Request, Response } from "express";
import { licenseCategoryService } from "../services/license-category.service";

export class LicenseCategoryController {
  /**
   * Get all license categories
   * GET /api/license-categories
   */
  async getAllCategories(req: Request, res: Response) {
    try {
      const includeInactive = req.query.includeInactive === "true";
      const categories = await licenseCategoryService.getAllCategories(
        includeInactive
      );

      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      console.error("Get all categories error:", error);
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to retrieve categories",
      });
    }
  }

  /**
   * Get category by ID
   * GET /api/license-categories/:id
   */
  async getCategoryById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const category = await licenseCategoryService.getCategoryById(id);

      res.json({
        success: true,
        data: category,
      });
    } catch (error) {
      console.error("Get category by ID error:", error);
      res.status(404).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Category not found",
      });
    }
  }

  /**
   * Create a new category
   * POST /api/license-categories
   */
  async createCategory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
        });
      }

      const category = await licenseCategoryService.createCategory(
        req.body,
        userId
      );

      res.status(201).json({
        success: true,
        data: category,
        message: "Category created successfully",
      });
    } catch (error) {
      console.error("Create category error:", error);
      res.status(400).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create category",
      });
    }
  }

  /**
   * Update a category
   * PUT /api/license-categories/:id
   */
  async updateCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
        });
      }

      const category = await licenseCategoryService.updateCategory(
        id,
        req.body,
        userId
      );

      res.json({
        success: true,
        data: category,
        message: "Category updated successfully",
      });
    } catch (error) {
      console.error("Update category error:", error);
      res.status(400).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update category",
      });
    }
  }

  /**
   * Delete a category
   * DELETE /api/license-categories/:id
   */
  async deleteCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
        });
      }

      await licenseCategoryService.deleteCategory(id, userId);

      res.json({
        success: true,
        message: "Category deleted successfully",
      });
    } catch (error) {
      console.error("Delete category error:", error);
      res.status(400).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete category",
      });
    }
  }

  /**
   * Reorder categories
   * POST /api/license-categories/reorder
   */
  async reorderCategories(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
        });
      }

      const { categoryOrders } = req.body;

      if (!Array.isArray(categoryOrders)) {
        return res.status(400).json({
          success: false,
          error: "categoryOrders must be an array",
        });
      }

      await licenseCategoryService.reorderCategories(categoryOrders, userId);

      res.json({
        success: true,
        message: "Categories reordered successfully",
      });
    } catch (error) {
      console.error("Reorder categories error:", error);
      res.status(400).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to reorder categories",
      });
    }
  }

  /**
   * Get category statistics
   * GET /api/license-categories/stats
   */
  async getCategoryStats(req: Request, res: Response) {
    try {
      const stats = await licenseCategoryService.getCategoryStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Get category stats error:", error);
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

export const licenseCategoryController = new LicenseCategoryController();
