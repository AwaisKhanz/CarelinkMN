import { db } from "@carelink/database";
import { Prisma } from "@prisma/client";
import { auditService } from "./audit.service";
import { AuditResult } from "@prisma/client";

export interface CreateLicenseTypeData {
  categoryId: string;
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
  order?: number;
}

export interface UpdateLicenseTypeData
  extends Partial<CreateLicenseTypeData> {
  id?: string;
}

export class LicenseTypeService {
  /**
   * Get all license types
   * @param includeInactive - Include inactive types
   * @returns Array of license types with category info
   */
  async getAllLicenseTypes(includeInactive = false) {
    try {
      const where: Prisma.LicenseTypeWhereInput = {};
      if (!includeInactive) {
        where.isActive = true;
      }

      return await db.licenseType.findMany({
        where,
        include: {
          category: true,
        },
        orderBy: [{ category: { order: "asc" } }, { order: "asc" }],
      });
    } catch (error) {
      console.error("Get all license types error:", error);
      throw new Error("Failed to retrieve license types");
    }
  }

  /**
   * Get license types by category
   * @param categoryId - Category ID
   * @param includeInactive - Include inactive types
   * @returns Array of license types for the category
   */
  async getLicenseTypesByCategory(
    categoryId: string,
    includeInactive = false
  ) {
    try {
      const where: Prisma.LicenseTypeWhereInput = { categoryId };
      if (!includeInactive) {
        where.isActive = true;
      }

      return await db.licenseType.findMany({
        where,
        orderBy: { order: "asc" },
      });
    } catch (error) {
      console.error("Get license types by category error:", error);
      throw new Error("Failed to retrieve license types for category");
    }
  }

  /**
   * Get license type by ID
   * @param id - License type ID
   * @returns License type with category info
   */
  async getLicenseTypeById(id: string) {
    try {
      const licenseType = await db.licenseType.findUnique({
        where: { id },
        include: {
          category: true,
        },
      });

      if (!licenseType) {
        throw new Error("License type not found");
      }

      return licenseType;
    } catch (error) {
      console.error("Get license type by ID error:", error);
      throw new Error("Failed to retrieve license type");
    }
  }

  /**
   * Get license type by code
   * @param code - License type code
   * @returns License type
   */
  async getLicenseTypeByCode(code: string) {
    try {
      return await db.licenseType.findUnique({
        where: { code },
        include: {
          category: true,
        },
      });
    } catch (error) {
      console.error("Get license type by code error:", error);
      throw new Error("Failed to retrieve license type");
    }
  }

