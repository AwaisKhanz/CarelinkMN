import { db } from "@carelink/database";
import { Prisma, EventType, NotificationType } from "@prisma/client";
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
  NotificationPreferences,
  MessageThread,
  Placement,
  PlacementReferralInfo,
  Gender,
  UserRole,
} from "@carelink/types";
import { normalizeDate } from "@carelink/utils";
import { MessagingService } from "./messaging.service";

// Standard include structure for referral queries
type ReferralInclude = {
  caseManager: { select: { id: true; firstName: true; lastName: true; email: true; role: true } };
  caseManagerProfile: true;
  shortlist: true;
  messages: true;
  placements: true;
};

type ReferralPayload = Prisma.ReferralGetPayload<{ include: ReferralInclude }>;

type ShortlistInclude = {
  referral: {
    include: {
      caseManager: { select: { id: true; firstName: true; lastName: true; email: true; role: true } };
      caseManagerProfile: true;
    };
  };
};

type ShortlistPayload = Prisma.ReferralShortlistGetPayload<{ include: ShortlistInclude }>;

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

      // Create notification for new referral (respect user preferences)
      try {
        const channels: string[] = [];
        const prefs = caseManagerProfile?.notificationPreferences as NotificationPreferences | null | undefined;
        if (prefs) {
          if (prefs.inAppNotifications && prefs.inAppNewReferrals) {
            channels.push("IN_APP");
          }
          if (prefs.emailNotifications && prefs.emailNewReferrals) {
            channels.push("EMAIL");
          }
        } else {
          // Default to both if preferences not set
          channels.push("IN_APP", "EMAIL");
        }

        if (channels.length > 0) {
          const { NotificationService } = await import("./notification.service");
          const notificationService = new NotificationService();
          await notificationService.createNotification({
            userId: userId,
            type: NotificationType.REFERRAL_NEW,
            title: "New Referral Created",
            message: `Referral ${referral.referralNumber} has been created successfully.`,
            channels: channels,
            actionUrl: `/case-manager/referrals/${referral.id}`,
          });
        }
      } catch (notifError) {
        console.error("Failed to create referral notification:", notifError);
        // Don't throw - notification failure shouldn't break referral creation
      }

      // Track analytics event
      try {
        await db.analyticsEvent.create({
          data: {
            eventType: EventType.REFERRAL_CREATED,
            userId: userId,
            referralId: referral.id,
            eventData: {
              referralNumber: referral.referralNumber,
              urgency: referral.urgency,
              primaryPayer: referral.primaryPayer,
            },
          },
        });
      } catch (analyticsError) {
        console.error("Failed to track referral creation analytics:", analyticsError);
        // Don't throw - analytics failure shouldn't break referral creation
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
          shortlist: true,
          messages: true,
          placements: true,
        } satisfies ReferralInclude,
      });

      if (!referral) {
        throw new Error("Referral not found");
      }

      return await this.mapReferralToType(referral);
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
            shortlist: true,
            placements: true,
            messages: true,
          } as ReferralInclude,
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
        referrals: await Promise.all(referrals.map((r) => this.mapReferralToType(r as ReferralPayload))),
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

      const updatedReferral = await db.referral.update({
        where: { id: referralId },
        data: updateData,
      });

      // Create notification for referral update (respect user preferences)
      try {
        // Get case manager profile for preferences
        const caseManagerProfile = await db.caseManager.findFirst({
          where: {
            organization: {
              users: {
                some: { id: userId },
              },
            },
          },
        });

        const channels: string[] = [];
        const prefs = caseManagerProfile?.notificationPreferences as NotificationPreferences | null | undefined;
        if (prefs) {
          // For referral updates, check if user wants notifications for provider responses or placement updates
          // Since there's no specific "referral update" preference, we'll use provider responses as the closest match
          if (prefs.inAppNotifications && (prefs.inAppProviderResponses || prefs.inAppPlacementUpdates)) {
            channels.push("IN_APP");
          }
          if (prefs.emailNotifications && (prefs.emailProviderResponses || prefs.emailPlacementUpdates)) {
            channels.push("EMAIL");
          }
        } else {
          // Default to both if preferences not set
          channels.push("IN_APP", "EMAIL");
        }

        if (channels.length > 0) {
          const { NotificationService } = await import("./notification.service");
          const notificationService = new NotificationService();
          await notificationService.createNotification({
            userId: userId,
            type: NotificationType.REFERRAL_UPDATE,
            title: "Referral Updated",
            message: `Referral ${updatedReferral.referralNumber} has been updated.`,
            channels: channels,
            actionUrl: `/case-manager/referrals/${referralId}`,
          });
        }
      } catch (notifError) {
        console.error("Failed to create referral update notification:", notifError);
        // Don't throw - notification failure shouldn't break referral update
      }

      // Track analytics event
      try {
        await db.analyticsEvent.create({
          data: {
            eventType: EventType.REFERRAL_UPDATE,
            userId: userId,
            referralId: referralId,
            eventData: {
              referralNumber: updatedReferral.referralNumber,
              status: updatedReferral.status,
              urgency: updatedReferral.urgency,
            },
          },
        });
      } catch (analyticsError) {
        console.error("Failed to track referral update analytics:", analyticsError);
        // Don't throw - analytics failure shouldn't break referral update
      }

      return this.getReferralById(referralId, userId);
    } catch (error) {
      console.error("Update referral error:", error);
      throw new Error("Failed to update referral");
    }
  }

  /**
   * Assign referral to another case manager in the same organization
   */
  async assignReferral(
    referralId: string,
    currentUserId: string,
    assignedToUserId: string,
    notes?: string
  ): Promise<Referral> {
    try {
      // Get current user and their organization
      const currentUser = await db.user.findUnique({
        where: { id: currentUserId },
        include: { organization: true },
      });

      if (!currentUser || !currentUser.organizationId) {
        throw new Error("Current user or organization not found");
      }

      // Get the referral
      const referral = await db.referral.findUnique({
        where: { id: referralId },
        include: {
          caseManager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              organizationId: true,
            },
          },
        },
      });

      if (!referral) {
        throw new Error("Referral not found");
      }

      // Verify referral is in the same organization
      if (referral.organizationId !== currentUser.organizationId) {
        throw new Error("Access denied: Referral belongs to a different organization");
      }

      // Get the target user (assigned to)
      const assignedToUser = await db.user.findUnique({
        where: { id: assignedToUserId },
        include: { organization: true },
      });

      if (!assignedToUser || !assignedToUser.organizationId) {
        throw new Error("Assigned user not found");
      }

      // Verify target user is in the same organization and is a case manager
      if (assignedToUser.organizationId !== currentUser.organizationId) {
        throw new Error("Access denied: Cannot assign to user in different organization");
      }

      if (assignedToUser.role !== UserRole.CASE_MANAGER) {
        throw new Error("Access denied: Can only assign to case managers");
      }

      // Get the target case manager profile
      const assignedToCaseManagerProfile = await db.caseManager.findFirst({
        where: {
          organizationId: assignedToUser.organizationId,
          email: assignedToUser.email,
        },
      });

      // Update referral assignment
      const previousCaseManagerId = referral.caseManagerId;
      const updatedReferral = await db.referral.update({
        where: { id: referralId },
        data: {
          caseManagerId: assignedToUserId,
          caseManagerProfileId: assignedToCaseManagerProfile?.id || null,
          internalNotes: notes
            ? `${referral.internalNotes || ""}\n\n[Assignment Note - ${new Date().toISOString()}]: ${notes}`.trim()
            : referral.internalNotes,
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

      // Track analytics event
      try {
        await db.analyticsEvent.create({
          data: {
            eventType: EventType.REFERRAL_UPDATE,
            userId: currentUserId,
            referralId: referralId,
            eventData: {
              referralNumber: referral.referralNumber,
              action: "assigned",
              previousCaseManagerId,
              assignedToUserId,
              assignedToUserName: `${assignedToUser.firstName} ${assignedToUser.lastName}`,
            },
          },
        });
      } catch (analyticsError) {
        console.error("Failed to track referral assignment analytics:", analyticsError);
      }

      // Create audit log
      try {
        const { AuditService } = await import("./audit.service");
        const auditService = new AuditService();
        await auditService.logReferral(
          currentUserId,
          "UPDATE",
          referralId,
          {
            action: "assignment",
            previousCaseManagerId,
            assignedToUserId,
            assignedToUserName: `${assignedToUser.firstName} ${assignedToUser.lastName}`,
            notes,
          }
        );
      } catch (auditError) {
        console.error("Failed to create audit log for referral assignment:", auditError);
      }

      // Send notification to assigned case manager
      try {
        const channels: string[] = [];
        const prefs = assignedToCaseManagerProfile?.notificationPreferences as NotificationPreferences | null | undefined;
        if (prefs) {
          if (prefs.inAppNotifications && prefs.inAppNewReferrals) {
            channels.push("IN_APP");
          }
          if (prefs.emailNotifications && prefs.emailNewReferrals) {
            channels.push("EMAIL");
          }
        } else {
          // Default to both if preferences not set
          channels.push("IN_APP", "EMAIL");
        }

        if (channels.length > 0) {
          const { NotificationService } = await import("./notification.service");
          const notificationService = new NotificationService();
          await notificationService.createNotification({
            userId: assignedToUserId,
            type: NotificationType.REFERRAL_NEW,
            title: "Referral Assigned to You",
            message: `Referral ${referral.referralNumber} has been assigned to you by ${currentUser.firstName} ${currentUser.lastName}.`,
            channels: channels,
            actionUrl: `/case-manager/referrals/${referralId}`,
          });
        }
      } catch (notifError) {
        console.error("Failed to create assignment notification:", notifError);
      }

      return this.getReferralById(referralId, assignedToUserId);
    } catch (error) {
      console.error("Assign referral error:", error);
      throw error instanceof Error ? error : new Error("Failed to assign referral");
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

      // Track analytics event
      try {
        await db.analyticsEvent.create({
          data: {
            eventType: EventType.REFERRAL_SHORTLIST_ADDED,
            userId: userId,
            referralId: referralId,
            eventData: {
              providerCount: data.providerIds.length,
              providerIds: data.providerIds,
            },
          },
        });
      } catch (analyticsError) {
        console.error("Failed to track shortlist analytics:", analyticsError);
        // Don't throw - analytics failure shouldn't break shortlist addition
      }

      // Fetch full shortlist with relations
      const result = await this.getShortlist(referralId, userId);

      // Notify providers
      try {
        const { NotificationService } = await import("./notification.service");
        const notificationService = new NotificationService();
        
        // Get provider users to notify
        // This assumes providers have users associated with them via Organization
        // Since we don't have direct Provider -> User relation, we'll notify Organization admins/members
        // For each provider in the shortlist
        for (const providerId of data.providerIds) {
          const provider = await db.provider.findUnique({
            where: { id: providerId },
            include: {
              organization: {
                include: {
                  users: true
                }
              }
            }
          });

          if (provider && provider.organization) {
            // Notify all users in the provider's organization
            // In a real app, we might want to filter by role or preferences
            await notificationService.createBatchNotifications(
              provider.organization.users.map(user => ({
                userId: user.id,
                type: NotificationType.NEW_REFERRAL,
                title: "New Referral Opportunity",
                message: `You have been shortlisted for a new referral: ${referral.clientInitials}`,
                actionUrl: `/provider/referrals/${referralId}`,
                actionLabel: "View Referral",
                metadata: { referralId, providerId }
              }))
            );
          }
        }
      } catch (notifError) {
        console.error("Failed to create shortlist notifications:", notifError);
      }

      return result;
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
          referral: {
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
          },
        } as ShortlistInclude,
      });

      // Fetch provider data
      const provider = await db.provider.findUnique({
        where: { id: updated.providerId },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          homes: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              city: true,
              state: true,
            },
          },
        },
      });

      return await this.mapShortlistToType(updated, provider ?? undefined);
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
          referral: {
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
          },
        } as ShortlistInclude,
        orderBy: {
          addedAt: "desc",
        },
      });

      // Fetch provider data for each shortlist item (providerId is not a relation in schema)
      const providerIds = [...new Set(shortlist.map((s) => s.providerId))];
      const providers = await db.provider.findMany({
        where: { id: { in: providerIds } },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          homes: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              city: true,
              state: true,
            },
          },
        },
      });
      const providerMap = new Map(providers.map((p) => [p.id, p]));

      return Promise.all(
        shortlist.map((s) => {
          const provider = providerMap.get(s.providerId);
          return this.mapShortlistToType(s, provider);
        })
      );
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
    providerIds: string[],
    notes?: string
  ): Promise<ReferralShortlist[]> {
    return this.addToShortlist(referralId, userId, {
      providerIds,
      notes,
    });
  }

  /**
   * Batch message providers
   */
  async batchMessageProviders(
    data: BatchMessageData,
    userId: string
  ): Promise<MessageThread[]> {
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
              const message = await messaging.sendMessage(
                {
                  threadId: existingThread.id,
                  content: data.message,
                  attachments: data.attachments,
                },
                userId
              );

              // Track analytics
              try {
                await db.analyticsEvent.create({
                  data: {
                    eventType: EventType.REFERRAL_MESSAGE_SENT,
                    userId: userId,
                    referralId: referralId,
                    eventData: {
                      providerId: providerId,
                      threadId: existingThread.id,
                      isNewThread: false,
                    },
                  },
                });
              } catch (analyticsError) {
                console.error("Failed to track message analytics:", analyticsError);
              }

              return message;
            } else {
              // Create new thread and send message
              const thread = await messaging.createThread(
                {
                  providerId,
                  referralId,
                  initialMessage: data.message,
                  attachments: data.attachments,
                },
                userId
              );

              // Track analytics
              try {
                await db.analyticsEvent.create({
                  data: {
                    eventType: EventType.REFERRAL_MESSAGE_SENT,
                    userId: userId,
                    referralId: referralId,
                    eventData: {
                      providerId: providerId,
                      threadId: thread.id,
                      isNewThread: true,
                    },
                  },
                });
              } catch (analyticsError) {
                console.error("Failed to track message analytics:", analyticsError);
              }

              return thread;
            }
          })
        )
      );

      return threads.filter((t): t is MessageThread => 'providerId' in t && 'initiatorId' in t);
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
          shortlist: true,
          messages: true,
          placements: true,
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
      const recentReferrals = await Promise.all(
        referrals
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 5)
          .map((r) => this.mapReferralToType(r as ReferralPayload))
      );

      // Get urgent referrals
      const urgentReferrals = await Promise.all(
        referrals
          .filter((r) => r.urgency === Urgency.URGENT)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 5)
          .map((r) => this.mapReferralToType(r as ReferralPayload))
      );

      // Map recent placements
      const recentPlacementsData: Placement[] = placements
        .slice(0, 5)
        .map((p) => {
          // Map placement to Placement type
          const placement: Placement = {
            id: p.id,
            referralId: p.referralId || undefined,
            providerId: p.providerId,
            openingId: p.openingId,
            placementDate: p.placementDate.toISOString(),
            moveInDate: p.moveInDate?.toISOString(),
            status: p.status as PlacementStatus,
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
            confirmedAt: p.confirmedAt?.toISOString(),
            completedAt: p.completedAt?.toISOString(),
            referral: p.referral
              ? {
                  id: p.referral.id,
                  referralNumber: p.referral.referralNumber,
                  clientInitials: p.referral.clientInitials,
                  clientAge: p.referral.clientAge,
                  primaryPayer: p.referral.primaryPayer,
                } as PlacementReferralInfo
              : undefined,
          };
          return placement;
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
        recentPlacements: recentPlacementsData,
      };
    } catch (error) {
      console.error("Get case manager dashboard error:", error);
      throw new Error("Failed to retrieve dashboard data");
    }
  }

  /**
   * Map Prisma referral to Referral type
   */
  private async mapReferralToType(referral: ReferralPayload): Promise<Referral> {
    return {
      id: referral.id,
      referralNumber: referral.referralNumber,
      caseManagerId: referral.caseManagerId,
      caseManagerProfileId: referral.caseManagerProfileId ?? undefined,
      organizationId: referral.organizationId,
      clientAge: referral.clientAge,
      clientGender: referral.clientGender as Gender,
      clientInitials: referral.clientInitials,
      careLevels: referral.careLevels,
      servicesNeeded: referral.servicesNeeded,
      mobilityLevel: referral.mobilityLevel ?? undefined,
      behavioralNeeds: referral.behavioralNeeds,
      medicalNeeds: referral.medicalNeeds,
      preferredCounties: referral.preferredCounties,
      preferredCities: referral.preferredCities,
      maxDistance: referral.maxDistance ?? undefined,
      primaryPayer: referral.primaryPayer as Payer,
      secondaryPayer: referral.secondaryPayer ? (referral.secondaryPayer as Payer) : undefined,
      targetMoveDate: referral.targetMoveDate?.toISOString(),
      urgency: referral.urgency as Urgency,
      status: referral.status as ReferralStatus,
      internalNotes: referral.internalNotes ?? undefined,
      createdAt: referral.createdAt.toISOString(),
      updatedAt: referral.updatedAt.toISOString(),
      placedAt: referral.placedAt?.toISOString(),
      closedAt: referral.closedAt?.toISOString(),
      caseManager: referral.caseManager
        ? {
            id: referral.caseManager.id,
            firstName: referral.caseManager.firstName,
            lastName: referral.caseManager.lastName,
            email: referral.caseManager.email,
            role: referral.caseManager.role as UserRole,
          }
        : undefined,
      caseManagerProfile: referral.caseManagerProfile
        ? {
            id: referral.caseManagerProfile.id,
            firstName: referral.caseManagerProfile.firstName,
            lastName: referral.caseManagerProfile.lastName,
            email: referral.caseManagerProfile.email,
            phone: referral.caseManagerProfile.phone ?? undefined,
            organizationId: referral.caseManagerProfile.organizationId,
          }
        : undefined,
      shortlist: await Promise.all(
        referral.shortlist.map(async (s) => {
          const provider = await db.provider.findUnique({
            where: { id: s.providerId },
            include: {
              organization: {
                select: {
                  id: true,
                  name: true,
                },
              },
              homes: {
                where: { isActive: true },
                select: {
                  id: true,
                  name: true,
                  city: true,
                  state: true,
                },
              },
            },
          });
          return await this.mapShortlistToType(s as ShortlistPayload, provider ?? undefined);
        })
      ),
      messages: undefined, // Messages are MessageThreads, not included in Referral type
      placements: referral.placements.map((p) => ({
        id: p.id,
        referralId: p.referralId ?? undefined,
        providerId: p.providerId,
        openingId: p.openingId,
        placementDate: p.placementDate.toISOString(),
        moveInDate: p.moveInDate?.toISOString(),
        status: p.status as PlacementStatus,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    };
  }

  /**
   * Get referral timeline events from analytics
   */
  async getReferralTimeline(referralId: string, userId: string): Promise<Array<{
    id: string;
    eventType: string;
    title: string;
    description: string;
    timestamp: string;
    userId?: string;
    userName?: string;
    eventData?: any;
  }>> {
    try {
      // Verify user has access to this referral
      // Get user's organizationId first
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { organizationId: true },
      });

      if (!user?.organizationId) {
        throw new Error("User organization not found");
      }

      const referral = await db.referral.findFirst({
        where: {
          id: referralId,
          caseManager: {
            organizationId: user.organizationId,
          },
        },
      });

      if (!referral) {
        throw new Error("Referral not found or access denied");
      }

      // Get all analytics events for this referral
      const events = await db.analyticsEvent.findMany({
        where: {
          referralId: referralId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Fetch user data for events that have userId
      const userIds = [...new Set(events.map(e => e.userId).filter(Boolean) as string[])];
      const users = userIds.length > 0 
        ? await db.user.findMany({
            where: { id: { in: userIds } },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          })
        : [];
      const userMap = new Map(users.map(u => [u.id, u]));

      // Also get shortlist events
      const shortlistEvents = await db.referralShortlist.findMany({
        where: {
          referralId: referralId,
        },
        include: {
          referral: {
            include: {
              caseManager: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          addedAt: "desc",
        },
      });

      // Format events for timeline
      const timelineEvents: Array<{
        id: string;
        eventType: string;
        title: string;
        description: string;
        timestamp: string;
        userId?: string;
        userName?: string;
        eventData?: any;
      }> = [];

      // Add analytics events
      for (const event of events) {
        const eventData = event.eventData as any || {};
        let title = "";
        let description = "";

        const user = event.userId ? userMap.get(event.userId) : null;

        switch (event.eventType) {
          case EventType.REFERRAL_CREATED:
            title = "Referral Created";
            description = `Referral ${eventData.referralNumber || referralId} was created`;
            break;
          case EventType.REFERRAL_UPDATE:
            if (eventData.action === "assigned") {
              title = "Referral Assigned";
              description = `Assigned to ${eventData.assignedToUserName || "another case manager"}`;
              if (eventData.notes) {
                description += `: ${eventData.notes}`;
              }
            } else if (eventData.statusChange) {
              title = "Status Updated";
              description = `Status changed from ${eventData.statusChange.from} to ${eventData.statusChange.to}`;
            } else if (eventData.status) {
              title = "Status Updated";
              description = `Status changed to ${eventData.status}`;
            } else if (eventData.urgencyChange) {
              title = "Urgency Updated";
              description = `Urgency changed from ${eventData.urgencyChange.from} to ${eventData.urgencyChange.to}`;
            } else {
              title = "Referral Updated";
              description = "Referral details were updated";
            }
            break;
          case EventType.REFERRAL_SHORTLIST_ADDED:
            title = "Provider Added to Shortlist";
            description = eventData.providerName 
              ? `Added ${eventData.providerName} to shortlist`
              : eventData.providerCount
              ? `Added ${eventData.providerCount} provider(s) to shortlist`
              : "Provider added to shortlist";
            break;
          case EventType.REFERRAL_MESSAGE_SENT:
            title = "Message Sent";
            description = eventData.providerName
              ? `Message sent to ${eventData.providerName}`
              : "Message sent to provider";
            break;
          default:
            title = event.eventType.replace(/_/g, " ");
            description = "Event occurred";
        }

        timelineEvents.push({
          id: event.id,
          eventType: event.eventType,
          title,
          description,
          timestamp: event.createdAt.toISOString(),
          userId: event.userId || undefined,
          userName: user
            ? `${user.firstName} ${user.lastName}`
            : undefined,
          eventData: eventData,
        });
      }

      // Add shortlist events
      for (const shortlist of shortlistEvents) {
        timelineEvents.push({
          id: `shortlist-${shortlist.id}`,
          eventType: "SHORTLIST_ADDED",
          title: "Provider Added to Shortlist",
          description: `Provider added to shortlist`,
          timestamp: shortlist.addedAt.toISOString(),
          userId: shortlist.referral.caseManagerId,
          userName: shortlist.referral.caseManager
            ? `${shortlist.referral.caseManager.firstName} ${shortlist.referral.caseManager.lastName}`
            : undefined,
          eventData: {
            providerId: shortlist.providerId,
            status: shortlist.status,
          },
        });

        if (shortlist.contactedAt) {
          timelineEvents.push({
            id: `shortlist-contacted-${shortlist.id}`,
            eventType: "SHORTLIST_CONTACTED",
            title: "Provider Contacted",
            description: "Provider was contacted",
            timestamp: shortlist.contactedAt.toISOString(),
            eventData: {
              providerId: shortlist.providerId,
            },
          });
        }

        if (shortlist.respondedAt) {
          timelineEvents.push({
            id: `shortlist-responded-${shortlist.id}`,
            eventType: "SHORTLIST_RESPONDED",
            title: "Provider Responded",
            description: `Provider responded (${shortlist.status})`,
            timestamp: shortlist.respondedAt.toISOString(),
            eventData: {
              providerId: shortlist.providerId,
              status: shortlist.status,
            },
          });
        }
      }

      // Sort by timestamp (newest first)
      timelineEvents.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      return timelineEvents;
    } catch (error) {
      console.error("Get referral timeline error:", error);
      throw new Error("Failed to retrieve referral timeline");
    }
  }

  /**
   * Map Prisma shortlist to ReferralShortlist type
   */
  private async mapShortlistToType(
    shortlist: ShortlistPayload | Prisma.ReferralShortlistGetPayload<{}>,
    provider?: Prisma.ProviderGetPayload<{
      include: {
        organization: { select: { id: true; name: true } };
        homes: { select: { id: true; name: true; city: true; state: true } };
      };
    }>
  ): Promise<ReferralShortlist> {
    const referral = 'referral' in shortlist && shortlist.referral
      ? await this.mapReferralToType(shortlist.referral as ReferralPayload)
      : undefined;

    return {
      id: shortlist.id,
      referralId: shortlist.referralId,
      providerId: shortlist.providerId,
      status: shortlist.status as ShortlistStatus,
      addedAt: shortlist.addedAt.toISOString(),
      contactedAt: shortlist.contactedAt?.toISOString(),
      respondedAt: shortlist.respondedAt?.toISOString(),
      notes: shortlist.notes ?? undefined,
      referral,
      provider: provider
        ? {
            id: provider.id,
            organization: provider.organization
              ? {
                  id: provider.organization.id,
                  name: provider.organization.name,
                }
              : undefined,
            homes: provider.homes.map((h) => ({
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

