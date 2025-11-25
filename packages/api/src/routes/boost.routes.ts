import { Router } from "express";
import { BoostController } from "../controllers/boost.controller";
import { AuthMiddleware } from "../middleware/auth.middleware";

const router: Router = Router();
const boostController = new BoostController();
const authMiddleware = new AuthMiddleware();

// Public routes
router.get("/pricing", boostController.getPricing);

// Protected routes (require authentication)
router.post(
  "/checkout",
  authMiddleware.requireAuth,
  boostController.createCheckout
);

router.get(
  "/status/:providerId",
  authMiddleware.requireAuth,
  boostController.getStatus
);

router.post(
  "/cancel",
  authMiddleware.requireAuth,
  boostController.cancelBoost
);

// Internal/Cron route (should be protected by API key in production)
router.post("/check-expired", boostController.checkExpired);

export default router;
