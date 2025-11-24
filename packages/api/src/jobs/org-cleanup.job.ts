import { db } from "@carelink/database";

/**
 * Job to clean up orphaned users after organization deletion
 * Runs daily to deactivate users whose organization has been deleted
 * 
 * Note: This is a placeholder implementation. Customize based on your
 * user management and soft-delete requirements.
 */
export class OrganizationCleanupJob {
  /**
   * Execute the organization cleanup job
   * Finds users with null organizationId and handles them appropriately
   */
  async execute(): Promise<void> {
    try {
      console.log("[OrganizationCleanupJob] Starting organization cleanup...");

      // Find users with null organizationId who are still active
      const orphanedUsers = await db.user.findMany({
        where: {
          organizationId: null,
          // Exclude admin roles that don't need an organization
          role: {
            notIn: ["SUPER_ADMIN", "ADMIN"],
          },
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      console.log(
        `[OrganizationCleanupJob] Found ${orphanedUsers.length} orphaned users`
      );

      if (orphanedUsers.length === 0) {
        console.log("[OrganizationCleanupJob] No orphaned users to clean up.");
        return;
      }

      // Log orphaned users for manual review
      console.log(
        "[OrganizationCleanupJob] Orphaned users that need attention:"
      );
      orphanedUsers.forEach((user) => {
        console.log(
          `  - ${user.email} (${user.role}) - Created: ${user.createdAt.toISOString()}`
        );
      });

      // TODO: Implement cleanup logic based on your requirements
      // Options:
      // 1. Soft delete by setting isActive: false (if field exists)
      // 2. Delete after grace period (e.g., 30 days)
      // 3. Send notification to admins for manual review
      // 4. Reassign to a default organization

      console.log("[OrganizationCleanupJob] Completed successfully.");
    } catch (error) {
      console.error("[OrganizationCleanupJob] Error executing job:", error);
      throw error;
    }
  }

  /**
   * Get job schedule (cron expression)
   * Runs daily at 2:00 AM
   */
  getSchedule(): string {
    return "0 2 * * *"; // Daily at 2:00 AM
  }

  /**
   * Get job name for logging
   */
  getName(): string {
    return "OrganizationCleanupJob";
  }
}
