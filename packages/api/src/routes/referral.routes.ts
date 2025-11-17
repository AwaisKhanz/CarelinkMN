import { Router } from "express";
import { body, param, query } from "express-validator";
import { ReferralController } from "../controllers/referral.controller";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { ReferralStatus, Urgency, Payer, ShortlistStatus } from "@carelink/types";
import { PROVIDER_PERMISSIONS, CASE_MANAGER_PERMISSIONS, HOSPITAL_SW_PERMISSIONS } from "../lib/rbac";

const router: Router = Router();
const referralController = new ReferralController();
const authMiddleware = new AuthMiddleware();

// All routes require authentication
router.use(authMiddleware.requireAuth);

// Referral CRUD operations
// Create referral - Case Managers, Hospital SW, VRS can create
router.post(
  "/referrals",
  authMiddleware.requireAnyPermission([
    CASE_MANAGER_PERMISSIONS.REFERRALS_CREATE,
    HOSPITAL_SW_PERMISSIONS.DISCHARGE_CASES_CREATE,
    "referrals:create", // Legacy permission
  ]),
  [
    body("clientAge")
      .isInt({ min: 18, max: 120 })
      .withMessage("Client age must be between 18 and 120"),
    body("clientGender")
      .isIn(["MALE", "FEMALE", "OTHER", "NO_PREFERENCE"])
      .withMessage("Invalid client gender"),
    body("clientInitials")
      .isLength({ min: 2, max: 2 })
      .matches(/^[A-Z]{2}$/)
      .withMessage("Client initials must be exactly 2 uppercase letters"),
    body("careLevels")
      .isArray({ min: 1 })
      .withMessage("At least one care level is required"),
    body("careLevels.*")
      .isString()
      .notEmpty()
      .withMessage("Each care level must be a non-empty string"),
    body("servicesNeeded")
      .isArray({ min: 1 })
      .withMessage("At least one service is required"),
    body("servicesNeeded.*")
      .isUUID()
      .withMessage("Each service ID must be a valid UUID"),
    body("mobilityLevel").optional().isString().withMessage("Mobility level must be a string"),
    body("behavioralNeeds")
      .optional()
      .isArray()
      .withMessage("Behavioral needs must be an array"),
    body("medicalNeeds")
      .optional()
      .isArray()
      .withMessage("Medical needs must be an array"),
    body("preferredCounties")
      .isArray({ min: 1 })
      .withMessage("At least one preferred county is required"),
    body("preferredCounties.*")
      .isString()
      .notEmpty()
      .withMessage("Each preferred county must be a non-empty string"),
    body("preferredCities").optional().isArray().withMessage("Preferred cities must be an array"),
    body("preferredCities.*")
      .optional()
      .isString()
      .withMessage("Each preferred city must be a string"),
    body("maxDistance")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Max distance must be a positive integer"),
    body("primaryPayer")
      .isIn(Object.values(Payer))
      .withMessage("Invalid primary payer"),
    body("secondaryPayer")
      .optional()
      .isIn(Object.values(Payer))
      .withMessage("Invalid secondary payer"),
    body("targetMoveDate")
      .optional()
      .isISO8601()
      .withMessage("Target move date must be a valid ISO 8601 date"),
    body("urgency")
      .optional()
      .isIn(Object.values(Urgency))
      .withMessage("Invalid urgency level"),
    body("internalNotes")
      .optional()
      .isString()
      .isLength({ max: 10000 })
      .withMessage("Internal notes must be less than 10000 characters"),
    body("providerIds").optional().isArray().withMessage("Provider IDs must be an array"),
    body("providerIds.*")
      .optional()
      .isUUID()
      .withMessage("Each provider ID must be a valid UUID"),
  ],
  validate([]),
  referralController.createReferral.bind(referralController)
);

