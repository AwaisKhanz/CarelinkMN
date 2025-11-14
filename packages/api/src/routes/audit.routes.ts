import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';

const router: Router = Router();
const auditController = new AuditController();
const authMiddleware = new AuthMiddleware();

// All audit routes require admin privileges
router.use(authMiddleware.requireAuth);
router.use(authMiddleware.requireRole(['ADMIN', 'SUPER_ADMIN']));

// Search audit logs
router.get('/search', auditController.searchLogs);

// Get audit statistics
router.get('/statistics', auditController.getStatistics);

// Export audit logs
router.get('/export', auditController.exportLogs);

// Cleanup old audit logs (super admin only)
router.post('/cleanup',
  authMiddleware.requireRole(['SUPER_ADMIN']),
  auditController.cleanupOldLogs
);

export default router;