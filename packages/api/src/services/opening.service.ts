import { db } from "@carelink/database";
import {
  Prisma,
  OpeningStatus,
  Gender,
  Payer,
  PlacementStatus,
} from "@prisma/client";

export interface CreateOpeningData {
  homeId: string;
  spotsAvailable: number;
  availableFrom: Date | string;
  availableUntil?: Date | string;
  ageMin?: number;
  ageMax?: number;
  genderPreference?: Gender;
  careLevels?: string[];
  supportedNeeds?: string[];
  acceptedPayers: Payer[];
  privatePayRate?: number;
}

export interface UpdateOpeningData extends Partial<CreateOpeningData> {
  status?: OpeningStatus;
  freshnessTimestamp?: Date | string; // For refresh operations
}

export interface OpeningFilters {
  homeId?: string;
  status?: OpeningStatus;
  providerId?: string;
  page?: number;
  limit?: number;
  includeExpired?: boolean;
  search?: string;
}

export class OpeningService {
  // Verify user has access to opening's provider
  async verifyOpeningAccess(
    userId: string,
    openingId: string
  ): Promise<boolean> {
    try {
      const opening = await db.opening.findFirst({
        where: {
          id: openingId,
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

      return !!opening;
    } catch (error) {
      console.error("Verify opening access error:", error);
      return false;
    }
  }

  // Verify user has access to home's provider
  async verifyHomeAccess(userId: string, homeId: string): Promise<boolean> {
    try {
      const home = await db.home.findFirst({
        where: {
          id: homeId,
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

      return !!home;
    } catch (error) {
      console.error("Verify home access error:", error);
      return false;
    }
  }

  // Check if opening is fresh (within 48 hours)
  isOpeningFresh(freshnessTimestamp: Date): boolean {
    const now = new Date();
    const hoursSinceUpdate =
      (now.getTime() - freshnessTimestamp.getTime()) / (1000 * 60 * 60);
    return hoursSinceUpdate < 48;
  }

  // Create a new opening
  async createOpening(providerId: string, openingData: CreateOpeningData) {
    try {
      // Verify home belongs to provider
      const home = await db.home.findFirst({
        where: {
          id: openingData.homeId,
          providerId,
        },
      });

      if (!home) {
        throw new Error("Home not found or does not belong to provider");
      }

      // Validate spots available doesn't exceed home capacity
      const currentOpenings = await db.opening.findMany({
        where: {
          homeId: openingData.homeId,
          status: {
            in: [OpeningStatus.OPEN, OpeningStatus.PENDING],
          },
        },
      });

      const totalOpenSpots = currentOpenings.reduce(
        (sum, opening) => sum + opening.spotsAvailable,
        0
      );

      if (totalOpenSpots + openingData.spotsAvailable > home.capacity) {
        throw new Error(
          `Total open spots (${totalOpenSpots + openingData.spotsAvailable}) exceeds home capacity (${home.capacity})`
        );
      }

      const opening = await db.opening.create({
        data: {
          providerId,
          homeId: openingData.homeId,
          spotsAvailable: openingData.spotsAvailable,
          availableFrom: new Date(openingData.availableFrom),
          availableUntil: openingData.availableUntil
            ? new Date(openingData.availableUntil)
            : null,
          ageMin: openingData.ageMin,
          ageMax: openingData.ageMax,
          genderPreference:
            openingData.genderPreference || Gender.NO_PREFERENCE,
          careLevels: openingData.careLevels || [],
          supportedNeeds: openingData.supportedNeeds || [],
          acceptedPayers: openingData.acceptedPayers,
          privatePayRate: openingData.privatePayRate
            ? new Prisma.Decimal(openingData.privatePayRate)
            : null,
          status: OpeningStatus.OPEN,
          freshnessTimestamp: new Date(),
        },
        include: {
          home: {
            include: {
              provider: {
                include: {
                  organization: true,
                },
              },
            },
          },
          placements: true,
        },
      });

      return opening;
    } catch (error) {
      console.error("Create opening error:", error);
      throw error;
    }
  }

  // Get openings with filters
  async getOpenings(filters: OpeningFilters, userId: string) {
    try {
      const {
        homeId,
        status,
        providerId,
        page = 1,
        limit = 20,
        includeExpired = false,
        search,
      } = filters;

      const where: any = {};

      // If providerId is provided, verify access
      if (providerId) {
        const hasAccess = await this.verifyProviderAccess(userId, providerId);
        if (!hasAccess) {
          throw new Error("Access denied");
        }
        where.providerId = providerId;
      }

      if (homeId) {
        const hasAccess = await this.verifyHomeAccess(userId, homeId);
        if (!hasAccess) {
          throw new Error("Access denied");
        }
        where.homeId = homeId;
      }

      if (status) {
        where.status = status;
      }

      // Filter expired openings based on freshnessTimestamp (48 hours)
      if (!includeExpired) {
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
        where.freshnessTimestamp = {
          gte: fortyEightHoursAgo,
        };
      }

      // Search functionality - search in home name, city, state, care levels, supported needs
      if (search && search.trim()) {
        const searchTerm = search.trim().toLowerCase();
        where.OR = [
          {
            home: {
              name: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
          },
          {
            home: {
              city: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
          },
          {
            home: {
              state: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
          },
          {
            careLevels: {
              hasSome: [searchTerm.toUpperCase()],
            },
          },
          {
            supportedNeeds: {
              hasSome: [searchTerm.toUpperCase()],
            },
          },
        ];
      }

      const skip = (page - 1) * limit;

      const [openings, total] = await Promise.all([
        db.opening.findMany({
          where,
          select: {
            id: true,
            providerId: true,
            homeId: true,
            spotsAvailable: true,
            availableFrom: true,
            availableUntil: true,
            ageMin: true,
            ageMax: true,
            genderPreference: true,
            careLevels: true,
            supportedNeeds: true,
            acceptedPayers: true,
            privatePayRate: true,
            status: true,
            freshnessTimestamp: true,
            createdAt: true,
            updatedAt: true,
            home: {
              select: {
                id: true,
                name: true,
                city: true,
                state: true,
                capacity: true,
                currentOccupancy: true,
              },
            },
            placements: {
              select: {
                id: true,
                status: true,
                placementDate: true,
              },
            },
          },
          orderBy: [{ freshnessTimestamp: "desc" }, { createdAt: "desc" }],
          skip,
          take: limit,
        }),
        db.opening.count({ where }),
      ]);

      // Check freshness for each opening
      const openingsWithFreshness = openings.map((opening) => ({
        ...opening,
        isFresh: this.isOpeningFresh(opening.freshnessTimestamp),
      }));

      return {
        openings: openingsWithFreshness,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page,
          limit,
        },
      };
    } catch (error) {
      console.error("Get openings error:", error);
      throw error;
    }
  }

  // Get opening by ID
  async getOpeningById(openingId: string, userId: string) {
    try {
      const opening = await db.opening.findFirst({
        where: {
          id: openingId,
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
        include: {
          home: {
            include: {
              provider: {
                include: {
                  organization: true,
                },
              },
            },
          },
          placements: {
            include: {
              referral: {
                select: {
                  id: true,
                  referralNumber: true,
                  clientAge: true,
                  clientGender: true,
                },
              },
              dischargeCase: {
                select: {
                  id: true,
                  caseNumber: true,
                  patientAge: true,
                  patientGender: true,
                },
              },
            },
          },
        },
      });

      if (!opening) {
        return null;
      }

      return {
        ...opening,
        isFresh: this.isOpeningFresh(opening.freshnessTimestamp),
      };
    } catch (error) {
      console.error("Get opening by ID error:", error);
      throw error;
    }
  }

  // Update opening
  async updateOpening(
    openingId: string,
    updateData: UpdateOpeningData,
    userId: string
  ) {
    try {
      // Verify access
      const existingOpening = await db.opening.findFirst({
        where: {
          id: openingId,
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
        include: {
          home: true,
        },
      });

      if (!existingOpening) {
        return null;
      }

      // If updating spots available, validate against capacity
      if (updateData.spotsAvailable !== undefined) {
        const currentOpenings = await db.opening.findMany({
          where: {
            homeId: existingOpening.homeId,
            status: {
              in: [OpeningStatus.OPEN, OpeningStatus.PENDING],
            },
            id: {
              not: openingId,
            },
          },
        });

        const totalOpenSpots = currentOpenings.reduce(
          (sum, opening) => sum + opening.spotsAvailable,
          0
        );

        if (
          totalOpenSpots + updateData.spotsAvailable >
          existingOpening.home.capacity
        ) {
          throw new Error(
            `Total open spots (${totalOpenSpots + updateData.spotsAvailable}) exceeds home capacity (${existingOpening.home.capacity})`
          );
        }
      }

      // Prepare update data
      const data: any = {
        ...updateData,
      };

      // Update freshness timestamp on any change (unless explicitly set)
      if (updateData.freshnessTimestamp !== undefined) {
        data.freshnessTimestamp = new Date(updateData.freshnessTimestamp);
      } else {
        // Only auto-update freshness if other fields are being updated
        // Don't update if only status is being changed (to allow status-only updates)
        const hasOtherChanges = Object.keys(updateData).some(
          (key) => key !== "status" && key !== "freshnessTimestamp"
        );
        if (hasOtherChanges) {
          data.freshnessTimestamp = new Date();
        }
      }

      // Handle date conversions
      if (updateData.availableFrom) {
        data.availableFrom = new Date(updateData.availableFrom);
      }
      if (updateData.availableUntil !== undefined) {
        data.availableUntil = updateData.availableUntil
          ? new Date(updateData.availableUntil)
          : null;
      }

      // Handle decimal conversion for privatePayRate
      if (updateData.privatePayRate !== undefined) {
        data.privatePayRate = updateData.privatePayRate
          ? new Prisma.Decimal(updateData.privatePayRate)
          : null;
      }

      const opening = await db.opening.update({
        where: { id: openingId },
        data,
        include: {
          home: {
            include: {
              provider: {
                include: {
                  organization: true,
                },
              },
            },
          },
          placements: true,
        },
      });

      return {
        ...opening,
        isFresh: this.isOpeningFresh(opening.freshnessTimestamp),
      };
    } catch (error) {
      console.error("Update opening error:", error);
      throw error;
    }
  }

  // Delete opening
  async deleteOpening(openingId: string, userId: string): Promise<boolean> {
    try {
      // Verify access
      const existingOpening = await db.opening.findFirst({
        where: {
          id: openingId,
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

      if (!existingOpening) {
        return false;
      }

      // Check if opening has active placements
      const activePlacements = await db.placement.findMany({
        where: {
          openingId,
          status: {
            in: [
              PlacementStatus.PENDING,
              PlacementStatus.CONFIRMED,
              PlacementStatus.IN_PROGRESS,
            ],
          },
        },
      });

      if (activePlacements.length > 0) {
        throw new Error(
          "Cannot delete opening with active placements. Please complete or cancel placements first."
        );
      }

      await db.opening.delete({
        where: { id: openingId },
      });

      return true;
    } catch (error) {
      console.error("Delete opening error:", error);
      throw error;
    }
  }

  // Update opening status (for Kanban board)
  async updateOpeningStatus(
    openingId: string,
    status: OpeningStatus,
    userId: string
  ) {
    try {
      return await this.updateOpening(openingId, { status }, userId);
    } catch (error) {
      console.error("Update opening status error:", error);
      throw error;
    }
  }

  // Refresh opening (update freshness timestamp)
  async refreshOpening(openingId: string, userId: string) {
    try {
      // Verify access
      const existingOpening = await db.opening.findFirst({
        where: {
          id: openingId,
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

      if (!existingOpening) {
        return null;
      }

      // Update freshness timestamp and reset status if it was EXPIRED
      const updateData: any = {
        freshnessTimestamp: new Date(),
        expiryReminderSentAt: null, // Reset reminder flag so new reminder can be sent if it expires again
      };

      // If opening was expired due to freshness, reset to OPEN status
      if (existingOpening.status === OpeningStatus.EXPIRED) {
        updateData.status = OpeningStatus.OPEN;
      }

      const opening = await db.opening.update({
        where: { id: openingId },
        data: updateData,
        include: {
          home: {
            include: {
              provider: {
                include: {
                  organization: true,
                },
              },
            },
          },
          placements: true,
        },
      });

      return {
        ...opening,
        isFresh: this.isOpeningFresh(opening.freshnessTimestamp),
      };
    } catch (error) {
      console.error("Refresh opening error:", error);
      throw error;
    }
  }

  // Get openings grouped by status (for Kanban board)
  async getOpeningsByStatus(providerId: string, userId: string) {
    try {
      // Verify access
      const hasAccess = await this.verifyProviderAccess(userId, providerId);
      if (!hasAccess) {
        throw new Error("Access denied");
      }

      // Get ALL openings for the provider (including expired ones)
      // The frontend can filter expired if needed, but we need to show them
      const openings = await db.opening.findMany({
        where: {
          providerId,
        },
        select: {
          id: true,
          providerId: true,
          homeId: true,
          spotsAvailable: true,
          availableFrom: true,
          availableUntil: true,
          ageMin: true,
          ageMax: true,
          genderPreference: true,
          careLevels: true,
          supportedNeeds: true,
          acceptedPayers: true,
          privatePayRate: true,
          status: true,
          freshnessTimestamp: true,
          createdAt: true,
          updatedAt: true,
          home: {
            select: {
              id: true,
              name: true,
              city: true,
              state: true,
              capacity: true,
              currentOccupancy: true,
            },
          },
          placements: {
            select: {
              id: true,
              status: true,
            },
          },
        },
        orderBy: [{ freshnessTimestamp: "desc" }, { createdAt: "desc" }],
      });

      // Group by status, considering freshness
      const grouped: Record<
        OpeningStatus,
        Array<(typeof openings)[0] & { isFresh: boolean }>
      > = {
        OPEN: [],
        PENDING: [],
        FILLED: [],
        EXPIRED: [],
      };

      openings.forEach((opening) => {
        const isFresh = this.isOpeningFresh(opening.freshnessTimestamp);
        // If opening is not fresh, it should be marked as EXPIRED regardless of its status
        // However, if status is already FILLED, keep it as FILLED
        let finalStatus = opening.status;
        if (!isFresh && opening.status !== OpeningStatus.FILLED) {
          finalStatus = OpeningStatus.EXPIRED;
        }

        grouped[finalStatus].push({
          ...opening,
          isFresh,
        } as (typeof openings)[0] & { isFresh: boolean });
      });

      return grouped;
    } catch (error) {
      console.error("Get openings by status error:", error);
      throw error;
    }
  }

  // Verify provider access helper
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

  /**
   * Decrement opening spots when a placement is created (atomic operation)
   * This method should be called when creating a Placement to ensure atomicity
   *
   * @param openingId - The opening ID
   * @param spotsToDecrement - Number of spots to decrement (usually 1)
   * @returns Updated opening or null if not found/insufficient spots
   *
   * Note: This is part of Epic 3 (Care Coordination) and will be implemented
   * when Placement creation is implemented. For now, this is a placeholder
   * to ensure the opening management system is ready for placement integration.
   */
  async decrementSpotsAtomically(
    openingId: string,
    spotsToDecrement: number = 1
  ): Promise<any> {
    try {
      // Use a transaction to ensure atomicity
      return await db.$transaction(async (tx) => {
        // Lock the opening row for update
        const opening = await tx.opening.findUnique({
          where: { id: openingId },
        });

        if (!opening) {
          throw new Error("Opening not found");
        }

        // Check if there are enough spots available
        if (opening.spotsAvailable < spotsToDecrement) {
          throw new Error(
            `Insufficient spots available. Requested: ${spotsToDecrement}, Available: ${opening.spotsAvailable}`
          );
        }

        // Decrement spots atomically
        const updatedOpening = await tx.opening.update({
          where: { id: openingId },
          data: {
            spotsAvailable: {
              decrement: spotsToDecrement,
            },
            // Update freshness timestamp when spots change
            freshnessTimestamp: new Date(),
            // Auto-update status if spots reach 0
            status:
              opening.spotsAvailable - spotsToDecrement === 0
                ? OpeningStatus.FILLED
                : opening.status,
          },
        });

        return updatedOpening;
      });
    } catch (error) {
      console.error("Decrement spots atomically error:", error);
      throw error;
    }
  }
}
