import { Router } from "express";
import { body, param, query } from "express-validator";
import { PlacementFollowUpController } from "../controllers/placement-followup.controller";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { PROVIDER_PERMISSIONS } from "../lib/rbac";
import { FollowUpType, FollowUpOutcome } from "@prisma/client";

const router: Router = Router();
const followUpController = new PlacementFollowUpController();
const authMiddleware = new AuthMiddleware();

// Create a follow-up for a placement
router.post(
  "/placements/:placementId/follow-ups",
  [
    param("placementId").isUUID().withMessage("Invalid placement ID"),
    body("type")
      .isIn(Object.values(FollowUpType))
      .withMessage("Invalid follow-up type"),
    body("scheduledAt")
      .isISO8601()
      .withMessage("Scheduled date must be a valid date"),
    body("notes")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Notes must be less than 1000 characters"),
  ],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.PLACEMENTS_MANAGE),
  followUpController.createFollowUp.bind(followUpController)
);

// Get follow-ups for a placement
router.get(
  "/placements/:placementId/follow-ups",
  [param("placementId").isUUID().withMessage("Invalid placement ID")],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requireAnyPermission([
    PROVIDER_PERMISSIONS.RESIDENTS_VIEW,
    "system:view", // Allow Admin/Super Admin access
  ]),
  followUpController.getFollowUps.bind(followUpController)
);

// Complete a follow-up
router.patch(
  "/follow-ups/:followUpId/complete",
  [
    param("followUpId").isUUID().withMessage("Invalid follow-up ID"),
    body("notes")
      .isString()
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage("Notes are required and must be less than 1000 characters"),
    body("outcome")
      .isIn(Object.values(FollowUpOutcome))
      .withMessage("Invalid outcome"),
  ],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.PLACEMENTS_MANAGE),
  followUpController.completeFollowUp.bind(followUpController)
);

// Get upcoming follow-ups
router.get(
  "/follow-ups/upcoming",
  [query("providerId").isUUID().withMessage("Invalid provider ID")],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requireAnyPermission([
    PROVIDER_PERMISSIONS.RESIDENTS_VIEW,
    "system:view", // Allow Admin/Super Admin access
  ]),
  followUpController.getUpcomingFollowUps.bind(followUpController)
);

// Delete a follow-up
router.delete(
  "/follow-ups/:followUpId",
  [param("followUpId").isUUID().withMessage("Invalid follow-up ID")],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.PLACEMENTS_MANAGE),
  followUpController.deleteFollowUp.bind(followUpController)
);

export default router;
