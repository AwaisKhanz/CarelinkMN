import { db } from "@carelink/database";
import {
  Prisma,
  PlacementStatus,
  NotificationType,
} from "@prisma/client";
import { OpeningService } from "./opening.service";

export interface CreatePlacementData {
  openingId: string;
  referralId?: string;
  dischargeCaseId?: string;
  placementDate: Date | string;
  moveInDate?: Date | string;
}

export interface UpdatePlacementData {
  status?: PlacementStatus;
  placementDate?: Date | string;
  moveInDate?: Date | string;
}

export interface PlacementFilters {
  providerId?: string;
  openingId?: string;
  referralId?: string;
  dischargeCaseId?: string;
  status?: PlacementStatus;
  page?: number;
  limit?: number;
  search?: string;
}

export class PlacementService {
  private openingService: OpeningService;

  constructor() {
    this.openingService = new OpeningService();
  }

  // Verify user has access to placement's provider
  async verifyPlacementAccess(
    userId: string,
    placementId: string
  ): Promise<boolean> {
    try {
      const placement = await db.placement.findFirst({
        where: {
          id: placementId,
          provider: {
            organization: {
              users: {
                some: {
                  id: userId,
                },
              },
            },
          },
        },
      });

      return !!placement;
    } catch (error) {
      console.error("Verify placement access error:", error);
      return false;
    }
  }

  // Verify user has access to provider
  async verifyProviderAccess(
    userId: string,
    providerId: string
  ): Promise<boolean> {
    try {
      const provider = await db.provider.findFirst({
        where: {
          id: providerId,
          organization: {
            users: {
              some: {
                id: userId,
              },
            },
          },
        },
      });

      return !!provider;
    } catch (error) {
      console.error("Verify provider access error:", error);
      return false;
    }
  }

