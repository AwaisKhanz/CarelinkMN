import { db } from "@carelink/database";
import { Prisma } from "@prisma/client";
import {
  Referral,
  CreateReferralData,
  UpdateReferralData,
  ReferralShortlist,
  AddToShortlistData,
  UpdateShortlistData,
  BatchMessageData,
  BatchShortlistData,
  GetReferralsParams,
  PaginatedReferrals,
  CaseManagerDashboard,
  ReferralStatus,
  ShortlistStatus,
  Urgency,
  Payer,
  PlacementStatus,
} from "@carelink/types";
import { normalizeDate } from "@carelink/utils";
import { MessagingService } from "./messaging.service";

export class ReferralService {
  /**
   * Create a new referral
   */
  async createReferral(
    userId: string,
    data: CreateReferralData
  ): Promise<Referral> {
    try {
      // Get user to find case manager profile and organization
      const user = await db.user.findUnique({
        where: { id: userId },
        include: {
          organization: true,
        },
      });

      if (!user || !user.organizationId) {
        throw new Error("User or organization not found");
      }

      // Find case manager profile
      const caseManagerProfile = await db.caseManager.findFirst({
        where: {
          organizationId: user.organizationId,
          email: user.email,
        },
      });

      // Create referral
      const referral = await db.referral.create({
        data: {
          caseManagerId: userId,
          caseManagerProfileId: caseManagerProfile?.id,
          organizationId: user.organizationId,
          clientAge: data.clientAge,
          clientGender: data.clientGender,
          clientInitials: data.clientInitials,
          careLevels: data.careLevels,
          servicesNeeded: data.servicesNeeded,
          mobilityLevel: data.mobilityLevel,
          behavioralNeeds: data.behavioralNeeds || [],
          medicalNeeds: data.medicalNeeds || [],
          preferredCounties: data.preferredCounties,
          preferredCities: data.preferredCities || [],
          maxDistance: data.maxDistance,
          primaryPayer: data.primaryPayer,
          secondaryPayer: data.secondaryPayer,
          targetMoveDate: data.targetMoveDate
            ? normalizeDate(data.targetMoveDate)
            : null,
          urgency: data.urgency || Urgency.ROUTINE,
          internalNotes: data.internalNotes,
        },
        include: {
          caseManager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          caseManagerProfile: true,
        },
      });

      // Add initial shortlist if provided
      if (data.providerIds && data.providerIds.length > 0) {
        await this.addToShortlist(referral.id, userId, {
          providerIds: data.providerIds,
        });
      }

      // Fetch full referral with relations
      return this.getReferralById(referral.id, userId);
    } catch (error) {
      console.error("Create referral error:", error);
      throw new Error("Failed to create referral");
    }
  }

