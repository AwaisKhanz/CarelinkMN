import { Prisma, RequestStatus, NotificationType } from "@prisma/client";
import { db } from "@carelink/database";
import { NotificationService } from "./notification.service";

export interface CreateRequestData {
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  recipientAge: number;
  recipientGender: string;
  recipientInitials: string;
  careNeeds: string;
  urgency: string;
  preferredCounties?: string[];
  primaryPayer?: string;
  secondaryPayer?: string;
  interestedProviderIds?: string[];
}

export interface UpdateRequestData {
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  careNeeds?: string;
  urgency?: string;
  preferredCounties?: string[];
  primaryPayer?: string;
  secondaryPayer?: string;
  interestedProviderIds?: string[];
}

export class PublicReferralRequestService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  // Create a new referral request
  async createRequest(data: CreateRequestData, userId: string) {
    try {
      const request = await db.publicReferralRequest.create({
        data: {
          userId,
          contactName: data.contactName,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          recipientAge: data.recipientAge,
          recipientGender: data.recipientGender as any,
          recipientInitials: data.recipientInitials.toUpperCase(),
          careNeeds: data.careNeeds,
          urgency: data.urgency as any,
          preferredCounties: data.preferredCounties || [],
          primaryPayer: data.primaryPayer as any,
          secondaryPayer: data.secondaryPayer as any,
          interestedProviderIds: data.interestedProviderIds || [],
          status: RequestStatus.PENDING,
        },
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
      });

      // Notify case managers about new request
      // Find case managers in the same organization or system admins if no org logic yet
      // For now, we'll notify all case managers (simplified for MVP)
      const caseManagers = await db.user.findMany({
        where: { role: "CASE_MANAGER" },
        select: { id: true }
      });

      if (caseManagers.length > 0) {
        await this.notificationService.createBatchNotifications(
          caseManagers.map(cm => ({
            userId: cm.id,
            type: NotificationType.NEW_REFERRAL_REQUEST,
            title: "New Referral Request",
            message: `New request from ${data.contactName} for ${data.recipientInitials}`,
            actionUrl: `/dashboard/requests/${request.id}`,
            actionLabel: "View Request",
            metadata: { requestId: request.id }
          }))
        );
      }

      return request;
    } catch (error) {
      console.error("Create request error:", error);
      throw new Error("Failed to create referral request");
    }
  }

  // Get all requests for a user
  async getRequestsByUser(
    userId: string,
    filters?: {
      status?: RequestStatus;
      page?: number;
      limit?: number;
    }
  ) {
    try {
      const { status, page = 1, limit = 20 } = filters || {};

      const where: Prisma.PublicReferralRequestWhereInput = {
        userId,
      };

      if (status) {
        where.status = status;
      }

      const [requests, total] = await Promise.all([
        db.publicReferralRequest.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            assignedCaseManager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.publicReferralRequest.count({ where }),
      ]);

      return {
        requests,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error("Get requests error:", error);
      throw new Error("Failed to retrieve referral requests");
    }
  }

  // Get a single request by ID
  async getRequestById(id: string, userId: string) {
    try {
      const request = await db.publicReferralRequest.findFirst({
        where: {
          id,
          userId, // Ensure user can only access their own requests
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          assignedCaseManager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          convertedToReferral: {
            select: {
              id: true,
              referralNumber: true,
              status: true,
            },
          },
        },
      });

      if (!request) {
        throw new Error("Request not found");
      }

      return request;
    } catch (error) {
      console.error("Get request error:", error);
      throw error;
    }
  }

  // Update a request
  async updateRequest(id: string, data: UpdateRequestData, userId: string) {
    try {
      // First check if request exists and belongs to user
      const existing = await db.publicReferralRequest.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!existing) {
        throw new Error("Request not found");
      }

      // Only allow updates if status is PENDING or ASSIGNED
      if (
        existing.status !== RequestStatus.PENDING &&
        existing.status !== RequestStatus.ASSIGNED
      ) {
        throw new Error("Cannot update request in current status");
      }

      const request = await db.publicReferralRequest.update({
        where: { id },
        data: {
          contactName: data.contactName,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          careNeeds: data.careNeeds,
          urgency: data.urgency as any,
          preferredCounties: data.preferredCounties,
          primaryPayer: data.primaryPayer as any,
          secondaryPayer: data.secondaryPayer as any,
          interestedProviderIds: data.interestedProviderIds,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          assignedCaseManager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      return request;
    } catch (error) {
      console.error("Update request error:", error);
      throw error;
    }
  }

  // Cancel a request
  async cancelRequest(id: string, userId: string) {
    try {
      const existing = await db.publicReferralRequest.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!existing) {
        throw new Error("Request not found");
      }

      // Only allow cancellation if not already converted
      if (existing.status === RequestStatus.CONVERTED) {
        throw new Error("Cannot cancel a converted request");
      }

      const updatedRequest = await db.publicReferralRequest.update({
        where: { id },
        data: {
          status: RequestStatus.CANCELLED,
          closedAt: new Date(),
        },
      });

      // Notify assigned case manager if exists
      if (existing.assignedCaseManagerId) {
        await this.notificationService.createNotification({
          userId: existing.assignedCaseManagerId,
          type: NotificationType.REQUEST_STATUS_UPDATE,
          title: "Request Cancelled",
          message: `Referral request for ${existing.recipientInitials} was cancelled by the user`,
          actionUrl: `/dashboard/requests/${id}`,
          actionLabel: "View Request",
          metadata: { requestId: id, status: RequestStatus.CANCELLED }
        });
      }

      return { success: true };
    } catch (error) {
      console.error("Cancel request error:", error);
      throw error;
    }
  }

  // Get request statistics for user
  async getRequestStats(userId: string) {
    try {
      const [total, pending, assigned, inProgress, converted] =
        await Promise.all([
          db.publicReferralRequest.count({ where: { userId } }),
          db.publicReferralRequest.count({
            where: { userId, status: RequestStatus.PENDING },
          }),
          db.publicReferralRequest.count({
            where: { userId, status: RequestStatus.ASSIGNED },
          }),
          db.publicReferralRequest.count({
            where: { userId, status: RequestStatus.IN_PROGRESS },
          }),
          db.publicReferralRequest.count({
            where: { userId, status: RequestStatus.CONVERTED },
          }),
        ]);

      return {
        total,
        pending,
        assigned,
        inProgress,
        converted,
      };
    } catch (error) {
      console.error("Get request stats error:", error);
      throw new Error("Failed to retrieve request statistics");
    }
  }
}