// Get referrals - Providers can view, Case Managers/Hospital SW can view their own
router.get(
  "/referrals",
  authMiddleware.requireAnyPermission([
    PROVIDER_PERMISSIONS.REFERRALS_VIEW,
    CASE_MANAGER_PERMISSIONS.REFERRALS_VIEW,
    HOSPITAL_SW_PERMISSIONS.DISCHARGE_CASES_VIEW,
    "referrals:read", // Legacy permission
  ]),
  [
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("status")
      .optional()
      .isIn(Object.values(ReferralStatus))
      .withMessage("Invalid referral status"),
    query("urgency")
      .optional()
      .isIn(Object.values(Urgency))
      .withMessage("Invalid urgency level"),
    query("primaryPayer")
      .optional()
      .isIn(Object.values(Payer))
      .withMessage("Invalid primary payer"),
    query("search").optional().isString().withMessage("Search must be a string"),
  ],
  validate([]),
  referralController.getReferrals.bind(referralController)
);

// Get referral by ID - Same permissions as list
router.get(
  "/referrals/:id",
  authMiddleware.requireAnyPermission([
    PROVIDER_PERMISSIONS.REFERRALS_VIEW,
    CASE_MANAGER_PERMISSIONS.REFERRALS_VIEW,
    HOSPITAL_SW_PERMISSIONS.DISCHARGE_CASES_VIEW,
    "referrals:read", // Legacy permission
  ]),
  [param("id").isUUID().withMessage("Invalid referral ID")],
  validate([]),
  referralController.getReferralById.bind(referralController)
);

// Update referral - Case Managers, Hospital SW can update
router.put(
  "/referrals/:id",
  authMiddleware.requireAnyPermission([
    CASE_MANAGER_PERMISSIONS.REFERRALS_UPDATE,
    HOSPITAL_SW_PERMISSIONS.DISCHARGE_CASES_UPDATE,
    "referrals:update", // Legacy permission
  ]),
  [
    param("id").isUUID().withMessage("Invalid referral ID"),
    body("clientAge")
      .optional()
      .isInt({ min: 18, max: 120 })
      .withMessage("Client age must be between 18 and 120"),
    body("clientGender")
      .optional()
      .isIn(["MALE", "FEMALE", "OTHER", "NO_PREFERENCE"])
      .withMessage("Invalid client gender"),
    body("clientInitials")
      .optional()
      .isLength({ min: 2, max: 2 })
      .matches(/^[A-Z]{2}$/)
      .withMessage("Client initials must be exactly 2 uppercase letters"),
    body("careLevels").optional().isArray().withMessage("Care levels must be an array"),
    body("servicesNeeded").optional().isArray().withMessage("Services needed must be an array"),
    body("primaryPayer")
      .optional()
      .isIn(Object.values(Payer))
      .withMessage("Invalid primary payer"),
    body("status")
      .optional()
      .isIn(Object.values(ReferralStatus))
      .withMessage("Invalid referral status"),
    body("urgency")
      .optional()
      .isIn(Object.values(Urgency))
      .withMessage("Invalid urgency level"),
  ],
  validate([]),
  referralController.updateReferral.bind(referralController)
);

// Delete referral - Case Managers, Hospital SW can delete
router.delete(
  "/referrals/:id",
  authMiddleware.requireAnyPermission([
    CASE_MANAGER_PERMISSIONS.REFERRALS_DELETE,
    HOSPITAL_SW_PERMISSIONS.DISCHARGE_CASES_DELETE,
    "referrals:delete", // Legacy permission
  ]),
  [param("id").isUUID().withMessage("Invalid referral ID")],
  validate([]),
  referralController.deleteReferral.bind(referralController)
);

// Shortlist management
// Add provider to shortlist - Case Managers can manage shortlists
router.post(
  "/referrals/:id/shortlist",
  authMiddleware.requireAnyPermission([
    CASE_MANAGER_PERMISSIONS.SHORTLIST_MANAGE,
    "referrals:update", // Legacy permission
  ]),
  [
    param("id").isUUID().withMessage("Invalid referral ID"),
    body("providerIds")
      .isArray({ min: 1 })
      .withMessage("At least one provider ID is required"),
    body("providerIds.*")
      .isUUID()
      .withMessage("Each provider ID must be a valid UUID"),
    body("notes")
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage("Notes must be less than 1000 characters"),
  ],
  validate([]),
  referralController.addToShortlist.bind(referralController)
);

