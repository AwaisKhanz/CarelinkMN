import { Request, Response } from "express";
import { BillingService } from "../services/billing.service";
import { AuthenticatedRequest } from "../types/auth";
import { ApiResponse } from "../types/common";
import { SubscriptionTier } from "@carelink/database";

export class BillingController {
  private billingService: BillingService;

  constructor() {
    this.billingService = new BillingService();
    this.createCheckoutSession = this.createCheckoutSession.bind(this);
    this.createPortalSession = this.createPortalSession.bind(this);
    this.getSubscription = this.getSubscription.bind(this);
    this.cleanupDuplicates = this.cleanupDuplicates.bind(this);
    this.scheduleDowngrade = this.scheduleDowngrade.bind(this);
    this.cancelDowngrade = this.cancelDowngrade.bind(this);
    this.handleStripeWebhook = this.handleStripeWebhook.bind(this);
  }

  async createCheckoutSession(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as unknown as AuthenticatedRequest).user;
      if (!user || !user.organizationId) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const { tier, context } = req.body as {
        tier: SubscriptionTier;
        context?: "onboarding" | "settings";
      };

      if (!tier || !["PRO", "PREMIUM"].includes(tier)) {
        res.status(400).json({
          success: false,
          error: "Invalid tier",
          message: "Tier must be PRO or PREMIUM",
        } as ApiResponse);
        return;
      }

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

      // Determine success/cancel URLs based on context
      let successUrl: string;
      let cancelUrl: string;

      if (context === "onboarding") {
        successUrl = `${frontendUrl}/provider/onboarding?checkout=success`;
        cancelUrl = `${frontendUrl}/provider/onboarding?checkout=cancel`;
      } else {
        // Default to settings page for upgrades/downgrades
        successUrl = `${frontendUrl}/provider/settings?upgrade=success`;
        cancelUrl = `${frontendUrl}/provider/settings?upgrade=cancel`;
      }

      const url = await this.billingService.createCheckoutSession({
        organizationId: user.organizationId,
        email: user.email,
        tier,
        successUrl,
        cancelUrl,
      });

      res.status(200).json({
        success: true,
        data: { url },
      } as ApiResponse);
    } catch (error) {
      console.error("Create checkout session error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: "Failed to create checkout session",
      } as ApiResponse);
    }
  }

  async createPortalSession(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as unknown as AuthenticatedRequest).user;
      if (!user || !user.organizationId) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const returnUrl = `${frontendUrl}/provider/settings`;

      const url = await this.billingService.createPortalSession(
        user.organizationId,
        returnUrl
      );

      res.status(200).json({
        success: true,
        data: { url },
      } as ApiResponse);
    } catch (error) {
      console.error("Create portal session error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: "Failed to create portal session",
      } as ApiResponse);
    }
  }

  async getSubscription(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as unknown as AuthenticatedRequest).user;
      if (!user || !user.organizationId) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const subscription = await this.billingService.getSubscription(
        user.organizationId
      );

      res.status(200).json({
        success: true,
        data: subscription,
      } as ApiResponse);
    } catch (error) {
      console.error("Get subscription error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve subscription",
      } as ApiResponse);
    }
  }

  async cleanupDuplicates(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as unknown as AuthenticatedRequest).user;
      if (!user || !user.organizationId) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const result = await this.billingService.cleanupDuplicateSubscriptions(
        user.organizationId
      );

      res.status(200).json({
        success: true,
        data: result,
        message: `Cleaned up ${result.cleaned} duplicate subscription(s)`,
      } as ApiResponse);
    } catch (error) {
      console.error("Cleanup duplicates error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: "Failed to cleanup duplicate subscriptions",
      } as ApiResponse);
    }
  }

  async scheduleDowngrade(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as unknown as AuthenticatedRequest).user;
      if (!user || !user.organizationId) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const result = await this.billingService.scheduleDowngradeToFree(
        user.organizationId
      );

      res.status(200).json({
        success: true,
        data: result,
        message:
          "Subscription will end at the end of the current billing period. You'll move to the Free plan automatically.",
      } as ApiResponse);
    } catch (error) {
      console.error("Schedule downgrade error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to schedule downgrade",
      } as ApiResponse);
    }
  }

  async cancelDowngrade(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as unknown as AuthenticatedRequest).user;
      if (!user || !user.organizationId) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const result = await this.billingService.cancelScheduledDowngrade(
        user.organizationId
      );

      res.status(200).json({
        success: true,
        data: result,
        message: "Scheduled downgrade has been cancelled.",
      } as ApiResponse);
    } catch (error) {
      console.error("Cancel downgrade error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to cancel scheduled downgrade",
      } as ApiResponse);
    }
  }

  async handleStripeWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers["stripe-signature"] as string | undefined;
      // With express.raw(), req.body is already a Buffer
      const rawBody = Buffer.isBuffer(req.body)
        ? req.body
        : Buffer.from(JSON.stringify(req.body));
      const result = await this.billingService.handleWebhook(
        rawBody,
        signature
      );
      res.status(200).json(result);
    } catch (error) {
      console.error("Stripe webhook error:", error);
      res.status(400).send(`Webhook Error: ${(error as Error).message}`);
    }
  }
}
