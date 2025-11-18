import { Router } from "express";
import { body, param, query } from "express-validator";
import { MessageTemplateController } from "../controllers/message-template.controller";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { CASE_MANAGER_PERMISSIONS } from "../lib/rbac";

const router: Router = Router();
const templateController = new MessageTemplateController();
const authMiddleware = new AuthMiddleware();

// All routes require authentication
router.use(authMiddleware.requireAuth);

// Get all templates
router.get(
  "/message-templates",
  authMiddleware.requireAnyPermission([
    CASE_MANAGER_PERMISSIONS.MESSAGES_MANAGE,
    "communications:send", // Legacy permission
  ]),
  [
    query("includeOrganization")
      .optional()
      .isBoolean()
      .withMessage("includeOrganization must be a boolean"),
  ],
  validate([]),
  templateController.getTemplates.bind(templateController)
);

// Get template by ID
router.get(
  "/message-templates/:id",
  authMiddleware.requireAnyPermission([
    CASE_MANAGER_PERMISSIONS.MESSAGES_MANAGE,
    "communications:send", // Legacy permission
  ]),
  [param("id").isUUID().withMessage("Invalid template ID")],
  validate([]),
  templateController.getTemplateById.bind(templateController)
);

// Create template
router.post(
  "/message-templates",
  authMiddleware.requireAnyPermission([
    CASE_MANAGER_PERMISSIONS.MESSAGES_MANAGE,
    "communications:send", // Legacy permission
  ]),
  [
    body("name")
      .notEmpty()
      .withMessage("Template name is required")
      .isLength({ min: 1, max: 100 })
      .withMessage("Template name must be between 1 and 100 characters"),
    body("subject")
      .optional()
      .isLength({ max: 200 })
      .withMessage("Subject must be less than 200 characters"),
    body("content")
      .notEmpty()
      .withMessage("Template content is required")
      .isLength({ min: 1, max: 10000 })
      .withMessage("Content must be between 1 and 10000 characters"),
    body("category")
      .optional()
      .isLength({ max: 50 })
      .withMessage("Category must be less than 50 characters"),
    body("variables")
      .optional()
      .isArray()
      .withMessage("Variables must be an array"),
    body("variables.*")
      .optional()
      .isString()
      .withMessage("Each variable must be a string"),
    body("organizationId")
      .optional()
      .isUUID()
      .withMessage("Organization ID must be a valid UUID"),
  ],
  validate([]),
  templateController.createTemplate.bind(templateController)
);

// Update template
router.put(
  "/message-templates/:id",
  authMiddleware.requireAnyPermission([
    CASE_MANAGER_PERMISSIONS.MESSAGES_MANAGE,
    "communications:send", // Legacy permission
  ]),
  [
    param("id").isUUID().withMessage("Invalid template ID"),
    body("name")
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage("Template name must be between 1 and 100 characters"),
    body("subject")
      .optional()
      .isLength({ max: 200 })
      .withMessage("Subject must be less than 200 characters"),
    body("content")
      .optional()
      .isLength({ min: 1, max: 10000 })
      .withMessage("Content must be between 1 and 10000 characters"),
    body("category")
      .optional()
      .isLength({ max: 50 })
      .withMessage("Category must be less than 50 characters"),
    body("variables")
      .optional()
      .isArray()
      .withMessage("Variables must be an array"),
    body("variables.*")
      .optional()
      .isString()
      .withMessage("Each variable must be a string"),
  ],
  validate([]),
  templateController.updateTemplate.bind(templateController)
);

// Delete template
router.delete(
  "/message-templates/:id",
  authMiddleware.requireAnyPermission([
    CASE_MANAGER_PERMISSIONS.MESSAGES_MANAGE,
    "communications:send", // Legacy permission
  ]),
  [param("id").isUUID().withMessage("Invalid template ID")],
  validate([]),
  templateController.deleteTemplate.bind(templateController)
);

export default router;

