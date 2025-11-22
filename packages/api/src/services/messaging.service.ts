import { db } from "@carelink/database";
import { Prisma, ThreadStatus as PrismaThreadStatus, NotificationType } from "@prisma/client";
import {
  MessageThread,
  Message,
  CreateMessageData,
  CreateThreadData,
  GetThreadsParams,
  ThreadStatus,
} from "@carelink/types";

export class MessagingService {
  /**
   * Get message threads for a provider
   */
  async getThreads(
    filters: GetThreadsParams,
    userId: string
  ): Promise<{
    threads: MessageThread[];
    pagination: {
      total: number;
      pages: number;
      page: number;
      limit: number;
    };
  }> {
    const {
      providerId,
      referralId,
      dischargeCaseId,
      status,
      page = 1,
      limit = 20,
      search,
    } = filters;

    const where: Prisma.MessageThreadWhereInput = {};

    // Get user's role to determine access logic
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isCaseManager = user?.role === "CASE_MANAGER";
    const isHospitalSW = user?.role === "HOSPITAL_SW";

    // If providerId is provided, verify access
    if (providerId) {
      // Verify the provider exists
      const providerExists = await db.provider.findUnique({
        where: { id: providerId },
        select: { id: true },
      });
      if (!providerExists) {
        throw new Error("Provider not found");
      }

      // Case managers and hospital SW can message any provider
      // They see threads with that provider where they are the initiator
      if (isCaseManager || isHospitalSW) {
        where.providerId = providerId;
        where.initiatorId = userId; // Only threads they initiated
      } else {
        // Providers can only access threads for their own provider
      const hasAccess = await this.verifyProviderAccess(userId, providerId);
      if (!hasAccess) {
        throw new Error("Access denied");
      }
      where.providerId = providerId;
      }
    } else {
      // If no providerId specified
      if (isCaseManager || isHospitalSW) {
        // Case managers and hospital SW see all threads where they are the initiator
        where.initiatorId = userId;
      } else {
        // Providers see threads for their own provider organization
      const userProvider = await db.provider.findFirst({
        where: {
          organization: {
            users: {
              some: { id: userId },
            },
          },
        },
        select: { id: true },
      });
      if (!userProvider) {
        throw new Error("User is not associated with a provider");
      }
      where.providerId = userProvider.id;
      }
    }

    if (referralId) where.referralId = referralId;
    if (dischargeCaseId) where.dischargeCaseId = dischargeCaseId;
    if (status) where.status = status as ThreadStatus;

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
          messages: {
            some: {
              content: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
          },
        },
      ];
    }

    const skip = (page - 1) * limit;

    const [threads, total] = await Promise.all([
      db.messageThread.findMany({
        where,
        include: {
          referral: {
            select: {
              id: true,
              referralNumber: true,
              clientInitials: true,
              clientAge: true,
              primaryPayer: true,
            },
          },
          dischargeCase: {
            select: {
              id: true,
              caseNumber: true,
              patientInitials: true,
              patientAge: true,
              primaryInsurance: true,
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
          messages: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1, // Get last message for preview
            include: {
              sender: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
        },
        orderBy: [
          { lastMessageAt: "desc" },
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
      }),
      db.messageThread.count({ where }),
    ]);

    // Fetch initiators and unread counts separately
    const initiatorIds = [...new Set(threads.map((t) => t.initiatorId))];
    const initiators = await db.user.findMany({
      where: {
        id: {
          in: initiatorIds,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    });
    const initiatorMap = new Map(initiators.map((u) => [u.id, u]));

    // Get unread counts for each thread
    const threadIds = threads.map((t) => t.id);
    const unreadCounts = await db.message.groupBy({
      by: ["threadId"],
      where: {
        threadId: {
          in: threadIds,
        },
        isRead: false,
        senderId: {
          not: userId,
        },
      },
      _count: {
        _all: true,
      },
    });
    const unreadCountMap = new Map(
      unreadCounts.map((uc) => [uc.threadId, uc._count._all])
    );

    // Transform to include initiator and unread count
    const transformedThreads: MessageThread[] = threads.map((thread: any) => ({
      ...thread,
      id: thread.id,
      referralId: thread.referralId ?? undefined,
      providerId: thread.providerId,
      initiatorId: thread.initiatorId,
      status: thread.status as ThreadStatus,
      firstResponseAt: thread.firstResponseAt?.toISOString(),
      avgResponseTime: thread.avgResponseTime ?? undefined,
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
      closedAt: thread.closedAt?.toISOString(),
      lastMessageAt: thread.lastMessageAt?.toISOString(),
      referral: thread.referral ? {
        id: thread.referral.id,
        referralNumber: thread.referral.referralNumber,
        clientInitials: thread.referral.clientInitials,
        clientAge: thread.referral.clientAge,
        primaryPayer: thread.referral.primaryPayer as string,
      } : undefined,
      initiator: initiatorMap.get(thread.initiatorId) ?? undefined,
      unreadCount: unreadCountMap.get(thread.id) || 0,
      messages: Array.isArray(thread.messages) ? thread.messages.map((msg: any) => ({
        ...msg,
        id: msg.id,
        threadId: msg.threadId,
        senderId: msg.senderId,
        content: msg.content,
        isRead: msg.isRead,
        readAt: msg.readAt?.toISOString(),
        createdAt: msg.createdAt.toISOString(),
        editedAt: msg.editedAt?.toISOString(),
        sender: msg.sender,
        attachments: Array.isArray(msg.attachments) ? msg.attachments.map((att: any) => ({
          ...att,
          id: att.id,
          messageId: att.messageId,
          url: att.url,
          fileName: att.fileName,
          fileType: att.fileType,
          fileSize: att.fileSize,
          createdAt: att.createdAt.toISOString(),
        })) : [],
      })) : [],
    }));

    return {
      threads: transformedThreads,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    };
  }

  /**
   * Get a single thread with all messages
   */
  async getThreadById(threadId: string, userId: string): Promise<MessageThread> {
    // Verify access
    if (!(await this.verifyThreadAccess(userId, threadId))) {
      throw new Error("Access denied");
    }

    const thread = await db.messageThread.findUnique({
      where: { id: threadId },
      include: {
        referral: {
          select: {
            id: true,
            referralNumber: true,
            clientInitials: true,
            clientAge: true,
            primaryPayer: true,
            urgency: true,
            status: true,
          },
        },
        dischargeCase: {
          select: {
            id: true,
            caseNumber: true,
            patientInitials: true,
            patientAge: true,
            primaryInsurance: true,
            status: true,
            targetDischargeDate: true,
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
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
            attachments: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!thread) {
      throw new Error("Thread not found");
    }

    // Fetch initiator separately
    const initiator = await db.user.findUnique({
      where: { id: thread.initiatorId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    });

    // Mark messages as read for current user
    await db.message.updateMany({
      where: {
        threadId,
        senderId: {
          not: userId,
        },
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // Get unread count for this thread
    const unreadCount = await db.message.count({
      where: {
        threadId,
        isRead: false,
        senderId: {
          not: userId,
        },
      },
    });

    return {
      ...thread,
      id: thread.id,
      referralId: thread.referralId ?? undefined,
      providerId: thread.providerId,
      initiatorId: thread.initiatorId,
      status: thread.status as ThreadStatus,
      firstResponseAt: thread.firstResponseAt?.toISOString(),
      avgResponseTime: thread.avgResponseTime ?? undefined,
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
      closedAt: thread.closedAt?.toISOString(),
      lastMessageAt: thread.lastMessageAt?.toISOString(),
      initiator: initiator ?? undefined,
      unreadCount,
      messages: thread.messages.map((msg) => ({
        ...msg,
        id: msg.id,
        threadId: msg.threadId,
        senderId: msg.senderId,
        content: msg.content,
        isRead: msg.isRead,
        readAt: msg.readAt?.toISOString(),
        createdAt: msg.createdAt.toISOString(),
        editedAt: msg.editedAt?.toISOString(),
        sender: msg.sender,
        attachments: msg.attachments.map((att) => ({
          ...att,
          id: att.id,
          messageId: att.messageId,
          url: att.url,
          fileName: att.fileName,
          fileType: att.fileType,
          fileSize: att.fileSize,
          createdAt: att.createdAt.toISOString(),
        })),
      })),
    } as MessageThread;
  }

  /**
   * Create a new message thread
   */
  async createThread(
    data: CreateThreadData,
    userId: string
  ): Promise<MessageThread> {
    const { providerId, referralId, dischargeCaseId, initialMessage, attachments } = data;

    // Get user's role to determine access
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isCaseManager = user?.role === "CASE_MANAGER";
    const isHospitalSW = user?.role === "HOSPITAL_SW";

    // Case managers and hospital SW can message any provider
    // Providers can only create threads for their own provider organization
    if (!isCaseManager && !isHospitalSW) {
    if (!(await this.verifyProviderAccess(userId, providerId))) {
      throw new Error("Access denied to provider");
      }
    }

    // Verify the provider exists
    const providerExists = await db.provider.findUnique({
      where: { id: providerId },
      select: { id: true },
    });
    if (!providerExists) {
      throw new Error("Provider not found");
    }

    // Create thread and first message in a transaction
    const result = await db.$transaction(async (tx) => {
      const thread = await tx.messageThread.create({
        data: {
          providerId,
          referralId,
          dischargeCaseId,
          initiatorId: userId,
          status: PrismaThreadStatus.OPEN,
        },
      });

      const message = await tx.message.create({
        data: {
          threadId: thread.id,
          senderId: userId,
          content: initialMessage,
          attachments: attachments && attachments.length > 0
            ? {
                create: attachments.map((att) => ({
                  fileName: att.fileName,
                  fileType: att.fileType,
                  fileSize: att.fileSize,
                  url: att.url,
                })),
              }
            : undefined,
        },
      });

      // Update thread's lastMessageAt
      await tx.messageThread.update({
        where: { id: thread.id },
        data: {
          lastMessageAt: new Date(),
        },
      });

      return thread;
    });

    // Fetch the complete thread with relations
    return await this.getThreadById(result.id, userId);
  }

  /**
   * Send a message in an existing thread
   */
  async sendMessage(
    data: CreateMessageData,
    userId: string
  ): Promise<Message> {
    const { threadId, content, attachments } = data;

    // Verify access to thread
    if (!(await this.verifyThreadAccess(userId, threadId))) {
      throw new Error("Access denied");
    }

    // Get thread to check status
    const thread = await db.messageThread.findUnique({
      where: { id: threadId },
      select: {
        status: true,
        providerId: true,
        initiatorId: true,
        firstResponseAt: true,
      },
    });

    if (!thread) {
      throw new Error("Thread not found");
    }

    if (thread.status === PrismaThreadStatus.CLOSED) {
      throw new Error("Cannot send message to a closed thread");
    }

    // Determine if this is a provider response before transaction
    // Get provider's organization users to check if userId is a provider user
    const providerOrg = await db.provider.findUnique({
      where: { id: thread.providerId },
      select: {
        organization: {
          select: {
            users: {
              select: { id: true },
            },
          },
        },
      },
    });
    const providerUserIds = new Set(
      providerOrg?.organization.users.map((u) => u.id) || []
    );
    const isProviderResponse = providerUserIds.has(userId) && thread.initiatorId !== userId;

    // Create message and update thread in a transaction
    const result = await db.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          threadId,
          senderId: userId,
          content,
          attachments: attachments && attachments.length > 0
            ? {
                create: attachments.map((att) => ({
                  fileName: att.fileName,
                  fileType: att.fileType,
                  fileSize: att.fileSize,
                  url: att.url,
                })),
              }
            : undefined,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          attachments: true,
        },
      });

      // Update thread status and timestamps
      const updateData: Prisma.MessageThreadUpdateInput = {
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      };

      // Track first response time if this is provider's first response
      if (isProviderResponse && !thread.firstResponseAt) {
        const firstMessage = await tx.message.findFirst({
          where: { threadId },
          orderBy: { createdAt: "asc" },
        });

        if (firstMessage) {
          const responseTimeMinutes = Math.floor(
            (new Date().getTime() - firstMessage.createdAt.getTime()) / (1000 * 60)
          );
          updateData.firstResponseAt = new Date();
          updateData.avgResponseTime = responseTimeMinutes;
          updateData.status = PrismaThreadStatus.AWAITING_RESPONSE;
        }
      } else if (!isProviderResponse) {
        // If initiator responds, change status back to OPEN
        updateData.status = PrismaThreadStatus.OPEN;
      }

      await tx.messageThread.update({
        where: { id: threadId },
        data: updateData,
      });

      return message;
    });

      // Create notification for the recipient (not the sender)
      try {
        const threadWithContext = await db.messageThread.findUnique({
          where: { id: threadId },
          include: {
            referral: {
              select: {
                id: true,
                referralNumber: true,
              },
            },
            dischargeCase: {
              select: {
                id: true,
                caseNumber: true,
              },
            },
            provider: {
              include: {
                organization: {
                  select: {
                    users: {
                      select: { id: true },
                    },
                  },
                },
              },
            },
          },
        });

        if (threadWithContext) {
          // Determine recipient IDs (opposite of sender)
          const recipientIds: string[] = [];
          if (isProviderResponse) {
            // Provider sent message, notify initiator (case manager)
            recipientIds.push(thread.initiatorId);
          } else {
            // Case manager sent message, notify all provider users
            if (threadWithContext.provider?.organization?.users) {
              recipientIds.push(
                ...threadWithContext.provider.organization.users
                  .filter((u) => u.id !== userId)
                  .map((u) => u.id)
              );
            }
          }

          // Create notifications for recipients
          const { NotificationService } = await import("./notification.service");
          const notificationService = new NotificationService();

          const contextInfo = threadWithContext.referral
            ? `Referral ${threadWithContext.referral.referralNumber}`
            : threadWithContext.dischargeCase
              ? `Discharge Case ${threadWithContext.dischargeCase.caseNumber}`
              : "General inquiry";

          for (const recipientId of recipientIds) {
            await notificationService.createNotification({
              userId: recipientId,
              type: NotificationType.MESSAGE_NEW,
              title: "New Message",
              message: `You have a new message regarding ${contextInfo}.`,
              channels: ["IN_APP", "EMAIL"],
              actionUrl: `/messages?threadId=${threadId}`,
            });
          }
        }
      } catch (notifError) {
        console.error("Failed to create message notification:", notifError);
        // Don't throw - notification failure shouldn't break message sending
      }

      return {
        ...result,
        id: result.id,
        threadId: result.threadId,
        senderId: result.senderId,
        content: result.content,
        isRead: result.isRead,
        readAt: result.readAt?.toISOString(),
        createdAt: result.createdAt.toISOString(),
        editedAt: result.editedAt?.toISOString(),
        sender: result.sender,
        attachments: result.attachments.map((att) => ({
          ...att,
          id: att.id,
          messageId: att.messageId,
          url: att.url,
          fileName: att.fileName,
          fileType: att.fileType,
          fileSize: att.fileSize,
          createdAt: att.createdAt.toISOString(),
        })),
      } as Message;
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(threadId: string, userId: string): Promise<void> {
    if (!(await this.verifyThreadAccess(userId, threadId))) {
      throw new Error("Access denied");
    }

    await db.message.updateMany({
      where: {
        threadId,
        senderId: {
          not: userId,
        },
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark a single message as read
   */
  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    // Get message to verify access
    const message = await db.message.findUnique({
      where: { id: messageId },
      include: {
        thread: true,
      },
    });

    if (!message) {
      throw new Error("Message not found");
    }

    // Verify user has access to the thread
    if (!(await this.verifyThreadAccess(userId, message.threadId))) {
      throw new Error("Access denied");
    }

    // Only mark as read if user is not the sender
    if (message.senderId !== userId && !message.isRead) {
      await db.message.update({
        where: { id: messageId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    }
  }

  /**
   * Update thread status
   */
  async updateThreadStatus(
    threadId: string,
    status: ThreadStatus,
    userId: string
  ): Promise<MessageThread> {
    if (!(await this.verifyThreadAccess(userId, threadId))) {
      throw new Error("Access denied");
    }

    const updateData: Prisma.MessageThreadUpdateInput = {
      status: status as PrismaThreadStatus,
      updatedAt: new Date(),
    };

    if (status === ThreadStatus.CLOSED) {
      updateData.closedAt = new Date();
    }

    const thread = await db.messageThread.update({
      where: { id: threadId },
      data: updateData,
    });

    return await this.getThreadById(thread.id, userId);
  }

  /**
   * Verify user has access to thread's provider
   */
  private async verifyThreadAccess(
    userId: string,
    threadId: string
  ): Promise<boolean> {
    try {
      // Get user's role to determine access logic
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      const isCaseManager = user?.role === "CASE_MANAGER";
      const isHospitalSW = user?.role === "HOSPITAL_SW";

      // Find the thread
      const thread = await db.messageThread.findUnique({
        where: { id: threadId },
        select: {
          id: true,
          initiatorId: true,
          providerId: true,
          provider: {
            select: {
            organization: {
                select: {
              users: {
                    select: { id: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!thread) {
        return false;
      }

      // Case managers and hospital SW can access threads they initiated
      if ((isCaseManager || isHospitalSW) && thread.initiatorId === userId) {
        return true;
      }

      // Providers can access threads for their own provider organization
      const providerUserIds = new Set(
        thread.provider?.organization?.users?.map((u) => u.id) || []
      );
      if (providerUserIds.has(userId)) {
        return true;
      }

      return false;
    } catch (error) {
      console.error("Verify thread access error:", error);
      return false;
    }
  }

  /**
   * Verify user has access to provider
   */
  private async verifyProviderAccess(
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
}

