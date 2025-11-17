import { Router } from "express";
import { body, param, query } from "express-validator";
import { HomeController } from "../controllers/home.controller";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { PROVIDER_PERMISSIONS } from "../lib/rbac";

const router: Router = Router();
const homeController = new HomeController();
const authMiddleware = new AuthMiddleware();

// Create a new home for a provider
router.post(
  "/providers/:providerId/homes",
  [
    param("providerId").isUUID().withMessage("Invalid provider ID"),
    body("name")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Home name is required"),
    body("addressLine1")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Address line 1 is required"),
    body("city").trim().isLength({ min: 1 }).withMessage("City is required"),
    body("state")
      .trim()
      .isLength({ min: 2, max: 2 })
      .withMessage("State must be 2 characters"),
    body("zipCode")
      .trim()
      .isLength({ min: 5, max: 10 })
      .withMessage("Invalid zip code"),
    body("county")
      .trim()
      .isLength({ min: 1 })
      .withMessage("County is required"),
    body("capacity")
      .isInt({ min: 1 })
      .withMessage("Capacity must be a positive integer"),
    body("currentOccupancy")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Current occupancy must be non-negative"),
    body("wheelchairAccessible")
      .optional()
      .isBoolean()
      .withMessage("wheelchairAccessible must be a boolean"),
    body("singleLevel")
      .optional()
      .isBoolean()
      .withMessage("singleLevel must be a boolean"),
    body("hasElevator")
      .optional()
      .isBoolean()
      .withMessage("hasElevator must be a boolean"),
    body("hasRollInShower")
      .optional()
      .isBoolean()
      .withMessage("hasRollInShower must be a boolean"),
    body("virtualTourUrl")
      .optional()
      .isURL()
      .withMessage("Virtual tour URL must be a valid URL"),
    body("amenities")
      .optional()
      .isArray()
      .withMessage("Amenities must be an array"),
    body("photos").optional().isArray().withMessage("Photos must be an array"),
    body("acceptingNew")
      .optional()
      .isBoolean()
      .withMessage("acceptingNew must be a boolean"),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be a boolean"),
  ],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.HOMES_MANAGE),
  homeController.createHome.bind(homeController)
);

// Get all homes for a provider
router.get(
  "/providers/:providerId/homes",
  [
    param("providerId").isUUID().withMessage("Invalid provider ID"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("status")
      .optional()
      .isIn(["active", "inactive"])
      .withMessage("Status must be active or inactive"),
    query("search")
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage("Search term cannot be empty"),
  ],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.DASHBOARD_VIEW),
  homeController.getProviderHomes.bind(homeController)
);

// Get a specific home by ID
router.get(
  "/homes/:homeId",
  [param("homeId").isUUID().withMessage("Invalid home ID")],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.DASHBOARD_VIEW),
  homeController.getHomeById.bind(homeController)
);

// Update a home
router.put(
  "/homes/:homeId",
  [
    param("homeId").isUUID().withMessage("Invalid home ID"),
    body("name")
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage("Home name cannot be empty"),
    body("addressLine1")
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage("Address line 1 cannot be empty"),
    body("city")
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage("City cannot be empty"),
    body("state")
      .optional()
      .trim()
      .isLength({ min: 2, max: 2 })
      .withMessage("State must be 2 characters"),
    body("zipCode")
      .optional()
      .trim()
      .isLength({ min: 5, max: 10 })
      .withMessage("Invalid zip code"),
    body("county")
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage("County cannot be empty"),
    body("capacity")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Capacity must be a positive integer"),
    body("currentOccupancy")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Current occupancy must be non-negative"),
    body("wheelchairAccessible")
      .optional()
      .isBoolean()
      .withMessage("wheelchairAccessible must be a boolean"),
    body("singleLevel")
      .optional()
      .isBoolean()
      .withMessage("singleLevel must be a boolean"),
    body("hasElevator")
      .optional()
      .isBoolean()
      .withMessage("hasElevator must be a boolean"),
    body("hasRollInShower")
      .optional()
      .isBoolean()
      .withMessage("hasRollInShower must be a boolean"),
    body("virtualTourUrl")
      .optional()
      .isURL()
      .withMessage("Virtual tour URL must be a valid URL"),
    body("amenities")
      .optional()
      .isArray()
      .withMessage("Amenities must be an array"),
    body("photos").optional().isArray().withMessage("Photos must be an array"),
    body("acceptingNew")
      .optional()
      .isBoolean()
      .withMessage("acceptingNew must be a boolean"),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be a boolean"),
  ],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.HOMES_MANAGE),
  homeController.updateHome.bind(homeController)
);

// Delete a home
router.delete(
  "/homes/:homeId",
  [param("homeId").isUUID().withMessage("Invalid home ID")],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.HOMES_MANAGE),
  homeController.deleteHome.bind(homeController)
);

// Get home services
router.get(
  "/homes/:homeId/services",
  [param("homeId").isUUID().withMessage("Invalid home ID")],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.DASHBOARD_VIEW),
  homeController.getHomeServices.bind(homeController)
);

// Update home services
router.put(
  "/homes/:homeId/services",
  [
    param("homeId").isUUID().withMessage("Invalid home ID"),
    body("serviceIds").isArray().withMessage("Service IDs must be an array"),
    body("serviceIds.*").isUUID().withMessage("Invalid service ID"),
  ],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.HOMES_MANAGE),
  homeController.updateHomeServices.bind(homeController)
);

export default router;
