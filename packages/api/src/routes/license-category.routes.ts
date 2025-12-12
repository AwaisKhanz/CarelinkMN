import { Router } from "express";
import { licenseCategoryController } from "../controllers/license-category.controller";
import { AuthMiddleware } from "../middleware/auth.middleware";

const router: Router = Router();
const authMiddleware = new AuthMiddleware();

// Public routes (read-only for active categories)
router.get("/", licenseCategoryController.getAllCategories);
router.get("/stats", licenseCategoryController.getCategoryStats);
router.get("/:id", licenseCategoryController.getCategoryById);

// Admin-only routes
router.post(
  "/",
  authMiddleware.requireAuth,
  authMiddleware.requireRole(["SUPER_ADMIN", "ADMIN"]),
  licenseCategoryController.createCategory
);

router.post(
  "/reorder",
  authMiddleware.requireAuth,
  authMiddleware.requireRole(["SUPER_ADMIN", "ADMIN"]),
  licenseCategoryController.reorderCategories
);

router.put(
  "/:id",
  authMiddleware.requireAuth,
  authMiddleware.requireRole(["SUPER_ADMIN", "ADMIN"]),
  licenseCategoryController.updateCategory
);

router.delete(
  "/:id",
  authMiddleware.requireAuth,
  authMiddleware.requireRole(["SUPER_ADMIN", "ADMIN"]),
  licenseCategoryController.deleteCategory
);

export default router;