// Update shortlist entry - Case Managers can manage shortlists
router.put(
  "/referrals/:id/shortlist/:shortlistId",
  authMiddleware.requireAnyPermission([
    CASE_MANAGER_PERMISSIONS.SHORTLIST_MANAGE,
    "referrals:update", // Legacy permission
  ]),
  [
    param("id").isUUID().withMessage("Invalid referral ID"),
    param("shortlistId").isUUID().withMessage("Invalid shortlist ID"),
    body("status")
      .optional()
      .isIn(Object.values(ShortlistStatus))
      .withMessage("Invalid shortlist status"),
    body("notes")
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage("Notes must be less than 1000 characters"),
  ],
  validate([]),
  referralController.updateShortlistStatus.bind(referralController)
);

// Remove from shortlist - Case Managers can manage shortlists
router.delete(
  "/referrals/:id/shortlist/:shortlistId",
  authMiddleware.requireAnyPermission([
    CASE_MANAGER_PERMISSIONS.SHORTLIST_MANAGE,
    "referrals:update", // Legacy permission
  ]),
  [
    param("id").isUUID().withMessage("Invalid referral ID"),
    param("shortlistId").isUUID().withMessage("Invalid shortlist ID"),
  ],
  validate([]),
  referralController.removeFromShortlist.bind(referralController)
);

// Get shortlist - Case Managers can view, Providers can view their own
router.get(
  "/referrals/:id/shortlist",
  authMiddleware.requireAnyPermission([
    CASE_MANAGER_PERMISSIONS.SHORTLIST_MANAGE,
    PROVIDER_PERMISSIONS.REFERRALS_VIEW,
    "referrals:read", // Legacy permission
  ]),
  [param("id").isUUID().withMessage("Invalid referral ID")],
  validate([]),
  referralController.getShortlist.bind(referralController)
);

// Batch operations
// Batch add to shortlist - Case Managers can batch manage
router.post(
  "/referrals/:id/shortlist/batch",
  authMiddleware.requireAnyPermission([
    CASE_MANAGER_PERMISSIONS.SHORTLIST_MANAGE,
    CASE_MANAGER_PERMISSIONS.BATCH_OUTREACH,
    "referrals:update", // Legacy permission
  ]),
  [
    param("id").isUUID().withMessage("Invalid referral ID"),
    body("providerIds")
      .isArray({ min: 1 })
      .withMessage("At least one provider ID is required"),
    body("providerIds.*")
      .isUUID()
      .withMessage("Each provider ID must be a valid UUID"),
    body("notes")
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage("Notes must be less than 1000 characters"),
  ],
  validate([]),
  referralController.batchAddToShortlist.bind(referralController)
);

// Batch message providers - Case Managers can batch outreach
router.post(
  "/referrals/batch-message",
  authMiddleware.requireAnyPermission([
    CASE_MANAGER_PERMISSIONS.BATCH_OUTREACH,
    "communications:send", // Legacy permission
  ]),
  [
    body("referralIds")
      .isArray({ min: 1 })
      .withMessage("At least one referral ID is required"),
    body("referralIds.*")
      .isUUID()
      .withMessage("Each referral ID must be a valid UUID"),
    body("providerIds")
      .isArray({ min: 1 })
      .withMessage("At least one provider ID is required"),
    body("providerIds.*")
      .isUUID()
      .withMessage("Each provider ID must be a valid UUID"),
    body("message")
      .notEmpty()
      .withMessage("Message is required")
      .isLength({ min: 1, max: 10000 })
      .withMessage("Message must be between 1 and 10000 characters"),
    body("attachments")
      .optional()
      .isArray()
      .withMessage("Attachments must be an array"),
    body("attachments.*.url")
      .optional()
      .isURL()
      .withMessage("Each attachment must have a valid URL"),
    body("attachments.*.fileName")
      .optional()
      .isString()
      .withMessage("Each attachment must have a file name"),
    body("attachments.*.fileType")
      .optional()
      .isString()
      .withMessage("Each attachment must have a file type"),
    body("attachments.*.fileSize")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Each attachment must have a valid file size"),
  ],
  validate([]),
  referralController.batchMessageProviders.bind(referralController)
);

export default router;

