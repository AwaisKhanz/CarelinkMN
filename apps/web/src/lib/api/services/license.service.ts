import { apiService } from "../config";
import {
  ApiResponse,
  LicenseCategory,
  CreateLicenseCategoryData,
  UpdateLicenseCategoryData,
  LicenseCategoryStats,
  LicenseType,
  CreateLicenseTypeData,
  UpdateLicenseTypeData,
  LicenseTypeStats,
} from "@carelink/types";

// ============================================
// LICENSE CATEGORY SERVICE
// ============================================

export class LicenseCategoryService {
  /**
   * Get all license categories
   */
  async getAllCategories(
    includeInactive = false
  ): Promise<ApiResponse<LicenseCategory[]>> {
    const params = new URLSearchParams();
    if (includeInactive) {
      params.append("includeInactive", "true");
    }
    return apiService.get<LicenseCategory[]>(
      `/api/license-categories?${params}`
    );
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string): Promise<ApiResponse<LicenseCategory>> {
    return apiService.get<LicenseCategory>(`/api/license-categories/${id}`);
  }

  /**
   * Create new category
   */
  async createCategory(
    data: CreateLicenseCategoryData
  ): Promise<ApiResponse<LicenseCategory>> {
    return apiService.post<LicenseCategory>("/api/license-categories", data);
  }

  /**
   * Update category
   */
  async updateCategory(
    id: string,
    data: UpdateLicenseCategoryData
  ): Promise<ApiResponse<LicenseCategory>> {
    return apiService.put<LicenseCategory>(`/api/license-categories/${id}`, data);
  }

  /**
   * Delete category
   */
  async deleteCategory(id: string): Promise<ApiResponse<void>> {
    return apiService.delete<void>(`/api/license-categories/${id}`);
  }

  /**
   * Reorder categories
   */
  async reorderCategories(
    categoryOrders: Array<{ id: string; order: number }>
  ): Promise<ApiResponse<void>> {
    return apiService.post<void>("/api/license-categories/reorder", {
      categoryOrders,
    });
  }

  /**
   * Get category statistics
   */
  async getCategoryStats(): Promise<ApiResponse<LicenseCategoryStats>> {
    return apiService.get<LicenseCategoryStats>("/api/license-categories/stats");
  }
}

// ============================================
// LICENSE TYPE SERVICE
// ============================================

export class LicenseTypeService {
  /**
   * Get all license types
   */
  async getAllLicenseTypes(
    includeInactive = false
  ): Promise<ApiResponse<LicenseType[]>> {
    const params = new URLSearchParams();
    if (includeInactive) {
      params.append("includeInactive", "true");
    }
    return apiService.get<LicenseType[]>(`/api/license-types?${params}`);
  }

  /**
   * Get license types by category
   */
  async getLicenseTypesByCategory(
    categoryId: string,
    includeInactive = false
  ): Promise<ApiResponse<LicenseType[]>> {
    const params = new URLSearchParams();
    if (includeInactive) {
      params.append("includeInactive", "true");
    }
    return apiService.get<LicenseType[]>(
      `/api/license-types/category/${categoryId}?${params}`
    );
  }

  /**
   * Get grouped license types (by category)
   */
  async getGroupedLicenseTypes(
    includeInactive = false
  ): Promise<ApiResponse<LicenseCategory[]>> {
    const params = new URLSearchParams();
    if (includeInactive) {
      params.append("includeInactive", "true");
    }
    return apiService.get<LicenseCategory[]>(
      `/api/license-types/grouped?${params}`
    );
  }

  /**
   * Get license type by ID
   */
  async getLicenseTypeById(id: string): Promise<ApiResponse<LicenseType>> {
    return apiService.get<LicenseType>(`/api/license-types/${id}`);
  }

  /**
   * Create new license type
   */
  async createLicenseType(
    data: CreateLicenseTypeData
  ): Promise<ApiResponse<LicenseType>> {
    return apiService.post<LicenseType>("/api/license-types", data);
  }

  /**
   * Update license type
   */
  async updateLicenseType(
    id: string,
    data: UpdateLicenseTypeData
  ): Promise<ApiResponse<LicenseType>> {
    return apiService.put<LicenseType>(`/api/license-types/${id}`, data);
  }

  /**
   * Delete license type
   */
  async deleteLicenseType(id: string): Promise<ApiResponse<void>> {
    return apiService.delete<void>(`/api/license-types/${id}`);
  }

  /**
   * Reorder license types
   */
  async reorderLicenseTypes(
    typeOrders: Array<{ id: string; order: number }>
  ): Promise<ApiResponse<void>> {
    return apiService.post<void>("/api/license-types/reorder", {
      typeOrders,
    });
  }

  /**
   * Get license type statistics
   */
  async getLicenseTypeStats(): Promise<ApiResponse<LicenseTypeStats>> {
    return apiService.get<LicenseTypeStats>("/api/license-types/stats");
  }
}

// Export singleton instances
export const licenseCategoryService = new LicenseCategoryService();
export const licenseTypeService = new LicenseTypeService();
