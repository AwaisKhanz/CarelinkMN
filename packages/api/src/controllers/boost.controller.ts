import { Request, Response } from "express";
import { BoostService } from "../services/boost.service";
import { ApiResponse } from "../types/common";
import { validationResult } from "express-validator";

const boostService = new BoostService();

export class BoostController {
  constructor() {
    // Bind methods to preserve 'this' context
    this.getPricing = this.getPricing.bind(this);
    this.createCheckout = this.createCheckout.bind(this);
    this.getStatus = this.getStatus.bind(this);
    this.cancelBoost = this.cancelBoost.bind(this);
    this.checkExpired = this.checkExpired.bind(this);
  }

  /**
   * GET /api/boost/pricing
   * Get boost tier pricing
   */
  async getPricing(req: Request, res: Response): Promise<void> {
    try {
      const pricing = boostService.getBoostPricing();
      res.json({
        success: true,
        data: pricing,
      } as ApiResponse);
    } catch (error) {
      console.error("Error getting boost pricing:", error);
      res.status(500).json({
        success: false,
        error: "Internal Server Error",
        message: "Failed to get boost pricing",
      } as ApiResponse);
    }
  }

  /**
   * POST /api/boost/checkout
   * Create Stripe Checkout session for boost purchase
   */
  async createCheckout(req: Request, res: Response): Promise<void> {
    try {
      const { providerId, boostLevel, isRecurring } = req.body;

      // Validate input
      if (!providerId || !boostLevel || typeof isRecurring !== "boolean") {
        res.status(400).json({
          success: false,
          error: "Validation Error",
          message: "providerId, boostLevel, and isRecurring are required",
        } as ApiResponse);
        return;
      }

      if (boostLevel < 1 || boostLevel > 3) {
        res.status(400).json({
          success: false,
          error: "Validation Error",
          message: "boostLevel must be between 1 and 3",
        } as ApiResponse);
        return;
      }

      const baseUrl = process.env.BASE_URL || "http://localhost:3000";
      const session = await boostService.createCheckoutSession({
        providerId,
        boostLevel,
        isRecurring,
        successUrl: `${baseUrl}/provider/boost/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${baseUrl}/provider/boost`,
      });

      res.json({
        success: true,
        data: session,
      } as ApiResponse);
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({
        success: false,
        error: "Internal Server Error",
        message:
          error instanceof Error ? error.message : "Failed to create checkout session",
      } as ApiResponse);
    }
  }

  /**
   * GET /api/boost/status/:providerId
   * Get current boost status for a provider
   */
  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const { providerId } = req.params;

      const status = await boostService.getBoostStatus(providerId);

      res.json({
        success: true,
        data: status,
      } as ApiResponse);
    } catch (error) {
      console.error("Error getting boost status:", error);
      res.status(500).json({
        success: false,
        error: "Internal Server Error",
        message:
          error instanceof Error ? error.message : "Failed to get boost status",
      } as ApiResponse);
    }
  }

  /**
   * POST /api/boost/cancel
   * Cancel boost subscription
   */
  async cancelBoost(req: Request, res: Response): Promise<void> {
    try {
      const { providerId } = req.body;

      if (!providerId) {
        res.status(400).json({
          success: false,
          error: "Validation Error",
          message: "providerId is required",
        } as ApiResponse);
        return;
      }

      await boostService.cancelBoost(providerId);

      res.json({
        success: true,
        message: "Boost cancelled successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Error cancelling boost:", error);
      res.status(500).json({
        success: false,
        error: "Internal Server Error",
        message:
          error instanceof Error ? error.message : "Failed to cancel boost",
      } as ApiResponse);
    }
  }

  /**
   * POST /api/boost/check-expired (Internal/Cron)
   * Check and deactivate expired boosts
   */
  async checkExpired(req: Request, res: Response): Promise<void> {
    try {
      const count = await boostService.checkExpiredBoosts();

      res.json({
        success: true,
        message: `Deactivated ${count} expired boosts`,
        data: { count },
      } as ApiResponse);
    } catch (error) {
      console.error("Error checking expired boosts:", error);
      res.status(500).json({
        success: false,
        error: "Internal Server Error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to check expired boosts",
      } as ApiResponse);
    }
  }
}
