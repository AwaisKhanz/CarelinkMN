import { db } from "@carelink/database";
import { NotificationService } from "../services/notification.service";
import { NotificationType } from "@carelink/types";
import { getSocketServer } from "../websocket/socket.server";

export class PlacementNotificationsJob {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Check for upcoming and overdue follow-ups
   */
  async checkFollowUpReminders(): Promise<void> {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);

    try {
      // Follow-ups due in 24 hours
      const followUpsDue24h = await db.placementFollowUp.findMany({
        where: {
          scheduledAt: {
            gte: now,
            lte: in24Hours,
          },
          completedAt: null,
        },
        include: {
          placement: {
            include: {
              provider: {
                include: {
                  organization: {
                    include: {
                      users: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      for (const followUp of followUpsDue24h) {
        const providerUsers = followUp.placement.provider.organization.users;

        await this.notificationService.createBatchNotifications(
          providerUsers.map((user) => ({
            userId: user.id,
            type: NotificationType.FOLLOW_UP_REMINDER,
            title: "Follow-up Reminder",
            message: `Follow-up scheduled for tomorrow at ${followUp.scheduledAt.toLocaleTimeString()}`,
            actionUrl: `/provider/placements/${followUp.placementId}`,
            actionLabel: "View Placement",
            metadata: {
              placementId: followUp.placementId,
              followUpId: followUp.id,
            },
            channels: ["IN_APP"],
          }))
        );
      }

      // Follow-ups due in 1 hour
      const followUpsDue1h = await db.placementFollowUp.findMany({
        where: {
          scheduledAt: {
            gte: now,
            lte: in1Hour,
          },
          completedAt: null,
        },
        include: {
          placement: {
            include: {
              provider: {
                include: {
                  organization: {
                    include: {
                      users: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      for (const followUp of followUpsDue1h) {
        const providerUsers = followUp.placement.provider.organization.users;

        await this.notificationService.createBatchNotifications(
          providerUsers.map((user) => ({
            userId: user.id,
            type: NotificationType.FOLLOW_UP_DUE,
            title: "Follow-up Due Soon",
            message: `Follow-up due in 1 hour`,
            actionUrl: `/provider/placements/${followUp.placementId}`,
            actionLabel: "Complete Now",
            metadata: {
              placementId: followUp.placementId,
              followUpId: followUp.id,
            },
            channels: ["IN_APP", "EMAIL"],
          }))
        );
      }

      // Overdue follow-ups
      const overdueFollowUps = await db.placementFollowUp.findMany({
        where: {
          scheduledAt: {
            lt: now,
          },
          completedAt: null,
        },
        include: {
          placement: {
            include: {
              provider: {
                include: {
                  organization: {
                    include: {
                      users: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      for (const followUp of overdueFollowUps) {
        const providerUsers = followUp.placement.provider.organization.users;

        await this.notificationService.createBatchNotifications(
          providerUsers.map((user) => ({
            userId: user.id,
            type: NotificationType.FOLLOW_UP_OVERDUE,
            title: "Overdue Follow-up",
            message: `Follow-up was due on ${followUp.scheduledAt.toLocaleDateString()}`,
            actionUrl: `/provider/placements/${followUp.placementId}`,
            actionLabel: "Complete Now",
            metadata: {
              placementId: followUp.placementId,
              followUpId: followUp.id,
            },
            channels: ["IN_APP", "EMAIL"],
          }))
        );
      }

      console.log(
        `[PlacementNotificationsJob] Processed ${followUpsDue24h.length + followUpsDue1h.length + overdueFollowUps.length} follow-up reminders`
      );
    } catch (error) {
      console.error("[PlacementNotificationsJob] Error checking follow-ups:", error);
    }
  }

  /**
   * Check for expiring and expired documents
   */
  async checkDocumentExpiration(): Promise<void> {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in1Day = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    try {
      // Documents expiring in 30 days
      const docsExpiring30d = await db.placementDocument.findMany({
        where: {
          expiresAt: {
            gte: now,
            lte: in30Days,
          },
        },
        include: {
          placement: {
            include: {
              provider: {
                include: {
                  organization: {
                    include: {
                      users: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      for (const doc of docsExpiring30d) {
        const providerUsers = doc.placement.provider.organization.users;

        await this.notificationService.createBatchNotifications(
          providerUsers.map((user) => ({
            userId: user.id,
            type: NotificationType.DOCUMENT_EXPIRING_SOON,
            title: "Document Expiring Soon",
            message: `${doc.fileName} expires in 30 days`,
            actionUrl: `/provider/placements/${doc.placementId}`,
            actionLabel: "View Documents",
            metadata: {
              placementId: doc.placementId,
              documentId: doc.id,
            },
            channels: ["IN_APP"],
          }))
        );
      }

      // Documents expiring in 7 days
      const docsExpiring7d = await db.placementDocument.findMany({
        where: {
          expiresAt: {
            gte: now,
            lte: in7Days,
          },
        },
        include: {
          placement: {
            include: {
              provider: {
                include: {
                  organization: {
                    include: {
                      users: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      for (const doc of docsExpiring7d) {
        const providerUsers = doc.placement.provider.organization.users;

        await this.notificationService.createBatchNotifications(
          providerUsers.map((user) => ({
            userId: user.id,
            type: NotificationType.DOCUMENT_EXPIRING_SOON,
            title: "Document Expiring This Week",
            message: `${doc.fileName} expires in 7 days`,
            actionUrl: `/provider/placements/${doc.placementId}`,
            actionLabel: "View Documents",
            metadata: {
              placementId: doc.placementId,
              documentId: doc.id,
            },
            channels: ["IN_APP", "EMAIL"],
          }))
        );
      }

      // Documents expiring in 1 day
      const docsExpiring1d = await db.placementDocument.findMany({
        where: {
          expiresAt: {
            gte: now,
            lte: in1Day,
          },
        },
        include: {
          placement: {
            include: {
              provider: {
                include: {
                  organization: {
                    include: {
                      users: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      for (const doc of docsExpiring1d) {
        const providerUsers = doc.placement.provider.organization.users;

        await this.notificationService.createBatchNotifications(
          providerUsers.map((user) => ({
            userId: user.id,
            type: NotificationType.DOCUMENT_EXPIRING_SOON,
            title: "Document Expiring Tomorrow",
            message: `${doc.fileName} expires tomorrow`,
            actionUrl: `/provider/placements/${doc.placementId}`,
            actionLabel: "View Documents",
            metadata: {
              placementId: doc.placementId,
              documentId: doc.id,
            },
            channels: ["IN_APP", "EMAIL"],
          }))
        );
      }

      // Expired documents
      const expiredDocs = await db.placementDocument.findMany({
        where: {
          expiresAt: {
            lt: now,
          },
        },
        include: {
          placement: {
            include: {
              provider: {
                include: {
                  organization: {
                    include: {
                      users: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      for (const doc of expiredDocs) {
        const providerUsers = doc.placement.provider.organization.users;

        await this.notificationService.createBatchNotifications(
          providerUsers.map((user) => ({
            userId: user.id,
            type: NotificationType.DOCUMENT_EXPIRED,
            title: "Document Expired",
            message: `${doc.fileName} has expired`,
            actionUrl: `/provider/placements/${doc.placementId}`,
            actionLabel: "Update Document",
            metadata: {
              placementId: doc.placementId,
              documentId: doc.id,
            },
            channels: ["IN_APP", "EMAIL"],
          }))
        );
      }

      console.log(
        `[PlacementNotificationsJob] Processed ${docsExpiring30d.length + docsExpiring7d.length + docsExpiring1d.length + expiredDocs.length} document expiration alerts`
      );
    } catch (error) {
      console.error("[PlacementNotificationsJob] Error checking documents:", error);
    }
  }

  /**
   * Run all notification checks
   */
  async run(): Promise<void> {
    console.log("[PlacementNotificationsJob] Starting...");

    try {
      await this.checkFollowUpReminders();
      await this.checkDocumentExpiration();

      console.log("[PlacementNotificationsJob] Completed successfully");
    } catch (error) {
      console.error("[PlacementNotificationsJob] Error:", error);
    }
  }
}
