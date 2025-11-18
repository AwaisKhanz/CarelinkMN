import { Router } from "express";
import { body, param, query } from "express-validator";
import { AmenityController } from "../controllers/amenity.controller";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { PROVIDER_PERMISSIONS } from "../lib/rbac";

const router: Router = Router();
const amenityController = new AmenityController();
const authMiddleware = new AuthMiddleware();

// Get all available amenities (public - no auth required for viewing)
router.get(
  "/amenities",
  [
    query("category")
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage("Category cannot be empty"),
  ],
  validate([]),
  amenityController.getAmenities
);

// Get amenity categories (public - no auth required)
router.get(
  "/amenities/categories",
  validate([]),
  amenityController.getAmenityCategories
);

// Create a custom amenity for a provider
router.post(
  "/providers/:providerId/amenities",
  [
    param("providerId").isUUID().withMessage("Invalid provider ID"),
    body("name")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Amenity name is required"),
    body("category")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Category is required"),
    body("description")
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage("Description cannot be empty"),
    body("icon")
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage("Icon cannot be empty"),
  ],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.HOMES_MANAGE),
  amenityController.createCustomAmenity
);

// Get custom amenities for a provider
router.get(
  "/providers/:providerId/amenities",
  [param("providerId").isUUID().withMessage("Invalid provider ID")],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.DASHBOARD_VIEW),
  amenityController.getProviderCustomAmenities
);

export default router;
