import { db } from "@carelink/database";
import { AuditResult, Prisma } from "@prisma/client";

export interface AuditLogEntry {
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  result: AuditResult;
  errorMessage?: string;
}

export interface AuditSearchCriteria {
  userId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  result?: AuditResult;
  fromDate?: Date;
  toDate?: Date;
  ipAddress?: string;
  limit?: number;
  offset?: number;
}

export class AuditService {
  /**
   * Create an audit log entry
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await db.auditLog.create({
        data: {
          userId: entry.userId,
          action: entry.action,
          resourceType: entry.resourceType,
          resourceId: entry.resourceId,
          metadata: entry.metadata || {},
          ipAddress: entry.ipAddress || "unknown",
          userAgent: entry.userAgent || "unknown",
          result: entry.result,
          errorMessage: entry.errorMessage,
        },
      });
    } catch (error) {
      // Never fail the main operation if audit logging fails
      console.error("Audit logging failed:", error);
    }
  }

  /**
   * Log authentication events
   */
  async logAuth(
    userId: string,
    action:
      | "LOGIN"
      | "LOGOUT"
      | "REGISTER"
      | "PASSWORD_CHANGE"
      | "EMAIL_VERIFY"
      | "PASSWORD_RESET"
      | "PHONE_VERIFY"
      | "PROFILE_UPDATE"
      | "STATUS_CHANGE",
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
    result: AuditResult = AuditResult.SUCCESS,
    errorMessage?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: `auth.${action.toLowerCase()}`,
      resourceType: "User",
      resourceId: userId,
      metadata,
      ipAddress,
      userAgent,
      result,
      errorMessage,
    });
  }

  /**
   * Log PHI access events (HIPAA compliance)
   */
  async logPHIAccess(
    userId: string,
    action: "VIEW" | "CREATE" | "UPDATE" | "DELETE" | "DOWNLOAD" | "PRINT",
    resourceType: string,
    resourceId: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
    result: AuditResult = AuditResult.SUCCESS,
    errorMessage?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: `phi.${action.toLowerCase()}`,
      resourceType,
      resourceId,
      metadata: {
        ...metadata,
        phiAccess: true,
        hipaaRelevant: true,
      },
      ipAddress,
      userAgent,
      result,
      errorMessage,
    });
  }

  /**
   * Generic audit event logging
   */
  async logAuditEvent(
    userId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
    result: AuditResult = AuditResult.SUCCESS,
    errorMessage?: string
  ): Promise<void> {
    await this.log({
      userId,
      action,
      resourceType,
      resourceId,
      metadata,
      ipAddress,
      userAgent,
      result,
      errorMessage,
    });
  }

  /**
   * Log organization management events
   */
  async logOrganization(
    userId: string,
    action: "CREATE" | "UPDATE" | "DELETE" | "VERIFY" | "SUSPEND",
    organizationId: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
    result: AuditResult = AuditResult.SUCCESS,
    errorMessage?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: `organization.${action.toLowerCase()}`,
      resourceType: "Organization",
      resourceId: organizationId,
      metadata,
      ipAddress,
      userAgent,
      result,
      errorMessage,
    });
  }

  /**
   * Log user management events
   */
  async logUserManagement(
    adminUserId: string,
    action:
      | "CREATE"
      | "UPDATE"
      | "DELETE"
      | "ACTIVATE"
      | "DEACTIVATE"
      | "ROLE_CHANGE",
    targetUserId: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
    result: AuditResult = AuditResult.SUCCESS,
    errorMessage?: string
  ): Promise<void> {
    await this.log({
      userId: adminUserId,
      action: `user.${action.toLowerCase()}`,
      resourceType: "User",
      resourceId: targetUserId,
      metadata,
      ipAddress,
      userAgent,
      result,
      errorMessage,
    });
  }

  /**
   * Log referral events
   */
  async logReferral(
    userId: string,
    action: "CREATE" | "UPDATE" | "ACCEPT" | "DECLINE" | "COMPLETE" | "CANCEL",
    referralId: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
    result: AuditResult = AuditResult.SUCCESS,
    errorMessage?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: `referral.${action.toLowerCase()}`,
      resourceType: "DischargeCase", // Referrals are discharge cases
      resourceId: referralId,
      metadata,
      ipAddress,
      userAgent,
      result,
      errorMessage,
    });
  }

  /**
   * Log system events
   */
  async logSystem(
    action: string,
    metadata?: Record<string, any>,
    result: AuditResult = AuditResult.SUCCESS,
    errorMessage?: string
  ): Promise<void> {
    await this.log({
      action: `system.${action}`,
      resourceType: "System",
      metadata,
      result,
      errorMessage,
    });
  }

  /**
   * Log security events
   */
  async logSecurity(
    userId: string,
    action:
      | "SUSPICIOUS_ACTIVITY"
      | "RATE_LIMIT_HIT"
      | "INVALID_ACCESS"
      | "PERMISSION_DENIED",
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
    result: AuditResult = AuditResult.FAILURE
  ): Promise<void> {
    await this.log({
      userId,
      action: `security.${action.toLowerCase()}`,
      resourceType: "Security",
      resourceId: userId,
      metadata: {
        ...metadata,
        securityEvent: true,
        severity: "HIGH",
      },
      ipAddress,
      userAgent,
      result,
    });
  }

  /**
   * Search audit logs with filtering
   */
  async search(criteria: AuditSearchCriteria) {
    const where: Prisma.AuditLogWhereInput = {};

    if (criteria.userId) where.userId = criteria.userId;
    if (criteria.action)
      where.action = { contains: criteria.action, mode: "insensitive" };
    if (criteria.resourceType) where.resourceType = criteria.resourceType;
    if (criteria.resourceId) where.resourceId = criteria.resourceId;
    if (criteria.result) where.result = criteria.result;
    if (criteria.ipAddress) where.ipAddress = criteria.ipAddress;

    if (criteria.fromDate || criteria.toDate) {
      where.timestamp = {};
      if (criteria.fromDate) where.timestamp.gte = criteria.fromDate;
      if (criteria.toDate) where.timestamp.lte = criteria.toDate;
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
        orderBy: { timestamp: "desc" },
        take: criteria.limit || 50,
        skip: criteria.offset || 0,
      }),
      db.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      hasMore: (criteria.offset || 0) + logs.length < total,
    };
  }

  /**
   * Get audit statistics
   */
  async getStatistics(fromDate: Date, toDate: Date) {
    const [
      totalLogs,
      successfulActions,
      failedActions,
      errorActions,
      phiAccess,
      securityEvents,
      topActions,
      topUsers,
    ] = await Promise.all([
      // Total logs
      db.auditLog.count({
        where: {
          timestamp: { gte: fromDate, lte: toDate },
        },
      }),

      // Successful actions
      db.auditLog.count({
        where: {
          timestamp: { gte: fromDate, lte: toDate },
          result: AuditResult.SUCCESS,
        },
      }),

      // Failed actions
      db.auditLog.count({
        where: {
          timestamp: { gte: fromDate, lte: toDate },
          result: AuditResult.FAILURE,
        },
      }),

      // Error actions
      db.auditLog.count({
        where: {
          timestamp: { gte: fromDate, lte: toDate },
          result: AuditResult.ERROR,
        },
      }),

      // PHI access logs
      db.auditLog.count({
        where: {
          timestamp: { gte: fromDate, lte: toDate },
          action: { startsWith: "phi." },
        },
      }),

      // Security events
      db.auditLog.count({
        where: {
          timestamp: { gte: fromDate, lte: toDate },
          action: { startsWith: "security." },
        },
      }),

      // Top 10 actions
      db.auditLog.groupBy({
        by: ["action"],
        where: {
          timestamp: { gte: fromDate, lte: toDate },
        },
        _count: true,
        orderBy: { _count: { action: "desc" } },
        take: 10,
      }),

      // Top 10 users by activity
      db.auditLog.groupBy({
        by: ["userId"],
        where: {
          timestamp: { gte: fromDate, lte: toDate },
          userId: { not: null },
        },
        _count: true,
        orderBy: { _count: { userId: "desc" } },
        take: 10,
      }),
    ]);

    return {
      overview: {
        totalLogs,
        successfulActions,
        failedActions,
        errorActions,
        successRate: totalLogs > 0 ? (successfulActions / totalLogs) * 100 : 0,
      },
      compliance: {
        phiAccess,
        securityEvents,
      },
      topActions: topActions.map((item) => ({
        action: item.action,
        count: item._count,
      })),
      topUsers: topUsers.map((item) => ({
        userId: item.userId,
        count: item._count,
      })),
    };
  }

  /**
   * Clean up old audit logs (retention policy)
   */
  async cleanup(retentionDays: number = 2555): Promise<number> {
    // 7 years default for HIPAA
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await db.auditLog.deleteMany({
      where: {
        timestamp: { lt: cutoffDate },
        // Never delete PHI access logs - they have special retention requirements
        NOT: {
          action: { startsWith: "phi." },
        },
      },
    });

    return result.count;
  }

  /**
   * Export audit logs for compliance reporting
   */
  async exportForCompliance(
    fromDate: Date,
    toDate: Date,
    includeMetadata: boolean = false
  ) {
    const logs = await db.auditLog.findMany({
      where: {
        timestamp: { gte: fromDate, lte: toDate },
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { timestamp: "asc" },
    });

    return logs.map((log) => ({
      timestamp: log.timestamp.toISOString(),
      userId: log.userId,
      userEmail: log.user?.email,
      userName: log.user ? `${log.user.firstName} ${log.user.lastName}` : null,
      userRole: log.user?.role,
      action: log.action,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      result: log.result,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      errorMessage: log.errorMessage,
      ...(includeMetadata && { metadata: log.metadata }),
    }));
  }
}

// Export singleton instance
export const auditService = new AuditService();
