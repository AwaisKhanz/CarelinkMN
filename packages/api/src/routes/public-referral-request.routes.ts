import { Router } from "express";
import { PublicReferralRequestController } from "../controllers/public-referral-request.controller";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { body, query } from "express-validator";
import { validate } from "../middleware/validation.middleware";

const router: Router = Router();
const controller = new PublicReferralRequestController();
const authMiddleware = new AuthMiddleware();

// All routes require authentication
router.use(authMiddleware.requireAuth);

// GET /api/public-requests/stats - Get request statistics
router.get("/stats", controller.getStats);

// GET /api/public-requests/queue - Get queue for case managers
router.get(
  "/queue",
  [
    query("status")
      .optional()
      .isString()
      .withMessage("Status must be a string"),
    query("urgency")
      .optional()
      .isString()
      .withMessage("Urgency must be a string"),
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
  controller.getQueue
);

// POST /api/public-requests/:id/claim - Claim a request (case managers)
router.post("/:id/claim", controller.claimRequest);

// GET /api/public-requests - List user's requests
router.get(
  "/",
  [
    query("status")
      .optional()
      .isString()
      .withMessage("Status must be a string"),
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
  controller.getRequests
);

// GET /api/public-requests/:id - Get single request
router.get("/:id", controller.getRequest);

// POST /api/public-requests - Create new request
router.post(
  "/",
  [
    body("contactName")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Contact name must be between 2 and 100 characters"),
    body("contactEmail")
      .trim()
      .isEmail()
      .withMessage("Contact email must be a valid email address"),
    body("contactPhone")
      .optional()
      .trim()
      .isMobilePhone("any")
      .withMessage("Contact phone must be a valid phone number"),
    body("recipientAge")
      .isInt({ min: 0, max: 120 })
      .withMessage("Recipient age must be between 0 and 120"),
    body("recipientGender")
      .isString()
      .isIn(["MALE", "FEMALE", "OTHER", "NO_PREFERENCE"])
      .withMessage("Recipient gender must be a valid option"),
    body("recipientInitials")
      .trim()
      .isLength({ min: 2, max: 2 })
      .matches(/^[A-Z]{2}$/)
      .withMessage("Recipient initials must be exactly 2 uppercase letters"),
    body("careNeeds")
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage("Care needs must be between 10 and 2000 characters"),
    body("urgency")
      .isString()
      .isIn(["URGENT", "HIGH", "ROUTINE"])
      .withMessage("Urgency must be a valid option"),
    body("preferredCounties")
      .optional()
      .isArray()
      .withMessage("Preferred counties must be an array"),
    body("primaryPayer")
      .optional()
      .isString()
      .isIn(["MA", "MEDICARE", "PRIVATE", "CADI", "BI_TBI", "EW", "DD"])
      .withMessage("Primary payer must be a valid option"),
    body("secondaryPayer")
      .optional()
      .isString()
      .isIn(["MA", "MEDICARE", "PRIVATE", "CADI", "BI_TBI", "EW", "DD"])
      .withMessage("Secondary payer must be a valid option"),
    body("interestedProviderIds")
      .optional()
      .isArray({ max: 10 })
      .withMessage("Interested providers must be an array with max 10 items"),
  ],
  validate([]),
  controller.createRequest
);

// PUT /api/public-requests/:id - Update request
router.put(
  "/:id",
  [
    body("contactName")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Contact name must be between 2 and 100 characters"),
    body("contactEmail")
      .optional()
      .trim()
      .isEmail()
      .withMessage("Contact email must be a valid email address"),
    body("contactPhone")
      .optional()
      .trim()
      .isMobilePhone("any")
      .withMessage("Contact phone must be a valid phone number"),
    body("careNeeds")
      .optional()
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage("Care needs must be between 10 and 2000 characters"),
    body("urgency")
      .optional()
      .isString()
      .isIn(["URGENT", "HIGH", "ROUTINE"])
      .withMessage("Urgency must be a valid option"),
    body("preferredCounties")
      .optional()
      .isArray()
      .withMessage("Preferred counties must be an array"),
    body("primaryPayer")
      .optional()
      .isString()
      .isIn(["MA", "MEDICARE", "PRIVATE", "CADI", "BI_TBI", "EW", "DD"])
      .withMessage("Primary payer must be a valid option"),
    body("secondaryPayer")
      .optional()
      .isString()
      .isIn(["MA", "MEDICARE", "PRIVATE", "CADI", "BI_TBI", "EW", "DD"])
      .withMessage("Secondary payer must be a valid option"),
    body("interestedProviderIds")
      .optional()
      .isArray({ max: 10 })
      .withMessage("Interested providers must be an array with max 10 items"),
  ],
  validate([]),
  controller.updateRequest
);

// DELETE /api/public-requests/:id - Cancel request
router.delete("/:id", controller.cancelRequest);

export default router;
