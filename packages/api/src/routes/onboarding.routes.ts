import { Router } from 'express';
import { body, param } from 'express-validator';
import { OnboardingController } from '../controllers/onboarding.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router: Router = Router();
const onboardingController = new OnboardingController();
const authMiddleware = new AuthMiddleware();

// Apply authentication middleware to all routes
router.use(authMiddleware.requireAuth);

/**
 * @route GET /api/onboarding/state
 * @desc Get current onboarding state for the authenticated provider
 * @access Private (Provider only)
 */
router.get('/state',
  validate([]),
  onboardingController.getOnboardingState
);

/**
 * @route PUT /api/onboarding/step
 * @desc Update onboarding step data
 * @access Private (Provider only)
 */
router.put('/step',
  [
    body('step')
      .isInt({ min: 0, max: 4 })
      .withMessage('Step must be an integer between 0 and 4'),
    body('data')
      .notEmpty()
      .withMessage('Step data is required'),
    body('isComplete')
      .optional()
      .isBoolean()
      .withMessage('isComplete must be a boolean'),
  ],
  validate([]),
  onboardingController.updateOnboardingStep
);


/**
 * @route POST /api/onboarding/complete
 * @desc Complete onboarding process and submit for review
 * @access Private (Provider only)
 */
router.post('/complete',
  validate([]),
  onboardingController.completeOnboarding
);

// Admin routes
/**
 * @route GET /api/onboarding/admin/pending
 * @desc Get all pending onboarding reviews
 * @access Private (Admin only)
 */
router.get('/admin/pending',
  validate([]),
  onboardingController.getPendingReviews
);

/**
 * @route PUT /api/onboarding/admin/review/:providerId
 * @desc Review onboarding application
 * @access Private (Admin only)
 */
router.put('/admin/review/:providerId',
  [
    param('providerId')
      .isUUID()
      .withMessage('Provider ID must be a valid UUID'),
    body('status')
      .isIn(['PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'NEEDS_CHANGES'])
      .withMessage('Invalid review status'),
    body('notes')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Notes must be a string with maximum 1000 characters'),
  ],
  validate([]),
  onboardingController.reviewOnboarding
);

/**
 * @route PUT /api/onboarding/admin/reset/:providerId
 * @desc Reset onboarding for changes needed
 * @access Private (Admin only)
 */
router.put('/admin/reset/:providerId',
  [
    param('providerId')
      .isUUID()
      .withMessage('Provider ID must be a valid UUID'),
  ],
  validate([]),
  onboardingController.resetOnboarding
);

export default router;