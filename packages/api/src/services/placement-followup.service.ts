import { db } from "@carelink/database";
import { FollowUpType, FollowUpOutcome, Prisma } from "@prisma/client";
import { addDays } from "date-fns";

interface CreateFollowUpData {
  type: FollowUpType;
  scheduledAt: Date | string;
  notes?: string;
}

interface CompleteFollowUpData {
  notes: string;
  outcome: FollowUpOutcome;
}

export class PlacementFollowUpService {
  /**
   * Create a follow-up for a placement
   */
  async createFollowUp(
    placementId: string,
    data: CreateFollowUpData,
    userId: string
  ): Promise<any> {
    try {
      // Verify placement exists and user has access
      const placement = await db.placement.findUnique({
        where: { id: placementId },
        include: {
          provider: {
            include: {
              organization: {
                include: {
                  users: {
                    where: { id: userId },
                  },
                },
              },
            },
          },
        },
      });

      if (!placement) {
        throw new Error("Placement not found");
      }

      if (placement.provider.organization.users.length === 0) {
        throw new Error("Access denied: You don't have permission to manage this placement");
      }

      const followUp = await db.placementFollowUp.create({
        data: {
          placementId,
          type: data.type,
          scheduledAt: new Date(data.scheduledAt),
          notes: data.notes,
        },
      });

      // Emit socket event for real-time update
      try {
        const { getSocketServer } = await import("../websocket/socket.server");
        const socketServer = getSocketServer();
        socketServer.emitToPlacement(placementId, "placement:followup:created", {
          placementId,
          followUp,
        });
      } catch (socketError) {
        console.error("Failed to emit socket event:", socketError);
        // Don't throw - socket failure shouldn't break the operation
      }

      return followUp;
    } catch (error) {
      console.error("Create follow-up error:", error);
      throw error instanceof Error ? error : new Error("Failed to create follow-up");
    }
  }

  /**
   * Get all follow-ups for a placement
   */
  async getFollowUps(placementId: string, userId: string): Promise<any[]> {
    try {
      // Check user role first
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      // Admin and Super Admin have system-wide access
      const isSystemAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

      if (!isSystemAdmin) {
        // For non-admin users, verify access through organization
        const placement = await db.placement.findUnique({
          where: { id: placementId },
          include: {
            provider: {
              include: {
                organization: {
                  include: {
                    users: {
                      where: { id: userId },
                    },
                  },
                },
              },
            },
          },
        });

        if (!placement) {
          throw new Error("Placement not found");
        }

        if (placement.provider.organization.users.length === 0) {
          throw new Error("Access denied");
        }
      } else {
        // For admins, just verify placement exists
        const placement = await db.placement.findUnique({
          where: { id: placementId },
          select: { id: true },
        });

        if (!placement) {
          throw new Error("Placement not found");
        }
      }

      const followUps = await db.placementFollowUp.findMany({
        where: { placementId },
        orderBy: { scheduledAt: "asc" },
      });

      return followUps;
    } catch (error) {
      console.error("Get follow-ups error:", error);
      throw error instanceof Error ? error : new Error("Failed to retrieve follow-ups");
    }
  }

