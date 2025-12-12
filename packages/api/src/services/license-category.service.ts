import { db } from "@carelink/database";
import { Prisma } from "@prisma/client";
import { auditService } from "./audit.service";
import { AuditResult } from "@prisma/client";

export interface CreateLicenseCategoryData {
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
  order?: number;
}

export interface UpdateLicenseCategoryData
  extends Partial<CreateLicenseCategoryData> {
  id?: string;
}

export class LicenseCategoryService {
  /**
   * Get all license categories
   * @param includeInactive - Include inactive categories
   * @returns Array of license categories with their types
   */
  async getAllCategories(includeInactive = false) {
    try {
      const where: Prisma.LicenseCategoryWhereInput = {};
      if (!includeInactive) {
        where.isActive = true;
      }

      return await db.licenseCategory.findMany({
        where,
        include: {
          licenseTypes: {
            where: includeInactive ? {} : { isActive: true },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      });
    } catch (error) {
      console.error("Get all categories error:", error);
      throw new Error("Failed to retrieve license categories");
    }
  }

  /**
   * Get category by ID
   * @param id - Category ID
   * @returns License category with its types
   */
  async getCategoryById(id: string) {
    try {
      const category = await db.licenseCategory.findUnique({
        where: { id },
        include: {
          licenseTypes: {
            orderBy: { order: "asc" },
          },
        },
      });

      if (!category) {
        throw new Error("Category not found");
      }

      return category;
    } catch (error) {
      console.error("Get category by ID error:", error);
      throw new Error("Failed to retrieve license category");
    }
  }

  /**
   * Get category by code
   * @param code - Category code
   * @returns License category
   */
  async getCategoryByCode(code: string) {
    try {
      return await db.licenseCategory.findUnique({
        where: { code },
        include: {
          licenseTypes: {
            where: { isActive: true },
            orderBy: { order: "asc" },
          },
        },
      });
    } catch (error) {
      console.error("Get category by code error:", error);
      throw new Error("Failed to retrieve license category");
    }
  }

  /**
   * Create a new license category
   * @param data - Category data
   * @param userId - User creating the category
   * @returns Created category
   */
  async createCategory(data: CreateLicenseCategoryData, userId: string) {
    try {
      // Check for duplicate code
      const existing = await db.licenseCategory.findUnique({
        where: { code: data.code },
      });

      if (existing) {
        throw new Error("Category with this code already exists");
      }

      const category = await db.licenseCategory.create({
        data: {
          code: data.code,
          name: data.name,
          description: data.description,
          isActive: data.isActive ?? true,
          order: data.order ?? 0,
        },
      });

      // Log audit event
      await auditService.logAuditEvent(
        userId,
        "license_category.create",
        "LicenseCategory",
        category.id,
        { code: data.code, name: data.name },
        undefined,
        undefined,
        AuditResult.SUCCESS
      );

      return category;
    } catch (error) {
      console.error("Create category error:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to create license category");
    }
  }

  /**
   * Update a license category
   * @param id - Category ID
   * @param data - Updated category data
   * @param userId - User updating the category
   * @returns Updated category
   */
  async updateCategory(
    id: string,
    data: Partial<CreateLicenseCategoryData>,
    userId: string
  ) {
    try {
      // Check if category exists
      const existing = await db.licenseCategory.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error("Category not found");
      }

      // If updating code, check for duplicates
      if (data.code && data.code !== existing.code) {
        const duplicate = await db.licenseCategory.findUnique({
          where: { code: data.code },
        });

        if (duplicate) {
          throw new Error("Category with this code already exists");
        }
      }

      const category = await db.licenseCategory.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      // Log audit event
      await auditService.logAuditEvent(
        userId,
        "license_category.update",
        "LicenseCategory",
        id,
        { updatedFields: Object.keys(data) },
        undefined,
        undefined,
        AuditResult.SUCCESS
      );

      return category;
    } catch (error) {
      console.error("Update category error:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to update license category");
    }
  }

  /**
   * Delete a license category
   * @param id - Category ID
   * @param userId - User deleting the category
   */
  async deleteCategory(id: string, userId: string): Promise<void> {
    try {
      // Check if category has license types
      const typesCount = await db.licenseType.count({
        where: { categoryId: id },
      });

      if (typesCount > 0) {
        throw new Error(
          "Cannot delete category with existing license types. Please delete or reassign all license types first."
        );
      }

      await db.licenseCategory.delete({
        where: { id },
      });

      // Log audit event
      await auditService.logAuditEvent(
        userId,
        "license_category.delete",
        "LicenseCategory",
        id,
        {},
        undefined,
        undefined,
        AuditResult.SUCCESS
      );
    } catch (error) {
      console.error("Delete category error:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to delete license category");
    }
  }

  /**
   * Reorder categories
   * @param categoryOrders - Array of { id, order } objects
   * @param userId - User reordering categories
   */
  async reorderCategories(
    categoryOrders: Array<{ id: string; order: number }>,
    userId: string
  ): Promise<void> {
    try {
      await db.$transaction(
        categoryOrders.map((item) =>
          db.licenseCategory.update({
            where: { id: item.id },
            data: { order: item.order },
          })
        )
      );

      // Log audit event
      await auditService.logAuditEvent(
        userId,
        "license_category.reorder",
        "LicenseCategory",
        "bulk",
        { count: categoryOrders.length },
        undefined,
        undefined,
        AuditResult.SUCCESS
      );
    } catch (error) {
      console.error("Reorder categories error:", error);
      throw new Error("Failed to reorder license categories");
    }
  }

  /**
   * Get category statistics
   * @returns Category statistics
   */
  async getCategoryStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    try {
      const [total, active] = await Promise.all([
        db.licenseCategory.count(),
        db.licenseCategory.count({ where: { isActive: true } }),
      ]);

      return {
        total,
        active,
        inactive: total - active,
      };
    } catch (error) {
      console.error("Get category stats error:", error);
      throw new Error("Failed to retrieve category statistics");
    }
  }
}

export const licenseCategoryService = new LicenseCategoryService();
