import { db } from "@carelink/database";
import {
  Prisma,
  DischargeStatus,
  InviteResponse,
  OpeningStatus,
} from "@prisma/client";
import {
  DischargeCase,
  CreateDischargeCaseData,
  UpdateDischargeCaseData,
  DischargeCaseFilters,
  DischargeInvitation,
  DischargeChecklist,
  PaginatedDischargeCases,
  AIMatchingResult,
  Gender,
  Payer,
  DischargeStatus as DischargeStatusType,
  InviteResponse as InviteResponseType,
  ThreadStatus,
  PlacementStatus,
  MessageThread,
  Placement,
  TransportBooking,
  Consent,
  BookingStatus as BookingStatusType,
  ConsentType,
  CaptureMethod,
  HospitalSWAnalytics,
} from "@carelink/types";
import { normalizeDate } from "@carelink/utils";

// Standard include structure for discharge case queries
type DischargeCaseInclude = {
  socialWorker: {
    select: { id: true; firstName: true; lastName: true; email: true };
  };
  hospitalStaff: { select: { id: true; department: true; title: true } };
  invitations: true;
  messages: true;
  placement: true;
  transportBooking: {
    include: {
      vendor: {
        include: {
          organization: {
            select: {
              id: true;
              name: true;
            };
          };
        };
      };
    };
  };
  checklist: true;
  consent: {
    include: {
      user: {
        select: {
          id: true;
          firstName: true;
          lastName: true;
          email: true;
        };
      };
    };
  };
};

type DischargeCasePayload = Prisma.DischargeCaseGetPayload<{
  include: DischargeCaseInclude;
}>;

type OpeningWithRelations = Prisma.OpeningGetPayload<{
  include: {
    provider: {
      include: {
        organization: {
          select: {
            id: true;
            name: true;
          };
        };
        services: {
          where: {
            isActive: true;
          };
          include: {
            service: true;
          };
        };
        licenses: true;
      };
    };
    home: {
      include: {
        services: {
          where: { isActive: true };
          include: { service: true };
        };
      };
    };
  };
}>;

type ProviderMatch = {
  provider: OpeningWithRelations["provider"];
  home: OpeningWithRelations["home"];
  score: number;
  reasons: string[];
};

type MatchingOptions = {
  excludeProviderIds?: string[];
  limit?: number;
};

type AutoEscalationResult = {
  caseId: string;
  caseNumber: string;
  invitedProviderIds: string[];
  invitedProviders: Array<{ id: string; name: string }>;
  socialWorker?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
};

export class DischargeCaseService {
  /**
   * Create a new discharge case
   */
  async createDischargeCase(
    userId: string,
    data: CreateDischargeCaseData
  ): Promise<DischargeCase> {
    try {
      // Get user to find hospital and organization
      const user = await db.user.findUnique({
        where: { id: userId },
        include: {
          organization: true,
        },
      });

      if (!user || !user.organizationId) {
        throw new Error("User or organization not found");
      }

      // Find hospital staff profile if exists
      const hospitalStaff = await db.hospitalStaff.findFirst({
        where: {
          organizationId: user.organizationId,
          email: user.email,
        },
      });

      // Create discharge case
      const dischargeCase = await db.dischargeCase.create({
        data: {
          hospitalId: user.organizationId,
          socialWorkerId: userId,
          hospitalStaffId: hospitalStaff?.id,
          patientInitials: data.patientInitials,
          patientAge: data.patientAge,
          patientGender: data.patientGender,
          diagnosisCodes: data.diagnosisCodes,
          mobilityStatus: data.mobilityStatus,
          cognitiveStatus: data.cognitiveStatus,
          behavioralConcerns: data.behavioralConcerns || [],
          dmeNeeds: data.dmeNeeds || [],
          medicationManagement: data.medicationManagement,
          currentLocation: data.currentLocation,
          targetDischargeDate: normalizeDate(data.targetDischargeDate) as Date,
          preferredCounties: data.preferredCounties,
          preferredCities: data.preferredCities || [],
          requiresProximity: data.requiresProximity,
          proximityZipCode: data.proximityZipCode,
          maxDistanceMiles: data.maxDistanceMiles,
          primaryInsurance: data.primaryInsurance,
          secondaryInsurance: data.secondaryInsurance,
          needsTransport: data.needsTransport,
          transportType: data.transportType,
          status: DischargeStatus.INTAKE,
        },
        include: this.getDefaultInclude(),
      });

      // Create initial checklist
      await db.dischargeChecklist.create({
        data: {
          dischargeCaseId: dischargeCase.id,
        },
      });

      return await this.mapDischargeCaseToType(
        dischargeCase as DischargeCasePayload
      );
    } catch (error) {
      console.error("Create discharge case error:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to create discharge case"
      );
    }
  }

