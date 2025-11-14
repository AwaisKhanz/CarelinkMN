import { Router } from "express";
import { body, param, query } from "express-validator";
import { ReferralController } from "../controllers/referral.controller";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { ReferralStatus, Urgency, Payer, ShortlistStatus } from "@carelink/types";

const router: Router = Router();
const referralController = new ReferralController();
const authMiddleware = new AuthMiddleware();

// All routes require authentication
router.use(authMiddleware.requireAuth);

// Referral CRUD operations
router.post(
  "/referrals",
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

router.get(
  "/referrals",
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

router.get(
  "/referrals/:id",
  [param("id").isUUID().withMessage("Invalid referral ID")],
  validate([]),
  referralController.getReferralById.bind(referralController)
);

router.put(
  "/referrals/:id",
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

router.delete(
  "/referrals/:id",
  [param("id").isUUID().withMessage("Invalid referral ID")],
  validate([]),
  referralController.deleteReferral.bind(referralController)
);

// Shortlist management
router.post(
  "/referrals/:id/shortlist",
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

router.put(
  "/referrals/:id/shortlist/:shortlistId",
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

router.delete(
  "/referrals/:id/shortlist/:shortlistId",
  [
    param("id").isUUID().withMessage("Invalid referral ID"),
    param("shortlistId").isUUID().withMessage("Invalid shortlist ID"),
  ],
  validate([]),
  referralController.removeFromShortlist.bind(referralController)
);

router.get(
  "/referrals/:id/shortlist",
  [param("id").isUUID().withMessage("Invalid referral ID")],
  validate([]),
  referralController.getShortlist.bind(referralController)
);

// Batch operations
router.post(
  "/referrals/:id/shortlist/batch",
  [
    param("id").isUUID().withMessage("Invalid referral ID"),
    body("providerIds")
      .isArray({ min: 1 })
      .withMessage("At least one provider ID is required"),
    body("providerIds.*")
      .isUUID()
      .withMessage("Each provider ID must be a valid UUID"),
  ],
  validate([]),
  referralController.batchAddToShortlist.bind(referralController)
);

router.post(
  "/referrals/batch-message",
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

