import { Router } from "express";
import { body, param } from "express-validator";
import { validationResult } from "express-validator";
import { UserController } from "../controllers/user.controller";
import { AuthMiddleware } from "../middleware/auth.middleware";

const router: Router = Router();
const userController = new UserController();
const authMiddleware = new AuthMiddleware();

// Update user profile
router.put('/profile',
  authMiddleware.requireAuth,
  [
    body('firstName').optional().trim().isLength({ min: 1 }),
    body('lastName').optional().trim().isLength({ min: 1 }),
    body('phone').optional().isMobilePhone('en-US'),
  ],
  userController.updateProfile
);

// Deactivate user account
router.post('/deactivate',
  authMiddleware.requireAuth,
  userController.deactivateAccount
);

// Suspend user (admin only)
router.post('/:userId/suspend',
  authMiddleware.requireAuth,
  authMiddleware.requireAnyPermission([
    'users:manage',
    'users:update',
    'system:manage',
  ]),
  [
    param('userId').isUUID(),
    body('reason').optional().trim().isLength({ min: 1 }),
  ],
  userController.suspendUser
);

// Activate user (admin only)
router.post('/:userId/activate',
  authMiddleware.requireAuth,
  authMiddleware.requireAnyPermission([
    'users:manage',
    'users:update',
    'system:manage',
  ]),
  [
    param('userId').isUUID(),
  ],
  userController.activateUser
);

// Get notification preferences
router.get('/notification-preferences',
  authMiddleware.requireAuth,
  userController.getNotificationPreferences
);

// Update notification preferences
router.put('/notification-preferences',
  authMiddleware.requireAuth,
  [
    body('emailNotifications').optional().isBoolean(),
    body('emailNewReferrals').optional().isBoolean(),
    body('emailProviderResponses').optional().isBoolean(),
    body('emailPlacementUpdates').optional().isBoolean(),
    body('emailUrgentCases').optional().isBoolean(),
    body('inAppNotifications').optional().isBoolean(),
    body('inAppNewReferrals').optional().isBoolean(),
    body('inAppProviderResponses').optional().isBoolean(),
    body('inAppPlacementUpdates').optional().isBoolean(),
    body('inAppUrgentCases').optional().isBoolean(),
  ],
  userController.updateNotificationPreferences
);

export default router;
