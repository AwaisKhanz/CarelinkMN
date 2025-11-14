import { Router } from "express";
import { body, param, query } from "express-validator";
import { MessagingController } from "../controllers/messaging.controller";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { ThreadStatus } from "@prisma/client";

const router: Router = Router();
const messagingController = new MessagingController();
const authMiddleware = new AuthMiddleware();

// All routes require authentication
router.use(authMiddleware.requireAuth);

// Get message threads
router.get(
  "/messages/threads",
  [
    query("providerId").optional().isUUID().withMessage("Invalid provider ID"),
    query("referralId").optional().isUUID().withMessage("Invalid referral ID"),
    query("dischargeCaseId")
      .optional()
      .isUUID()
      .withMessage("Invalid discharge case ID"),
    query("status")
      .optional()
      .isIn(Object.values(ThreadStatus))
      .withMessage("Invalid thread status"),
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("search").optional().isString().withMessage("Search must be a string"),
  ],
  validate([]),
  messagingController.getThreads.bind(messagingController)
);

// Get a single thread with messages
router.get(
  "/messages/threads/:threadId",
  [param("threadId").isUUID().withMessage("Invalid thread ID")],
  validate([]),
  messagingController.getThreadById.bind(messagingController)
);

// Create a new thread
router.post(
  "/messages/threads",
  [
    body("providerId").isUUID().withMessage("Invalid provider ID"),
    body("referralId")
      .optional()
      .isUUID()
      .withMessage("Invalid referral ID"),
    body("dischargeCaseId")
      .optional()
      .isUUID()
      .withMessage("Invalid discharge case ID"),
    body("initialMessage")
      .notEmpty()
      .withMessage("Initial message is required")
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
    body().custom((value) => {
      // At least one of referralId or dischargeCaseId should be provided for context
      // But we'll make it optional for flexibility
      return true;
    }),
  ],
  validate([]),
  messagingController.createThread.bind(messagingController)
);

// Send a message in a thread
router.post(
  "/messages/threads/:threadId/messages",
  [
    param("threadId").isUUID().withMessage("Invalid thread ID"),
    body("content")
      .notEmpty()
      .withMessage("Message content is required")
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
  messagingController.sendMessage.bind(messagingController)
);

// Mark messages as read
router.post(
  "/messages/threads/:threadId/read",
  [param("threadId").isUUID().withMessage("Invalid thread ID")],
  validate([]),
  messagingController.markAsRead.bind(messagingController)
);

// Update thread status
router.patch(
  "/messages/threads/:threadId/status",
  [
    param("threadId").isUUID().withMessage("Invalid thread ID"),
    body("status")
      .isIn(Object.values(ThreadStatus))
      .withMessage("Invalid thread status"),
  ],
  validate([]),
  messagingController.updateThreadStatus.bind(messagingController)
);

export default router;

