import { BoostPurchaseStatus } from "@prisma/client";
import { db } from "@carelink/database";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

export interface BoostTier {
  level: number;
  name: string;
  influence: number; // Percentage (10, 20, 30)
  monthlyPrice: number; // In cents
  stripePriceId: string;
}

export const BOOST_TIERS: BoostTier[] = [
  {
    level: 1,
    name: "Basic Boost",
    influence: 10,
    monthlyPrice: 9900, // $99
    stripePriceId: process.env.BOOST_TIER_1_PRICE_ID || "",
  },
  {
    level: 2,
    name: "Enhanced Boost",
    influence: 20,
    monthlyPrice: 19900, // $199
    stripePriceId: process.env.BOOST_TIER_2_PRICE_ID || "",
  },
  {
    level: 3,
    name: "Premium Boost",
    influence: 30,
    monthlyPrice: 29900, // $299
    stripePriceId: process.env.BOOST_TIER_3_PRICE_ID || "",
  },
];

export class BoostService {
  /**
   * Get boost tier pricing information
   */
  getBoostPricing(): BoostTier[] {
    return BOOST_TIERS;
  }

  /**
   * Get boost tier by level
   */
  getBoostTier(level: number): BoostTier | undefined {
    return BOOST_TIERS.find((tier) => tier.level === level);
  }

  /**
   * Create Stripe Checkout session for boost purchase
   */
  async createCheckoutSession(params: {
    providerId: string;
    boostLevel: number;
    isRecurring: boolean;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ sessionId: string; url: string }> {
    const tier = this.getBoostTier(params.boostLevel);
    if (!tier) {
      throw new Error(`Invalid boost level: ${params.boostLevel}`);
    }

    // Get provider to use organization email
    const provider = await db.provider.findUnique({
      where: { id: params.providerId },
      include: { organization: true },
    });

    if (!provider) {
      throw new Error("Provider not found");
    }

    const session = await stripe.checkout.sessions.create({
      mode: params.isRecurring ? "subscription" : "payment",
      customer_email: provider.organization.email,
      line_items: [
        {
          price: tier.stripePriceId,
          quantity: 1,
        },
      ],
      metadata: {
        providerId: params.providerId,
        boostLevel: params.boostLevel.toString(),
        isRecurring: params.isRecurring.toString(),
      },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    });

    return {
      sessionId: session.id,
      url: session.url || "",
    };
  }

  /**
   * Activate boost after successful payment
   */
  async activateBoost(params: {
    providerId: string;
    boostLevel: number;
    stripePaymentId?: string;
    stripeSubId?: string;
    durationDays?: number; // Default 30 days
  }): Promise<void> {
    const tier = this.getBoostTier(params.boostLevel);
    if (!tier) {
      throw new Error(`Invalid boost level: ${params.boostLevel}`);
    }

    const durationDays = params.durationDays || 30;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);

    // Create boost purchase record
    await db.boostPurchase.create({
      data: {
        providerId: params.providerId,
        boostLevel: params.boostLevel,
        amount: tier.monthlyPrice,
        currency: "usd",
        stripePaymentId: params.stripePaymentId,
        stripeSubId: params.stripeSubId,
        startDate,
        endDate,
        status: BoostPurchaseStatus.ACTIVE,
      },
    });

    // Update provider boost status
    await db.provider.update({
      where: { id: params.providerId },
      data: {
        boostLevel: params.boostLevel,
        boostExpiresAt: endDate,
        boostPurchasedAt: startDate,
        boostStripeSubId: params.stripeSubId,
      },
    });

    console.log(
      `✅ Boost activated for provider ${params.providerId} - Level ${params.boostLevel}`
    );
  }

  /**
   * Cancel boost subscription
   */
  async cancelBoost(providerId: string): Promise<void> {
    const provider = await db.provider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new Error("Provider not found");
    }

    // Cancel Stripe subscription if exists
    if (provider.boostStripeSubId) {
      try {
        await stripe.subscriptions.cancel(provider.boostStripeSubId);
      } catch (error) {
        console.error("Error cancelling Stripe subscription:", error);
        // Continue with local cancellation even if Stripe fails
      }
    }

    // Mark current boost purchase as cancelled
    await db.boostPurchase.updateMany({
      where: {
        providerId,
        status: BoostPurchaseStatus.ACTIVE,
      },
      data: {
        status: BoostPurchaseStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });

    // Deactivate boost on provider
    await db.provider.update({
      where: { id: providerId },
      data: {
        boostLevel: 0,
        boostExpiresAt: null,
        boostStripeSubId: null,
      },
    });

    console.log(`✅ Boost cancelled for provider ${providerId}`);
  }

  /**
   * Check and deactivate expired boosts (cron job)
   */
  async checkExpiredBoosts(): Promise<number> {
    const now = new Date();

    // Find providers with expired boosts
    const expiredProviders = await db.provider.findMany({
      where: {
        boostLevel: { gt: 0 },
        boostExpiresAt: { lte: now },
      },
    });

    console.log(`Found ${expiredProviders.length} expired boosts`);

    // Deactivate each expired boost
    for (const provider of expiredProviders) {
      await db.boostPurchase.updateMany({
        where: {
          providerId: provider.id,
          status: BoostPurchaseStatus.ACTIVE,
        },
        data: {
          status: BoostPurchaseStatus.EXPIRED,
        },
      });

      await db.provider.update({
        where: { id: provider.id },
        data: {
          boostLevel: 0,
          boostExpiresAt: null,
        },
      });

      console.log(`✅ Deactivated expired boost for provider ${provider.id}`);
    }

    return expiredProviders.length;
  }

  /**
   * Get current boost status for a provider
   */
  async getBoostStatus(providerId: string) {
    const provider = await db.provider.findUnique({
      where: { id: providerId },
      select: {
        boostLevel: true,
        boostExpiresAt: true,
        boostPurchasedAt: true,
        boostStripeSubId: true,
        viewCount: true,
        inquiryCount: true,
        placementCount: true,
      },
    });

    if (!provider) {
      throw new Error("Provider not found");
    }

    const tier = provider.boostLevel > 0 ? this.getBoostTier(provider.boostLevel) : null;

    return {
      isActive: provider.boostLevel > 0,
      level: provider.boostLevel,
      tier,
      expiresAt: provider.boostExpiresAt,
      purchasedAt: provider.boostPurchasedAt,
      isRecurring: !!provider.boostStripeSubId,
      metrics: {
        views: provider.viewCount,
        inquiries: provider.inquiryCount,
        placements: provider.placementCount,
      },
    };
  }

  /**
   * Increment view count for a provider
   */
  async incrementViewCount(providerId: string): Promise<void> {
    await db.provider.update({
      where: { id: providerId },
      data: {
        viewCount: { increment: 1 },
        lastViewedAt: new Date(),
      },
    });
  }

  /**
   * Increment inquiry count for a provider
   */
  async incrementInquiryCount(providerId: string): Promise<void> {
    await db.provider.update({
      where: { id: providerId },
      data: {
        inquiryCount: { increment: 1 },
      },
    });
  }

  /**
   * Increment placement count for a provider
   */
  async incrementPlacementCount(providerId: string): Promise<void> {
    await db.provider.update({
      where: { id: providerId },
      data: {
        placementCount: { increment: 1 },
      },
    });
  }
}

export const boostService = new BoostService();
