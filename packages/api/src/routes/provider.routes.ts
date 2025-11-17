import { Router } from "express";
import { body, param, query } from "express-validator";
import { ProviderController } from "../controllers/provider.controller";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";

const router: Router = Router();
const providerController = new ProviderController();
const authMiddleware = new AuthMiddleware();

// Public routes (no authentication required)
router.get(
  "/providers/:id/public-profile",
  param("id").isUUID().withMessage("Invalid provider ID"),
  validate([]),
  providerController.getProviderProfile
);

// Protected routes (authentication required)
router.use(authMiddleware.requireAuth);

// Provider CRUD operations
router.post(
  "/providers",
  [
    body("organizationId")
      .isUUID()
      .withMessage("Valid organization ID is required"),
    body("primaryLicenseType")
      .notEmpty()
      .withMessage("Primary license type is required"),
    body("description")
      .optional()
      .isString()
      .isLength({ max: 2000 })
      .withMessage("Description must be less than 2000 characters"),
    body("logo").optional().isURL().withMessage("Logo must be a valid URL"),
    body("coverImage")
      .optional()
      .isURL()
      .withMessage("Cover image must be a valid URL"),
    body("acceptsReferrals")
      .optional()
      .isBoolean()
      .withMessage("Accepts referrals must be a boolean"),
    body("responseTimeHours")
      .optional()
      .isInt({ min: 1, max: 168 })
      .withMessage("Response time must be between 1 and 168 hours"),
  ],
  validate([]),
  providerController.createProvider
);

router.get(
  "/providers/:id",
  param("id").isUUID().withMessage("Invalid provider ID"),
  query("includeHomes")
    .optional()
    .isBoolean()
    .withMessage("includeHomes must be a boolean"),
  query("includeServices")
    .optional()
    .isBoolean()
    .withMessage("includeServices must be a boolean"),
  query("includeOpenings")
    .optional()
    .isBoolean()
    .withMessage("includeOpenings must be a boolean"),
  validate([]),
  providerController.getProvider
);

router.put(
  "/providers/:id",
  param("id").isUUID().withMessage("Invalid provider ID"),
  [
    body("description")
      .optional()
      .isString()
      .isLength({ max: 2000 })
      .withMessage("Description must be less than 2000 characters"),
    body("logo").optional().isURL().withMessage("Logo must be a valid URL"),
    body("coverImage")
      .optional()
      .isURL()
      .withMessage("Cover image must be a valid URL"),
    body("acceptsReferrals")
      .optional()
      .isBoolean()
      .withMessage("Accepts referrals must be a boolean"),
    body("responseTimeHours")
      .optional()
      .isInt({ min: 1, max: 168 })
      .withMessage("Response time must be between 1 and 168 hours"),
    body("verified")
      .optional()
      .isBoolean()
      .withMessage("Verified must be a boolean"),
    body("verificationNotes")
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage("Verification notes must be less than 1000 characters"),
  ],
  validate([]),
  providerController.updateProvider
);

// Provider profile management
router.put(
  "/providers/:id/profile",
  param("id").isUUID().withMessage("Invalid provider ID"),
  [
    body("description")
      .optional()
      .isString()
      .isLength({ max: 2000 })
      .withMessage("Description must be less than 2000 characters"),
    body("logo").optional().isURL().withMessage("Logo must be a valid URL"),
    body("coverImage")
      .optional()
      .isURL()
      .withMessage("Cover image must be a valid URL"),
    body("acceptsReferrals")
      .optional()
      .isBoolean()
      .withMessage("Accepts referrals must be a boolean"),
    body("responseTimeHours")
      .optional()
      .isInt({ min: 1, max: 168 })
      .withMessage("Response time must be between 1 and 168 hours"),
  ],
  validate([]),
  providerController.updateProviderProfile
);

// License management
router.post(
  "/providers/:providerId/licenses",
  param("providerId").isUUID().withMessage("Invalid provider ID"),
  [
    body("licenseType").notEmpty().withMessage("License type is required"),
    body("licenseNumber").notEmpty().withMessage("License number is required"),
    body("issueDate").isISO8601().withMessage("Valid issue date is required"),
    body("expirationDate")
      .isISO8601()
      .withMessage("Valid expiration date is required"),
    body("documentUrl")
      .notEmpty()
      .withMessage("License document is required")
      .isURL()
      .withMessage("Document URL must be a valid URL"),
  ],
  validate([]),
  providerController.uploadLicense
);