  /**
   * Complete a follow-up
   */
  async completeFollowUp(
    followUpId: string,
    data: CompleteFollowUpData,
    userId: string
  ): Promise<any> {
    try {
      // Verify follow-up exists and user has access
      const followUp = await db.placementFollowUp.findUnique({
        where: { id: followUpId },
        include: {
          placement: {
            include: {
              provider: {
                include: {
                  organization: {
                    include: {
                      users: {
                        where: { id: userId },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!followUp) {
        throw new Error("Follow-up not found");
      }

      if (followUp.placement.provider.organization.users.length === 0) {
        throw new Error("Access denied");
      }

      if (followUp.completedAt) {
        throw new Error("Follow-up already completed");
      }

      const updated = await db.placementFollowUp.update({
        where: { id: followUpId },
        data: {
          completedAt: new Date(),
          completedBy: userId,
          notes: data.notes,
          outcome: data.outcome,
        },
      });

      // Emit socket event for real-time update
      try {
        const { getSocketServer } = await import("../websocket/socket.server");
        const socketServer = getSocketServer();
        socketServer.emitToPlacement(followUp.placementId, "placement:followup:completed", {
          placementId: followUp.placementId,
          followUpId,
          outcome: data.outcome,
        });
      } catch (socketError) {
        console.error("Failed to emit socket event:", socketError);
      }

      return updated;
    } catch (error) {
      console.error("Complete follow-up error:", error);
      throw error instanceof Error ? error : new Error("Failed to complete follow-up");
    }
  }

  /**
   * Get upcoming follow-ups for a provider
   */
  async getUpcomingFollowUps(providerId: string, userId: string): Promise<any[]> {
    try {
      // Verify user has access to provider
      const provider = await db.provider.findUnique({
        where: { id: providerId },
        include: {
          organization: {
            include: {
              users: {
                where: { id: userId },
              },
            },
          },
        },
      });

      if (!provider) {
        throw new Error("Provider not found");
      }

      if (provider.organization.users.length === 0) {
        throw new Error("Access denied");
      }

      const now = new Date();
      const followUps = await db.placementFollowUp.findMany({
        where: {
          placement: {
            providerId,
          },
          completedAt: null,
          scheduledAt: {
            lte: addDays(now, 7), // Next 7 days
          },
        },
        include: {
          placement: {
            include: {
              referral: {
                select: {
                  clientInitials: true,
                  clientAge: true,
                },
              },
              dischargeCase: {
                select: {
                  patientInitials: true,
                  patientAge: true,
                },
              },
              opening: {
                include: {
                  home: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { scheduledAt: "asc" },
        take: 10,
      });

      return followUps;
    } catch (error) {
      console.error("Get upcoming follow-ups error:", error);
      throw error instanceof Error ? error : new Error("Failed to retrieve upcoming follow-ups");
    }
  }

  /**
   * Schedule default follow-ups for a placement
   * Called automatically when placement is confirmed
   */
  async scheduleDefaultFollowUps(placementId: string): Promise<any[]> {
    try {
      const placement = await db.placement.findUnique({
        where: { id: placementId },
      });

      if (!placement) {
        throw new Error("Placement not found");
      }

      if (!placement.moveInDate) {
        throw new Error("Move-in date not set");
      }

      const moveInDate = new Date(placement.moveInDate);

      // Check if follow-ups already exist
      const existing = await db.placementFollowUp.findMany({
        where: {
          placementId,
          type: {
            in: [
              FollowUpType.DAY_1_CHECKIN,
              FollowUpType.DAY_7_CHECKIN,
              FollowUpType.DAY_30_CHECKIN,
              FollowUpType.DAY_90_CHECKIN,
            ],
          },
        },
      });

      if (existing.length > 0) {
        return existing; // Already scheduled
      }

      // Create default follow-ups
      const followUps = await db.$transaction([
        db.placementFollowUp.create({
          data: {
            placementId,
            type: FollowUpType.DAY_1_CHECKIN,
            scheduledAt: addDays(moveInDate, 1),
          },
        }),
        db.placementFollowUp.create({
          data: {
            placementId,
            type: FollowUpType.DAY_7_CHECKIN,
            scheduledAt: addDays(moveInDate, 7),
          },
        }),
        db.placementFollowUp.create({
          data: {
            placementId,
            type: FollowUpType.DAY_30_CHECKIN,
            scheduledAt: addDays(moveInDate, 30),
          },
        }),
        db.placementFollowUp.create({
          data: {
            placementId,
            type: FollowUpType.DAY_90_CHECKIN,
            scheduledAt: addDays(moveInDate, 90),
          },
        }),
      ]);

      return followUps;
    } catch (error) {
      console.error("Schedule default follow-ups error:", error);
      throw error instanceof Error ? error : new Error("Failed to schedule follow-ups");
    }
  }

  /**
   * Delete a follow-up
   */
  async deleteFollowUp(followUpId: string, userId: string): Promise<void> {
    try {
      // Verify follow-up exists and user has access
      const followUp = await db.placementFollowUp.findUnique({
        where: { id: followUpId },
        include: {
          placement: {
            include: {
              provider: {
                include: {
                  organization: {
                    include: {
                      users: {
                        where: { id: userId },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!followUp) {
        throw new Error("Follow-up not found");
      }

      if (followUp.placement.provider.organization.users.length === 0) {
        throw new Error("Access denied");
      }

      await db.placementFollowUp.delete({
        where: { id: followUpId },
      });

      // Emit socket event for real-time update
      try {
        const { getSocketServer } = await import("../websocket/socket.server");
        const socketServer = getSocketServer();
        socketServer.emitToPlacement(followUp.placementId, "placement:followup:deleted", {
          placementId: followUp.placementId,
          followUpId,
        });
      } catch (socketError) {
        console.error("Failed to emit socket event:", socketError);
      }
    } catch (error) {
      console.error("Delete follow-up error:", error);
      throw error instanceof Error ? error : new Error("Failed to delete follow-up");
    }
  }
}
