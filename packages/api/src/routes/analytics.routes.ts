import { Router } from "express";
import { param, query } from "express-validator";
import { AnalyticsController } from "../controllers/analytics.controller";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";

const router: Router = Router();
const analyticsController = new AnalyticsController();
const authMiddleware = new AuthMiddleware();

// All routes require authentication
router.use(authMiddleware.requireAuth);

// Get provider analytics
router.get(
  "/providers/:providerId/analytics",
  [
    param("providerId").isUUID().withMessage("Invalid provider ID"),
    query("startDate")
      .optional()
      .isISO8601()
      .withMessage("Start date must be a valid ISO 8601 date"),
    query("endDate")
      .optional()
      .isISO8601()
      .withMessage("End date must be a valid ISO 8601 date"),
  ],
  validate([]),
  analyticsController.getProviderAnalytics.bind(analyticsController)
);

export default router;