  /**
   * Get discharge cases with filters
   */
  async getDischargeCases(
    userId: string,
    filters?: DischargeCaseFilters
  ): Promise<PaginatedDischargeCases> {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.DischargeCaseWhereInput = {};

      // Filter by status
      if (filters?.status) {
        where.status = filters.status as DischargeStatus;
      }

      // Filter by hospital (user's organization)
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { organizationId: true },
      });

      if (user?.organizationId) {
        where.hospitalId = user.organizationId;
      } else {
        // If no organization, return empty result by using impossible condition
        where.hospitalId = "IMPOSSIBLE_ID_THAT_WILL_NEVER_MATCH";
      }

      // Filter by social worker
      if (filters?.socialWorkerId) {
        where.socialWorkerId = filters.socialWorkerId;
      }

      // Search filter
      if (filters?.search) {
        where.OR = [
          { caseNumber: { contains: filters.search, mode: "insensitive" } },
          {
            patientInitials: { contains: filters.search, mode: "insensitive" },
          },
        ];
      }

      // Date range filter
      if (filters?.targetDischargeDateFrom || filters?.targetDischargeDateTo) {
        const dateFilter: Prisma.DateTimeFilter = {};
        if (filters.targetDischargeDateFrom) {
          dateFilter.gte = normalizeDate(
            filters.targetDischargeDateFrom
          ) as Date;
        }
        if (filters.targetDischargeDateTo) {
          dateFilter.lte = normalizeDate(filters.targetDischargeDateTo) as Date;
        }
        where.targetDischargeDate = dateFilter;
      }

      // Get total count
      const total = await db.dischargeCase.count({ where });

      // Get discharge cases
      const dischargeCases = await db.dischargeCase.findMany({
        where,
        include: this.getDefaultInclude(),
        orderBy: [{ targetDischargeDate: "asc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      });

      return {
        cases: await Promise.all(
          dischargeCases.map((dc) =>
            this.mapDischargeCaseToType(dc as DischargeCasePayload)
          )
        ),
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page,
          limit,
        },
      };
    } catch (error) {
      console.error("Get discharge cases error:", error);
      throw new Error("Failed to retrieve discharge cases");
    }
  }

  /**
   * Get discharge case by ID
   */
  async getDischargeCaseById(
    id: string,
    userId: string
  ): Promise<DischargeCase> {
    try {
      // Verify user has access to this case
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { organizationId: true },
      });

      const whereClause: Prisma.DischargeCaseWhereInput = { id };
      if (user?.organizationId) {
        whereClause.hospitalId = user.organizationId;
      } else {
        // Will never match
        whereClause.hospitalId = "IMPOSSIBLE_ID_THAT_WILL_NEVER_MATCH";
      }

      const dischargeCase = await db.dischargeCase.findFirst({
        where: whereClause,
        include: this.getDefaultInclude(),
      });

      if (!dischargeCase) {
        throw new Error("Discharge case not found");
      }

      return await this.mapDischargeCaseToType(
        dischargeCase as DischargeCasePayload
      );
    } catch (error) {
      console.error("Get discharge case by ID error:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to retrieve discharge case"
      );
    }
  }

  /**
   * Update discharge case
   */
  async updateDischargeCase(
    id: string,
    userId: string,
    data: UpdateDischargeCaseData
  ): Promise<DischargeCase> {
    try {
      // Verify user has access to this case
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { organizationId: true },
      });

      const whereClause: Prisma.DischargeCaseWhereInput = { id };
      if (user?.organizationId) {
        whereClause.hospitalId = user.organizationId;
      } else {
        whereClause.hospitalId = "IMPOSSIBLE_ID_THAT_WILL_NEVER_MATCH";
      }

      const existingCase = await db.dischargeCase.findFirst({
        where: whereClause,
      });

      if (!existingCase) {
        throw new Error("Discharge case not found");
      }

      // Build update data
      const updateData: Prisma.DischargeCaseUpdateInput = {};

      if (data.patientInitials !== undefined)
        updateData.patientInitials = data.patientInitials;
      if (data.patientAge !== undefined)
        updateData.patientAge = data.patientAge;
      if (data.patientGender !== undefined)
        updateData.patientGender = data.patientGender;
      if (data.diagnosisCodes !== undefined)
        updateData.diagnosisCodes = data.diagnosisCodes;
      if (data.mobilityStatus !== undefined)
        updateData.mobilityStatus = data.mobilityStatus;
      if (data.cognitiveStatus !== undefined)
        updateData.cognitiveStatus = data.cognitiveStatus;
      if (data.behavioralConcerns !== undefined)
        updateData.behavioralConcerns = data.behavioralConcerns;
      if (data.dmeNeeds !== undefined) updateData.dmeNeeds = data.dmeNeeds;
      if (data.medicationManagement !== undefined)
        updateData.medicationManagement = data.medicationManagement;
      if (data.currentLocation !== undefined)
        updateData.currentLocation = data.currentLocation;
      if (data.targetDischargeDate !== undefined) {
        updateData.targetDischargeDate = normalizeDate(
          data.targetDischargeDate
        ) as Date;
      }
      if (data.actualDischargeDate !== undefined) {
        updateData.actualDischargeDate = data.actualDischargeDate
          ? (normalizeDate(data.actualDischargeDate) as Date)
          : null;
      }
      if (data.preferredCounties !== undefined)
        updateData.preferredCounties = data.preferredCounties;
      if (data.preferredCities !== undefined)
        updateData.preferredCities = data.preferredCities;
      if (data.requiresProximity !== undefined)
        updateData.requiresProximity = data.requiresProximity;
      if (data.proximityZipCode !== undefined)
        updateData.proximityZipCode = data.proximityZipCode;
      if (data.maxDistanceMiles !== undefined)
        updateData.maxDistanceMiles = data.maxDistanceMiles;
      if (data.primaryInsurance !== undefined)
        updateData.primaryInsurance = data.primaryInsurance;
      if (data.secondaryInsurance !== undefined)
        updateData.secondaryInsurance = data.secondaryInsurance;
      if (data.needsTransport !== undefined)
        updateData.needsTransport = data.needsTransport;
      if (data.transportType !== undefined)
        updateData.transportType = data.transportType;
      if (data.status !== undefined) {
        updateData.status = data.status as DischargeStatus;
        // Update timestamps based on status changes
        if (data.status === DischargeStatusType.MATCHING) {
          updateData.matchedAt = new Date();
        } else if (data.status === DischargeStatusType.INVITES_SENT) {
          updateData.invitesSentAt = new Date();
        } else if (
          data.status === DischargeStatusType.PLACEMENT_CONFIRMED ||
          data.status === DischargeStatusType.DISCHARGED
        ) {
          updateData.placedAt = new Date();
        }
      }

      const updatedCase = await db.dischargeCase.update({
        where: { id },
        data: updateData,
        include: this.getDefaultInclude(),
      });

      return await this.mapDischargeCaseToType(
        updatedCase as DischargeCasePayload
      );
    } catch (error) {
      console.error("Update discharge case error:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to update discharge case"
      );
    }
  }

  /**
   * Delete discharge case
   */
  async deleteDischargeCase(id: string, userId: string): Promise<void> {
    try {
      // Verify user has access to this case
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { organizationId: true },
      });

      const whereClause: Prisma.DischargeCaseWhereInput = { id };
      if (user?.organizationId) {
        whereClause.hospitalId = user.organizationId;
      } else {
        whereClause.hospitalId = "IMPOSSIBLE_ID_THAT_WILL_NEVER_MATCH";
      }

      const existingCase = await db.dischargeCase.findFirst({
        where: whereClause,
      });

      if (!existingCase) {
        throw new Error("Discharge case not found");
      }

      // Only allow deletion if case is in INTAKE or CANCELLED status
      if (
        existingCase.status !== "INTAKE" &&
        existingCase.status !== "CANCELLED"
      ) {
        throw new Error("Cannot delete discharge case in current status");
      }

      await db.dischargeCase.delete({
        where: { id },
      });
    } catch (error) {
      console.error("Delete discharge case error:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to delete discharge case"
      );
    }
  }

  /**
   * Get discharge case invitations
   */
  async getDischargeCaseInvitations(
    caseId: string,
    userId: string
  ): Promise<DischargeInvitation[]> {
    try {
      // Verify user has access to this case
      await this.getDischargeCaseById(caseId, userId);

      const invitations = await db.dischargeInvitation.findMany({
        where: { dischargeCaseId: caseId },
        orderBy: { invitedAt: "desc" },
      });

      // Fetch provider data for each invitation
      const invitationsWithProviders = await Promise.all(
        invitations.map(async (inv) => {
          const provider = await db.provider.findUnique({
            where: { id: inv.providerId },
            include: {
              organization: { select: { id: true, name: true } },
              homes: {
                select: { id: true, name: true, city: true, state: true },
              },
            },
          });
          return { ...inv, provider };
        })
      );

      return await Promise.all(
        invitationsWithProviders.map((inv) =>
          this.mapDischargeInvitationToType(inv)
        )
      );
    } catch (error) {
      console.error("Get discharge case invitations error:", error);
      throw new Error("Failed to retrieve invitations");
    }
  }

  /**
   * Send provider invitations
   */
  async sendProviderInvitations(
    caseId: string,
    userId: string,
    providerIds: string[]
  ): Promise<DischargeInvitation[]> {
    try {
      // Verify user has access to this case
      const dischargeCase = await this.getDischargeCaseById(caseId, userId);

      // Create invitations
      const invitations = await Promise.all(
        providerIds.map(async (providerId) => {
          // Check if invitation already exists
          const existing = await db.dischargeInvitation.findFirst({
            where: {
              dischargeCaseId: caseId,
              providerId,
            },
          });

          if (existing) {
            const provider = await db.provider.findUnique({
              where: { id: providerId },
              include: {
                organization: { select: { id: true, name: true } },
                homes: {
                  select: { id: true, name: true, city: true, state: true },
                },
              },
            });
            return { ...existing, provider };
          }

          // Create new invitation (expires in 48 hours)
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 48);

          const invitation = await db.dischargeInvitation.create({
            data: {
              dischargeCaseId: caseId,
              providerId,
              expiresAt,
            },
          });

          // Fetch provider data
          const provider = await db.provider.findUnique({
            where: { id: providerId },
            include: {
              organization: { select: { id: true, name: true } },
              homes: {
                select: { id: true, name: true, city: true, state: true },
              },
            },
          });

          return { ...invitation, provider };
        })
      );

      // Update case status if needed
      if (dischargeCase.status === DischargeStatusType.MATCHING) {
        await db.dischargeCase.update({
          where: { id: caseId },
          data: {
            status: DischargeStatus.INVITES_SENT,
            invitesSentAt: new Date(),
          },
        });
      }

      return await Promise.all(
        invitations.map((inv) => this.mapDischargeInvitationToType(inv))
      );
    } catch (error) {
      console.error("Send provider invitations error:", error);
      throw new Error("Failed to send invitations");
    }
  }

  /**
   * Get discharge checklist
   */
  async getDischargeChecklist(
    caseId: string,
    userId: string
  ): Promise<DischargeChecklist> {
    try {
      // Verify user has access to this case
      await this.getDischargeCaseById(caseId, userId);

      let checklist = await db.dischargeChecklist.findUnique({
        where: { dischargeCaseId: caseId },
      });

      // Create checklist if it doesn't exist
      if (!checklist) {
        checklist = await db.dischargeChecklist.create({
          data: { dischargeCaseId: caseId },
        });
      }

      return this.mapDischargeChecklistToType(checklist);
    } catch (error) {
      console.error("Get discharge checklist error:", error);
      throw new Error("Failed to retrieve checklist");
    }
  }

  /**
   * Update discharge checklist
   */
  async updateDischargeChecklist(
    caseId: string,
    userId: string,
    checklistData: Partial<DischargeChecklist>
  ): Promise<DischargeChecklist> {
    try {
      // Verify user has access to this case
      await this.getDischargeCaseById(caseId, userId);

      const updateData: Prisma.DischargeChecklistUpdateInput = {};
      if (checklistData.consentObtained !== undefined)
        updateData.consentObtained = checklistData.consentObtained;
      if (checklistData.insuranceVerified !== undefined)
        updateData.insuranceVerified = checklistData.insuranceVerified;
      if (checklistData.medsReconciled !== undefined)
        updateData.medsReconciled = checklistData.medsReconciled;
      if (checklistData.equipmentOrdered !== undefined)
        updateData.equipmentOrdered = checklistData.equipmentOrdered;
      if (checklistData.transportArranged !== undefined)
        updateData.transportArranged = checklistData.transportArranged;
      if (checklistData.patientEducated !== undefined)
        updateData.patientEducated = checklistData.patientEducated;
      if (checklistData.documentsSent !== undefined)
        updateData.documentsSent = checklistData.documentsSent;
      if (checklistData.followUpScheduled !== undefined)
        updateData.followUpScheduled = checklistData.followUpScheduled;
      if (checklistData.day1Contact !== undefined)
        updateData.day1Contact = checklistData.day1Contact;
      if (checklistData.day2Contact !== undefined)
        updateData.day2Contact = checklistData.day2Contact;
      if (checklistData.day7Contact !== undefined)
        updateData.day7Contact = checklistData.day7Contact;
      if (checklistData.day30Contact !== undefined)
        updateData.day30Contact = checklistData.day30Contact;

      const checklist = await db.dischargeChecklist.upsert({
        where: { dischargeCaseId: caseId },
        create: {
          dischargeCaseId: caseId,
          ...updateData,
        } as Prisma.DischargeChecklistCreateInput,
        update: updateData,
      });

      return this.mapDischargeChecklistToType(checklist);
    } catch (error) {
      console.error("Update discharge checklist error:", error);
      throw new Error("Failed to update checklist");
    }
  }

  /**
   * Trigger AI matching for discharge case
   */
  async triggerAIMatching(
    caseId: string,
    userId: string
  ): Promise<AIMatchingResult> {
    try {
      const dischargeCase = await this.getDischargeCaseById(caseId, userId);
      const { matches, explanation } = await this.getMatchingProvidersForCase(
        dischargeCase,
        { limit: 15 }
      );

      return {
        providers: matches.map(
          (match: {
            provider: OpeningWithRelations["provider"];
            home: OpeningWithRelations["home"];
            score: number;
            reasons: string[];
          }) => ({
            id: match.provider.id,
            organization: match.provider?.organization
              ? { name: match.provider.organization.name }
              : undefined,
            matchScore: Math.max(1, Math.round(match.score)),
            matchReasons: [
              ...match.reasons,
              `Suggested home: ${match.home.name} (${match.home.city}, ${match.home.state}).`,
            ],
          })
        ),
        explanation,
      };
    } catch (error) {
      console.error("Trigger AI matching error:", error);
      throw new Error("Failed to trigger AI matching");
    }
  }

  /**
   * Automatically escalate a discharge case by inviting alternate providers
   * when all prior invitations have expired or been declined.
   */
  async autoEscalateDischargeCase(
    caseId: string,
    maxInvites: number = 3
  ): Promise<{ invitedProviderIds: string[] }> {
    try {
      const caseRecord = await db.dischargeCase.findUnique({
        where: { id: caseId },
        include: this.getDefaultInclude(),
      });

      if (!caseRecord) {
        return { invitedProviderIds: [] };
      }

      const dischargeCase = await this.mapDischargeCaseToType(
        caseRecord as DischargeCasePayload
      );

      // Only escalate cases in these statuses
      if (
        ![
          DischargeStatusType.MATCHING,
          DischargeStatusType.INVITES_SENT,
          DischargeStatusType.RESPONSES_PENDING,
        ].includes(dischargeCase.status)
      ) {
        return { invitedProviderIds: [] };
      }

      // Get all invitations for this case
      const invitations = await db.dischargeInvitation.findMany({
        where: { dischargeCaseId: caseId },
        select: { providerId: true, response: true, respondedAt: true },
      });

      // Don't escalate if there's an accepted invitation
      if (invitations.some((inv) => inv.response === InviteResponse.ACCEPTED)) {
        return { invitedProviderIds: [] };
      }

      // Don't escalate if there are pending invitations
      const hasPendingInvite = invitations.some(
        (inv) => inv.respondedAt === null
      );
      if (hasPendingInvite) {
        return { invitedProviderIds: [] };
      }

      // Get providers to exclude (already invited)
      const excludeProviderIds = invitations
        .map((inv) => inv.providerId)
        .filter((id): id is string => Boolean(id));

      // Get matching providers (excluding already invited ones)
      const { matches } = await this.getMatchingProvidersForCase(
        dischargeCase,
        {
          excludeProviderIds,
          limit: maxInvites * 2,
        }
      );

      // Select top providers to invite
      const providerIdsToInvite = matches
        .map((match) => match.provider.id)
        .filter(
          (id): id is string => Boolean(id) && !excludeProviderIds.includes(id)
        )
        .slice(0, maxInvites);

      if (providerIdsToInvite.length === 0) {
        return { invitedProviderIds: [] };
      }

      // Send invitations
      await this.sendProviderInvitations(
        caseId,
        dischargeCase.socialWorkerId,
        providerIdsToInvite
      );

      // Update case status if needed
      await db.dischargeCase.update({
        where: { id: caseId },
        data: {
          status: DischargeStatus.INVITES_SENT,
          invitesSentAt: new Date(),
        },
      });

      console.log(
        `[Discharge Case] Auto-escalated case ${caseId} with ${providerIdsToInvite.length} new invitations`
      );

      return { invitedProviderIds: providerIdsToInvite };
    } catch (error) {
      console.error("Auto-escalate discharge case error:", error);
      throw new Error("Failed to auto-escalate discharge case");
    }
  }

  /**
   * Get matching providers for a discharge case
   */
  private async getMatchingProvidersForCase(
    dischargeCase: DischargeCase,
    options?: {
      excludeProviderIds?: string[];
      limit?: number;
    }
  ): Promise<{
    matches: {
      provider: OpeningWithRelations["provider"];
      home: OpeningWithRelations["home"];
      score: number;
      reasons: string[];
    }[];
    explanation: string;
  }> {
    const limit = options?.limit ?? 15;
    const payerPreferences: Payer[] = [
      dischargeCase.primaryInsurance,
      ...(dischargeCase.secondaryInsurance
        ? [dischargeCase.secondaryInsurance]
        : []),
    ].filter((payer): payer is Payer => Boolean(payer));

    const homeFilter: Prisma.HomeWhereInput = {
      isActive: true,
      acceptingNew: true,
    };

    if (dischargeCase.preferredCounties?.length) {
      homeFilter.county = {
        in: dischargeCase.preferredCounties,
        mode: "insensitive",
      };
    }

    if (dischargeCase.preferredCities?.length) {
      homeFilter.city = {
        in: dischargeCase.preferredCities,
        mode: "insensitive",
      };
    }

    const providerFilter: Prisma.ProviderWhereInput = {
      acceptsReferrals: true,
    };

    if (options?.excludeProviderIds?.length) {
      providerFilter.id = {
        notIn: options.excludeProviderIds,
      };
    }

    const openingWhere: Prisma.OpeningWhereInput = {
      status: OpeningStatus.OPEN,
      spotsAvailable: {
        gt: 0,
      },
      provider: {
        is: providerFilter,
      },
      home: {
        is: homeFilter,
      },
    };

    if (payerPreferences.length > 0) {
      openingWhere.acceptedPayers = {
        hasSome: payerPreferences,
      };
    }

    const candidateOpenings = (await db.opening.findMany({
      where: openingWhere,
      include: {
        provider: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
            services: {
              where: { isActive: true },
              include: { service: true },
            },
            licenses: true,
          },
        },
        home: {
          include: {
            services: {
              where: { isActive: true },
              include: { service: true },
            },
          },
        },
      },
      orderBy: {
        freshnessTimestamp: "desc",
      },
      take: Math.max(limit * 4, 50),
    })) as OpeningWithRelations[];

    if (candidateOpenings.length === 0) {
      return {
        matches: [],
        explanation:
          "No open providers matched the payer and location criteria. Consider broadening the search.",
      };
    }

    const matchesByProvider = new Map<
      string,
      {
        provider: OpeningWithRelations["provider"];
        home: OpeningWithRelations["home"];
        score: number;
        reasons: string[];
      }
    >();

    for (const opening of candidateOpenings) {
      if (!opening.provider || !opening.home) {
        continue;
      }

      const { score, reasons } = this.calculateOpeningMatchScore(
        dischargeCase,
        opening,
        payerPreferences
      );

      if (score <= 0) {
        continue;
      }

      const existing = matchesByProvider.get(opening.providerId);
      if (!existing || score > existing.score) {
        matchesByProvider.set(opening.providerId, {
          provider: opening.provider,
          home: opening.home,
          score,
          reasons,
        });
      }
    }

    const matches = Array.from(matchesByProvider.values()).sort(
      (a, b) => b.score - a.score
    );

    return {
      matches: matches.slice(0, limit),
      explanation: matches.length
        ? `Found ${matches.length} providers that meet the payer, location, and care requirements for case ${dischargeCase.caseNumber}.`
        : "No providers matched the current criteria. Try adjusting the preferred counties or payer filters.",
    };
  }

  /**
   * Get default include for discharge case queries
   */
  private getDefaultInclude(): DischargeCaseInclude {
    return {
      socialWorker: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      hospitalStaff: { select: { id: true, department: true, title: true } },
      invitations: true,
      messages: true,
      placement: true,
      transportBooking: {
        include: {
          vendor: {
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
      checklist: true,
      consent: {
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
      },
    };
  }

  private calculateOpeningMatchScore(
    dischargeCase: DischargeCase,
    opening: OpeningWithRelations,
    payerPreferences: Payer[]
  ): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    const acceptedPayers = opening.acceptedPayers || [];

    if (
      dischargeCase.primaryInsurance &&
      acceptedPayers.includes(dischargeCase.primaryInsurance)
    ) {
      score += 30;
      reasons.push(
        `Accepts primary payer (${dischargeCase.primaryInsurance}).`
      );
    }

    if (
      dischargeCase.secondaryInsurance &&
      acceptedPayers.includes(dischargeCase.secondaryInsurance)
    ) {
      score += 15;
      reasons.push(
        `Accepts secondary payer (${dischargeCase.secondaryInsurance}).`
      );
    }

    if (
      payerPreferences.length > 0 &&
      !payerPreferences.some((payer) => acceptedPayers.includes(payer))
    ) {
      return { score: 0, reasons: [] };
    }

    const countyMatch = dischargeCase.preferredCounties?.some(
      (county) => county.toLowerCase() === opening.home.county.toLowerCase()
    );
    if (countyMatch) {
      score += 20;
      reasons.push(
        `Home located in preferred county (${opening.home.county}).`
      );
    }

    const cityMatch = dischargeCase.preferredCities?.some(
      (city) => city.toLowerCase() === opening.home.city.toLowerCase()
    );
    if (cityMatch) {
      score += 15;
      reasons.push(`Home located in preferred city (${opening.home.city}).`);
    }

    if (
      (opening.ageMin && dischargeCase.patientAge < opening.ageMin) ||
      (opening.ageMax && dischargeCase.patientAge > opening.ageMax)
    ) {
      return { score: 0, reasons: [] };
    } else {
      score += 10;
      reasons.push("Patient age fits the opening requirements.");
    }

    if (
      opening.genderPreference &&
      opening.genderPreference !== "NO_PREFERENCE" &&
      opening.genderPreference !== dischargeCase.patientGender
    ) {
      return { score: 0, reasons: [] };
    } else if (
      opening.genderPreference &&
      opening.genderPreference !== "NO_PREFERENCE"
    ) {
      score += 5;
      reasons.push(
        `Matches gender preference (${opening.genderPreference.toLowerCase()}).`
      );
    }

    const normalizedCaseNeeds = [
      ...(dischargeCase.behavioralConcerns || []),
      ...(dischargeCase.dmeNeeds || []),
      dischargeCase.mobilityStatus || "",
    ]
      .filter(Boolean)
      .map((need) => need.toLowerCase());

    const normalizedSupportedNeeds = (opening.supportedNeeds || []).map(
      (need) => need.toLowerCase()
    );

    const overlappingNeeds = normalizedCaseNeeds.filter((need) =>
      normalizedSupportedNeeds.includes(need)
    );

    if (overlappingNeeds.length > 0) {
      const overlapScore = Math.min(overlappingNeeds.length * 5, 20);
      score += overlapScore;
      reasons.push(
        `Supports ${overlappingNeeds.length} requested care need(s).`
      );
    }

    if (
      dischargeCase.mobilityStatus?.toLowerCase().includes("wheelchair") &&
      opening.home.wheelchairAccessible
    ) {
      score += 10;
      reasons.push("Home is wheelchair accessible.");
    }

    if (
      dischargeCase.dmeNeeds?.includes("HOSPITAL_BED") &&
      opening.home.singleLevel
    ) {
      score += 5;
      reasons.push("Single-level layout simplifies equipment setup.");
    }

    if (dischargeCase.dmeNeeds?.includes("LIFT") && opening.home.hasElevator) {
      score += 5;
      reasons.push("Elevator available to support lift equipment.");
    }

    if (opening.spotsAvailable > 0) {
      const availabilityScore = Math.min(opening.spotsAvailable * 2, 10);
      score += availabilityScore;
      reasons.push(
        `${opening.spotsAvailable} spot(s) currently available at ${opening.home.name}.`
      );
    }

    if (opening.provider.verified) {
      score += 5;
      reasons.push("Provider is verified on CareLinkMN.");
    }

    return { score, reasons };
  }

  /**
   * Map Prisma discharge case to DischargeCase type
   */
  private async mapDischargeCaseToType(
    payload: DischargeCasePayload
  ): Promise<DischargeCase> {
    // Fetch provider data for invitations
    const invitations = await Promise.all(
      (payload.invitations || []).map(async (inv) => {
        const provider = await db.provider.findUnique({
          where: { id: inv.providerId },
          include: {
            organization: { select: { id: true, name: true } },
            homes: {
              select: { id: true, name: true, city: true, state: true },
            },
          },
        });
        return this.mapDischargeInvitationToType({ ...inv, provider });
      })
    );

    return {
      id: payload.id,
      caseNumber: payload.caseNumber,
      hospitalId: payload.hospitalId,
      socialWorkerId: payload.socialWorkerId,
      hospitalStaffId: payload.hospitalStaffId ?? undefined,
      patientInitials: payload.patientInitials,
      patientAge: payload.patientAge,
      patientGender: payload.patientGender as Gender,
      diagnosisCodes: payload.diagnosisCodes,
      mobilityStatus: payload.mobilityStatus,
      cognitiveStatus: payload.cognitiveStatus ?? undefined,
      behavioralConcerns: payload.behavioralConcerns,
      dmeNeeds: payload.dmeNeeds,
      medicationManagement: payload.medicationManagement,
      currentLocation: payload.currentLocation,
      targetDischargeDate: payload.targetDischargeDate,
      actualDischargeDate: payload.actualDischargeDate ?? undefined,
      preferredCounties: payload.preferredCounties,
      preferredCities: payload.preferredCities,
      requiresProximity: payload.requiresProximity,
      proximityZipCode: payload.proximityZipCode ?? undefined,
      maxDistanceMiles: payload.maxDistanceMiles ?? undefined,
      primaryInsurance: payload.primaryInsurance as Payer,
      secondaryInsurance: (payload.secondaryInsurance as Payer) ?? undefined,
      status: payload.status as DischargeStatusType,
      needsTransport: payload.needsTransport,
      transportType: payload.transportType ?? undefined,
      createdAt: payload.createdAt,
      updatedAt: payload.updatedAt,
      matchedAt: payload.matchedAt ?? undefined,
      invitesSentAt: payload.invitesSentAt ?? undefined,
      placedAt: payload.placedAt ?? undefined,
      socialWorker: payload.socialWorker
        ? {
            id: payload.socialWorker.id,
            firstName: payload.socialWorker.firstName,
            lastName: payload.socialWorker.lastName,
            email: payload.socialWorker.email,
          }
        : undefined,
      hospitalStaff: payload.hospitalStaff
        ? {
            id: payload.hospitalStaff.id,
            department: payload.hospitalStaff.department ?? undefined,
            title: payload.hospitalStaff.title ?? undefined,
          }
        : undefined,
      invitations,
      messages: (payload.messages?.map((msg) => ({
        ...msg,
        status: msg.status as ThreadStatus,
        referralId: msg.referralId ?? undefined,
        dischargeCaseId: msg.dischargeCaseId ?? undefined,
        createdAt: msg.createdAt.toISOString(),
        updatedAt: msg.updatedAt.toISOString(),
        closedAt: msg.closedAt?.toISOString() ?? undefined,
        firstResponseAt: msg.firstResponseAt?.toISOString() ?? undefined,
        lastMessageAt: msg.lastMessageAt?.toISOString() ?? undefined,
        avgResponseTime: msg.avgResponseTime ?? undefined,
      })) ?? []) as MessageThread[],
      placement: payload.placement
        ? ({
            ...payload.placement,
            status: payload.placement.status as PlacementStatus,
            referralId: payload.placement.referralId ?? undefined,
            dischargeCaseId: payload.placement.dischargeCaseId ?? undefined,
            placementDate: payload.placement.placementDate.toISOString(),
            moveInDate:
              payload.placement.moveInDate?.toISOString() ?? undefined,
            createdAt: payload.placement.createdAt.toISOString(),
            updatedAt: payload.placement.updatedAt.toISOString(),
            confirmedAt:
              payload.placement.confirmedAt?.toISOString() ?? undefined,
            completedAt:
              payload.placement.completedAt?.toISOString() ?? undefined,
            packetGeneratedAt:
              payload.placement.packetGeneratedAt?.toISOString() ?? undefined,
            packetUrl: payload.placement.packetUrl ?? undefined,
          } as Placement)
        : undefined,
      transportBooking: payload.transportBooking
        ? this.mapTransportBookingToType(payload.transportBooking)
        : undefined,
      checklist: payload.checklist
        ? this.mapDischargeChecklistToType(payload.checklist)
        : undefined,
      consent: payload.consent
        ? this.mapConsentToType(payload.consent)
        : undefined,
    };
  }

  /**
   * Map Prisma transport booking to TransportBooking type
   */
  private mapTransportBookingToType(
    payload: Prisma.TransportBookingGetPayload<{
      include: {
        vendor: {
          include: {
            organization: {
              select: {
                id: true;
                name: true;
              };
            };
          };
        };
      };
    }>
  ): TransportBooking {
    return {
      id: payload.id,
      dischargeCaseId: payload.dischargeCaseId,
      vendorId: payload.vendorId,
      vendor: payload.vendor
        ? {
            id: payload.vendor.id,
            organization: payload.vendor.organization
              ? {
                  id: payload.vendor.organization.id,
                  name: payload.vendor.organization.name,
                }
              : undefined,
          }
        : undefined,
      pickupAddress: payload.pickupAddress,
      pickupTime: payload.pickupTime,
      dropoffAddress: payload.dropoffAddress,
      vehicleType: payload.vehicleType,
      equipmentNeeded: payload.equipmentNeeded,
      attendantRequired: payload.attendantRequired,
      status: payload.status as BookingStatusType,
      estimatedCost: payload.estimatedCost
        ? Number(payload.estimatedCost)
        : undefined,
      actualCost: payload.actualCost ? Number(payload.actualCost) : undefined,
      payerType: payload.payerType as Payer,
      confirmationNumber: payload.confirmationNumber ?? undefined,
      driverName: payload.driverName ?? undefined,
      driverPhone: payload.driverPhone ?? undefined,
      createdAt: payload.createdAt,
      updatedAt: payload.updatedAt,
      completedAt: payload.completedAt ?? undefined,
    };
  }

  /**
   * Map Prisma consent to Consent type
   */
  private mapConsentToType(
    payload: Prisma.ConsentGetPayload<{
      include: {
        user: {
          select: {
            id: true;
            firstName: true;
            lastName: true;
            email: true;
          };
        };
      };
    }>
  ): Consent {
    return {
      id: payload.id,
      userId: payload.userId,
      user: payload.user
        ? {
            id: payload.user.id,
            firstName: payload.user.firstName,
            lastName: payload.user.lastName,
            email: payload.user.email,
          }
        : undefined,
      referralId: payload.referralId ?? undefined,
      dischargeCaseId: payload.dischargeCaseId ?? undefined,
      consentType: payload.consentType as ConsentType,
      consentVersion: payload.consentVersion,
      captureMethod: payload.captureMethod as CaptureMethod,
      witnessName: payload.witnessName ?? undefined,
      witnessTitle: payload.witnessTitle ?? undefined,
      signatureData: payload.signatureData ?? undefined,
      isActive: payload.isActive,
      revokedAt: payload.revokedAt ?? undefined,
      revokedReason: payload.revokedReason ?? undefined,
      consentedAt: payload.consentedAt,
      expiresAt: payload.expiresAt ?? undefined,
    };
  }

  /**
   * Map Prisma discharge invitation to DischargeInvitation type
   */
  private mapDischargeInvitationToType(invitation: {
    id: string;
    dischargeCaseId: string;
    providerId: string;
    invitedAt: Date;
    expiresAt: Date;
    respondedAt: Date | null;
    response: InviteResponse | null;
    responseNotes: string | null;
    reminderSentAt: Date | null;
    escalatedAt: Date | null;
    provider?: Prisma.ProviderGetPayload<{
      include: {
        organization: { select: { id: true; name: true } };
        homes: { select: { id: true; name: true; city: true; state: true } };
      };
    }> | null;
  }): DischargeInvitation {
    return {
      id: invitation.id,
      dischargeCaseId: invitation.dischargeCaseId,
      providerId: invitation.providerId,
      provider: invitation.provider
        ? {
            id: invitation.provider.id,
            organization: invitation.provider.organization
              ? {
                  id: invitation.provider.organization.id,
                  name: invitation.provider.organization.name,
                }
              : undefined,
            homes: invitation.provider.homes || [],
          }
        : undefined,
      invitedAt: invitation.invitedAt,
      expiresAt: invitation.expiresAt,
      respondedAt: invitation.respondedAt ?? undefined,
      response: invitation.response
        ? (invitation.response as InviteResponseType)
        : undefined,
      responseNotes: invitation.responseNotes ?? undefined,
      reminderSentAt: invitation.reminderSentAt ?? undefined,
      escalatedAt: invitation.escalatedAt ?? undefined,
    };
  }

  /**
   * Get Hospital SW analytics
   */
  async getHospitalSWAnalytics(
    userId: string,
    startDate?: Date | string,
    endDate?: Date | string
  ): Promise<HospitalSWAnalytics> {
    try {
      // Get user's organization (hospital)
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { organizationId: true },
      });

      if (!user?.organizationId) {
        throw new Error("User organization not found");
      }

      // Set default date range to last 30 days if not provided
      const defaultStartDate = startDate
        ? typeof startDate === "string"
          ? new Date(startDate)
          : startDate
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const defaultEndDate = endDate
        ? typeof endDate === "string"
          ? new Date(endDate)
          : endDate
        : new Date();

      // Build date filter
      const dateFilter = {
        gte: defaultStartDate,
        lte: defaultEndDate,
      };

      // Get all discharge cases for this hospital
      const allCases = await db.dischargeCase.findMany({
        where: {
          hospitalId: user.organizationId,
          createdAt: dateFilter,
        },
        include: {
          invitations: true,
          placement: true,
          transportBooking: true,
        },
      });

      // Calculate summary
      const totalCases = allCases.length;
      const activeCases = allCases.filter(
        (c) =>
          c.status !== DischargeStatus.COMPLETED &&
          c.status !== DischargeStatus.CANCELLED &&
          c.status !== DischargeStatus.DISCHARGED
      ).length;
      const completedCases = allCases.filter(
        (c) =>
          c.status === DischargeStatus.COMPLETED ||
          c.status === DischargeStatus.DISCHARGED
      ).length;
      const cancelledCases = allCases.filter(
        (c) => c.status === DischargeStatus.CANCELLED
      ).length;

      // Calculate status breakdown
      const statusCounts = Object.values(DischargeStatus).map((status) => {
        const count = allCases.filter((c) => c.status === status).length;
        return {
          status: status as DischargeStatusType,
          count,
          percentage: totalCases > 0 ? (count / totalCases) * 100 : 0,
        };
      });

      // Calculate average placement time (hours)
      const placementsWithTimes = allCases
        .filter((c) => c.placedAt && c.invitesSentAt)
        .map((c) => {
          const placedAt = c.placedAt!;
          const invitesSentAt = c.invitesSentAt!;
          return (
            (placedAt.getTime() - invitesSentAt.getTime()) / (1000 * 60 * 60)
          ); // hours
        });

      const averagePlacementTime =
        placementsWithTimes.length > 0
          ? placementsWithTimes.reduce((a, b) => a + b, 0) /
            placementsWithTimes.length
          : 0;

      // Calculate response rate
      const allInvitations = allCases.flatMap((c) => c.invitations);
      const respondedInvitations = allInvitations.filter(
        (inv) => inv.respondedAt !== null
      ).length;
      const responseRate =
        allInvitations.length > 0
          ? (respondedInvitations / allInvitations.length) * 100
          : 0;

      // Calculate payer mix
      const payerCounts = new Map<Payer, number>();
      allCases.forEach((c) => {
        payerCounts.set(
          c.primaryInsurance as Payer,
          (payerCounts.get(c.primaryInsurance as Payer) || 0) + 1
        );
        if (c.secondaryInsurance) {
          payerCounts.set(
            c.secondaryInsurance as Payer,
            (payerCounts.get(c.secondaryInsurance as Payer) || 0) + 1
          );
        }
      });

      const payerMix = Array.from(payerCounts.entries()).map(
        ([payer, count]) => ({
          payer,
          count,
          percentage: totalCases > 0 ? (count / totalCases) * 100 : 0,
        })
      );

      // Calculate transport stats
      const casesWithTransport = allCases.filter((c) => c.needsTransport);
      const transportTypeCounts = new Map<string, number>();
      allCases.forEach((c) => {
        if (c.transportBooking) {
          const type = c.transportBooking.vehicleType;
          transportTypeCounts.set(
            type,
            (transportTypeCounts.get(type) || 0) + 1
          );
        } else if (c.transportType) {
          transportTypeCounts.set(
            c.transportType,
            (transportTypeCounts.get(c.transportType) || 0) + 1
          );
        }
      });

      const transportTypes = Array.from(transportTypeCounts.entries()).map(
        ([type, count]) => ({
          type,
          count,
        })
      );

      return {
        summary: {
          totalCases,
          activeCases,
          completedCases,
          cancelledCases,
        },
        statusBreakdown: statusCounts,
        averagePlacementTime,
        responseRate,
        payerMix,
        transportStats: {
          totalWithTransport: casesWithTransport.length,
          transportTypes,
        },
      };
    } catch (error) {
      console.error("Error getting Hospital SW analytics:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to retrieve Hospital SW analytics");
    }
  }

  /**
   * Map Prisma discharge checklist to DischargeChecklist type
   */
  private mapDischargeChecklistToType(
    checklist: Prisma.DischargeChecklistGetPayload<{}>
  ): DischargeChecklist {
    return {
      id: checklist.id,
      dischargeCaseId: checklist.dischargeCaseId,
      consentObtained: checklist.consentObtained,
      insuranceVerified: checklist.insuranceVerified,
      medsReconciled: checklist.medsReconciled,
      equipmentOrdered: checklist.equipmentOrdered,
      transportArranged: checklist.transportArranged,
      patientEducated: checklist.patientEducated,
      documentsSent: checklist.documentsSent,
      followUpScheduled: checklist.followUpScheduled,
      day1Contact: checklist.day1Contact,
      day2Contact: checklist.day2Contact,
      day7Contact: checklist.day7Contact,
      day30Contact: checklist.day30Contact,
      updatedAt: checklist.updatedAt,
    };
  }
}