  /**
   * Create a new license type
   * @param data - License type data
   * @param userId - User creating the license type
   * @returns Created license type
   */
  async createLicenseType(data: CreateLicenseTypeData, userId: string) {
    try {
      // Check for duplicate code
      const existing = await db.licenseType.findUnique({
        where: { code: data.code },
      });

      if (existing) {
        throw new Error("License type with this code already exists");
      }

      // Verify category exists
      const category = await db.licenseCategory.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        throw new Error("Category not found");
      }

      const licenseType = await db.licenseType.create({
        data: {
          categoryId: data.categoryId,
          code: data.code,
          name: data.name,
          description: data.description,
          isActive: data.isActive ?? true,
          order: data.order ?? 0,
        },
        include: {
          category: true,
        },
      });

      // Log audit event
      await auditService.logAuditEvent(
        userId,
        "license_type.create",
        "LicenseType",
        licenseType.id,
        { code: data.code, name: data.name, categoryId: data.categoryId },
        undefined,
        undefined,
        AuditResult.SUCCESS
      );

      return licenseType;
    } catch (error) {
      console.error("Create license type error:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to create license type");
    }
  }

  /**
   * Update a license type
   * @param id - License type ID
   * @param data - Updated license type data
   * @param userId - User updating the license type
   * @returns Updated license type
   */
  async updateLicenseType(
    id: string,
    data: Partial<CreateLicenseTypeData>,
    userId: string
  ) {
    try {
      // Check if license type exists
      const existing = await db.licenseType.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error("License type not found");
      }

      // If updating code, check for duplicates
      if (data.code && data.code !== existing.code) {
        const duplicate = await db.licenseType.findUnique({
          where: { code: data.code },
        });

        if (duplicate) {
          throw new Error("License type with this code already exists");
        }
      }

      // If updating category, verify it exists
      if (data.categoryId && data.categoryId !== existing.categoryId) {
        const category = await db.licenseCategory.findUnique({
          where: { id: data.categoryId },
        });

        if (!category) {
          throw new Error("Category not found");
        }
      }

      const licenseType = await db.licenseType.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          category: true,
        },
      });

      // Log audit event
      await auditService.logAuditEvent(
        userId,
        "license_type.update",
        "LicenseType",
        id,
        { updatedFields: Object.keys(data) },
        undefined,
        undefined,
        AuditResult.SUCCESS
      );

      return licenseType;
    } catch (error) {
      console.error("Update license type error:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to update license type");
    }
  }

  /**
   * Delete a license type
   * @param id - License type ID
   * @param userId - User deleting the license type
   */
  async deleteLicenseType(id: string, userId: string): Promise<void> {
    try {
      // Check if license type is in use by any licenses
      const licensesCount = await db.license.count({
        where: { licenseTypeId: id },
      });

      if (licensesCount > 0) {
        throw new Error(
          `Cannot delete license type that is in use by ${licensesCount} license(s)`
        );
      }

      // Check if license type is used as primary by any providers
      const providersCount = await db.provider.count({
        where: { primaryLicenseTypeId: id },
      });

      if (providersCount > 0) {
        throw new Error(
          `Cannot delete license type that is set as primary for ${providersCount} provider(s)`
        );
      }

      await db.licenseType.delete({
        where: { id },
      });

      // Log audit event
      await auditService.logAuditEvent(
        userId,
        "license_type.delete",
        "LicenseType",
        id,
        {},
        undefined,
        undefined,
        AuditResult.SUCCESS
      );
    } catch (error) {
      console.error("Delete license type error:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to delete license type");
    }
  }

  /**
   * Reorder license types within a category
   * @param typeOrders - Array of { id, order } objects
   * @param userId - User reordering types
   */
  async reorderLicenseTypes(
    typeOrders: Array<{ id: string; order: number }>,
    userId: string
  ): Promise<void> {
    try {
      await db.$transaction(
        typeOrders.map((item) =>
          db.licenseType.update({
            where: { id: item.id },
            data: { order: item.order },
          })
        )
      );

      // Log audit event
      await auditService.logAuditEvent(
        userId,
        "license_type.reorder",
        "LicenseType",
        "bulk",
        { count: typeOrders.length },
        undefined,
        undefined,
        AuditResult.SUCCESS
      );
    } catch (error) {
      console.error("Reorder license types error:", error);
      throw new Error("Failed to reorder license types");
    }
  }

  /**
   * Get license type statistics
   * @returns License type statistics
   */
  async getLicenseTypeStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byCategory: Array<{ categoryId: string; categoryName: string; count: number }>;
  }> {
    try {
      const [total, active, types] = await Promise.all([
        db.licenseType.count(),
        db.licenseType.count({ where: { isActive: true } }),
        db.licenseType.findMany({
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
      ]);

      // Group by category
      const byCategory = types.reduce(
        (acc, type) => {
          const existing = acc.find((item) => item.categoryId === type.categoryId);
          if (existing) {
            existing.count++;
          } else {
            acc.push({
              categoryId: type.categoryId,
              categoryName: type.category.name,
              count: 1,
            });
          }
          return acc;
        },
        [] as Array<{ categoryId: string; categoryName: string; count: number }>
      );

      return {
        total,
        active,
        inactive: total - active,
        byCategory,
      };
    } catch (error) {
      console.error("Get license type stats error:", error);
      throw new Error("Failed to retrieve license type statistics");
    }
  }

  /**
   * Get grouped license types (by category)
   * @param includeInactive - Include inactive categories and types
   * @returns License types grouped by category
   */
  async getGroupedLicenseTypes(includeInactive = false) {
    try {
      const categories = await db.licenseCategory.findMany({
        where: includeInactive ? {} : { isActive: true },
        include: {
          licenseTypes: {
            where: includeInactive ? {} : { isActive: true },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      });

      return categories;
    } catch (error) {
      console.error("Get grouped license types error:", error);
      throw new Error("Failed to retrieve grouped license types");
    }
  }
}

export const licenseTypeService = new LicenseTypeService();
