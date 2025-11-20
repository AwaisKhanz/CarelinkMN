import { db } from "@carelink/database";
import {
  OpeningStatus,
  LicenseStatus,
  NotificationType,
  InviteResponse,
  DischargeStatus,
} from "@prisma/client";
import { Prisma } from "@prisma/client";
import { EmailService } from "./email.service";
import { LicenseService } from "./license.service";
import { OpeningService } from "./opening.service";
import { DischargeCaseService } from "./discharge-case.service";

export class ScheduledJobService {
  private emailService: EmailService;
  private licenseService: LicenseService;
  private openingService: OpeningService;
  private dischargeCaseService: DischargeCaseService;

  constructor() {
    this.emailService = new EmailService();
    this.licenseService = new LicenseService();
    this.openingService = new OpeningService();
    this.dischargeCaseService = new DischargeCaseService();
  }

  /**
   * Enforce 48-hour freshness for openings
   * Marks openings as EXPIRED if freshnessTimestamp is older than 48 hours
   */
  async enforceOpeningFreshness(): Promise<void> {
    try {
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

      // Find all openings that are stale but not yet marked as EXPIRED
      const staleOpenings = await db.opening.findMany({
        where: {
          freshnessTimestamp: {
            lt: fortyEightHoursAgo,
          },
          status: {
            not: OpeningStatus.EXPIRED,
          },
        },
        include: {
          home: {
            select: {
              id: true,
              name: true,
            },
          },
          provider: {
            include: {
              organization: {
                include: {
                  users: {
                    where: {
                      role: {
                        in: ["PROVIDER_OWNER", "PROVIDER_STAFF"],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      let expiredCount = 0;

      for (const opening of staleOpenings) {
        await db.opening.update({
          where: { id: opening.id },
          data: {
            status: OpeningStatus.EXPIRED,
          },
        });

        expiredCount++;

        // Send notification email to provider owners/staff
        if (opening.provider?.organization?.users) {
          for (const user of opening.provider.organization.users) {
            if (user.email) {
              try {
                await this.emailService.sendOpeningExpiredNotification({
                  to: user.email,
                  openingId: opening.id,
                  homeName: opening.home?.name || "Unknown Home",
                  spotsAvailable: opening.spotsAvailable,
                });
              } catch (emailError) {
                console.error(
                  `Failed to send expiry notification to ${user.email}:`,
                  emailError
                );
              }
            }
          }
        }
      }

      console.log(
        `[Scheduled Job] Enforced freshness: ${expiredCount} openings marked as EXPIRED`
      );

      return;
    } catch (error) {
      console.error(
        "[Scheduled Job] Error enforcing opening freshness:",
        error
      );
      throw error;
    }
  }

  /**
   * Send 24-hour expiry reminders for openings approaching freshness expiry
   * Finds openings with freshnessTimestamp >= 24h old but < 48h, that have not been reminded
   */
  async sendOpeningExpiryReminders(): Promise<void> {
    try {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      // Openings that are between 24h and 48h since last freshness update, not expired, not reminded yet
      const expiringOpenings = await db.opening.findMany({
        where: {
          freshnessTimestamp: {
            lte: twentyFourHoursAgo,
            gt: fortyEightHoursAgo,
          },
          status: {
            not: OpeningStatus.EXPIRED,
          },
          // Only send reminder if not already sent (expiryReminderSentAt is null)
          // OR if it was sent more than 24 hours ago (in case opening was refreshed and is expiring again)
          OR: [
            { expiryReminderSentAt: null },
            {
              expiryReminderSentAt: {
                lt: twentyFourHoursAgo,
              },
            },
          ],
        },
        include: {
          home: {
            select: {
              id: true,
              name: true,
            },
          },
          provider: {
            include: {
              organization: {
                include: {
                  users: {
                    where: {
                      role: {
                        in: ["PROVIDER_OWNER", "PROVIDER_STAFF"],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      let reminderCount = 0;

      for (const opening of expiringOpenings) {
        // Calculate hours until 48h expiry
        const hoursSinceFreshness =
          (now.getTime() - new Date(opening.freshnessTimestamp).getTime()) /
          (1000 * 60 * 60);
        const hoursUntilExpiry = Math.max(
          0,
          Math.ceil(48 - hoursSinceFreshness)
        );

        // Send emails to provider owners/staff
        if (opening.provider?.organization?.users) {
          for (const user of opening.provider.organization.users) {
            // Skip if a recent notification was already sent to this user for this opening
            const recentNotif = await db.notification.findFirst({
              where: {
                userId: user.id,
                type: NotificationType.OPENING_EXPIRING,
                createdAt: {
                  gte: new Date(now.getTime() - 30 * 60 * 60 * 1000), // within last 30 hours
                },
                actionUrl: `/provider/openings/${opening.id}`,
              },
            });
            if (recentNotif) continue;

            if (user.email) {
              try {
                await this.emailService.sendOpeningExpiryReminder({
                  to: user.email,
                  openingId: opening.id,
                  homeName: opening.home?.name || "Unknown Home",
                  hoursUntilExpiry,
                  spotsAvailable: opening.spotsAvailable ?? 0,
                });
              } catch (emailError) {
                console.error(
                  `Failed to send expiry reminder to ${user.email}:`,
                  emailError
                );
              }
            }
          }
        }

        // Create in-app notifications for each user
        if (opening.provider?.organization?.users) {
          for (const user of opening.provider.organization.users) {
            // Skip if a recent notification was already created
            const recentNotif = await db.notification.findFirst({
              where: {
                userId: user.id,
                type: NotificationType.OPENING_EXPIRING,
                createdAt: {
                  gte: new Date(now.getTime() - 30 * 60 * 60 * 1000),
                },
                actionUrl: `/provider/openings/${opening.id}`,
              },
            });
            if (recentNotif) continue;

            try {
              const { NotificationService } = await import(
                "./notification.service"
              );
              const notificationService = new NotificationService();
              await notificationService.createNotification({
                userId: user.id,
                type: NotificationType.OPENING_EXPIRING,
                title: "Opening Expiring Soon",
                message: `Opening at ${opening.home?.name ?? "home"} will expire in ~${hoursUntilExpiry} hours if not refreshed.`,
                channels: ["IN_APP", "EMAIL"],
                actionUrl: `/provider/openings/${opening.id}`,
              });
            } catch (notifError) {
              console.error(
                `Failed to create in-app notification for user ${user.id}:`,
                notifError
              );
            }
          }
        }

        // Update expiryReminderSentAt to prevent duplicate reminders
        try {
          await db.opening.update({
            where: { id: opening.id },
            data: { expiryReminderSentAt: now },
          });
        } catch (updateError) {
          console.error(
            `Failed to update expiryReminderSentAt for opening ${opening.id}:`,
            updateError
          );
        }

        reminderCount++;
      }

      console.log(
        `[Scheduled Job] Opening expiry reminders sent: ${reminderCount}`
      );
    } catch (error) {
      console.error(
        "[Scheduled Job] Error sending opening expiry reminders:",
        error
      );
      throw error;
    }
  }

  /**
   * Check for expiring licenses and send reminder emails
   * Sends reminders at 30 days and 7 days before expiry
   */
  async checkLicenseExpiry(): Promise<void> {
    try {
      const now = new Date();
      const thirtyDaysFromNow = new Date(
        now.getTime() + 30 * 24 * 60 * 60 * 1000
      );
      const sevenDaysFromNow = new Date(
        now.getTime() + 7 * 24 * 60 * 60 * 1000
      );

      // Find licenses expiring in 30 days (within next 24 hours)
      const thirtyDayThreshold = new Date(
        thirtyDaysFromNow.getTime() - 24 * 60 * 60 * 1000
      );
      const licensesExpiringIn30Days = await db.license.findMany({
        where: {
          expirationDate: {
            gte: thirtyDayThreshold,
            lte: thirtyDaysFromNow,
          },
          status: {
            in: [LicenseStatus.PENDING, LicenseStatus.ACTIVE],
          },
        },
        include: {
          provider: {
            include: {
              organization: {
                include: {
                  users: {
                    where: {
                      role: {
                        in: ["PROVIDER_OWNER", "PROVIDER_STAFF"],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Find licenses expiring in 7 days (within next 24 hours)
      const sevenDayThreshold = new Date(
        sevenDaysFromNow.getTime() - 24 * 60 * 60 * 1000
      );
      const licensesExpiringIn7Days = await db.license.findMany({
        where: {
          expirationDate: {
            gte: sevenDayThreshold,
            lte: sevenDaysFromNow,
          },
          status: {
            in: [LicenseStatus.PENDING, LicenseStatus.ACTIVE],
          },
        },
        include: {
          provider: {
            include: {
              organization: {
                include: {
                  users: {
                    where: {
                      role: {
                        in: ["PROVIDER_OWNER", "PROVIDER_STAFF"],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      let remindersSent30 = 0;
      let remindersSent7 = 0;

      // Send 30-day reminders
      for (const license of licensesExpiringIn30Days) {
        if (license.provider?.organization?.users) {
          for (const user of license.provider.organization.users) {
            if (user.email) {
              try {
                await this.emailService.sendLicenseExpiryReminder({
                  to: user.email,
                  licenseId: license.id,
                  licenseType: license.licenseType,
                  licenseNumber: license.licenseNumber,
                  expirationDate: license.expirationDate,
                  daysUntilExpiry: 30,
                });

                // Create in-app notification
                const { NotificationService } = await import(
                  "./notification.service"
                );
                const notificationService = new NotificationService();
                await notificationService.createNotification({
                  userId: user.id,
                  type: NotificationType.LICENSE_EXPIRING,
                  title: "License Expiring Soon",
                  message: `Your ${license.licenseType} license (${license.licenseNumber}) will expire in 30 days.`,
                  channels: ["IN_APP", "EMAIL"],
                  actionUrl: `/provider/licenses`,
                });

                remindersSent30++;
              } catch (emailError) {
                console.error(
                  `Failed to send 30-day reminder to ${user.email}:`,
                  emailError
                );
              }
            }
          }
        }
      }

      // Send 7-day reminders
      for (const license of licensesExpiringIn7Days) {
        if (license.provider?.organization?.users) {
          for (const user of license.provider.organization.users) {
            if (user.email) {
              try {
                await this.emailService.sendLicenseExpiryReminder({
                  to: user.email,
                  licenseId: license.id,
                  licenseType: license.licenseType,
                  licenseNumber: license.licenseNumber,
                  expirationDate: license.expirationDate,
                  daysUntilExpiry: 7,
                });

                // Create in-app notification
                const { NotificationService } = await import(
                  "./notification.service"
                );
                const notificationService = new NotificationService();
                await notificationService.createNotification({
                  userId: user.id,
                  type: NotificationType.LICENSE_EXPIRING,
                  title: "License Expiring Soon",
                  message: `Your ${license.licenseType} license (${license.licenseNumber}) will expire in 7 days.`,
                  channels: ["IN_APP", "EMAIL"],
                  actionUrl: `/provider/licenses`,
                });

                remindersSent7++;
              } catch (emailError) {
                console.error(
                  `Failed to send 7-day reminder to ${user.email}:`,
                  emailError
                );
              }
            }
          }
        }
      }

      // Auto-update expired licenses
      const expiredLicenses = await db.license.findMany({
        where: {
          expirationDate: {
            lt: now,
          },
          status: {
            in: [LicenseStatus.PENDING, LicenseStatus.ACTIVE],
          },
        },
      });

      let expiredCount = 0;
      for (const license of expiredLicenses) {
        await db.license.update({
          where: { id: license.id },
          data: {
            status: LicenseStatus.EXPIRED,
          },
        });
        expiredCount++;
      }

      console.log(
        `[Scheduled Job] License expiry check: ${remindersSent30} 30-day reminders, ${remindersSent7} 7-day reminders, ${expiredCount} licenses marked as EXPIRED`
      );

      return;
    } catch (error) {
      console.error("[Scheduled Job] Error checking license expiry:", error);
      throw error;
    }
  }

  /**
   * Check for expiring case manager licenses and send reminder emails
   * Sends reminders at 30 days and 7 days before expiry
   */
  async checkCaseManagerLicenseExpiry(): Promise<void> {
    try {
      const now = new Date();
      const thirtyDaysFromNow = new Date(
        now.getTime() + 30 * 24 * 60 * 60 * 1000
      );
      const sevenDaysFromNow = new Date(
        now.getTime() + 7 * 24 * 60 * 60 * 1000
      );

      // Find case managers with licenses expiring in 30 days (within next 24 hours)
      const thirtyDayThreshold = new Date(
        thirtyDaysFromNow.getTime() - 24 * 60 * 60 * 1000
      );
      const caseManagersExpiringIn30Days = await db.caseManager.findMany({
        where: {
          licenseExpiry: {
            gte: thirtyDayThreshold,
            lte: thirtyDaysFromNow,
          },
          isActive: true,
          licenseNumber: {
            not: null,
          },
        },
        select: {
          id: true,
          organizationId: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          licenseNumber: true,
          licenseExpiry: true,
          licenseDocumentUrl: true,
          licenseFileName: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Find case managers with licenses expiring in 7 days (within next 24 hours)
      const sevenDayThreshold = new Date(
        sevenDaysFromNow.getTime() - 24 * 60 * 60 * 1000
      );
      const caseManagersExpiringIn7Days = await db.caseManager.findMany({
        where: {
          licenseExpiry: {
            gte: sevenDayThreshold,
            lte: sevenDaysFromNow,
          },
          isActive: true,
          licenseNumber: {
            not: null,
          },
        },
        select: {
          id: true,
          organizationId: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          licenseNumber: true,
          licenseExpiry: true,
          licenseDocumentUrl: true,
          licenseFileName: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      let remindersSent30 = 0;
      let remindersSent7 = 0;

      // Send 30-day reminders
      for (const caseManager of caseManagersExpiringIn30Days) {
        if (caseManager.email && caseManager.licenseExpiry) {
          try {
            await this.emailService.sendLicenseExpiryReminder({
              to: caseManager.email,
              licenseId: caseManager.id,
              licenseType: "Case Manager License",
              licenseNumber: caseManager.licenseNumber || "N/A",
              expirationDate: caseManager.licenseExpiry,
              daysUntilExpiry: 30,
            });

            // Find user associated with this case manager to create notification
            const user = await db.user.findFirst({
              where: {
                email: caseManager.email,
                organizationId: caseManager.organizationId,
              },
            });

            if (user) {
              const { NotificationService } = await import(
                "./notification.service"
              );
              const notificationService = new NotificationService();
              await notificationService.createNotification({
                userId: user.id,
                type: NotificationType.LICENSE_EXPIRING,
                title: "License Expiring Soon",
                message: `Your Case Manager license (${caseManager.licenseNumber || "N/A"}) will expire in 30 days.`,
                channels: ["IN_APP", "EMAIL"],
                actionUrl: `/case-manager/settings`,
              });
            }

            remindersSent30++;
          } catch (emailError) {
            console.error(
              `Failed to send 30-day reminder to ${caseManager.email}:`,
              emailError
            );
          }
        }
      }

      // Send 7-day reminders
      for (const caseManager of caseManagersExpiringIn7Days) {
        if (caseManager.email && caseManager.licenseExpiry) {
          try {
            await this.emailService.sendLicenseExpiryReminder({
              to: caseManager.email,
              licenseId: caseManager.id,
              licenseType: "Case Manager License",
              licenseNumber: caseManager.licenseNumber || "N/A",
              expirationDate: caseManager.licenseExpiry,
              daysUntilExpiry: 7,
            });

            // Find user associated with this case manager to create notification
            const user = await db.user.findFirst({
              where: {
                email: caseManager.email,
                organizationId: caseManager.organizationId,
              },
            });

            if (user) {
              const { NotificationService } = await import(
                "./notification.service"
              );
              const notificationService = new NotificationService();
              await notificationService.createNotification({
                userId: user.id,
                type: NotificationType.LICENSE_EXPIRING,
                title: "License Expiring Soon",
                message: `Your Case Manager license (${caseManager.licenseNumber || "N/A"}) will expire in 7 days.`,
                channels: ["IN_APP", "EMAIL"],
                actionUrl: `/case-manager/settings`,
              });
            }

            remindersSent7++;
          } catch (emailError) {
            console.error(
              `Failed to send 7-day reminder to ${caseManager.email}:`,
              emailError
            );
          }
        }
      }

      // Find expired case manager licenses and mark as inactive
      const expiredCaseManagers = await db.caseManager.findMany({
        where: {
          licenseExpiry: {
            lt: now,
          },
          isActive: true,
          licenseNumber: {
            not: null,
          },
        },
      });

      let expiredCount = 0;
      for (const caseManager of expiredCaseManagers) {
        await db.caseManager.update({
          where: { id: caseManager.id },
          data: {
            isActive: false,
          },
        });
        expiredCount++;
      }

      console.log(
        `[Scheduled Job] Case Manager license expiry check: ${remindersSent30} 30-day reminders, ${remindersSent7} 7-day reminders, ${expiredCount} case managers marked as inactive`
      );

      return;
    } catch (error) {
      console.error(
        "[Scheduled Job] Error checking case manager license expiry:",
        error
      );
      throw error;
    }
  }

  /**
   * Send reminders for discharge invitations expiring within 24 hours
   */
  async sendDischargeInvitationReminders(): Promise<void> {
    try {
      const now = new Date();
      const reminderThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const invitations = await db.dischargeInvitation.findMany({
        where: {
          respondedAt: null,
          reminderSentAt: null,
          expiresAt: {
            gt: now,
            lte: reminderThreshold,
          },
        },
        include: {
          dischargeCase: {
            select: {
              id: true,
              caseNumber: true,
              socialWorker: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      if (invitations.length === 0) {
        return;
      }

      const providerIds = Array.from(
        new Set(invitations.map((invitation) => invitation.providerId))
      );
      const providers = await db.provider.findMany({
        where: {
          id: {
            in: providerIds,
          },
        },
        include: {
          organization: {
            select: {
              name: true,
            },
          },
        },
      });
      const providerMap = new Map(
        providers.map((provider) => [provider.id, provider])
      );

      let reminderCount = 0;
      const reminderTimestamp = new Date();
      const formatter = new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });

      for (const invitation of invitations) {
        const socialWorker = invitation.dischargeCase?.socialWorker;
        if (!socialWorker?.email) {
          continue;
        }

        const provider = providerMap.get(invitation.providerId);
        const providerName =
          provider?.organization?.name || provider?.primaryLicenseType || "Provider";

        try {
          await this.emailService.sendNotificationEmail({
            to: socialWorker.email,
            subject: `Provider invitation expiring soon for Case ${invitation.dischargeCase?.caseNumber}`,
            message: `The invitation sent to ${providerName} will expire on ${formatter.format(
              invitation.expiresAt
            )}. Please follow up with the provider or invite an alternate option.`,
            actionUrl: `/hospital-sw/discharges/${invitation.dischargeCase?.id}`,
            userName: socialWorker.firstName || "there",
          });

          await db.dischargeInvitation.update({
            where: { id: invitation.id },
            data: { reminderSentAt: reminderTimestamp },
          });

          reminderCount++;
        } catch (emailError) {
          console.error(
            `Failed to send discharge invitation reminder for invitation ${invitation.id}:`,
            emailError
          );
        }
      }

      if (reminderCount > 0) {
        console.log(
          `[Scheduled Job] Discharge invitation reminders sent: ${reminderCount}`
        );
      }
    } catch (error) {
      console.error(
        "[Scheduled Job] Error sending discharge invitation reminders:",
        error
      );
      throw error;
    }
  }

  /**
   * Handle expired discharge invitations (48-hour expiry)
   */
  async handleExpiredDischargeInvitations(): Promise<void> {
    try {
      const now = new Date();

      const expiredInvitations = await db.dischargeInvitation.findMany({
        where: {
          respondedAt: null,
          expiresAt: {
            lt: now,
          },
        },
        include: {
          dischargeCase: {
            select: {
              id: true,
              caseNumber: true,
              socialWorker: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      if (expiredInvitations.length === 0) {
        return;
      }

      const providerIds = Array.from(
        new Set(expiredInvitations.map((invitation) => invitation.providerId))
      );
      const providers = await db.provider.findMany({
        where: {
          id: {
            in: providerIds,
          },
        },
        include: {
          organization: {
            select: { name: true },
          },
        },
      });
      const providerMap = new Map(
        providers.map((provider) => [provider.id, provider])
      );

      let expiredCount = 0;
      const formatter = new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });

      for (const invitation of expiredInvitations) {
        const socialWorker = invitation.dischargeCase?.socialWorker;
        const provider = providerMap.get(invitation.providerId);
        const providerName =
          provider?.organization?.name || provider?.primaryLicenseType || "Provider";

        await db.dischargeInvitation.update({
          where: { id: invitation.id },
          data: {
            respondedAt: now,
            response: InviteResponse.NO_AVAILABILITY,
            responseNotes: "Automatically marked as expired after 48 hours",
          },
        });

        if (socialWorker?.email) {
          try {
            await this.emailService.sendNotificationEmail({
              to: socialWorker.email,
              subject: `Invitation expired for Case ${invitation.dischargeCase?.caseNumber}`,
              message: `The invitation sent to ${providerName} expired on ${formatter.format(
                invitation.expiresAt
              )}. Consider inviting an alternate provider.`,
              actionUrl: `/hospital-sw/discharges/${invitation.dischargeCase?.id}`,
              userName: socialWorker.firstName || "there",
            });
          } catch (emailError) {
            console.error(
              `Failed to send discharge invitation expiration notice for invitation ${invitation.id}:`,
              emailError
            );
          }
        }

        expiredCount++;
      }

      if (expiredCount > 0) {
        console.log(
          `[Scheduled Job] Expired discharge invitations processed: ${expiredCount}`
        );
      }
    } catch (error) {
      console.error(
        "[Scheduled Job] Error handling expired discharge invitations:",
        error
      );
      throw error;
    }
  }

  /**
   * Auto-escalate discharge cases after invitations expire or are declined
   */
  async autoEscalateDischargeCases(): Promise<void> {
    try {
      // Find cases that need escalation:
      // - Status is MATCHING, INVITES_SENT, or RESPONSES_PENDING
      // - All invitations have been responded to (no pending)
      // - No accepted invitations
      const casesNeedingEscalation = await db.dischargeCase.findMany({
        where: {
          status: {
            in: [
              DischargeStatus.MATCHING,
              DischargeStatus.INVITES_SENT,
              DischargeStatus.RESPONSES_PENDING,
            ],
          },
        },
        include: {
          invitations: {
            select: {
              id: true,
              providerId: true,
              response: true,
              respondedAt: true,
            },
          },
        },
      });

      let escalatedCount = 0;

      for (const caseRecord of casesNeedingEscalation) {
        const invitations = caseRecord.invitations || [];

        // Skip if there are pending invitations
        const hasPendingInvite = invitations.some(
          (inv) => inv.respondedAt === null
        );
        if (hasPendingInvite) {
          continue;
        }

        // Skip if there's an accepted invitation
        const hasAcceptedInvite = invitations.some(
          (inv) => inv.response === InviteResponse.ACCEPTED
        );
        if (hasAcceptedInvite) {
          continue;
        }

        // Skip if no invitations exist (nothing to escalate from)
        if (invitations.length === 0) {
          continue;
        }

        // All invitations have been declined or expired - escalate
        try {
          const result =
            await this.dischargeCaseService.autoEscalateDischargeCase(
              caseRecord.id,
              3 // max 3 new invitations per escalation
            );

          if (result.invitedProviderIds.length > 0) {
            escalatedCount++;
            console.log(
              `[Scheduled Job] Auto-escalated case ${caseRecord.caseNumber} with ${result.invitedProviderIds.length} new invitations`
            );
          }
        } catch (error) {
          console.error(
            `[Scheduled Job] Error escalating case ${caseRecord.id}:`,
            error
          );
          // Continue with other cases
        }
      }

      if (escalatedCount > 0) {
        console.log(
          `[Scheduled Job] Auto-escalated ${escalatedCount} discharge cases`
        );
      }
    } catch (error) {
      console.error(
        "[Scheduled Job] Error auto-escalating discharge cases:",
        error
      );
      throw error;
    }
  }

  /**
   * Run all scheduled jobs
   * This should be called by a cron job or scheduler
   */
  async runAllJobs(): Promise<void> {
    try {
      console.log("[Scheduled Job] Starting scheduled jobs...");
      
      // Run jobs that can run in parallel
      await Promise.all([
        this.enforceOpeningFreshness(),
        this.sendOpeningExpiryReminders(),
        this.checkLicenseExpiry(),
        this.checkCaseManagerLicenseExpiry(),
        this.sendDischargeInvitationReminders(),
      ]);

      // Handle expired invitations first
      await this.handleExpiredDischargeInvitations();

      // Then auto-escalate cases (runs after expired invitations are processed)
      await this.autoEscalateDischargeCases();

      console.log("[Scheduled Job] All scheduled jobs completed");
    } catch (error) {
      console.error("[Scheduled Job] Error running scheduled jobs:", error);
      throw error;
    }
  }
}
