import { Router } from "express";
import { param } from "express-validator";
import { VendorController } from "../controllers/vendor.controller";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { VENDOR_PERMISSIONS } from "../lib/rbac";

const router: Router = Router();
const vendorController = new VendorController();
const authMiddleware = new AuthMiddleware();

// Get vendor by user ID
router.get(
  "/vendors/by-user/:userId",
  [param("userId").isUUID().withMessage("Invalid user ID")],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(VENDOR_PERMISSIONS.DASHBOARD_VIEW),
  vendorController.getVendorByUserId
);

// Update vendor profile
router.put(
  "/vendors/by-user/:userId",
  [param("userId").isUUID().withMessage("Invalid user ID")],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(VENDOR_PERMISSIONS.PROFILE_MANAGE),
  vendorController.updateVendor
);

export default router;
