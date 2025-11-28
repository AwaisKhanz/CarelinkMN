import { Router } from "express";
import { body, param } from "express-validator";
import { PlacementFamilyController } from "../controllers/placement-family.controller";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { PROVIDER_PERMISSIONS, HOSPITAL_SW_PERMISSIONS } from "../lib/rbac";
import { UpdateCategory } from "@prisma/client";

const router: Router = Router();
const familyController = new PlacementFamilyController();
const authMiddleware = new AuthMiddleware();

// Add a family contact
router.post(
  "/placements/:placementId/family-contacts",
  [
    param("placementId").isUUID().withMessage("Invalid placement ID"),
    body("name")
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Name is required and must be less than 100 characters"),
    body("relationship")
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Relationship is required and must be less than 50 characters"),
    body("email")
      .isEmail()
      .withMessage("Valid email is required"),
    body("phone")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 20 })
      .withMessage("Phone must be less than 20 characters"),
    body("isPrimary")
      .optional()
      .isBoolean()
      .withMessage("isPrimary must be a boolean"),
    body("canReceiveUpdates")
      .optional()
      .isBoolean()
      .withMessage("canReceiveUpdates must be a boolean"),
  ],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.PLACEMENTS_MANAGE),
  familyController.addFamilyContact.bind(familyController)
);

// Get family contacts
router.get(
  "/placements/:placementId/family-contacts",
  [param("placementId").isUUID().withMessage("Invalid placement ID")],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requireAnyPermission([
    PROVIDER_PERMISSIONS.RESIDENTS_VIEW,
    HOSPITAL_SW_PERMISSIONS.DISCHARGE_CASES_VIEW,
    "system:view", // Allow Admin/Super Admin access
  ]),
  familyController.getFamilyContacts.bind(familyController)
);

// Update a family contact
router.patch(
  "/family-contacts/:contactId",
  [
    param("contactId").isUUID().withMessage("Invalid contact ID"),
    body("name")
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Name must be less than 100 characters"),
    body("relationship")
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Relationship must be less than 50 characters"),
    body("email")
      .optional()
      .isEmail()
      .withMessage("Must be a valid email"),
    body("phone")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 20 })
      .withMessage("Phone must be less than 20 characters"),
    body("isPrimary")
      .optional()
      .isBoolean()
      .withMessage("isPrimary must be a boolean"),
    body("canReceiveUpdates")
      .optional()
      .isBoolean()
      .withMessage("canReceiveUpdates must be a boolean"),
  ],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.PLACEMENTS_MANAGE),
  familyController.updateFamilyContact.bind(familyController)
);

// Delete a family contact
router.delete(
  "/family-contacts/:contactId",
  [param("contactId").isUUID().withMessage("Invalid contact ID")],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.PLACEMENTS_MANAGE),
  familyController.deleteFamilyContact.bind(familyController)
);

// Create an update
router.post(
  "/placements/:placementId/updates",
  [
    param("placementId").isUUID().withMessage("Invalid placement ID"),
    body("title")
      .isString()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage("Title is required and must be less than 200 characters"),
    body("message")
      .isString()
      .trim()
      .isLength({ min: 1, max: 2000 })
      .withMessage("Message is required and must be less than 2000 characters"),
    body("category")
      .isIn(Object.values(UpdateCategory))
      .withMessage("Invalid update category"),
    body("photos")
      .optional()
      .isArray()
      .withMessage("Photos must be an array"),
    body("photos.*")
      .optional()
      .isString()
      .isURL()
      .withMessage("Each photo must be a valid URL"),
  ],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.PLACEMENTS_MANAGE),
  familyController.createUpdate.bind(familyController)
);

// Get updates
router.get(
  "/placements/:placementId/updates",
  [param("placementId").isUUID().withMessage("Invalid placement ID")],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requireAnyPermission([
    PROVIDER_PERMISSIONS.RESIDENTS_VIEW,
    HOSPITAL_SW_PERMISSIONS.DISCHARGE_CASES_VIEW,
    "system:view", // Allow Admin/Super Admin access
  ]),
  familyController.getUpdates.bind(familyController)
);

// Delete an update
router.delete(
  "/updates/:updateId",
  [param("updateId").isUUID().withMessage("Invalid update ID")],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.PLACEMENTS_MANAGE),
  familyController.deleteUpdate.bind(familyController)
);

export default router;
