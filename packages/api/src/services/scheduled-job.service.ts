import { db } from "@carelink/database";
import { OpeningStatus, LicenseStatus } from "@prisma/client";
import { EmailService } from "./email.service";
import { LicenseService } from "./license.service";
import { OpeningService } from "./opening.service";

export class ScheduledJobService {
  private emailService: EmailService;
  private licenseService: LicenseService;
  private openingService: OpeningService;

  constructor() {
    this.emailService = new EmailService();
    this.licenseService = new LicenseService();
    this.openingService = new OpeningService();
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

      for (const opening of expiringOpenings as any[]) {
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
          for (const user of opening.provider.organization.users as any[]) {
            // Skip if a recent notification was already sent to this user for this opening
            const recentNotif = await db.notification.findFirst({
              where: {
                userId: user.id,
                type: "OPENING_EXPIRING" as any,
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
          for (const user of opening.provider.organization.users as any[]) {
            // Skip if a recent notification was already created
            const recentNotif = await db.notification.findFirst({
              where: {
                userId: user.id,
                type: "OPENING_EXPIRING" as any,
                createdAt: {
                  gte: new Date(now.getTime() - 30 * 60 * 60 * 1000),
                },
                actionUrl: `/provider/openings/${opening.id}`,
              },
            });
            if (recentNotif) continue;

            try {
              await db.notification.create({
                data: {
                  userId: user.id,
                  type: "OPENING_EXPIRING" as any,
                  title: "Opening Expiring Soon",
                  message: `Opening at ${opening.home?.name ?? "home"} will expire in ~${hoursUntilExpiry} hours if not refreshed.`,
                  channels: ["IN_APP", "EMAIL"],
                  actionUrl: `/provider/openings/${opening.id}`,
                },
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
   * Run all scheduled jobs
   * This should be called by a cron job or scheduler
   */
  async runAllJobs(): Promise<void> {
    try {
      console.log("[Scheduled Job] Starting scheduled jobs...");
      await Promise.all([
        this.enforceOpeningFreshness(),
        this.sendOpeningExpiryReminders(),
        this.checkLicenseExpiry(),
      ]);
      console.log("[Scheduled Job] All scheduled jobs completed");
    } catch (error) {
      console.error("[Scheduled Job] Error running scheduled jobs:", error);
      throw error;
    }
  }
}
