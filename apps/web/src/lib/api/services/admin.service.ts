import { apiService } from "../config";
import {
  ApiResponse,
  UserStatus,
  UserRole,
  OrganizationStatus,
  LicenseStatus,
  License,
} from "@carelink/types";
import type { User } from "./auth.service";
import type { Organization } from "../types/organization.types";
// ============================================
// SHARED TYPES
// ============================================

export interface AdminPagination {
  total: number;
  pages: number;
  page: number;
  limit: number;
}

// ============================================
// USER MANAGEMENT TYPES
// ============================================

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  organizationId?: string;
}

export interface UsersResponse {
  users: User[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  status?: UserStatus;
  organizationId?: string;
}

// ============================================
// ORGANIZATION MANAGEMENT TYPES
// ============================================

export interface GetOrganizationsParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  status?: OrganizationStatus;
}

export interface OrganizationsResponse {
  organizations: Organization[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
}

export interface UpdateOrganizationData {
  name?: string;
  email?: string;
  phone?: string;
  status?: OrganizationStatus;
}

// ============================================
// LICENSE VERIFICATION TYPES
// ============================================

export interface GetLicensesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: LicenseStatus;
  providerId?: string;
  verified?: boolean;
}

export interface LicensesResponse {
  licenses: License[];
  pagination: AdminPagination;
}

export interface VerifyLicenseData {
  status: LicenseStatus;
  verificationNotes?: string;
}

// ============================================
// COMPLIANCE TYPES
// ============================================

export interface ComplianceIssue {
  id: string;
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  resourceType: string;
  resourceId?: string;
  status: "open" | "resolved" | "acknowledged";
  createdAt: string;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
}

export interface ComplianceSummary {
  total: number;
  byStatus: {
    open: number;
    resolved: number;
    acknowledged: number;
  };
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface ComplianceIssuesResponse {
  issues: ComplianceIssue[];
  pagination: AdminPagination;
  summary?: ComplianceSummary;
}

export interface GetComplianceIssuesParams {
  page?: number;
  limit?: number;
  severity?: string;
  type?: string;
  status?: string;
  search?: string;
}

// ============================================
// AUDIT TYPES
// ============================================

export interface AuditLogEntry {
  id: string;
  userId?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  action: string;
  resourceType: string;
  resourceId?: string | null;
  result: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AuditLogsResponse {
  logs: AuditLogEntry[];
  pagination: AdminPagination & { hasMore?: boolean };
}

// ============================================
// ADMIN SERVICE
// ============================================

export class AdminService {
  // ============================================
  // USER MANAGEMENT
  // ============================================

  /**
   * Get all users with pagination and filters
   */
  async getUsers(
    params: GetUsersParams = {}
  ): Promise<ApiResponse<UsersResponse>> {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      status,
      organizationId,
    } = params;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) searchParams.append("search", search);
    if (role) searchParams.append("role", role);
    if (status) searchParams.append("status", status);
    if (organizationId) searchParams.append("organizationId", organizationId);

    return apiService.get<UsersResponse>(`/api/admin/users?${searchParams}`);
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<ApiResponse<User>> {
    return apiService.get<User>(`/api/admin/users/${userId}`);
  }

  /**
   * Update user
   */
  async updateUser(
    userId: string,
    data: UpdateUserData
  ): Promise<ApiResponse<User>> {
    return apiService.put<User>(`/api/admin/users/${userId}`, data);
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<ApiResponse<void>> {
    return apiService.delete<void>(`/api/admin/users/${userId}`);
  }

  // ============================================
  // ORGANIZATION MANAGEMENT
  // ============================================

  /**
   * Get all organizations with pagination and filters
   */
  async getOrganizations(
    params: GetOrganizationsParams = {}
  ): Promise<ApiResponse<OrganizationsResponse>> {
    const { page = 1, limit = 10, search, type, status } = params;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) searchParams.append("search", search);
    if (type) searchParams.append("type", type);
    if (status) searchParams.append("status", status);

    return apiService.get<OrganizationsResponse>(
      `/api/admin/organizations?${searchParams}`
    );
  }

