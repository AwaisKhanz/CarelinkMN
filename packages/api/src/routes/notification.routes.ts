import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { query, param } from "express-validator";
import { NotificationType } from "@prisma/client";

const router: Router = Router();
const notificationController = new NotificationController();
const authMiddleware = new AuthMiddleware();

// All routes require authentication
router.use(authMiddleware.requireAuth);

// Get notifications
router.get(
  "/notifications",
  [
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("isRead")
      .optional()
      .isBoolean()
      .withMessage("isRead must be a boolean"),
    query("type")
      .optional()
      .isIn(Object.values(NotificationType))
      .withMessage("Invalid notification type"),
  ],
  validate([]),
  notificationController.getNotifications.bind(notificationController)
);

// Mark notification as read
router.patch(
  "/notifications/:id/read",
  [param("id").isUUID().withMessage("Invalid notification ID")],
  validate([]),
  notificationController.markAsRead.bind(notificationController)
);

// Mark all notifications as read
router.patch(
  "/notifications/read-all",
  validate([]),
  notificationController.markAllAsRead.bind(notificationController)
);

export default router;

