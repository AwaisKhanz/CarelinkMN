import { db } from "@carelink/database";
import {
  CaseManager,
  CaseManagerDashboard,
  CaseManagerStats,
  UpdateCaseManagerData,
} from "@carelink/types";
import { ReferralService } from "./referral.service";

export class CaseManagerService {
  // Get case manager by user ID
  async getCaseManagerByUserId(userId: string): Promise<CaseManager | null> {
    try {
      const caseManager = await db.caseManager.findFirst({
        where: {
          organization: {
            users: {
              some: {
                id: userId,
              },
            },
          },
        },
        include: {
          organization: true,
        },
      });

      if (!caseManager) {
        return null;
      }

      return this.mapCaseManagerToType(caseManager);
    } catch (error) {
      console.error("Get case manager by user ID error:", error);
      throw new Error("Failed to retrieve case manager by user ID");
    }
  }

  // Update case manager profile
  async updateCaseManager(
    userId: string,
    updateData: UpdateCaseManagerData
  ): Promise<CaseManager> {
    try {
      const caseManager = await db.caseManager.findFirst({
        where: {
          organization: {
            users: {
              some: {
                id: userId,
              },
            },
          },
        },
      });

      if (!caseManager) {
        throw new Error("Case manager profile not found");
      }

      const updatedCaseManager = await db.caseManager.update({
        where: { id: caseManager.id },
        data: {
          firstName: updateData.firstName,
          lastName: updateData.lastName,
          phone: updateData.phone,
          licenseNumber: updateData.licenseNumber,
          licenseExpiry: updateData.licenseExpiry
            ? new Date(updateData.licenseExpiry)
            : undefined,
          isActive: updateData.isActive,
        },
        include: {
          organization: true,
        },
      });

      return this.mapCaseManagerToType(updatedCaseManager);
    } catch (error) {
      console.error("Update case manager error:", error);
      throw new Error("Failed to update case manager profile");
    }
  }

  /**
   * Get case manager dashboard data
   * Delegates to ReferralService for dashboard aggregation
   */
  async getCaseManagerDashboard(
    userId: string
  ): Promise<CaseManagerDashboard> {
    const referralService = new ReferralService();
    return referralService.getCaseManagerDashboard(userId);
  }

  /**
   * Get case manager statistics
   */
  async getCaseManagerStats(
    userId: string,
    dateRange?: { startDate?: Date; endDate?: Date }
  ): Promise<CaseManagerStats> {
    try {
      const whereClause: any = {
        caseManagerId: userId,
      };

      if (dateRange?.startDate || dateRange?.endDate) {
        whereClause.createdAt = {};
        if (dateRange.startDate) {
          whereClause.createdAt.gte = dateRange.startDate;
        }
        if (dateRange.endDate) {
          whereClause.createdAt.lte = dateRange.endDate;
        }
      }

      // Get all referrals
      const referrals = await db.referral.findMany({
        where: whereClause,
        include: {
          placements: true,
        },
      });

      // Get placements
      const placements = await db.placement.findMany({
        where: {
          referral: {
            caseManagerId: userId,
            ...(dateRange?.startDate || dateRange?.endDate
              ? {
                  createdAt: {
                    ...(dateRange.startDate ? { gte: dateRange.startDate } : {}),
                    ...(dateRange.endDate ? { lte: dateRange.endDate } : {}),
                  },
                }
              : {}),
          },
        },
      });

      // Calculate stats
      const totalReferrals = referrals.length;
      const activeReferrals = referrals.filter(
        (r) =>
          r.status !== "CLOSED" &&
          r.status !== "CANCELLED" &&
          r.status !== "PLACED"
      ).length;
      const completedReferrals = referrals.filter(
        (r) => r.status === "PLACED" || r.status === "CLOSED"
      ).length;
      const pendingPlacements = placements.filter(
        (p) => p.status === "PENDING"
      ).length;
      const completedPlacements = placements.filter(
        (p) => p.status === "COMPLETED"
      ).length;

      // Calculate average placement time
      const completedPlacementsWithDates = placements.filter(
        (p) => p.status === "COMPLETED" && p.createdAt && p.completedAt
      );
      const averagePlacementTime =
        completedPlacementsWithDates.length > 0
          ? completedPlacementsWithDates.reduce((sum, p) => {
              const days =
                (new Date(p.completedAt!).getTime() -
                  new Date(p.createdAt).getTime()) /
                (1000 * 60 * 60 * 24);
              return sum + days;
            }, 0) / completedPlacementsWithDates.length
          : 0;

      // Calculate response rate (from messages)
      const messageThreads = await db.messageThread.findMany({
        where: {
          referral: {
            caseManagerId: userId,
            ...(dateRange?.startDate || dateRange?.endDate
              ? {
                  createdAt: {
                    ...(dateRange.startDate ? { gte: dateRange.startDate } : {}),
                    ...(dateRange.endDate ? { lte: dateRange.endDate } : {}),
                  },
                }
              : {}),
          },
        },
      });
      const totalMessages = messageThreads.length;
      const respondedMessages = messageThreads.filter(
        (t) => t.firstResponseAt !== null
      ).length;
      const responseRate =
        totalMessages > 0 ? (respondedMessages / totalMessages) * 100 : 0;

      // Group by status
      const referralsByStatus: Record<string, number> = {};
      referrals.forEach((r) => {
        referralsByStatus[r.status] = (referralsByStatus[r.status] || 0) + 1;
      });

      // Group by urgency
      const referralsByUrgency: Record<string, number> = {};
      referrals.forEach((r) => {
        referralsByUrgency[r.urgency] =
          (referralsByUrgency[r.urgency] || 0) + 1;
      });

      // Group by payer
      const referralsByPayer: Record<string, number> = {};
      referrals.forEach((r) => {
        referralsByPayer[r.primaryPayer] =
          (referralsByPayer[r.primaryPayer] || 0) + 1;
      });

      return {
        totalReferrals,
        activeReferrals,
        completedReferrals,
        pendingPlacements,
        completedPlacements,
        averagePlacementTime,
        responseRate,
        referralsByStatus: referralsByStatus as any,
        referralsByUrgency: referralsByUrgency as any,
        referralsByPayer: referralsByPayer as any,
      };
    } catch (error) {
      console.error("Get case manager stats error:", error);
      throw new Error("Failed to retrieve case manager statistics");
    }
  }

  /**
   * Map Prisma case manager to CaseManager type
   */
  private mapCaseManagerToType(caseManager: any): CaseManager {
    return {
      id: caseManager.id,
      organizationId: caseManager.organizationId,
      firstName: caseManager.firstName,
      lastName: caseManager.lastName,
      email: caseManager.email,
      phone: caseManager.phone,
      licenseNumber: caseManager.licenseNumber,
      licenseExpiry: caseManager.licenseExpiry?.toISOString(),
      isActive: caseManager.isActive,
      createdAt: caseManager.createdAt.toISOString(),
      updatedAt: caseManager.updatedAt.toISOString(),
      organization: caseManager.organization
        ? {
            id: caseManager.organization.id,
            name: caseManager.organization.name,
            type: caseManager.organization.type,
            email: caseManager.organization.email,
            phone: caseManager.organization.phone,
            city: caseManager.organization.city,
            state: caseManager.organization.state,
          }
        : undefined,
    };
  }
}
