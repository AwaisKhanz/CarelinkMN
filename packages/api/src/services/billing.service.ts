import Stripe from "stripe";
import { db } from "@carelink/database";
import {
  ProductType,
  SubscriptionStatus,
  SubscriptionTier,
} from "@carelink/database";

export class BillingService {
  private stripe: Stripe;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    this.stripe = new Stripe(secretKey, { apiVersion: "2023-10-16" });
  }

  async getOrCreateCustomer(organizationId: string, email?: string) {
    // Check for existing subscription/customer
    const existing = await db.subscription.findFirst({
      where: { organizationId },
    });
    if (existing?.stripeCustomerId) {
      return existing.stripeCustomerId;
    }

    const customer = await this.stripe.customers.create({
      email,
      metadata: { organizationId },
    });
    return customer.id;
  }

  /**
   * Resolve Stripe Price ID for subscription tier
   *
   * Mapping:
   * - FREE: No Stripe subscription (tracked via Provider.subscriptionTier)
   * - PRO: STRIPE_PRICE_ID_PRO (paid plan - $49/month per PRD)
   * - PREMIUM: STRIPE_PRICE_ID_PREMIUM (paid plan - $99/month per PRD)
   * - ENTERPRISE: No Stripe subscription (custom pricing, handled separately)
   *
   * PRD Reference: Section 7 - Marketplace & Monetization - Subscription Tiers
   * - Free: Basic listing, 1 photo, 10 services
   * - Pro: Enhanced visibility, 5 photos, analytics
   * - Premium: Maximum boost, priority support
   */
  private resolvePriceId(tier: SubscriptionTier): string {
    switch (tier) {
      case SubscriptionTier.PRO:
        return process.env.STRIPE_PRICE_ID_PRO || "";
      case SubscriptionTier.PREMIUM:
        return process.env.STRIPE_PRICE_ID_PREMIUM || "";
      default:
        return "";
    }
  }

  async createCheckoutSession(params: {
    organizationId: string;
    email?: string;
    tier: SubscriptionTier;
    successUrl: string;
    cancelUrl: string;
  }) {
    const { organizationId, email, tier, successUrl, cancelUrl } = params;

    // Check for existing subscription
    const existingSubscription = await db.subscription.findFirst({
      where: { organizationId },
    });

    // If they have an active subscription, update it instead of creating new
    if (existingSubscription?.stripeSubscriptionId) {
      try {
        const subscription = await this.stripe.subscriptions.retrieve(
          existingSubscription.stripeSubscriptionId
        );

        // Only update if subscription is active or trialing
        if (
          subscription.status === "active" ||
          subscription.status === "trialing"
        ) {
          const price = this.resolvePriceId(tier);
          if (!price) {
            throw new Error("Stripe price ID not configured for selected tier");
          }

          const updatePayload: Stripe.SubscriptionUpdateParams = {
            items: [
              {
                id: subscription.items.data[0].id,
                price: price,
              },
            ],
            metadata: {
              organizationId,
              productType: ProductType.PROVIDER_SUBSCRIPTION,
              tier,
            },
            proration_behavior: "always_invoice", // Prorate the difference
          };

          // If a downgrade was scheduled, remove the pending cancellation
          if (subscription.cancel_at_period_end) {
            updatePayload.cancel_at_period_end = false;
          }

          // Update existing subscription
          const updatedSubscription = await this.stripe.subscriptions.update(
            existingSubscription.stripeSubscriptionId,
            updatePayload
          );

          // Update our database
          await this.upsertSubscription({
            organizationId,
            stripeCustomerId: updatedSubscription.customer as string,
            stripeSubscriptionId: updatedSubscription.id,
            tier,
            status: this.mapStripeStatus(updatedSubscription.status),
            currentPeriodStart: new Date(
              updatedSubscription.current_period_start * 1000
            ),
            currentPeriodEnd: new Date(
              updatedSubscription.current_period_end * 1000
            ),
            cancelAt: updatedSubscription.cancel_at_period_end
              ? updatedSubscription.cancel_at
                ? new Date(updatedSubscription.cancel_at * 1000)
                : null
              : null,
          });

          // Return success URL directly
          return successUrl;
        }
      } catch (err) {
        console.error("Error updating subscription:", err);
        // If update fails, fall through to create new checkout session
      }
    }

    // No existing subscription or it's cancelled - create new checkout session
    const customerId = await this.getOrCreateCustomer(organizationId, email);
    const price = this.resolvePriceId(tier);
    if (!price) {
      throw new Error("Stripe price ID not configured for selected tier");
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        organizationId,
        productType: ProductType.PROVIDER_SUBSCRIPTION,
        tier,
      },
      subscription_data: {
        metadata: {
          organizationId,
          productType: ProductType.PROVIDER_SUBSCRIPTION,
          tier,
        },
      },
    });

    return session.url as string;
  }

  async createPortalSession(organizationId: string, returnUrl: string) {
    const existing = await db.subscription.findFirst({
      where: { organizationId },
    });
    if (!existing?.stripeCustomerId) {
      throw new Error("No Stripe customer found for organization");
    }
    const session = await this.stripe.billingPortal.sessions.create({
      customer: existing.stripeCustomerId,
      return_url: returnUrl,
    });
    return session.url;
  }

  async getSubscription(organizationId: string) {
    const subscription = await db.subscription.findFirst({
      where: { organizationId },
      orderBy: { createdAt: "desc" }, // Get the most recent one
    });
    return subscription;
  }

  /**
   * Cancel duplicate/old subscriptions for an organization
   * Keeps only the most recent active subscription
   */
  async cleanupDuplicateSubscriptions(organizationId: string) {
    const allSubscriptions = await db.subscription.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });

    if (allSubscriptions.length <= 1) {
      return { cleaned: 0, kept: allSubscriptions.length };
    }

    // Keep the first (most recent) subscription
    const keepSubscription = allSubscriptions[0];
    const duplicates = allSubscriptions.slice(1);

    let cleanedCount = 0;

    for (const duplicate of duplicates) {
      try {
        // Cancel in Stripe if it's active
        if (duplicate.stripeSubscriptionId) {
          const stripeSub = await this.stripe.subscriptions.retrieve(
            duplicate.stripeSubscriptionId
          );
          if (
            stripeSub.status === "active" ||
            stripeSub.status === "trialing"
          ) {
            await this.stripe.subscriptions.cancel(
              duplicate.stripeSubscriptionId
            );
          }
        }

        // Mark as cancelled in database
        await db.subscription.update({
          where: { id: duplicate.id },
          data: {
            status: SubscriptionStatus.CANCELLED,
            canceledAt: new Date(),
          },
        });

        cleanedCount++;
      } catch (err) {
        console.error(`Failed to cleanup subscription ${duplicate.id}:`, err);
      }
    }

    return { cleaned: cleanedCount, kept: 1 };
  }

  /**
   * Schedule downgrade to free plan at the end of current billing period.
   * Sets cancel_at_period_end on the active Stripe subscription so user keeps
   * access for the remainder of the paid term, then moves to FREE.
   */
  async scheduleDowngradeToFree(organizationId: string) {
    const subscriptionRecord = await db.subscription.findFirst({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });

    if (!subscriptionRecord?.stripeSubscriptionId) {
      throw new Error("No active subscription found to downgrade");
    }

    const stripeSubscription = await this.stripe.subscriptions.retrieve(
      subscriptionRecord.stripeSubscriptionId
    );

    if (
      stripeSubscription.status !== "active" &&
      stripeSubscription.status !== "trialing"
    ) {
      throw new Error(
        `Subscription is ${stripeSubscription.status}. Only active subscriptions can be downgraded.`
      );
    }

    const updatedSubscription = await this.stripe.subscriptions.update(
      stripeSubscription.id,
      {
        cancel_at_period_end: true,
      }
    );

    const cancelAt =
      updatedSubscription.cancel_at && updatedSubscription.cancel_at > 0
        ? new Date(updatedSubscription.cancel_at * 1000)
        : updatedSubscription.current_period_end
          ? new Date(updatedSubscription.current_period_end * 1000)
          : null;

    await db.subscription.update({
      where: { id: subscriptionRecord.id },
      data: {
        cancelAt,
        canceledAt: null,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    return {
      cancelAt,
      currentPeriodEnd: updatedSubscription.current_period_end
        ? new Date(updatedSubscription.current_period_end * 1000)
        : cancelAt,
      stripeStatus: updatedSubscription.status,
    };
  }

  /**
   * Cancel an existing scheduled downgrade, keeping the paid plan active.
   */
  async cancelScheduledDowngrade(organizationId: string) {
    const subscriptionRecord = await db.subscription.findFirst({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });

    if (!subscriptionRecord?.stripeSubscriptionId) {
      throw new Error("No active subscription found to cancel downgrade");
    }

    const stripeSubscription = await this.stripe.subscriptions.retrieve(
      subscriptionRecord.stripeSubscriptionId
    );

    if (!stripeSubscription.cancel_at_period_end) {
      return {
        cancelAt: null,
        stripeStatus: stripeSubscription.status,
      };
    }

    const updated = await this.stripe.subscriptions.update(
      stripeSubscription.id,
      {
        cancel_at_period_end: false,
      }
    );

    await db.subscription.update({
      where: { id: subscriptionRecord.id },
      data: {
        cancelAt: null,
        canceledAt: null,
        status: this.mapStripeStatus(updated.status),
      },
    });

    return {
      cancelAt: null,
      stripeStatus: updated.status,
      currentPeriodEnd: updated.current_period_end
        ? new Date(updated.current_period_end * 1000)
        : null,
    };
  }

  async handleWebhook(rawBody: Buffer, signature: string | undefined) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event: Stripe.Event;

    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
    }
    if (!signature) {
      throw new Error("Missing Stripe signature header");
    }

    event = this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        // subscription id might be in session.subscription
        const subscriptionId = session.subscription as string | undefined;
        const customerId = session.customer as string | undefined;
        // Metadata is set on the session itself
        const tier = session.metadata?.tier as SubscriptionTier | undefined;
        const organizationId = session.metadata?.organizationId as
          | string
          | undefined;

        // If we have subscription ID, fetch subscription to get metadata as fallback
        let finalTier = tier;
        let finalOrgId = organizationId;

        if (subscriptionId && (!finalTier || !finalOrgId)) {
          try {
            const subscription =
              await this.stripe.subscriptions.retrieve(subscriptionId);
            finalTier =
              finalTier ||
              (subscription.metadata?.tier as SubscriptionTier | undefined);
            finalOrgId = finalOrgId || subscription.metadata?.organizationId;
          } catch (err) {
            console.error("Failed to retrieve subscription:", err);
          }
        }

        if (subscriptionId && customerId && finalTier && finalOrgId) {
          await this.upsertSubscription({
            organizationId: finalOrgId,
            stripeCustomerId: customerId as string,
            stripeSubscriptionId: subscriptionId,
            tier: finalTier,
            status: SubscriptionStatus.ACTIVE,
          });
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription;
        const {
          id,
          customer,
          current_period_start,
          current_period_end,
          status,
          metadata,
        } = sub;
        const organizationId =
          (metadata?.organizationId as string) || undefined;
        const tier = (metadata?.tier as SubscriptionTier) || undefined;

        console.log(`[Webhook] ${event.type}:`, {
          subscriptionId: id,
          customerId: customer,
          organizationId,
          tier,
          hasMetadata: !!metadata,
          metadataKeys: metadata ? Object.keys(metadata) : [],
          hasPeriodDates: !!current_period_start && !!current_period_end,
        });

        if (organizationId && tier) {
          // Only include period dates if they're valid
          const updateData: any = {
            organizationId,
            stripeCustomerId: customer as string,
            stripeSubscriptionId: id,
            tier,
            status: this.mapStripeStatus(status),
          };

          if (sub.cancel_at_period_end) {
            updateData.cancelAt =
              sub.cancel_at && sub.cancel_at > 0
                ? new Date(sub.cancel_at * 1000)
                : null;
          } else {
            updateData.cancelAt = null;
          }

          // Only add period dates if they exist and are valid
          if (current_period_start && current_period_end) {
            updateData.currentPeriodStart = new Date(
              current_period_start * 1000
            );
            updateData.currentPeriodEnd = new Date(current_period_end * 1000);
          }

          await this.upsertSubscription(updateData);
        } else {
          console.warn(`[Webhook] Missing metadata for ${event.type}:`, {
            organizationId,
            tier,
            metadata,
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const { id } = sub;
        await db.subscription.updateMany({
          where: { stripeSubscriptionId: id },
          data: {
            status: SubscriptionStatus.CANCELLED,
            canceledAt: new Date(),
          },
        });
        break;
      }
      default:
        // no-op
        break;
    }

    return { received: true };
  }

  private mapStripeStatus(
    status: Stripe.Subscription.Status
  ): SubscriptionStatus {
    switch (status) {
      case "trialing":
        return SubscriptionStatus.TRIALING;
      case "active":
        return SubscriptionStatus.ACTIVE;
      case "past_due":
        return SubscriptionStatus.PAST_DUE;
      case "unpaid":
        return SubscriptionStatus.UNPAID;
      case "canceled":
        return SubscriptionStatus.CANCELLED;
      default:
        return SubscriptionStatus.ACTIVE;
    }
  }

  private async upsertSubscription(params: {
    organizationId: string;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    tier: SubscriptionTier;
    status: SubscriptionStatus;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    cancelAt?: Date | null;
  }) {
    const {
      organizationId,
      stripeCustomerId,
      stripeSubscriptionId,
      tier,
      status,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAt,
    } = params;

    const existing = await db.subscription.findFirst({
      where: { organizationId },
    });

    if (existing) {
      await db.subscription.update({
        where: { id: existing.id },
        data: {
          stripeCustomerId,
          stripeSubscriptionId,
          productType: ProductType.PROVIDER_SUBSCRIPTION,
          tier,
          status,
          currentPeriodStart: currentPeriodStart ?? existing.currentPeriodStart,
          currentPeriodEnd: currentPeriodEnd ?? existing.currentPeriodEnd,
          cancelAt:
            cancelAt === undefined ? existing.cancelAt : cancelAt ?? null,
          canceledAt:
            cancelAt === null ? null : existing.canceledAt ?? null,
        },
      });
    } else {
      await db.subscription.create({
        data: {
          stripeCustomerId,
          stripeSubscriptionId,
          organizationId,
          productType: ProductType.PROVIDER_SUBSCRIPTION,
          tier,
          status,
          currentPeriodStart: currentPeriodStart ?? new Date(),
          currentPeriodEnd: currentPeriodEnd ?? new Date(),
          cancelAt: cancelAt ?? null,
          seatsIncluded: 1,
          seatsUsed: 0,
        },
      });
    }

    // Also update provider tier
    await db.provider.updateMany({
      where: { organizationId },
      data: { subscriptionTier: tier },
    });
  }
}
