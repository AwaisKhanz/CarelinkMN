import { Router } from "express";
import { ServiceController } from "../controllers/service.controller";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { PROVIDER_PERMISSIONS } from "../lib/rbac";

const router: Router = Router();
const serviceController = new ServiceController();
const authMiddleware = new AuthMiddleware();

// Get all available services - Providers need services manage permission
router.get(
  "/services",
  authMiddleware.requireAnyPermission([
    PROVIDER_PERMISSIONS.SERVICES_MANAGE,
    PROVIDER_PERMISSIONS.HOMES_MANAGE, // Can also view when managing homes
    "providers:read", // Legacy permission for read access
  ]),
  validate([]),
  serviceController.getAvailableServices
);

export default router;

