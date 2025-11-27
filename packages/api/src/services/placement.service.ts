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
      // Check if user is Admin or Super Admin (they have system-wide access)
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") {
        // Admin and Super Admin can access all placements
        const placementExists = await db.placement.findUnique({
          where: { id: placementId },
          select: { id: true },
        });
        return !!placementExists;
      }

      // For other users, check if they belong to the provider's organization
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

      // Notify relevant parties about new placement
      try {
        const { NotificationService } = await import("./notification.service");
        const notificationService = new NotificationService();

        // Determine who to notify
        // If user is Case Manager, notify Provider
        // If user is Provider, notify Case Manager (if referral exists)
        
        const user = await db.user.findUnique({
          where: { id: userId },
          select: { role: true }
        });

        const isCaseManager = user?.role === "CASE_MANAGER" || user?.role === "HOSPITAL_SW";
        
        if (isCaseManager) {
          // Notify provider users
          const provider = await db.provider.findUnique({
            where: { id: opening.providerId },
            include: {
              organization: {
                include: {
                  users: true
                }
              }
            }
          });

          if (provider?.organization?.users) {
            await notificationService.createBatchNotifications(
              provider.organization.users.map(u => ({
                userId: u.id,
                type: NotificationType.PLACEMENT_UPDATE, // Using generic update or specific NEW type if available
                title: "New Placement Request",
                message: `New placement request for ${result.referral?.clientInitials || result.dischargeCase?.patientInitials || "client"}`,
                actionUrl: `/provider/placements/${result.id}`,
                actionLabel: "View Placement",
                metadata: { placementId: result.id }
              }))
            );
          }
        } else {
          // Notify Case Manager
          const recipientId = result.referral?.caseManagerId || result.dischargeCase?.socialWorkerId;
          if (recipientId) {
             await notificationService.createNotification({
              userId: recipientId,
              type: NotificationType.PLACEMENT_UPDATE,
              title: "New Placement Created",
              message: `New placement created for ${result.referral?.clientInitials || result.dischargeCase?.patientInitials || "client"}`,
              channels: ["IN_APP", "EMAIL"],
              actionUrl: result.referral 
                ? `/case-manager/referrals/${result.referral.id}`
                : `/placements/${result.id}`,
            });
          }
        }
      } catch (notifError) {
        console.error("Failed to create placement notification:", notifError);
      }

      return result;
    } catch (error) {
      console.error("Create placement error:", error);
      throw error;
    }
  }

  // Create placement from referral (case manager workflow)
  async createPlacementFromReferral(
    data: {
      referralId: string;
      providerId: string;
      homeId: string;
      openingId: string;
      placementDate: string;
      moveInDate?: string;
      notes?: string;
    },
    userId: string
  ): Promise<any> {
    try {
      // Verify referral exists and get case manager
      const referral = await db.referral.findUnique({
        where: { id: data.referralId },
        include: {
          caseManager: {
            select: {
              id: true,
              organizationId: true,
            },
          },
          shortlist: {
            where: {
              providerId: data.providerId,
            },
            select: {
              status: true,
              providerId: true,
            },
          },
        },
      });

      if (!referral) {
        throw new Error("Referral not found");
      }

      // Verify user is the case manager or has access to the referral
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { role: true, organizationId: true },
      });

      const isCaseManager = user?.role === "CASE_MANAGER";
      const hasAccess = 
        referral.caseManagerId === userId || 
        (isCaseManager && user.organizationId === referral.caseManager?.organizationId);

      if (!hasAccess) {
        throw new Error("Access denied: You don't have permission to create placements for this referral");
      }

      // Verify provider is in shortlist with RESPONDED status
      const shortlistEntry = referral.shortlist.find(
        (s) => s.providerId === data.providerId
      );

      if (!shortlistEntry) {
        throw new Error("Provider not found in referral shortlist");
      }

      if (shortlistEntry.status !== "RESPONDED") {
        throw new Error(
          "Can only create placements for providers who have responded to the referral"
        );
      }

      // Verify home belongs to provider
      const home = await db.home.findFirst({
        where: {
          id: data.homeId,
          providerId: data.providerId,
        },
      });

      if (!home) {
        throw new Error("Home not found or doesn't belong to the selected provider");
      }

      // Verify opening belongs to home and has available spots
      const opening = await db.opening.findFirst({
        where: {
          id: data.openingId,
          homeId: data.homeId,
        },
      });

      if (!opening) {
        throw new Error("Opening not found or doesn't belong to the selected home");
      }

      if (opening.spotsAvailable <= 0) {
        throw new Error("No spots available in this opening");
      }

      if (opening.status !== "OPEN") {
        throw new Error("Opening is not available for placement");
      }

      // Use transaction to create placement and update referral status
      const result = await db.$transaction(async (tx) => {
        // Create placement using existing logic
        const placement = await tx.placement.create({
          data: {
            providerId: data.providerId,
            openingId: data.openingId,
            referralId: data.referralId,
            placementDate: new Date(data.placementDate),
            moveInDate: data.moveInDate ? new Date(data.moveInDate) : null,
            status: PlacementStatus.PENDING,
          },
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

        // Decrement opening spots
        const updatedOpening = await tx.opening.update({
          where: { id: data.openingId },
          data: {
            spotsAvailable: {
              decrement: 1,
            },
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
        await tx.home.update({
          where: { id: data.homeId },
          data: {
            currentOccupancy: {
              increment: 1,
            },
          },
        });

        // Update referral status to PLACED
        await tx.referral.update({
          where: { id: data.referralId },
          data: {
            status: "PLACED",
          },
        });

        return placement;
      });

      // Send notifications
      try {
        const { NotificationService } = await import("./notification.service");
        const notificationService = new NotificationService();

        // Notify provider users
        const provider = await db.provider.findUnique({
          where: { id: data.providerId },
          include: {
            organization: {
              include: {
                users: true,
              },
            },
          },
        });

        if (provider?.organization?.users) {
          await notificationService.createBatchNotifications(
            provider.organization.users.map((u) => ({
              userId: u.id,
              type: NotificationType.PLACEMENT_UPDATE,
              title: "New Placement Created",
              message: `New placement created for referral ${referral.referralNumber}`,
              actionUrl: `/provider/placements/${result.id}`,
              actionLabel: "View Placement",
              metadata: { placementId: result.id, referralId: data.referralId },
            }))
          );
        }

        // Notify case manager
        if (referral.caseManagerId && referral.caseManagerId !== userId) {
          await notificationService.createNotification({
            userId: referral.caseManagerId,
            type: NotificationType.PLACEMENT_UPDATE,
            title: "Placement Created",
            message: `Placement created for referral ${referral.referralNumber}`,
            channels: ["IN_APP", "EMAIL"],
            actionUrl: `/case-manager/referrals/${data.referralId}`,
          });
        }
      } catch (notifError) {
        console.error("Failed to create placement notifications:", notifError);
      // Don't throw - notification failure shouldn't break placement creation
      }

      return result;
    } catch (error) {
      console.error("Create placement from referral error:", error);
      throw error;
    }
  }

  // Create placement from discharge case (hospital SW workflow)
  async createPlacementFromDischargeCase(
    data: {
      dischargeCaseId: string;
      providerId: string;
      homeId: string;
      openingId: string;
      placementDate: string;
      moveInDate?: string;
      notes?: string;
    },
    userId: string
  ): Promise<any> {
    try {
      // Verify discharge case exists and get social worker
      const dischargeCase = await db.dischargeCase.findUnique({
        where: { id: data.dischargeCaseId },
        include: {
          socialWorker: {
            select: {
              id: true,
              organizationId: true,
            },
          },
          invitations: {
            where: {
              providerId: data.providerId,
            },
            select: {
              response: true,
              providerId: true,
            },
          },
        },
      });

      if (!dischargeCase) {
        throw new Error("Discharge case not found");
      }

      // Verify user is the social worker or has access to the discharge case
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { role: true, organizationId: true },
      });

      const isHospitalSW = user?.role === "HOSPITAL_SW";
      const isSocialWorker = dischargeCase.socialWorkerId === userId;
      const sameOrganization = user?.organizationId === dischargeCase.socialWorker?.organizationId;

      if (!isHospitalSW || (!isSocialWorker && !sameOrganization)) {
        throw new Error("Access denied: You don't have permission to create placement for this discharge case");
      }

      // Verify provider was invited and accepted
      const invitation = dischargeCase.invitations.find(
        (inv) => inv.providerId === data.providerId
      );

      if (!invitation || invitation.response !== "ACCEPTED") {
        throw new Error("Provider must be invited and accept before creating placement");
      }

      // Create placement using the standard createPlacement method
      const placement = await this.createPlacement(
        {
          openingId: data.openingId,
          dischargeCaseId: data.dischargeCaseId,
          placementDate: data.placementDate,
          moveInDate: data.moveInDate,
        },
        userId
      );

      return placement;
    } catch (error) {
      console.error("Create placement from discharge case error:", error);
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

      // If providerId is provided, verify access (skip for Admin/Super Admin)
      if (providerId) {
        // Admin and Super Admin have system-wide access
        const isSystemAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
        
        if (!isSystemAdmin) {
          const hasAccess = await this.verifyProviderAccess(userId, providerId);
          if (!hasAccess) {
            throw new Error("Access denied");
          }
        }
        
        where.providerId = providerId;
        // Remove dischargeCase filter if providerId is specified (provider takes precedence)
        delete where.dischargeCase;
      }

      if (openingId) {
        // Admin and Super Admin have system-wide access
        const isSystemAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
        
        if (!isSystemAdmin) {
          const hasAccess = await this.openingService.verifyOpeningAccess(
            userId,
            openingId
          );
          if (!hasAccess) {
            throw new Error("Access denied");
          }
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

        // Schedule default follow-ups when placement is confirmed
        if (placement.moveInDate) {
          try {
            const { PlacementFollowUpService } = await import("./placement-followup.service");
            const followUpService = new PlacementFollowUpService();
            await followUpService.scheduleDefaultFollowUps(placementId);
          } catch (followUpError) {
            console.error("Failed to schedule follow-ups:", followUpError);
            // Don't throw - follow-up scheduling failure shouldn't break placement update
          }
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
    accessToken: string;
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

      // Generate PDF using PlacementPacketService
      const { PlacementPacketService } = await import("./placement-packet.service");
      const packetService = new PlacementPacketService();
      
      // Generate the PDF
      const pdfBuffer = await packetService.generatePacketPDF(placementId);

      // Generate unique access token
      const crypto = await import("crypto");
      const accessToken = crypto.randomBytes(32).toString("hex");

      // Store PDF in memory cache (in production, use Redis or S3)
      // For now, we'll just store the token and regenerate on download
      const packetUrl = `/api/placements/${placementId}/packet/download?token=${accessToken}`;

      // Update placement with packet generation timestamp and access token
      await db.placement.update({
        where: { id: placementId },
        data: {
          packetGeneratedAt: new Date(),
          packetUrl: accessToken, // Store token in packetUrl field for validation
        },
      });

      return { packetUrl, accessToken };
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

  // Verify packet access with token
  async verifyPacketAccess(
    placementId: string,
    token: string
  ): Promise<any | null> {
    try {
      const placement = await db.placement.findUnique({
        where: { id: placementId },
        select: {
          id: true,
          packetUrl: true, // This stores the access token
          packetGeneratedAt: true,
        },
      });

      if (!placement || !placement.packetUrl) {
        return null;
      }

      // Verify token matches
      if (placement.packetUrl !== token) {
        return null;
      }

      return placement;
    } catch (error) {
      console.error("Verify packet access error:", error);
      return null;
    }
  }

  // Log packet access
  async logPacketAccess(
    placementId: string,
    userId: string,
    ipAddress: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await db.packetAccessLog.create({
        data: {
          placementId,
          accessedBy: userId,
          ipAddress,
          userAgent,
        },
      });
    } catch (error) {
      console.error("Log packet access error:", error);
      // Don't throw - logging failure shouldn't break the download
    }
  }
}

