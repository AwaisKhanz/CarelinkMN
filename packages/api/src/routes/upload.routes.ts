import { Router } from 'express';
import { body } from 'express-validator';
import { UploadController } from '../controllers/upload.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router: Router = Router();
const uploadController = new UploadController();
const authMiddleware = new AuthMiddleware();

// Apply authentication middleware to all routes
router.use(authMiddleware.requireAuth);

/**
 * @route POST /api/upload/document
 * @desc Upload document and return URL
 * @access Private (All authenticated users)
 */
router.post('/document',
  [
    body('documentType')
      .optional()
      .isString()
      .isLength({ min: 1, max: 50 })
      .withMessage('Document type must be a string between 1 and 50 characters'),
    body('folder')
      .optional()
      .isString()
      .isLength({ min: 1, max: 100 })
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Folder must contain only alphanumeric characters, hyphens, and underscores'),
  ],
  validate([]),
  uploadController.uploadDocument
);

export default router;