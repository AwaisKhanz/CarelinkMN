import { Router } from "express";
import { body, param, query } from "express-validator";
import { ProviderController } from "../controllers/provider.controller";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  PROVIDER_PERMISSIONS,
  CASE_MANAGER_PERMISSIONS,
  HOSPITAL_SW_PERMISSIONS,
} from "../lib/rbac";

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

// Public provider list (for search page)
router.get(
  "/providers",
  [
    query("search")
      .optional()
      .isString()
      .isLength({ max: 200 })
      .withMessage("Search must be a string up to 200 characters")
      .trim(),
    query("status")
      .optional()
      .isString()
      .withMessage("Status must be a string"),
    query("county")
      .optional()
      .isString()
      .withMessage("County must be a string"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer")
      .toInt(),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100")
      .toInt(),
  ],
  validate([]),
  providerController.searchProviders
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
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.DASHBOARD_VIEW),
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
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.PROFILE_MANAGE),
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
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.PROFILE_MANAGE),
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
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.LICENSES_MANAGE),
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
  authMiddleware.requireAnyPermission([
    "system:licenses:verify",
    "licenses:verify",
    "providers:verify",
  ]),
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
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.LICENSES_MANAGE),
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
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.LICENSES_MANAGE),
  providerController.updateLicense
);

// Delete license
router.delete(
  "/providers/:providerId/licenses/:licenseId",
  param("providerId").isUUID().withMessage("Invalid provider ID"),
  param("licenseId").isUUID().withMessage("Invalid license ID"),
  validate([]),
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.LICENSES_MANAGE),
  providerController.deleteLicense
);

router.get(
  "/providers/by-user/:userId",
  param("userId").isUUID().withMessage("Invalid user ID"),
  validate([]),
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.DASHBOARD_VIEW),
  providerController.getProviderByUserId
);

router.get(
  "/providers/organization/:organizationId",
  param("organizationId").isUUID().withMessage("Invalid organization ID"),
  validate([]),
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.DASHBOARD_VIEW),
  providerController.getProviderByOrganizationId
);

// Provider services management
router.get(
  "/providers/:providerId/services",
  param("providerId").isUUID().withMessage("Invalid provider ID"),
  validate([]),
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.SERVICES_MANAGE),
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
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.SERVICES_MANAGE),
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
  authMiddleware.requireAnyPermission([
    PROVIDER_PERMISSIONS.REFERRALS_VIEW,
    CASE_MANAGER_PERMISSIONS.REFERRALS_VIEW
  ]),
  providerController.getProviderReferrals
);

// Get single provider referral detail
router.get(
  "/providers/:providerId/referrals/:referralId",
  [
    param("providerId").isUUID().withMessage("Invalid provider ID"),
    param("referralId").isUUID().withMessage("Invalid referral ID"),
  ],
  validate([]),
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.REFERRALS_VIEW),
  providerController.getProviderReferralById
);

// Staff management (PROVIDER_OWNER only)
router.get(
  "/providers/:providerId/staff",
  param("providerId").isUUID().withMessage("Invalid provider ID"),
  validate([]),
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.STAFF_MANAGE),
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
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.STAFF_MANAGE),
  providerController.inviteStaff
);

router.delete(
  "/providers/:providerId/staff/:staffUserId",
  param("providerId").isUUID().withMessage("Invalid provider ID"),
  param("staffUserId").isUUID().withMessage("Invalid staff user ID"),
  validate([]),
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.STAFF_MANAGE),
  providerController.removeStaff
);

router.post(
  "/providers/:providerId/staff/:staffUserId/resend-invite",
  param("providerId").isUUID().withMessage("Invalid provider ID"),
  param("staffUserId").isUUID().withMessage("Invalid staff user ID"),
  validate([]),
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.STAFF_MANAGE),
  providerController.resendStaffInvite
);

// Get provider statistics
router.get(
  "/providers/:providerId/stats",
  param("providerId").isUUID().withMessage("Invalid provider ID"),
  validate([]),
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.ANALYTICS_VIEW),
  providerController.getProviderStats
);

// Respond to referral - Update provider's own shortlist status
router.post(
  "/providers/:providerId/referrals/:referralId/respond",
  [
    param("providerId").isUUID().withMessage("Invalid provider ID"),
    param("referralId").isUUID().withMessage("Invalid referral ID"),
    body("status")
      .isIn(["ADDED", "CONTACTED", "RESPONDED", "TOURING", "DECLINED"])
      .withMessage("Invalid shortlist status"),
    body("notes")
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage("Notes must be less than 1000 characters"),
  ],
  validate([]),
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.REFERRALS_RESPOND),
  providerController.respondToReferral
);

// Get provider discharge invitations
router.get(
  "/providers/:providerId/discharge-invitations",
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
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.REFERRALS_VIEW),
  providerController.getProviderDischargeInvitations
);

export default router;
