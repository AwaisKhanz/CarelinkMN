import { apiService } from "@/lib/api/config";
import type {
  BoostTier,
  BoostStatus,
  CreateBoostCheckoutParams,
  BoostCheckoutSession,
  CancelBoostParams,
} from "@carelink/types";

export class BoostService {
  /**
   * Get boost tier pricing
   */
  async getPricing() {
    const response = await apiService.get<BoostTier[]>("/api/boost/pricing");
    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to get boost pricing");
    }
    return response.data;
  }

  /**
   * Create Stripe Checkout session for boost purchase
   */
  async createCheckoutSession(params: CreateBoostCheckoutParams) {
    const response = await apiService.post<BoostCheckoutSession>(
      "/api/boost/checkout",
      params
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to create checkout session");
    }
    return response.data;
  }

  /**
   * Get current boost status for a provider
   */
  async getStatus(providerId: string) {
    const response = await apiService.get<BoostStatus>(
      `/api/boost/status/${providerId}`
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to get boost status");
    }
    return response.data;
  }

  /**
   * Cancel boost subscription
   */
  async cancelBoost(params: CancelBoostParams) {
    const response = await apiService.post("/api/boost/cancel", params);
    if (!response.success) {
      throw new Error(response.message || "Failed to cancel boost");
    }
    return response.data;
  }
}

export const boostService = new BoostService();
