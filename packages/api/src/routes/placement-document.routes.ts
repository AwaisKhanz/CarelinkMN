import { Router } from "express";
import { body, param, query } from "express-validator";
import { PlacementDocumentController } from "../controllers/placement-document.controller";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { PROVIDER_PERMISSIONS, HOSPITAL_SW_PERMISSIONS } from "../lib/rbac";
import { DocumentCategory } from "@prisma/client";

const router: Router = Router();
const documentController = new PlacementDocumentController();
const authMiddleware = new AuthMiddleware();

// Upload a document for a placement
router.post(
  "/placements/:placementId/documents",
  [
    param("placementId").isUUID().withMessage("Invalid placement ID"),
    body("fileName")
      .isString()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage("File name is required and must be less than 255 characters"),
    body("fileType")
      .isString()
      .trim()
      .withMessage("File type is required"),
    body("fileSize")
      .isInt({ min: 1 })
      .withMessage("File size must be a positive integer"),
    body("category")
      .isIn(Object.values(DocumentCategory))
      .withMessage("Invalid document category"),
    body("storageUrl")
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage("Storage URL is required"),
    body("notes")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Notes must be less than 500 characters"),
    body("expiresAt")
      .optional()
      .isISO8601()
      .withMessage("Expiration date must be a valid date"),
  ],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.PLACEMENTS_MANAGE),
  documentController.uploadDocument.bind(documentController)
);

// Get documents for a placement
router.get(
  "/placements/:placementId/documents",
  [
    param("placementId").isUUID().withMessage("Invalid placement ID"),
    query("category")
      .optional()
      .isIn(Object.values(DocumentCategory))
      .withMessage("Invalid document category"),
  ],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requireAnyPermission([
    PROVIDER_PERMISSIONS.RESIDENTS_VIEW,
    HOSPITAL_SW_PERMISSIONS.DISCHARGE_CASES_VIEW,
    "system:view", // Allow Admin/Super Admin access
  ]),
  documentController.getDocuments.bind(documentController)
);

// Get expiring documents
router.get(
  "/placements/:placementId/documents/expiring",
  [
    param("placementId").isUUID().withMessage("Invalid placement ID"),
    query("days")
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage("Days must be between 1 and 365"),
  ],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requireAnyPermission([
    PROVIDER_PERMISSIONS.RESIDENTS_VIEW,
    HOSPITAL_SW_PERMISSIONS.DISCHARGE_CASES_VIEW,
    "system:view", // Allow Admin/Super Admin access
  ]),
  documentController.getExpiringDocuments.bind(documentController)
);

// Get a single document
router.get(
  "/documents/:documentId",
  [param("documentId").isUUID().withMessage("Invalid document ID")],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requireAnyPermission([
    PROVIDER_PERMISSIONS.RESIDENTS_VIEW,
    HOSPITAL_SW_PERMISSIONS.DISCHARGE_CASES_VIEW,
    "system:view", // Allow Admin/Super Admin access
  ]),
  documentController.getDocumentById.bind(documentController)
);

// Delete a document
router.delete(
  "/documents/:documentId",
  [param("documentId").isUUID().withMessage("Invalid document ID")],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.PLACEMENTS_MANAGE),
  documentController.deleteDocument.bind(documentController)
);

export default router;