  /**
   * Get organization by ID
   */
  async getOrganizationById(orgId: string): Promise<ApiResponse<Organization>> {
    return apiService.get<Organization>(`/api/admin/organizations/${orgId}`);
  }

  /**
   * Update organization
   */
  async updateOrganization(
    orgId: string,
    data: UpdateOrganizationData
  ): Promise<ApiResponse<Organization>> {
    return apiService.put<Organization>(
      `/api/admin/organizations/${orgId}`,
      data
    );
  }

  // ============================================
  // LICENSE VERIFICATION
  // ============================================

  /**
   * Get all licenses with pagination and filters
   */
  async getLicenses(
    params: GetLicensesParams = {}
  ): Promise<ApiResponse<LicensesResponse>> {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      providerId,
      verified,
    } = params;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) searchParams.append("search", search);
    if (status) searchParams.append("status", status);
    if (providerId) searchParams.append("providerId", providerId);
    if (verified !== undefined)
      searchParams.append("verified", verified.toString());

    return apiService.get<LicensesResponse>(
      `/api/admin/licenses?${searchParams}`
    );
  }

  /**
   * Get license by ID
   */
  async getLicenseById(licenseId: string): Promise<ApiResponse<License>> {
    return apiService.get<License>(`/api/admin/licenses/${licenseId}`);
  }

  /**
   * Verify license
   */
  async verifyLicense(
    licenseId: string,
    data: VerifyLicenseData
  ): Promise<ApiResponse<License>> {
    return apiService.put<License>(
      `/api/admin/licenses/${licenseId}/verify`,
      data
    );
  }

  // ============================================
  // AUDIT LOGS
  // ============================================

  /**
   * Get audit logs with pagination and filters
   */
  async getAuditLogs(
    params: {
      page?: number;
      limit?: number;
      userId?: string;
      action?: string;
      resourceType?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<ApiResponse<AuditLogsResponse>> {
    const {
      page = 1,
      limit = 50,
      userId,
      action,
      resourceType,
      startDate,
      endDate,
    } = params;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (userId) searchParams.append("userId", userId);
    if (action) searchParams.append("action", action);
    if (resourceType) searchParams.append("resourceType", resourceType);
    if (startDate) searchParams.append("startDate", startDate);
    if (endDate) searchParams.append("endDate", endDate);

    return apiService.get<AuditLogsResponse>(`/api/audit/logs?${searchParams}`);
  }

  // ============================================
  // COMPLIANCE
  // ============================================

  /**
   * Get compliance issues
   */
  async getComplianceIssues(
    params: GetComplianceIssuesParams = {}
  ): Promise<ApiResponse<ComplianceIssuesResponse>> {
    const { page = 1, limit = 20, severity, status, search, type } = params;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (severity) searchParams.append("severity", severity);
    if (type) searchParams.append("type", type);
    if (status) searchParams.append("status", status);
    if (search) searchParams.append("search", search);

    return apiService.get<ComplianceIssuesResponse>(
      `/api/admin/compliance/issues?${searchParams}`
    );
  }

  // ============================================
  // PLATFORM ANALYTICS
  // ============================================

  /**
   * Get platform analytics
   */
  async getPlatformAnalytics(
    params: {
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<ApiResponse<any>> {
    const { startDate, endDate } = params;

    const searchParams = new URLSearchParams();
    if (startDate) searchParams.append("startDate", startDate);
    if (endDate) searchParams.append("endDate", endDate);

    const queryString = searchParams.toString();
    return apiService.get<any>(
      `/api/admin/analytics${queryString ? `?${queryString}` : ""}`
    );
  }
}

// Export singleton instance
export const adminService = new AdminService();
export default adminService;
