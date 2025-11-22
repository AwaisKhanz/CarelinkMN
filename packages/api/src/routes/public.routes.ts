import { Router } from "express";
import { body, param, query } from "express-validator";
import { PublicController } from "../controllers/public.controller";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { UserRole } from "@carelink/types";

const router: Router = Router();
const publicController = new PublicController();
const authMiddleware = new AuthMiddleware();

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// Search providers (public, no auth)
router.get(
  "/public/providers",
  [
    query("search").optional().isString().withMessage("Search must be a string"),
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
    query("sortBy").optional().isIn(["relevance", "distance", "rating", "newest"]).withMessage("Invalid sort option"),
    query("viewMode").optional().isIn(["grid", "list", "map"]).withMessage("Invalid view mode"),
    query("locationType").optional().isIn(["county", "city", "zip"]).withMessage("Invalid location type"),
    query("locationValue").optional().isString().withMessage("Location value must be a string"),
    query("radius").optional().isInt({ min: 1 }).withMessage("Radius must be a positive integer"),
    query("licenseTypes").optional().isString().withMessage("License types must be a comma-separated string"),
    query("serviceTypes").optional().isString().withMessage("Service types must be a comma-separated string"),
    query("payers").optional().isString().withMessage("Payers must be a comma-separated string"),
    query("wheelchairAccessible").optional().isIn(["true", "false"]).withMessage("Wheelchair accessible must be true or false"),
    query("singleLevel").optional().isIn(["true", "false"]).withMessage("Single level must be true or false"),
    query("hasElevator").optional().isIn(["true", "false"]).withMessage("Has elevator must be true or false"),
    query("hasRollInShower").optional().isIn(["true", "false"]).withMessage("Has roll-in shower must be true or false"),
    query("availability").optional().isIn(["open-only", "all"]).withMessage("Invalid availability option"),
    query("verified").optional().isIn(["true", "false"]).withMessage("Verified must be true or false"),
  ],
  validate([]),
  publicController.searchProviders
);

// Get provider profile (public, no auth)
router.get(
  "/public/providers/:providerId",
  [
    param("providerId").isUUID().withMessage("Invalid provider ID"),
    query("lat").optional().isFloat().withMessage("Latitude must be a number"),
    query("lon").optional().isFloat().withMessage("Longitude must be a number"),
  ],
  validate([]),
  publicController.getProviderProfile
);

// ============================================
// AI SEARCH ROUTE (Optional auth for rate limiting)
// ============================================

// Parse natural language query (optional auth)
router.post(
  "/public/carebot/parse",
  [
    body("query")
      .isString()
      .isLength({ min: 10, max: 500 })
      .withMessage("Query must be a string between 10 and 500 characters"),
  ],
  validate([]),
  authMiddleware.optionalAuth, // Optional auth for rate limiting
  publicController.parseQuery
);

// ============================================
// FAVORITES ROUTES (Authentication required for PUBLIC role)
// ============================================

// Get user's favorites
router.get(
  "/public/favorites",
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requireRole([UserRole.PUBLIC]),
  publicController.getFavorites
);

// Add provider to favorites
router.post(
  "/public/favorites",
  [
    body("providerId").isUUID().withMessage("Provider ID must be a valid UUID"),
  ],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requireRole([UserRole.PUBLIC]),
  publicController.addFavorite
);

// Remove provider from favorites
router.delete(
  "/public/favorites/:favoriteId",
  [
    param("favoriteId").isUUID().withMessage("Favorite ID must be a valid UUID"),
  ],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requireRole([UserRole.PUBLIC]),
  publicController.removeFavorite
);

export default router;

