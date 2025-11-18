import { db } from "@carelink/database";
import { Prisma, DischargeStatus, InviteResponse } from "@prisma/client";
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
} from "@carelink/types";
import { normalizeDate } from "@carelink/utils";

// Standard include structure for discharge case queries
type DischargeCaseInclude = {
  socialWorker: { select: { id: true; firstName: true; lastName: true; email: true } };
  hospitalStaff: { select: { id: true; department: true; title: true } };
  invitations: true;
  messages: true;
  placement: true;
  transportBooking: true;
  checklist: true;
  consent: true;
};

type DischargeCasePayload = Prisma.DischargeCaseGetPayload<{ include: DischargeCaseInclude }>;

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

      return await this.mapDischargeCaseToType(dischargeCase as DischargeCasePayload);
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
          { patientInitials: { contains: filters.search, mode: "insensitive" } },
        ];
      }

      // Date range filter
      if (filters?.targetDischargeDateFrom || filters?.targetDischargeDateTo) {
        const dateFilter: Prisma.DateTimeFilter = {};
        if (filters.targetDischargeDateFrom) {
          dateFilter.gte = normalizeDate(filters.targetDischargeDateFrom) as Date;
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
        orderBy: [
          { targetDischargeDate: "asc" },
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
      });

      return {
        cases: await Promise.all(
          dischargeCases.map((dc) => this.mapDischargeCaseToType(dc as DischargeCasePayload))
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

      return await this.mapDischargeCaseToType(dischargeCase as DischargeCasePayload);
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

      if (data.patientInitials !== undefined) updateData.patientInitials = data.patientInitials;
      if (data.patientAge !== undefined) updateData.patientAge = data.patientAge;
      if (data.patientGender !== undefined) updateData.patientGender = data.patientGender;
      if (data.diagnosisCodes !== undefined) updateData.diagnosisCodes = data.diagnosisCodes;
      if (data.mobilityStatus !== undefined) updateData.mobilityStatus = data.mobilityStatus;
      if (data.cognitiveStatus !== undefined) updateData.cognitiveStatus = data.cognitiveStatus;
      if (data.behavioralConcerns !== undefined) updateData.behavioralConcerns = data.behavioralConcerns;
      if (data.dmeNeeds !== undefined) updateData.dmeNeeds = data.dmeNeeds;
      if (data.medicationManagement !== undefined) updateData.medicationManagement = data.medicationManagement;
      if (data.currentLocation !== undefined) updateData.currentLocation = data.currentLocation;
      if (data.targetDischargeDate !== undefined) {
        updateData.targetDischargeDate = normalizeDate(data.targetDischargeDate) as Date;
      }
      if (data.actualDischargeDate !== undefined) {
        updateData.actualDischargeDate = data.actualDischargeDate 
          ? (normalizeDate(data.actualDischargeDate) as Date)
          : null;
      }
      if (data.preferredCounties !== undefined) updateData.preferredCounties = data.preferredCounties;
      if (data.preferredCities !== undefined) updateData.preferredCities = data.preferredCities;
      if (data.requiresProximity !== undefined) updateData.requiresProximity = data.requiresProximity;
      if (data.proximityZipCode !== undefined) updateData.proximityZipCode = data.proximityZipCode;
      if (data.maxDistanceMiles !== undefined) updateData.maxDistanceMiles = data.maxDistanceMiles;
      if (data.primaryInsurance !== undefined) updateData.primaryInsurance = data.primaryInsurance;
      if (data.secondaryInsurance !== undefined) updateData.secondaryInsurance = data.secondaryInsurance;
      if (data.needsTransport !== undefined) updateData.needsTransport = data.needsTransport;
      if (data.transportType !== undefined) updateData.transportType = data.transportType;
      if (data.status !== undefined) {
        updateData.status = data.status as DischargeStatus;
        // Update timestamps based on status changes
        if (data.status === DischargeStatusType.MATCHING) {
          updateData.matchedAt = new Date();
        } else if (data.status === DischargeStatusType.INVITES_SENT) {
          updateData.invitesSentAt = new Date();
        } else if (data.status === DischargeStatusType.PLACEMENT_CONFIRMED || data.status === DischargeStatusType.DISCHARGED) {
          updateData.placedAt = new Date();
        }
      }

      const updatedCase = await db.dischargeCase.update({
        where: { id },
        data: updateData,
        include: this.getDefaultInclude(),
      });

      return await this.mapDischargeCaseToType(updatedCase as DischargeCasePayload);
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
              homes: { select: { id: true, name: true, city: true, state: true } },
            },
          });
          return { ...inv, provider };
        })
      );

      return await Promise.all(
        invitationsWithProviders.map((inv) => this.mapDischargeInvitationToType(inv))
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
                homes: { select: { id: true, name: true, city: true, state: true } },
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
              homes: { select: { id: true, name: true, city: true, state: true } },
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
            status: "INVITES_SENT",
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
      if (checklistData.consentObtained !== undefined) updateData.consentObtained = checklistData.consentObtained;
      if (checklistData.insuranceVerified !== undefined) updateData.insuranceVerified = checklistData.insuranceVerified;
      if (checklistData.medsReconciled !== undefined) updateData.medsReconciled = checklistData.medsReconciled;
      if (checklistData.equipmentOrdered !== undefined) updateData.equipmentOrdered = checklistData.equipmentOrdered;
      if (checklistData.transportArranged !== undefined) updateData.transportArranged = checklistData.transportArranged;
      if (checklistData.patientEducated !== undefined) updateData.patientEducated = checklistData.patientEducated;
      if (checklistData.documentsSent !== undefined) updateData.documentsSent = checklistData.documentsSent;
      if (checklistData.followUpScheduled !== undefined) updateData.followUpScheduled = checklistData.followUpScheduled;
      if (checklistData.day1Contact !== undefined) updateData.day1Contact = checklistData.day1Contact;
      if (checklistData.day2Contact !== undefined) updateData.day2Contact = checklistData.day2Contact;
      if (checklistData.day7Contact !== undefined) updateData.day7Contact = checklistData.day7Contact;
      if (checklistData.day30Contact !== undefined) updateData.day30Contact = checklistData.day30Contact;

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
   * TODO: Implement AI matching logic
   */
  async triggerAIMatching(
    caseId: string,
    userId: string
  ): Promise<AIMatchingResult> {
    try {
      // Verify user has access to this case
      await this.getDischargeCaseById(caseId, userId);

      // TODO: Implement AI matching algorithm
      // For now, return empty result
      return {
        providers: [],
        explanation: "AI matching not yet implemented",
      };
    } catch (error) {
      console.error("Trigger AI matching error:", error);
      throw new Error("Failed to trigger AI matching");
    }
  }

  /**
   * Get default include for discharge case queries
   */
  private getDefaultInclude(): DischargeCaseInclude {
    return {
      socialWorker: { select: { id: true, firstName: true, lastName: true, email: true } },
      hospitalStaff: { select: { id: true, department: true, title: true } },
      invitations: true,
      messages: true,
      placement: true,
      transportBooking: true,
      checklist: true,
      consent: true,
    };
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
            homes: { select: { id: true, name: true, city: true, state: true } },
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
            moveInDate: payload.placement.moveInDate?.toISOString() ?? undefined,
            createdAt: payload.placement.createdAt.toISOString(),
            updatedAt: payload.placement.updatedAt.toISOString(),
            confirmedAt: payload.placement.confirmedAt?.toISOString() ?? undefined,
            completedAt: payload.placement.completedAt?.toISOString() ?? undefined,
            packetGeneratedAt: payload.placement.packetGeneratedAt?.toISOString() ?? undefined,
            packetUrl: payload.placement.packetUrl ?? undefined,
          } as Placement)
        : undefined,
      transportBooking: payload.transportBooking
        ? {
            id: payload.transportBooking.id,
            transportType: payload.transportBooking.vehicleType,
            scheduledDate: payload.transportBooking.pickupTime ?? undefined,
            status: payload.transportBooking.status,
          }
        : undefined,
      checklist: payload.checklist ? this.mapDischargeChecklistToType(payload.checklist) : undefined,
      consent: payload.consent
        ? {
            id: payload.consent.id,
            obtainedAt: payload.consent.consentedAt,
            version: payload.consent.consentVersion,
          }
        : undefined,
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
      response: invitation.response ? (invitation.response as InviteResponseType) : undefined,
      responseNotes: invitation.responseNotes ?? undefined,
      reminderSentAt: invitation.reminderSentAt ?? undefined,
      escalatedAt: invitation.escalatedAt ?? undefined,
    };
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
