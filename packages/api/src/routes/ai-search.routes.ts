import { Router } from "express";
import { body } from "express-validator";
import { AISearchController } from "../controllers/ai-search.controller";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { CASE_MANAGER_PERMISSIONS } from "../lib/rbac";

const router: Router = Router();
const aiSearchController = new AISearchController();
const authMiddleware = new AuthMiddleware();

// All routes require authentication
router.use(authMiddleware.requireAuth);

// Parse natural language query
router.post(
  "/ai-search/parse",
  authMiddleware.requirePermission(CASE_MANAGER_PERMISSIONS.SEARCH_AI_ASSISTED),
  [
    body("query")
      .notEmpty()
      .withMessage("Query is required")
      .isString()
      .isLength({ min: 1, max: 500 })
      .withMessage("Query must be between 1 and 500 characters"),
  ],
  validate([]),
  aiSearchController.parseQuery.bind(aiSearchController)
);

export default router;
