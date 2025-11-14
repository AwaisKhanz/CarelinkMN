import { Router } from "express";
import { body, param, query } from "express-validator";
import { OrganizationController } from "../controllers/organization.controller";
import { validate } from "../middleware/validation.middleware";
import { AuthMiddleware } from "../middleware/auth.middleware";

const router: Router = Router();
const organizationController = new OrganizationController();
const authMiddleware = new AuthMiddleware();

// Search organizations (must come before /organizations/:id to avoid route conflict)
router.get(
  "/organizations/search",
  [
    query("query")
      .isString()
      .notEmpty()
      .withMessage("Search query is required"),
    query("type").optional().isString().withMessage("Type must be a string"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
  ],
  validate([]),
  organizationController.searchOrganizations.bind(organizationController)
);

// Get all organizations
router.get(
  "/organizations",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("type").optional().isString().withMessage("Type must be a string"),
    query("status")
      .optional()
      .isString()
      .withMessage("Status must be a string"),
  ],
  validate([]),
  organizationController.getOrganizations.bind(organizationController)
);

// Create organization
router.post(
  "/organizations",
  authMiddleware.requireAuth,
  [
    body("name").trim().isLength({ min: 1 }).withMessage("Organization name is required"),
    body("type").isIn(["PROVIDER", "CASE_MANAGEMENT", "HOSPITAL", "VRS", "VENDOR"]).withMessage("Valid organization type is required"),
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("phone").matches(/^[\d\s\-\+\(\)]+$/).withMessage("Valid phone number is required"),
    body("addressLine1").trim().isLength({ min: 1 }).withMessage("Address line 1 is required"),
    body("addressLine2").optional().trim(),
    body("city").trim().isLength({ min: 1 }).withMessage("City is required"),
    body("state").trim().isLength({ min: 2, max: 2 }).withMessage("Valid 2-letter state code is required"),
    body("zipCode").isPostalCode("US").withMessage("Valid US zip code is required"),
    body("county").trim().isLength({ min: 1 }).withMessage("County is required"),
    body("ein").optional().trim(),
    body("npi").optional().trim(),
    body("website").optional().isURL().withMessage("Valid URL is required if website is provided"),
    body("fax").optional().trim(),
  ],
  validate([]),
  organizationController.createOrganization.bind(organizationController)
);

// Get organization by ID
router.get(
  "/organizations/:id",
  [param("id").isUUID().withMessage("Invalid organization ID")],
  validate([]),
  organizationController.getOrganizationById.bind(organizationController)
);

export default router;
