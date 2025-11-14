import { Router } from "express";
import { param, body, query } from "express-validator";
import { CaseManagerController } from "../controllers/case-manager.controller";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";

const router: Router = Router();
const caseManagerController = new CaseManagerController();
const authMiddleware = new AuthMiddleware();

// All routes require authentication
router.use(authMiddleware.requireAuth);

// Get case manager by user ID
router.get(
  "/case-managers/:userId",
  [param("userId").isUUID().withMessage("Invalid user ID")],
  validate([]),
  caseManagerController.getCaseManagerByUserId.bind(caseManagerController)
);

// Update case manager profile
router.put(
  "/case-managers/:userId",
  [
    param("userId").isUUID().withMessage("Invalid user ID"),
    body("firstName").optional().isString().withMessage("First name must be a string"),
    body("lastName").optional().isString().withMessage("Last name must be a string"),
    body("phone").optional().isString().withMessage("Phone must be a string"),
    body("licenseNumber")
      .optional()
      .isString()
      .withMessage("License number must be a string"),
    body("licenseExpiry")
      .optional()
      .isISO8601()
      .withMessage("License expiry must be a valid date"),
    body("isActive").optional().isBoolean().withMessage("Is active must be a boolean"),
  ],
  validate([]),
  caseManagerController.updateCaseManager.bind(caseManagerController)
);

// Get case manager dashboard
router.get(
  "/case-managers/:userId/dashboard",
  [param("userId").isUUID().withMessage("Invalid user ID")],
  validate([]),
  caseManagerController.getDashboard.bind(caseManagerController)
);

// Get case manager statistics
router.get(
  "/case-managers/:userId/stats",
  [
    param("userId").isUUID().withMessage("Invalid user ID"),
    query("startDate")
      .optional()
      .isISO8601()
      .withMessage("Start date must be a valid ISO 8601 date"),
    query("endDate")
      .optional()
      .isISO8601()
      .withMessage("End date must be a valid ISO 8601 date"),
  ],
  validate([]),
  caseManagerController.getStats.bind(caseManagerController)
);

export default router;
