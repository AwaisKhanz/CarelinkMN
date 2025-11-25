import { Router } from "express";
import { body, param, query } from "express-validator";
import { OpeningController } from "../controllers/opening.controller";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { PROVIDER_PERMISSIONS, CASE_MANAGER_PERMISSIONS } from "../lib/rbac";
import { OpeningStatus, Gender, Payer } from "@prisma/client";

const router: Router = Router();
const openingController = new OpeningController();
const authMiddleware = new AuthMiddleware();

// Create a new opening for a home
router.post(
  "/homes/:homeId/openings",
  [
    param("homeId").isUUID().withMessage("Invalid home ID"),
    body("spotsAvailable")
      .isInt({ min: 1 })
      .withMessage("Spots available must be a positive integer"),
    body("availableFrom")
      .isISO8601()
      .withMessage("Available from must be a valid date"),
    body("availableUntil")
      .optional()
      .isISO8601()
      .withMessage("Available until must be a valid date"),
    body("ageMin")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Minimum age must be non-negative"),
    body("ageMax")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Maximum age must be non-negative"),
    body("genderPreference")
      .optional()
      .isIn(Object.values(Gender))
      .withMessage("Invalid gender preference"),
    body("careLevels")
      .optional()
      .isArray()
      .withMessage("Care levels must be an array"),
    body("supportedNeeds")
      .optional()
      .isArray()
      .withMessage("Supported needs must be an array"),
    body("acceptedPayers")
      .isArray({ min: 1 })
      .withMessage("At least one accepted payer is required"),
    body("acceptedPayers.*")
      .isIn(Object.values(Payer))
      .withMessage("Invalid payer type"),
    body("privatePayRate")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Private pay rate must be a non-negative number"),
  ],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.OPENINGS_MANAGE),
  openingController.createOpening.bind(openingController)
);

// Get openings with filters
router.get(
  "/openings",
  [
    query("homeId")
      .optional()
      .isUUID()
      .withMessage("Invalid home ID"),
    query("providerId")
      .optional()
      .isUUID()
      .withMessage("Invalid provider ID"),
    query("status")
      .optional()
      .isIn(Object.values(OpeningStatus))
      .withMessage("Invalid status"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("includeExpired")
      .optional()
      .isBoolean()
      .withMessage("includeExpired must be a boolean"),
    query("search")
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Search must be between 1 and 100 characters"),
  ],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requireAnyPermission([
    PROVIDER_PERMISSIONS.DASHBOARD_VIEW,
    CASE_MANAGER_PERMISSIONS.REFERRALS_VIEW
  ]),
  openingController.getOpenings.bind(openingController)
);

// Get openings grouped by status (for Kanban board)
router.get(
  "/providers/:providerId/openings/by-status",
  [
    param("providerId").isUUID().withMessage("Invalid provider ID"),
  ],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.OPENINGS_MANAGE),
  openingController.getOpeningsByStatus.bind(openingController)
);

// Get a specific opening by ID
router.get(
  "/openings/:openingId",
  [
    param("openingId").isUUID().withMessage("Invalid opening ID"),
  ],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requireAnyPermission([
    PROVIDER_PERMISSIONS.DASHBOARD_VIEW,
    CASE_MANAGER_PERMISSIONS.REFERRALS_VIEW
  ]),
  openingController.getOpeningById.bind(openingController)
);

// Update an opening
router.put(
  "/openings/:openingId",
  [
    param("openingId").isUUID().withMessage("Invalid opening ID"),
    body("spotsAvailable")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Spots available must be a positive integer"),
    body("availableFrom")
      .optional()
      .isISO8601()
      .withMessage("Available from must be a valid date"),
    body("availableUntil")
      .optional()
      .isISO8601()
      .withMessage("Available until must be a valid date"),
    body("ageMin")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Minimum age must be non-negative"),
    body("ageMax")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Maximum age must be non-negative"),
    body("genderPreference")
      .optional()
      .isIn(Object.values(Gender))
      .withMessage("Invalid gender preference"),
    body("careLevels")
      .optional()
      .isArray()
      .withMessage("Care levels must be an array"),
    body("supportedNeeds")
      .optional()
      .isArray()
      .withMessage("Supported needs must be an array"),
    body("acceptedPayers")
      .optional()
      .isArray({ min: 1 })
      .withMessage("At least one accepted payer is required"),
    body("acceptedPayers.*")
      .optional()
      .isIn(Object.values(Payer))
      .withMessage("Invalid payer type"),
    body("privatePayRate")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Private pay rate must be a non-negative number"),
    body("status")
      .optional()
      .isIn(Object.values(OpeningStatus))
      .withMessage("Invalid status"),
  ],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.OPENINGS_MANAGE),
  openingController.updateOpening.bind(openingController)
);

// Update opening status (for Kanban board)
router.patch(
  "/openings/:openingId/status",
  [
    param("openingId").isUUID().withMessage("Invalid opening ID"),
    body("status")
      .isIn(Object.values(OpeningStatus))
      .withMessage("Invalid status"),
  ],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.OPENINGS_MANAGE),
  openingController.updateOpeningStatus.bind(openingController)
);

// Refresh opening (update freshness timestamp)
router.post(
  "/openings/:openingId/refresh",
  [
    param("openingId").isUUID().withMessage("Invalid opening ID"),
  ],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.OPENINGS_MANAGE),
  openingController.refreshOpening.bind(openingController)
);

// Delete an opening
router.delete(
  "/openings/:openingId",
  [
    param("openingId").isUUID().withMessage("Invalid opening ID"),
  ],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.OPENINGS_MANAGE),
  openingController.deleteOpening.bind(openingController)
);

export default router;

