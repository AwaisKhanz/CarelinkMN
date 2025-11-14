import { Router } from "express";
import { ServiceController } from "../controllers/service.controller";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";

const router: Router = Router();
const serviceController = new ServiceController();
const authMiddleware = new AuthMiddleware();

// Get all available services (requires authentication)
router.get(
  "/services",
  authMiddleware.requireAuth,
  validate([]),
  serviceController.getAvailableServices
);

export default router;