  // Create a new placement
  async createPlacement(
    data: CreatePlacementData,
    userId: string
  ): Promise<any> {
    try {
      // Get opening to verify access and get providerId
      const opening = await db.opening.findUnique({
        where: { id: data.openingId },
        include: {
          provider: true,
        },
      });

      if (!opening) {
        throw new Error("Opening not found");
      }

      // Verify user has access to opening's provider
      const hasAccess = await this.verifyProviderAccess(
        userId,
        opening.providerId
      );
      if (!hasAccess) {
        throw new Error("Access denied");
      }

      // Verify opening has available spots
      if (opening.spotsAvailable <= 0) {
        throw new Error("No spots available in this opening");
      }

      // Verify opening status is OPEN
      if (opening.status !== "OPEN") {
        throw new Error("Opening is not available for placement");
      }

      // If referralId is provided, verify it exists
      if (data.referralId) {
        const referral = await db.referral.findUnique({
          where: { id: data.referralId },
        });
        if (!referral) {
          throw new Error("Referral not found");
        }
      }

      // If dischargeCaseId is provided, verify it exists and is unique
      if (data.dischargeCaseId) {
        const existingPlacement = await db.placement.findUnique({
          where: { dischargeCaseId: data.dischargeCaseId },
        });
        if (existingPlacement) {
          throw new Error("Discharge case already has a placement");
        }
      }

      // Use transaction to create placement and decrement opening spots atomically
      const result = await db.$transaction(async (tx) => {
        // Re-read opening with home for transactional checks
        const openingForTx = await tx.opening.findUnique({
          where: { id: data.openingId },
          include: {
            home: {
              select: {
                id: true,
                capacity: true,
                currentOccupancy: true,
              },
            },
          },
        });
        if (!openingForTx) {
          throw new Error("Opening not found");
        }
        // Capacity invariant: home.currentOccupancy < home.capacity
        if (
          openingForTx.home &&
          openingForTx.home.currentOccupancy >= openingForTx.home.capacity
        ) {
          throw new Error(
            "Home capacity reached. Cannot create placement for this opening."
          );
        }

        // Create placement
        const placement = await tx.placement.create({
          data: {
            providerId: opening.providerId,
            openingId: data.openingId,
            referralId: data.referralId,
            dischargeCaseId: data.dischargeCaseId,
            placementDate: new Date(data.placementDate),
            moveInDate: data.moveInDate ? new Date(data.moveInDate) : null,
            status: PlacementStatus.PENDING,
          },
          include: {
            referral: {
              select: {
                id: true,
                referralNumber: true,
                clientAge: true,
                clientGender: true,
                clientInitials: true,
                careLevels: true,
                servicesNeeded: true,
                primaryPayer: true,
                targetMoveDate: true,
                urgency: true,
                status: true,
              },
            },
            dischargeCase: {
              select: {
                id: true,
                caseNumber: true,
                patientAge: true,
                patientGender: true,
                patientInitials: true,
                diagnosisCodes: true,
                mobilityStatus: true,
                targetDischargeDate: true,
                primaryInsurance: true,
                status: true,
              },
            },
            opening: {
              include: {
                home: {
                  select: {
                    id: true,
                    name: true,
                    city: true,
                    state: true,
                    addressLine1: true,
                  },
                },
              },
            },
            provider: {
              include: {
                organization: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        });

        // Decrement opening spots atomically
        const updatedOpening = await tx.opening.update({
          where: { id: data.openingId },
          data: {
            spotsAvailable: {
              decrement: 1,
            },
            // When spots change, refresh freshness timestamp
            freshnessTimestamp: new Date(),
          },
        });

        // Update opening status to FILLED if no spots left
        if (updatedOpening.spotsAvailable === 0) {
          await tx.opening.update({
            where: { id: data.openingId },
            data: {
              status: "FILLED",
            },
          });
        }

        // Increment home's current occupancy
        if (openingForTx.home) {
          await tx.home.update({
            where: { id: openingForTx.home.id },
            data: {
              currentOccupancy: {
                increment: 1,
              },
            },
          });
        }

        return placement;
      });

      return result;
    } catch (error) {
      console.error("Create placement error:", error);
      throw error;
    }
  }

  // Get placements with filters
  async getPlacements(filters: PlacementFilters, userId: string): Promise<{
    placements: any[];
    pagination: {
      total: number;
      pages: number;
      page: number;
      limit: number;
    };
  }> {
    try {
      const {
        providerId,
        openingId,
        referralId,
        dischargeCaseId,
        status,
        page = 1,
        limit = 20,
        search,
      } = filters;

      const where: any = {};

      // Get user role and organization for access control
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { role: true, organizationId: true },
      });

      // If user is Hospital SW, filter placements by their hospital's discharge cases
      if (user?.role === "HOSPITAL_SW" && user.organizationId) {
        where.dischargeCase = {
          hospitalId: user.organizationId,
        };
      }

      // If providerId is provided, verify access
      if (providerId) {
        const hasAccess = await this.verifyProviderAccess(userId, providerId);
        if (!hasAccess) {
          throw new Error("Access denied");
        }
        where.providerId = providerId;
        // Remove dischargeCase filter if providerId is specified (provider takes precedence)
        delete where.dischargeCase;
      }

      if (openingId) {
        const hasAccess = await this.openingService.verifyOpeningAccess(
          userId,
          openingId
        );
        if (!hasAccess) {
          throw new Error("Access denied");
        }
        where.openingId = openingId;
      }

      if (referralId) {
        where.referralId = referralId;
      }

      if (dischargeCaseId) {
        // Verify user has access to the discharge case (for Hospital SW users)
        if (user?.role === "HOSPITAL_SW" && user.organizationId) {
          // Verify the discharge case belongs to the user's hospital
          const dischargeCase = await db.dischargeCase.findFirst({
            where: {
              id: dischargeCaseId,
              hospitalId: user.organizationId,
            },
          });

          if (!dischargeCase) {
            throw new Error("Access denied: Discharge case not found or access denied");
          }
        }
        where.dischargeCaseId = dischargeCaseId;
        // Remove the general dischargeCase filter if specific dischargeCaseId is provided
        delete where.dischargeCase;
      }

      if (status) {
        where.status = status;
      }

      // Search functionality
      if (search && search.trim()) {
        const searchTerm = search.trim().toLowerCase();
        where.OR = [
          {
            referral: {
              referralNumber: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
          },
          {
            dischargeCase: {
              caseNumber: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
          },
          {
            opening: {
              home: {
                name: {
                  contains: searchTerm,
                  mode: "insensitive",
                },
              },
            },
          },
        ];
      }

      const skip = (page - 1) * limit;

      const [placements, total] = await Promise.all([
        db.placement.findMany({
          where,
          include: {
            referral: {
              select: {
                id: true,
                referralNumber: true,
                clientAge: true,
                clientGender: true,
                clientInitials: true,
                careLevels: true,
                servicesNeeded: true,
                primaryPayer: true,
                targetMoveDate: true,
                urgency: true,
                status: true,
              },
            },
            dischargeCase: {
              select: {
                id: true,
                caseNumber: true,
                patientAge: true,
                patientGender: true,
                patientInitials: true,
                diagnosisCodes: true,
                mobilityStatus: true,
                targetDischargeDate: true,
                primaryInsurance: true,
                status: true,
              },
            },
            opening: {
              include: {
                home: {
                  select: {
                    id: true,
                    name: true,
                    city: true,
                    state: true,
                    addressLine1: true,
                  },
                },
              },
            },
            provider: {
              include: {
                organization: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: [{ createdAt: "desc" }],
          skip,
          take: limit,
        }),
        db.placement.count({ where }),
      ]);

      return {
        placements,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page,
          limit,
        },
      };
    } catch (error) {
      console.error("Get placements error:", error);
      throw error;
    }
  }

  // Get placement by ID
  async getPlacementById(placementId: string, userId: string): Promise<any> {
    try {
      const hasAccess = await this.verifyPlacementAccess(userId, placementId);
      if (!hasAccess) {
        throw new Error("Access denied");
      }

      const placement = await db.placement.findUnique({
        where: { id: placementId },
        include: {
          referral: {
            select: {
              id: true,
              referralNumber: true,
              clientAge: true,
              clientGender: true,
              clientInitials: true,
              careLevels: true,
              servicesNeeded: true,
              primaryPayer: true,
              targetMoveDate: true,
              urgency: true,
              status: true,
            },
          },
          dischargeCase: {
            select: {
              id: true,
              caseNumber: true,
              patientAge: true,
              patientGender: true,
              patientInitials: true,
              diagnosisCodes: true,
              mobilityStatus: true,
              targetDischargeDate: true,
              primaryInsurance: true,
              status: true,
            },
          },
          opening: {
            include: {
              home: {
                select: {
                  id: true,
                  name: true,
                  city: true,
                  state: true,
                  addressLine1: true,
                  capacity: true,
                  currentOccupancy: true,
                },
              },
            },
          },
          provider: {
            include: {
              organization: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!placement) {
        throw new Error("Placement not found");
      }

      return placement;
    } catch (error) {
      console.error("Get placement by ID error:", error);
      throw error;
    }
  }

  // Update placement
  async updatePlacement(
    placementId: string,
    data: UpdatePlacementData,
    userId: string
  ): Promise<any> {
    try {
      const hasAccess = await this.verifyPlacementAccess(userId, placementId);
      if (!hasAccess) {
        throw new Error("Access denied");
      }

      const updateData: any = {};

      if (data.status !== undefined) {
        updateData.status = data.status;

        // Update timestamps based on status
        if (data.status === PlacementStatus.CONFIRMED) {
          updateData.confirmedAt = new Date();
        } else if (data.status === PlacementStatus.COMPLETED) {
          updateData.completedAt = new Date();
        }
      }

      if (data.placementDate !== undefined) {
        updateData.placementDate = new Date(data.placementDate);
      }

      if (data.moveInDate !== undefined) {
        updateData.moveInDate = data.moveInDate
          ? new Date(data.moveInDate)
          : null;
      }

      const placement = await db.placement.update({
        where: { id: placementId },
        data: updateData,
        include: {
          referral: {
            select: {
              id: true,
              referralNumber: true,
              caseManagerId: true,
              clientAge: true,
              clientGender: true,
              clientInitials: true,
              careLevels: true,
              servicesNeeded: true,
              primaryPayer: true,
              targetMoveDate: true,
              urgency: true,
              status: true,
            },
          },
          dischargeCase: {
            select: {
              id: true,
              caseNumber: true,
              socialWorkerId: true,
              patientAge: true,
              patientGender: true,
              patientInitials: true,
              diagnosisCodes: true,
              mobilityStatus: true,
              targetDischargeDate: true,
              primaryInsurance: true,
              status: true,
            },
          },
          opening: {
            include: {
              home: {
                select: {
                  id: true,
                  name: true,
                  city: true,
                  state: true,
                  addressLine1: true,
                },
              },
            },
          },
          provider: {
            include: {
              organization: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      // Create notification when placement is confirmed
      if (data.status === PlacementStatus.CONFIRMED) {
        try {
          const { NotificationService } = await import("./notification.service");
          const notificationService = new NotificationService();

          const recipientId = placement.referral?.caseManagerId || placement.dischargeCase?.socialWorkerId;
          if (recipientId) {
            const contextInfo = placement.referral
              ? `Referral ${placement.referral.referralNumber}`
              : placement.dischargeCase
                ? `Discharge Case ${placement.dischargeCase.caseNumber}`
                : "Placement";

            await notificationService.createNotification({
              userId: recipientId,
              type: NotificationType.PLACEMENT_CONFIRMED,
              title: "Placement Confirmed",
              message: `Placement for ${contextInfo} has been confirmed at ${placement.opening?.home?.name || "provider facility"}.`,
              channels: ["IN_APP", "EMAIL"],
              actionUrl: placement.referral
                ? `/case-manager/referrals/${placement.referral.id}`
                : `/placements/${placementId}`,
            });
          }
        } catch (notifError) {
          console.error("Failed to create placement confirmation notification:", notifError);
          // Don't throw - notification failure shouldn't break placement update
        }
      }

      return placement;
    } catch (error) {
      console.error("Update placement error:", error);
      throw error;
    }
  }

  // Cancel placement (restore opening spots)
  async cancelPlacement(
    placementId: string,
    userId: string,
    reason?: string
  ): Promise<any> {
    try {
      const hasAccess = await this.verifyPlacementAccess(userId, placementId);
      if (!hasAccess) {
        throw new Error("Access denied");
      }

      // Use transaction to cancel placement and restore opening spots
      const result = await db.$transaction(async (tx) => {
        const placement = await tx.placement.findUnique({
          where: { id: placementId },
        });

        if (!placement) {
          throw new Error("Placement not found");
        }

        if (placement.status === PlacementStatus.CANCELLED) {
          throw new Error("Placement is already cancelled");
        }

        // Update placement status
        const updatedPlacement = await tx.placement.update({
          where: { id: placementId },
          data: {
            status: PlacementStatus.CANCELLED,
          },
          include: {
            referral: {
              select: {
                id: true,
                referralNumber: true,
                clientAge: true,
                clientGender: true,
                clientInitials: true,
                careLevels: true,
                servicesNeeded: true,
                primaryPayer: true,
                targetMoveDate: true,
                urgency: true,
                status: true,
              },
            },
            dischargeCase: {
              select: {
                id: true,
                caseNumber: true,
                patientAge: true,
                patientGender: true,
                patientInitials: true,
                diagnosisCodes: true,
                mobilityStatus: true,
                targetDischargeDate: true,
                primaryInsurance: true,
                status: true,
              },
            },
            opening: {
              include: {
                home: {
                  select: {
                    id: true,
                    name: true,
                    city: true,
                    state: true,
                    addressLine1: true,
                  },
                },
              },
            },
            provider: {
              include: {
                organization: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        });

        // Restore opening spot and decrement home occupancy
        const opening = await tx.opening.findUnique({
          where: { id: placement.openingId },
          include: {
            home: {
              select: {
                id: true,
                currentOccupancy: true,
              },
            },
          },
        });

        if (opening) {
          await tx.opening.update({
            where: { id: placement.openingId },
            data: {
              spotsAvailable: {
                increment: 1,
              },
              // If opening was FILLED, change back to OPEN
              status: opening.status === "FILLED" ? "OPEN" : opening.status,
              freshnessTimestamp: new Date(),
            },
          });

          if (opening.home) {
            await tx.home.update({
              where: { id: opening.home.id },
              data: {
                currentOccupancy: {
                  decrement: opening.home.currentOccupancy > 0 ? 1 : 0,
                },
              },
            });
          }
        }

        return updatedPlacement;
      });

      return result;
    } catch (error) {
      console.error("Cancel placement error:", error);
      throw error;
    }
  }

  // Generate placement packet (placeholder - will be implemented with document generation)
  async generatePacket(placementId: string, userId: string): Promise<{
    packetUrl: string;
  }> {
    try {
      const hasAccess = await this.verifyPlacementAccess(userId, placementId);
      if (!hasAccess) {
        throw new Error("Access denied");
      }

      const placement = await db.placement.findUnique({
        where: { id: placementId },
      });

      if (!placement) {
        throw new Error("Placement not found");
      }

      // TODO: Implement packet generation logic
      // For now, return a placeholder URL
      const packetUrl = `/api/placements/${placementId}/packet/download`;

      // Update placement with packet generation timestamp
      await db.placement.update({
        where: { id: placementId },
        data: {
          packetGeneratedAt: new Date(),
          packetUrl,
        },
      });

      return { packetUrl };
    } catch (error) {
      console.error("Generate packet error:", error);
      throw error;
    }
  }

  // Get packet access logs for a placement
  async getPacketAccessLogs(
    placementId: string,
    userId: string
  ): Promise<any[]> {
    try {
      const hasAccess = await this.verifyPlacementAccess(userId, placementId);
      if (!hasAccess) {
        throw new Error("Access denied");
      }

      const logs = await db.packetAccessLog.findMany({
        where: { placementId },
        include: {
          placement: {
            select: {
              id: true,
              packetGeneratedAt: true,
            },
          },
        },
        orderBy: { accessedAt: "desc" },
      });

      return logs;
    } catch (error) {
      console.error("Get packet access logs error:", error);
      throw error;
    }
  }
}

