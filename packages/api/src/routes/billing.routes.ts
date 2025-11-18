import { Router } from "express";
import { body } from "express-validator";
import { BillingController } from "../controllers/billing.controller";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { PROVIDER_PERMISSIONS } from "../lib/rbac";

const router: Router = Router();
const controller = new BillingController();
const auth = new AuthMiddleware();

// Authenticated routes
router.use(auth.requireAuth);

/**
 * @route POST /api/billing/create-checkout-session
 * @desc Create Stripe Checkout Session for a subscription tier
 * @access Private
 */
router.post(
  "/create-checkout-session",
  auth.requirePermission(PROVIDER_PERMISSIONS.BILLING_MANAGE),
  [
    body("tier")
      .isIn(["PRO", "PREMIUM"])
      .withMessage("Tier must be PRO or PREMIUM"),
  ],
  validate([]),
  controller.createCheckoutSession
);

/**
 * @route POST /api/billing/create-portal-session
 * @desc Create Stripe Billing Portal Session
 * @access Private
 */
router.post(
  "/create-portal-session",
  auth.requirePermission(PROVIDER_PERMISSIONS.BILLING_MANAGE),
  validate([]),
  controller.createPortalSession
);

/**
 * @route GET /api/billing/subscription
 * @desc Get current subscription details
 * @access Private
 */
router.get(
  "/subscription",
  auth.requirePermission(PROVIDER_PERMISSIONS.BILLING_MANAGE),
  validate([]),
  controller.getSubscription
);

/**
 * @route POST /api/billing/cleanup-duplicates
 * @desc Cancel duplicate subscriptions (keep most recent)
 * @access Private
 */
router.post(
  "/cleanup-duplicates",
  auth.requirePermission(PROVIDER_PERMISSIONS.BILLING_MANAGE),
  validate([]),
  controller.cleanupDuplicates
);

/**
 * @route POST /api/billing/downgrade
 * @desc Schedule downgrade to Free plan at period end
 * @access Private
 */
router.post(
  "/downgrade",
  auth.requirePermission(PROVIDER_PERMISSIONS.BILLING_MANAGE),
  validate([]),
  controller.scheduleDowngrade
);

/**
 * @route POST /api/billing/downgrade/cancel
 * @desc Cancel scheduled downgrade
 * @access Private
 */
router.post(
  "/downgrade/cancel",
  auth.requirePermission(PROVIDER_PERMISSIONS.BILLING_MANAGE),
  validate([]),
  controller.cancelDowngrade
);

export default router;
