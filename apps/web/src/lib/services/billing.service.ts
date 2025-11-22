import { apiService } from "@/lib/api/config";
import { SubscriptionTier } from "@carelink/types";
import { Subscription } from "@/types/subscription";

export class BillingService {
  async createCheckoutSession(
    tier: SubscriptionTier.PRO | SubscriptionTier.PREMIUM,
    context: "onboarding" | "settings" = "settings"
  ) {
    const response = await apiService.post<{ url: string }>(
      "/api/billing/create-checkout-session",
      { tier, context }
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to create checkout session");
    }
    return response.data.url;
  }

  async createPortalSession() {
    const response = await apiService.post<{ url: string }>(
      "/api/billing/create-portal-session",
      {}
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to create portal session");
    }
    return response.data.url;
  }

  async getSubscription() {
    const response = await apiService.get<Subscription | null>(
      "/api/billing/subscription"
    );
    if (!response.success) {
      throw new Error(response.message || "Failed to get subscription");
    }
    return response.data || null;
  }

  async cleanupDuplicateSubscriptions() {
    const response = await apiService.post(
      "/api/billing/cleanup-duplicates",
      {}
    );
    if (!response.success) {
      throw new Error(response.message || "Failed to cleanup duplicates");
    }
    return response.data;
  }

  async scheduleDowngrade() {
    const response = await apiService.post<{
      cancelAt: string | null;
      currentPeriodEnd: string | null;
      stripeStatus: string;
    }>("/api/billing/downgrade", {});
    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to schedule downgrade");
    }
    return response.data;
  }

  async cancelScheduledDowngrade() {
    const response = await apiService.post<{
      cancelAt: string | null;
      stripeStatus: string;
      currentPeriodEnd?: string | null;
    }>("/api/billing/downgrade/cancel", {});
    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to cancel downgrade");
    }
    return response.data;
  }
}

export const billingService = new BillingService();
