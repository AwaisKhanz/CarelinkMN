import { Router } from "express";
import { licenseTypeController } from "../controllers/license-type.controller";
import { AuthMiddleware } from "../middleware/auth.middleware";

const router: Router = Router();
const authMiddleware = new AuthMiddleware();

// Public routes (read-only for active types)
router.get("/", licenseTypeController.getAllLicenseTypes);
router.get("/grouped", licenseTypeController.getGroupedLicenseTypes);
router.get("/stats", licenseTypeController.getLicenseTypeStats);
router.get("/category/:categoryId", licenseTypeController.getLicenseTypesByCategory);
router.get("/:id", licenseTypeController.getLicenseTypeById);

// Admin-only routes
router.post(
  "/",
  authMiddleware.requireAuth,
  authMiddleware.requireRole(["SUPER_ADMIN", "ADMIN"]),
  licenseTypeController.createLicenseType
);

router.post(
  "/reorder",
  authMiddleware.requireAuth,
  authMiddleware.requireRole(["SUPER_ADMIN", "ADMIN"]),
  licenseTypeController.reorderLicenseTypes
);

router.put(
  "/:id",
  authMiddleware.requireAuth,
  authMiddleware.requireRole(["SUPER_ADMIN", "ADMIN"]),
  licenseTypeController.updateLicenseType
);

router.delete(
  "/:id",
  authMiddleware.requireAuth,
  authMiddleware.requireRole(["SUPER_ADMIN", "ADMIN"]),
  licenseTypeController.deleteLicenseType
);

export default router;

