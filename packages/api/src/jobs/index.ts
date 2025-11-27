import cron from "node-cron";
import { PlacementNotificationsJob } from "./placement-notifications.job";

export class JobScheduler {
  private placementNotificationsJob: PlacementNotificationsJob;

  constructor() {
    this.placementNotificationsJob = new PlacementNotificationsJob();
  }

  /**
   * Start all scheduled jobs
   */
  start(): void {
    // Run placement notifications every hour
    cron.schedule("0 * * * *", async () => {
      console.log("[JobScheduler] Running placement notifications job...");
      await this.placementNotificationsJob.run();
    });

    console.log("✅ [JobScheduler] Jobs scheduled successfully");
    console.log("   - Placement notifications: Every hour");
  }

  /**
   * Run jobs immediately (for testing)
   */
  async runNow(): Promise<void> {
    console.log("[JobScheduler] Running all jobs immediately...");
    await this.placementNotificationsJob.run();
  }
}

// Export singleton instance
let jobScheduler: JobScheduler | null = null;

export function getJobScheduler(): JobScheduler {
  if (!jobScheduler) {
    jobScheduler = new JobScheduler();
  }
  return jobScheduler;
}
