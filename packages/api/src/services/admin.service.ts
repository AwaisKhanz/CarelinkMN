import { db } from "@carelink/database";
import {
  LicenseStatus,
  OrganizationStatus,
  OrganizationType,
  UserRole,
  UserStatus,
} from "@carelink/types";
import { AuditResult, Prisma } from "@prisma/client";
import { LicenseService } from "./license.service";
import { AuditService } from "./audit.service";

interface PaginationParams {
  page?: number;
  limit?: number;
}

interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface GetUsersParams extends PaginationParams {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  organizationId?: string;
}

interface GetOrganizationsParams extends PaginationParams {
  search?: string;
  type?: OrganizationType | string;
  status?: OrganizationStatus | string;
}

interface GetLicensesParams extends PaginationParams {
  search?: string;
  status?: LicenseStatus | string;
  providerId?: string;
  verified?: boolean;
}

interface GetComplianceParams extends PaginationParams {
  severity?: string;
  type?: string;
  status?: string;
  search?: string;
}

export class AdminService {
  private licenseService: LicenseService;
  private auditService: AuditService;

  constructor() {
    this.licenseService = new LicenseService();
    this.auditService = new AuditService();
  }

  /**
   * USERS
   */
  async getUsers(params: GetUsersParams = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      status,
      organizationId,
    } = params;

    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    if (organizationId) {
      where.organizationId = organizationId;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          status: true,
          organizationId: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
        },
      }),
      db.user.count({ where }),
    ]);

    return {
      users,
      pagination: this.buildPagination(page, limit, total),
    };
  }

  async getUserById(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    return user;
  }

  async updateUser(
    userId: string,
    data: Partial<{
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      role: UserRole;
      status: UserStatus;
      organizationId: string | null;
    }>,
    actingUserId: string
  ) {
    const updatedUser = await db.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    await this.auditService.logUserManagement(actingUserId, "UPDATE", userId, {
      updatedFields: Object.keys(data),
    });

    return updatedUser;
  }

  async deleteUser(userId: string, actingUserId: string) {
    await db.user.delete({ where: { id: userId } });
    await this.auditService.logUserManagement(actingUserId, "DELETE", userId);
  }

  /**
   * ORGANIZATIONS
   */
  async getOrganizations(params: GetOrganizationsParams = {}) {
    const { page = 1, limit = 10, search, type, status } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.OrganizationWhereInput = {};

    if (type) {
      where.type = type as OrganizationType;
    }

    if (status) {
      where.status = status as OrganizationStatus;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { state: { contains: search, mode: "insensitive" } },
      ];
    }

    const [organizations, total] = await Promise.all([
      db.organization.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          email: true,
          phone: true,
          city: true,
          state: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      db.organization.count({ where }),
    ]);

    return {
      organizations,
      pagination: this.buildPagination(page, limit, total),
    };
  }

  async getOrganizationById(organizationId: string) {
    return db.organization.findUnique({
      where: { id: organizationId },
    });
  }

  async updateOrganization(
    organizationId: string,
    data: Partial<{
      name: string;
      email: string;
      phone: string;
      status: OrganizationStatus;
      city: string;
      state: string;
      addressLine1: string;
      addressLine2?: string | null;
      zipCode: string;
      county: string;
      website?: string | null;
      fax?: string | null;
    }>,
    actingUserId: string
  ) {
    const organization = await db.organization.update({
      where: { id: organizationId },
      data,
    });

    await this.auditService.logOrganization(
      actingUserId,
      "UPDATE",
      organizationId,
      {
        updatedFields: Object.keys(data),
      }
    );

    return organization;
  }

  /**
   * LICENSES
   */
  async getLicenses(params: GetLicensesParams = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      providerId,
      verified,
    } = params;

    const skip = (page - 1) * limit;

    const where: Prisma.LicenseWhereInput = {};

    if (status) {
      where.status = status as LicenseStatus;
    }

    if (providerId) {
      where.providerId = providerId;
    }

    if (verified !== undefined) {
      where.verifiedAt = verified ? { not: null } : null;
    }

    if (search) {
      where.OR = [
        { licenseNumber: { contains: search, mode: "insensitive" } },
        { licenseType: { contains: search, mode: "insensitive" } },
      ];
    }

    const [licenses, total] = await Promise.all([
      db.license.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          provider: {
            select: {
              id: true,
              organization: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      db.license.count({ where }),
    ]);

    return {
      licenses,
      pagination: this.buildPagination(page, limit, total),
    };
  }

  async getLicenseById(licenseId: string) {
    return db.license.findUnique({
      where: { id: licenseId },
      include: {
        provider: {
          include: {
            organization: true,
          },
        },
      },
    });
  }

  async verifyLicense(
    licenseId: string,
    status: LicenseStatus,
    notes: string | undefined,
    actingUserId: string
  ) {
    const result = await this.licenseService.verifyLicense(licenseId, {
      status,
      verificationNotes: notes,
      verifiedBy: actingUserId,
    });

    await this.auditService.logAuditEvent(
      actingUserId,
      "license.verify",
      "License",
      licenseId,
      {
        status,
      }
    );

    return result;
  }

  /**
   * COMPLIANCE
   */
  async getComplianceIssues(params: GetComplianceParams = {}) {
    const {
      page = 1,
      limit = 20,
      severity,
      type,
      status,
      search,
    } = params;
    const skip = (page - 1) * limit;

    const andFilters: Prisma.AuditLogWhereInput[] = [];

    if (type) {
      andFilters.push({
        action: { startsWith: type, mode: "insensitive" },
      });
    }

    if (status) {
      const normalized = status.toLowerCase();
      const result =
        normalized === "open"
          ? AuditResult.FAILURE
          : normalized === "resolved"
          ? AuditResult.SUCCESS
          : normalized === "acknowledged"
          ? AuditResult.ERROR
          : undefined;
      if (result) {
        andFilters.push({ result });
      }
    }

    if (severity) {
      const normalized = severity.toLowerCase();
      if (normalized === "critical") {
        andFilters.push({
          action: { startsWith: "phi.", mode: "insensitive" },
        });
      } else if (normalized === "high") {
        andFilters.push({
          action: { startsWith: "auth.", mode: "insensitive" },
        });
        andFilters.push({ result: AuditResult.FAILURE });
      } else if (normalized === "medium") {
        andFilters.push({ result: AuditResult.FAILURE });
        andFilters.push({
          NOT: [
            { action: { startsWith: "phi.", mode: "insensitive" } },
            { action: { startsWith: "auth.", mode: "insensitive" } },
          ],
        });
      } else if (normalized === "low") {
        andFilters.push({
          result: { not: AuditResult.FAILURE },
        });
      }
    }

    if (search) {
      andFilters.push({
        OR: [
          { action: { contains: search, mode: "insensitive" } },
          { resourceType: { contains: search, mode: "insensitive" } },
          { resourceId: { contains: search, mode: "insensitive" } },
          { user: { email: { contains: search, mode: "insensitive" } } },
        ],
      });
    }

    const where =
      andFilters.length > 0 ? ({ AND: andFilters } as Prisma.AuditLogWhereInput) : {};

    const [logs, total, summary] = await Promise.all([
      db.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: "desc" },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      db.auditLog.count({ where }),
      this.buildComplianceSummary(where),
    ]);

    const issues = logs.map((log) => this.mapAuditLogToComplianceIssue(log));

    return {
      issues,
      pagination: this.buildPagination(page, limit, total),
      summary,
    };
  }

  /**
   * ANALYTICS
   */
  async getPlatformAnalytics(params: { startDate?: string; endDate?: string }) {
    const { startDate, endDate } = params;

    const dateFilter = startDate && endDate
      ? {
          gte: new Date(startDate),
          lte: new Date(endDate),
        }
      : undefined;

    const [totalUsers, totalOrganizations, totalReferrals, totalPlacements] =
      await Promise.all([
        db.user.count(),
        db.organization.count(),
        db.referral.count({ where: dateFilter ? { createdAt: dateFilter } : {} }),
        db.placement.count({
          where: dateFilter ? { createdAt: dateFilter } : {},
        }),
      ]);

    const dailyActiveUsers = await db.auditLog.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    const monthlyActiveUsers = await db.auditLog.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    return {
      totalUsers,
      totalOrganizations,
      totalReferrals,
      totalPlacements,
      dailyActiveUsers,
      monthlyActiveUsers,
      platformActivity: monthlyActiveUsers,
      userGrowth: 0,
      orgGrowth: 0,
    };
  }

  /**
   * Helpers
   */
  private buildPagination(
    page: number,
    limit: number,
    total: number
  ): PaginationResult {
    return {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    };
  }

  private mapAuditLogToComplianceIssue(log: any) {
    const severity = this.deriveSeverity(log);
    const type = log.action.split(".")[0] || "general";
    const status =
      log.result === AuditResult.FAILURE
        ? "open"
        : log.result === AuditResult.ERROR
        ? "acknowledged"
        : "resolved";

    return {
      id: log.id,
      type,
      severity,
      title: log.action,
      description: log.errorMessage || "Automated compliance alert",
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      status,
      createdAt: log.timestamp,
      resolvedAt: null,
      resolvedBy: null,
    };
  }

  private async buildComplianceSummary(where: Prisma.AuditLogWhereInput) {
    const [total, open, resolved, acknowledged, critical, high, medium] =
      await Promise.all([
        db.auditLog.count({ where }),
        db.auditLog.count({
          where: this.combineWhere(where, { result: AuditResult.FAILURE }),
        }),
        db.auditLog.count({
          where: this.combineWhere(where, { result: AuditResult.SUCCESS }),
        }),
        db.auditLog.count({
          where: this.combineWhere(where, { result: AuditResult.ERROR }),
        }),
        db.auditLog.count({
          where: this.combineWhere(where, {
            action: { startsWith: "phi.", mode: "insensitive" },
          }),
        }),
        db.auditLog.count({
          where: this.combineWhere(where, {
            action: { startsWith: "auth.", mode: "insensitive" },
            result: AuditResult.FAILURE,
          }),
        }),
        db.auditLog.count({
          where: this.combineWhere(where, {
            result: AuditResult.FAILURE,
            NOT: [
              { action: { startsWith: "phi.", mode: "insensitive" } },
              { action: { startsWith: "auth.", mode: "insensitive" } },
            ],
          }),
        }),
      ]);

    const low = Math.max(total - (critical + high + medium), 0);

    return {
      total,
      byStatus: {
        open,
        resolved,
        acknowledged,
      },
      bySeverity: {
        critical,
        high,
        medium,
        low,
      },
    };
  }

  private combineWhere(
    base: Prisma.AuditLogWhereInput,
    addition: Prisma.AuditLogWhereInput
  ): Prisma.AuditLogWhereInput {
    if (!base || Object.keys(base).length === 0) {
      return addition;
    }

    return {
      AND: [base, addition],
    };
  }

  private deriveSeverity(log: any): "critical" | "high" | "medium" | "low" {
    if (log.action?.startsWith("phi.")) {
      return "critical";
    }
    if (log.action?.startsWith("auth.") && log.result === AuditResult.FAILURE) {
      return "high";
    }
    if (log.result === AuditResult.FAILURE) {
      return "medium";
    }
    return "low";
  }
}

export const adminService = new AdminService();

