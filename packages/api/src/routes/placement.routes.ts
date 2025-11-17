import { Router } from "express";
import { body, param, query } from "express-validator";
import { PlacementController } from "../controllers/placement.controller";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { PROVIDER_PERMISSIONS } from "../lib/rbac";
import { PlacementStatus } from "@prisma/client";

const router: Router = Router();
const placementController = new PlacementController();
const authMiddleware = new AuthMiddleware();

// Create a new placement
router.post(
  "/placements",
  [
    body("openingId")
      .isUUID()
      .withMessage("Invalid opening ID"),
    body("referralId")
      .optional()
      .isUUID()
      .withMessage("Invalid referral ID"),
    body("dischargeCaseId")
      .optional()
      .isUUID()
      .withMessage("Invalid discharge case ID"),
    body("placementDate")
      .isISO8601()
      .withMessage("Placement date must be a valid date"),
    body("moveInDate")
      .optional()
      .isISO8601()
      .withMessage("Move-in date must be a valid date"),
    body()
      .custom((value) => {
        // At least one of referralId or dischargeCaseId must be provided
        if (!value.referralId && !value.dischargeCaseId) {
          throw new Error("Either referralId or dischargeCaseId must be provided");
        }
        return true;
      }),
  ],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.PLACEMENTS_MANAGE),
  placementController.createPlacement.bind(placementController)
);

// Get placements with filters
router.get(
  "/placements",
  [
    query("providerId")
      .optional()
      .isUUID()
      .withMessage("Invalid provider ID"),
    query("openingId")
      .optional()
      .isUUID()
      .withMessage("Invalid opening ID"),
    query("referralId")
      .optional()
      .isUUID()
      .withMessage("Invalid referral ID"),
    query("dischargeCaseId")
      .optional()
      .isUUID()
      .withMessage("Invalid discharge case ID"),
    query("status")
      .optional()
      .isIn(Object.values(PlacementStatus))
      .withMessage("Invalid status"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("search")
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Search must be between 1 and 100 characters"),
  ],
  validate([]),
  authMiddleware.requireAuth,
  placementController.getPlacements.bind(placementController)
);

// Get a specific placement by ID
router.get(
  "/placements/:placementId",
  [
    param("placementId").isUUID().withMessage("Invalid placement ID"),
  ],
  validate([]),
  authMiddleware.requireAuth,
  placementController.getPlacementById.bind(placementController)
);

// Update a placement
router.put(
  "/placements/:placementId",
  [
    param("placementId").isUUID().withMessage("Invalid placement ID"),
    body("status")
      .optional()
      .isIn(Object.values(PlacementStatus))
      .withMessage("Invalid status"),
    body("placementDate")
      .optional()
      .isISO8601()
      .withMessage("Placement date must be a valid date"),
    body("moveInDate")
      .optional()
      .isISO8601()
      .withMessage("Move-in date must be a valid date"),
  ],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.PLACEMENTS_MANAGE),
  placementController.updatePlacement.bind(placementController)
);

// Update placement status
router.patch(
  "/placements/:placementId/status",
  [
    param("placementId").isUUID().withMessage("Invalid placement ID"),
    body("status")
      .isIn(Object.values(PlacementStatus))
      .withMessage("Invalid status"),
  ],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.PLACEMENTS_MANAGE),
  placementController.updatePlacementStatus.bind(placementController)
);

// Cancel a placement
router.post(
  "/placements/:placementId/cancel",
  [
    param("placementId").isUUID().withMessage("Invalid placement ID"),
    body("reason")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Reason must be less than 500 characters"),
  ],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.PLACEMENTS_MANAGE),
  placementController.cancelPlacement.bind(placementController)
);

// Generate placement packet
router.post(
  "/placements/:placementId/packet",
  [
    param("placementId").isUUID().withMessage("Invalid placement ID"),
  ],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.PLACEMENTS_MANAGE),
  placementController.generatePacket.bind(placementController)
);

export default router;

