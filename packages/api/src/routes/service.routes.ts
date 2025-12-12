import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { ServiceController } from '../controllers/service.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router: Router = Router();
const serviceController = new ServiceController();
const authMiddleware = new AuthMiddleware();

// Get service categories
router.get(
  '/categories',
  authMiddleware.requireAuth,
  serviceController.getServiceCategories
);

// Get all services (authenticated users)
router.get(
  '/',
  authMiddleware.requireAuth,
  validate([
    query('category').optional().isString(),
    query('isActive').optional().isBoolean(),
    query('includeInactive').optional().isBoolean(),
  ]),
  serviceController.getAllServices
);

// Get service by ID (admin only)
router.get(
  '/:id',
  authMiddleware.requireAuth,
  authMiddleware.requireAnyPermission([
    'services:manage',
    'system:manage',
  ]),
  validate([param('id').isUUID()]),
  serviceController.getServiceById
);

// Create service (admin only)
router.post(
  '/',
  authMiddleware.requireAuth,
  authMiddleware.requireAnyPermission([
    'services:manage',
    'system:manage',
  ]),
  validate([
    body('code').isString().trim().isLength({ min: 1, max: 50 }),
    body('name').isString().trim().isLength({ min: 1, max: 200 }),
    body('description').optional().isString(),
    body('category').isString().trim().isLength({ min: 1, max: 100 }),
    body('licenseTypeIds').isArray(),
    body('licenseTypeIds.*').isUUID(),
    body('isActive').optional().isBoolean(),
  ]),
  serviceController.createService
);

// Update service (admin only)
router.put(
  '/:id',
  authMiddleware.requireAuth,
  authMiddleware.requireAnyPermission([
    'services:manage',
    'system:manage',
  ]),
  validate([
    param('id').isUUID(),
    body('name').optional().isString().trim().isLength({ min: 1, max: 200 }),
    body('description').optional().isString(),
    body('category').optional().isString().trim().isLength({ min: 1, max: 100 }),
    body('licenseTypeIds').optional().isArray(),
    body('licenseTypeIds.*').isUUID(),
    body('isActive').optional().isBoolean(),
  ]),
  serviceController.updateService
);

// Delete service (admin only)
router.delete(
  '/:id',
  authMiddleware.requireAuth,
  authMiddleware.requireAnyPermission([
    'services:manage',
    'system:manage',
  ]),
  validate([param('id').isUUID()]),
  serviceController.deleteService
);

// Get services for provider (filtered by licenses)
router.get(
  '/provider/:providerId',
  authMiddleware.requireAuth,
  validate([param('providerId').isUUID()]),
  serviceController.getServicesForProvider
);

export default router;