  /**
   * Get referral by ID
   */
  async getReferralById(
    referralId: string,
    userId: string
  ): Promise<Referral> {
    try {
      const referral = await db.referral.findFirst({
        where: {
          id: referralId,
          caseManagerId: userId, // Ensure user owns this referral
        },
        include: {
          caseManager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          caseManagerProfile: true,
          shortlist: {
            include: {
              provider: {
                include: {
                  organization: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                  homes: {
                    select: {
                      id: true,
                      name: true,
                      city: true,
                      state: true,
                    },
                    take: 5, // Limit homes for performance
                  },
                },
              },
            },
          },
          messages: {
            take: 5, // Limit messages for list view
            orderBy: {
              lastMessageAt: "desc",
            },
          },
          placements: {
            take: 10,
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });

      if (!referral) {
        throw new Error("Referral not found");
      }

      return this.mapReferralToType(referral);
    } catch (error) {
      console.error("Get referral by ID error:", error);
      throw new Error("Failed to retrieve referral");
    }
  }

  /**
   * Get referrals with filtering and pagination
   */
  async getReferrals(
    userId: string,
    filters: GetReferralsParams = {}
  ): Promise<PaginatedReferrals> {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        urgency,
        primaryPayer,
        search,
      } = filters;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.ReferralWhereInput = {
        caseManagerId: userId, // Only user's referrals
      };

      if (status) {
        where.status = status;
      }

      if (urgency) {
        where.urgency = urgency;
      }

      if (primaryPayer) {
        where.primaryPayer = primaryPayer;
      }

      if (search) {
        where.OR = [
          { referralNumber: { contains: search, mode: "insensitive" } },
          { clientInitials: { contains: search, mode: "insensitive" } },
          {
            preferredCounties: {
              hasSome: [search],
            },
          },
          {
            preferredCities: {
              hasSome: [search],
            },
          },
        ];
      }

      // Get referrals and total count
      const [referrals, total] = await Promise.all([
        db.referral.findMany({
          where,
          include: {
            caseManager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
            caseManagerProfile: true,
            shortlist: {
              take: 5, // Limit for list view
              include: {
                provider: {
                  include: {
                    organization: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
            placements: {
              take: 1,
              orderBy: {
                createdAt: "desc",
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: limit,
        }),
        db.referral.count({ where }),
      ]);

      const pages = Math.ceil(total / limit);

      return {
        referrals: referrals.map((r) => this.mapReferralToType(r)),
        pagination: {
          total,
          pages,
          page,
          limit,
        },
      };
    } catch (error) {
      console.error("Get referrals error:", error);
      throw new Error("Failed to retrieve referrals");
    }
  }

  /**
   * Update referral
   */
  async updateReferral(
    referralId: string,
    userId: string,
    data: UpdateReferralData
  ): Promise<Referral> {
    try {
      // Verify user owns this referral
      const existing = await db.referral.findFirst({
        where: {
          id: referralId,
          caseManagerId: userId,
        },
      });

      if (!existing) {
        throw new Error("Referral not found or access denied");
      }

      // Build update data
      const updateData: Prisma.ReferralUpdateInput = {};

      if (data.clientAge !== undefined) updateData.clientAge = data.clientAge;
      if (data.clientGender !== undefined)
        updateData.clientGender = data.clientGender;
      if (data.clientInitials !== undefined)
        updateData.clientInitials = data.clientInitials;
      if (data.careLevels !== undefined)
        updateData.careLevels = data.careLevels;
      if (data.servicesNeeded !== undefined)
        updateData.servicesNeeded = data.servicesNeeded;
      if (data.mobilityLevel !== undefined)
        updateData.mobilityLevel = data.mobilityLevel;
      if (data.behavioralNeeds !== undefined)
        updateData.behavioralNeeds = data.behavioralNeeds;
      if (data.medicalNeeds !== undefined)
        updateData.medicalNeeds = data.medicalNeeds;
      if (data.preferredCounties !== undefined)
        updateData.preferredCounties = data.preferredCounties;
      if (data.preferredCities !== undefined)
        updateData.preferredCities = data.preferredCities;
      if (data.maxDistance !== undefined)
        updateData.maxDistance = data.maxDistance;
      if (data.primaryPayer !== undefined)
        updateData.primaryPayer = data.primaryPayer;
      if (data.secondaryPayer !== undefined)
        updateData.secondaryPayer = data.secondaryPayer;
      if (data.targetMoveDate !== undefined)
        updateData.targetMoveDate = data.targetMoveDate
          ? normalizeDate(data.targetMoveDate)
          : null;
      if (data.urgency !== undefined) updateData.urgency = data.urgency;
      if (data.internalNotes !== undefined)
        updateData.internalNotes = data.internalNotes;
      if (data.status !== undefined) {
        updateData.status = data.status;
        // Update placedAt or closedAt based on status
        if (data.status === ReferralStatus.PLACED) {
          updateData.placedAt = new Date();
        } else if (
          data.status === ReferralStatus.CLOSED ||
          data.status === ReferralStatus.CANCELLED
        ) {
          updateData.closedAt = new Date();
        }
      }

      await db.referral.update({
        where: { id: referralId },
        data: updateData,
      });

      return this.getReferralById(referralId, userId);
    } catch (error) {
      console.error("Update referral error:", error);
      throw new Error("Failed to update referral");
    }
  }

  /**
   * Delete referral
   */
  async deleteReferral(referralId: string, userId: string): Promise<void> {
    try {
      // Verify user owns this referral
      const existing = await db.referral.findFirst({
        where: {
          id: referralId,
          caseManagerId: userId,
        },
      });

      if (!existing) {
        throw new Error("Referral not found or access denied");
      }

      await db.referral.delete({
        where: { id: referralId },
      });
    } catch (error) {
      console.error("Delete referral error:", error);
      throw new Error("Failed to delete referral");
    }
  }

  /**
   * Add providers to shortlist
   */
  async addToShortlist(
    referralId: string,
    userId: string,
    data: AddToShortlistData
  ): Promise<ReferralShortlist[]> {
    try {
      // Verify user owns this referral
      const referral = await db.referral.findFirst({
        where: {
          id: referralId,
          caseManagerId: userId,
        },
      });

      if (!referral) {
        throw new Error("Referral not found or access denied");
      }

      // Create shortlist entries (using createMany for efficiency)
      const shortlistEntries = data.providerIds.map((providerId) => ({
        referralId,
        providerId,
        status: ShortlistStatus.ADDED,
        notes: data.notes,
      }));

      // Use transaction to handle duplicates
      const created = await db.$transaction(
        shortlistEntries.map((entry) =>
          db.referralShortlist.upsert({
            where: {
              referralId_providerId: {
                referralId: entry.referralId,
                providerId: entry.providerId,
              },
            },
            create: entry,
            update: {
              status: ShortlistStatus.ADDED,
              notes: entry.notes,
            },
          })
        )
      );

      // Fetch full shortlist with relations
      return this.getShortlist(referralId, userId);
    } catch (error) {
      console.error("Add to shortlist error:", error);
      throw new Error("Failed to add providers to shortlist");
    }
  }

  /**
   * Update shortlist status
   */
  async updateShortlistStatus(
    shortlistId: string,
    userId: string,
    data: UpdateShortlistData
  ): Promise<ReferralShortlist> {
    try {
      // Verify user owns the referral
      const shortlist = await db.referralShortlist.findUnique({
        where: { id: shortlistId },
        include: {
          referral: true,
        },
      });

      if (!shortlist || shortlist.referral.caseManagerId !== userId) {
        throw new Error("Shortlist not found or access denied");
      }

      const updateData: Prisma.ReferralShortlistUpdateInput = {};

      if (data.status !== undefined) {
        updateData.status = data.status;
        // Update timestamps based on status
        if (data.status === ShortlistStatus.CONTACTED) {
          updateData.contactedAt = new Date();
        } else if (data.status === ShortlistStatus.RESPONDED) {
          updateData.respondedAt = new Date();
        }
      }

      if (data.notes !== undefined) {
        updateData.notes = data.notes;
      }

      const updated = await db.referralShortlist.update({
        where: { id: shortlistId },
        data: updateData,
        include: {
          referral: true,
          provider: {
            include: {
              organization: {
                select: {
                  id: true,
                  name: true,
                },
              },
              homes: {
                select: {
                  id: true,
                  name: true,
                  city: true,
                  state: true,
                },
                take: 5,
              },
            },
          },
        },
      });

      return this.mapShortlistToType(updated);
    } catch (error) {
      console.error("Update shortlist status error:", error);
      throw new Error("Failed to update shortlist status");
    }
  }

  /**
   * Remove provider from shortlist
   */
  async removeFromShortlist(
    shortlistId: string,
    userId: string
  ): Promise<void> {
    try {
      // Verify user owns the referral
      const shortlist = await db.referralShortlist.findUnique({
        where: { id: shortlistId },
        include: {
          referral: true,
        },
      });

      if (!shortlist || shortlist.referral.caseManagerId !== userId) {
        throw new Error("Shortlist not found or access denied");
      }

      await db.referralShortlist.delete({
        where: { id: shortlistId },
      });
    } catch (error) {
      console.error("Remove from shortlist error:", error);
      throw new Error("Failed to remove provider from shortlist");
    }
  }

  /**
   * Get shortlist for a referral
   */
  async getShortlist(
    referralId: string,
    userId: string
  ): Promise<ReferralShortlist[]> {
    try {
      // Verify user owns this referral
      const referral = await db.referral.findFirst({
        where: {
          id: referralId,
          caseManagerId: userId,
        },
      });

      if (!referral) {
        throw new Error("Referral not found or access denied");
      }

      const shortlist = await db.referralShortlist.findMany({
        where: { referralId },
        include: {
          referral: true,
          provider: {
            include: {
              organization: {
                select: {
                  id: true,
                  name: true,
                },
              },
              homes: {
                select: {
                  id: true,
                  name: true,
                  city: true,
                  state: true,
                },
                take: 5,
              },
            },
          },
        },
        orderBy: {
          addedAt: "desc",
        },
      });

      return shortlist.map((s) => this.mapShortlistToType(s));
    } catch (error) {
      console.error("Get shortlist error:", error);
      throw new Error("Failed to retrieve shortlist");
    }
  }

  /**
   * Batch add to shortlist
   */
  async batchAddToShortlist(
    referralId: string,
    userId: string,
    providerIds: string[]
  ): Promise<ReferralShortlist[]> {
    return this.addToShortlist(referralId, userId, {
      providerIds,
    });
  }

  /**
   * Batch message providers
   */
  async batchMessageProviders(
    data: BatchMessageData,
    userId: string
  ): Promise<any[]> {
    try {
      // Verify user owns all referrals
      const referrals = await db.referral.findMany({
        where: {
          id: { in: data.referralIds },
          caseManagerId: userId,
        },
      });

      if (referrals.length !== data.referralIds.length) {
        throw new Error("Some referrals not found or access denied");
      }

      // Create message threads for each referral-provider combination
      const messaging = new MessagingService();

      const threads = await Promise.all(
        data.referralIds.flatMap((referralId) =>
          data.providerIds.map(async (providerId) => {
            // Check if thread already exists
            const existingThread = await db.messageThread.findFirst({
              where: {
                referralId,
                providerId,
              },
            });

            if (existingThread) {
              // Send message to existing thread
              return messaging.sendMessage(
                {
                  threadId: existingThread.id,
                  content: data.message,
                  attachments: data.attachments,
                },
                userId
              );
            } else {
              // Create new thread and send message
              return messaging.createThread(
                {
                  providerId,
                  referralId,
                  initialMessage: data.message,
                  attachments: data.attachments,
                },
                userId
              );
            }
          })
        )
      );

      return threads;
    } catch (error) {
      console.error("Batch message providers error:", error);
      throw new Error("Failed to send batch messages");
    }
  }

  /**
   * Get case manager dashboard data
   */
  async getCaseManagerDashboard(
    userId: string
  ): Promise<CaseManagerDashboard> {
    try {
      // Get all user's referrals
      const referrals = await db.referral.findMany({
        where: {
          caseManagerId: userId,
        },
        include: {
          placements: {
            where: {
              status: {
                in: [
                  PlacementStatus.PENDING,
                  PlacementStatus.CONFIRMED,
                  PlacementStatus.IN_PROGRESS,
                ],
              },
            },
          },
        },
      });

      // Get placements
      const placements = await db.placement.findMany({
        where: {
          referral: {
            caseManagerId: userId,
          },
        },
        include: {
          referral: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      });

      // Calculate stats
      const totalReferrals = referrals.length;
      const activeReferrals = referrals.filter(
        (r) =>
          r.status !== ReferralStatus.CLOSED &&
          r.status !== ReferralStatus.CANCELLED &&
          r.status !== ReferralStatus.PLACED
      ).length;
      const pendingPlacements = placements.filter(
        (p) => p.status === PlacementStatus.PENDING
      ).length;
      const completedPlacements = placements.filter(
        (p) => p.status === PlacementStatus.COMPLETED
      ).length;

      // Calculate average placement time
      const completedPlacementsWithDates = placements.filter(
        (p) =>
          p.status === PlacementStatus.COMPLETED &&
          p.createdAt &&
          p.completedAt
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
          },
        },
      });
      const totalMessages = messageThreads.length;
      const respondedMessages = messageThreads.filter(
        (t) => t.firstResponseAt !== null
      ).length;
      const responseRate =
        totalMessages > 0 ? (respondedMessages / totalMessages) * 100 : 0;

      // Get recent referrals
      const recentReferrals = referrals
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5)
        .map((r) => this.mapReferralToType(r));

      // Get urgent referrals
      const urgentReferrals = referrals
        .filter((r) => r.urgency === Urgency.URGENT)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5)
        .map((r) => this.mapReferralToType(r));

      // Map recent placements
      const recentPlacementsData = placements
        .slice(0, 5)
        .map((p) => {
          // Map placement to Placement type (simplified)
          return {
            id: p.id,
            referralId: p.referralId,
            providerId: p.providerId,
            openingId: p.openingId,
            placementDate: p.placementDate.toISOString(),
            moveInDate: p.moveInDate?.toISOString(),
            status: p.status,
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
            referral: p.referral
              ? {
                  id: p.referral.id,
                  referralNumber: p.referral.referralNumber,
                  clientInitials: p.referral.clientInitials,
                  clientAge: p.referral.clientAge,
                  primaryPayer: p.referral.primaryPayer,
                }
              : undefined,
          };
        });

      return {
        stats: {
          totalReferrals,
          activeReferrals,
          pendingPlacements,
          completedPlacements,
          averagePlacementTime,
          responseRate,
        },
        recentReferrals,
        urgentReferrals,
        recentPlacements: recentPlacementsData as any,
      };
    } catch (error) {
      console.error("Get case manager dashboard error:", error);
      throw new Error("Failed to retrieve dashboard data");
    }
  }

  /**
   * Map Prisma referral to Referral type
   */
  private mapReferralToType(referral: any): Referral {
    return {
      id: referral.id,
      referralNumber: referral.referralNumber,
      caseManagerId: referral.caseManagerId,
      caseManagerProfileId: referral.caseManagerProfileId,
      organizationId: referral.organizationId,
      clientAge: referral.clientAge,
      clientGender: referral.clientGender,
      clientInitials: referral.clientInitials,
      careLevels: referral.careLevels,
      servicesNeeded: referral.servicesNeeded,
      mobilityLevel: referral.mobilityLevel,
      behavioralNeeds: referral.behavioralNeeds,
      medicalNeeds: referral.medicalNeeds,
      preferredCounties: referral.preferredCounties,
      preferredCities: referral.preferredCities,
      maxDistance: referral.maxDistance,
      primaryPayer: referral.primaryPayer,
      secondaryPayer: referral.secondaryPayer,
      targetMoveDate: referral.targetMoveDate?.toISOString(),
      urgency: referral.urgency,
      status: referral.status,
      internalNotes: referral.internalNotes,
      createdAt: referral.createdAt.toISOString(),
      updatedAt: referral.updatedAt.toISOString(),
      placedAt: referral.placedAt?.toISOString(),
      closedAt: referral.closedAt?.toISOString(),
      caseManager: referral.caseManager,
      caseManagerProfile: referral.caseManagerProfile
        ? {
            id: referral.caseManagerProfile.id,
            firstName: referral.caseManagerProfile.firstName,
            lastName: referral.caseManagerProfile.lastName,
            email: referral.caseManagerProfile.email,
            phone: referral.caseManagerProfile.phone,
            organizationId: referral.caseManagerProfile.organizationId,
          }
        : undefined,
      shortlist: referral.shortlist?.map((s: any) =>
        this.mapShortlistToType(s)
      ),
      messages: referral.messages?.map((m: any) => ({
        id: m.id,
        threadId: m.threadId,
        senderId: m.senderId,
        content: m.content,
        isRead: m.isRead,
        readAt: m.readAt?.toISOString(),
        createdAt: m.createdAt.toISOString(),
        editedAt: m.editedAt?.toISOString(),
      })),
      placements: referral.placements?.map((p: any) => ({
        id: p.id,
        referralId: p.referralId,
        providerId: p.providerId,
        openingId: p.openingId,
        placementDate: p.placementDate.toISOString(),
        moveInDate: p.moveInDate?.toISOString(),
        status: p.status,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    };
  }

  /**
   * Map Prisma shortlist to ReferralShortlist type
   */
  private mapShortlistToType(shortlist: any): ReferralShortlist {
    return {
      id: shortlist.id,
      referralId: shortlist.referralId,
      providerId: shortlist.providerId,
      status: shortlist.status,
      addedAt: shortlist.addedAt.toISOString(),
      contactedAt: shortlist.contactedAt?.toISOString(),
      respondedAt: shortlist.respondedAt?.toISOString(),
      notes: shortlist.notes,
      referral: shortlist.referral
        ? this.mapReferralToType(shortlist.referral)
        : undefined,
      provider: shortlist.provider
        ? {
            id: shortlist.provider.id,
            organization: shortlist.provider.organization
              ? {
                  id: shortlist.provider.organization.id,
                  name: shortlist.provider.organization.name,
                }
              : undefined,
            homes: shortlist.provider.homes?.map((h: any) => ({
              id: h.id,
              name: h.name,
              city: h.city,
              state: h.state,
            })),
          }
        : undefined,
    };
  }
}