router.put(
  "/licenses/:licenseId/verify",
  param("licenseId").isUUID().withMessage("Invalid license ID"),
  [
    body("status")
      .isIn(["PENDING", "ACTIVE", "EXPIRED", "SUSPENDED", "REJECTED"])
      .withMessage("Invalid license status"),
    body("verificationNotes")
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage("Verification notes must be less than 1000 characters"),
  ],
  validate([]),
  providerController.verifyLicense
);

router.get(
  "/providers/:providerId/licenses",
  param("providerId").isUUID().withMessage("Invalid provider ID"),
  query("status")
    .optional()
    .isIn(["PENDING", "ACTIVE", "EXPIRED", "SUSPENDED", "REVOKED"])
    .withMessage("Invalid license status"),
  validate([]),
  providerController.getProviderLicenses
);

// Update license
router.put(
  "/providers/:providerId/licenses/:licenseId",
  param("providerId").isUUID().withMessage("Invalid provider ID"),
  param("licenseId").isUUID().withMessage("Invalid license ID"),
  [
    body("licenseType")
      .optional()
      .notEmpty()
      .withMessage("License type cannot be empty"),
    body("licenseNumber")
      .optional()
      .notEmpty()
      .withMessage("License number cannot be empty"),
    body("issueDate")
      .optional()
      .isISO8601()
      .withMessage("Valid issue date is required"),
    body("expirationDate")
      .optional()
      .isISO8601()
      .withMessage("Valid expiration date is required"),
    body("documentUrl")
      .optional()
      .isURL()
      .withMessage("Document URL must be a valid URL"),
  ],
  validate([]),
  providerController.updateLicense
);

// Delete license
router.delete(
  "/providers/:providerId/licenses/:licenseId",
  param("providerId").isUUID().withMessage("Invalid provider ID"),
  param("licenseId").isUUID().withMessage("Invalid license ID"),
  validate([]),
  providerController.deleteLicense
);

router.get(
  "/providers/by-user/:userId",
  param("userId").isUUID().withMessage("Invalid user ID"),
  validate([]),
  providerController.getProviderByUserId
);

router.get(
  "/providers/organization/:organizationId",
  param("organizationId").isUUID().withMessage("Invalid organization ID"),
  validate([]),
  providerController.getProviderByOrganizationId
);

// Provider services management
router.get(
  "/providers/:providerId/services",
  param("providerId").isUUID().withMessage("Invalid provider ID"),
  validate([]),
  providerController.getProviderServices
);

router.put(
  "/providers/:providerId/services",
  param("providerId").isUUID().withMessage("Invalid provider ID"),
  [
    body("serviceIds").isArray().withMessage("serviceIds must be an array"),
    body("serviceIds.*")
      .isUUID()
      .withMessage("Each service ID must be a valid UUID"),
  ],
  validate([]),
  providerController.updateProviderServices
);

// Get provider referrals
router.get(
  "/providers/:providerId/referrals",
  param("providerId").isUUID().withMessage("Invalid provider ID"),
  [
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
      .isString()
      .withMessage("Status must be a string"),
  ],
  validate([]),
  providerController.getProviderReferrals
);

// Staff management (PROVIDER_OWNER only)
router.get(
  "/providers/:providerId/staff",
  param("providerId").isUUID().withMessage("Invalid provider ID"),
  validate([]),
  providerController.getOrganizationStaff
);

router.post(
  "/providers/:providerId/staff",
  param("providerId").isUUID().withMessage("Invalid provider ID"),
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
    body("firstName")
      .trim()
      .isLength({ min: 1 })
      .withMessage("First name is required"),
    body("lastName")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Last name is required"),
    body("phone")
      .optional()
      .matches(/^[\d\s\-\+\(\)]+$/)
      .withMessage("Invalid phone number format"),
  ],
  validate([]),
  providerController.inviteStaff
);

router.delete(
  "/providers/:providerId/staff/:staffUserId",
  param("providerId").isUUID().withMessage("Invalid provider ID"),
  param("staffUserId").isUUID().withMessage("Invalid staff user ID"),
  validate([]),
  providerController.removeStaff
);

router.post(
  "/providers/:providerId/staff/:staffUserId/resend-invite",
  param("providerId").isUUID().withMessage("Invalid provider ID"),
  param("staffUserId").isUUID().withMessage("Invalid staff user ID"),
  validate([]),
  providerController.resendStaffInvite
);

// Get provider statistics
router.get(
  "/providers/:providerId/stats",
  param("providerId").isUUID().withMessage("Invalid provider ID"),
  validate([]),
  providerController.getProviderStats
);

export default router;
