import { Router } from "express";
import { body, param, query } from "express-validator";
import { adminController } from "../controllers/admin.controller";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";

const router: Router = Router();
const authMiddleware = new AuthMiddleware();

// All admin routes require authentication
router.use(authMiddleware.requireAuth);

/**
 * USERS
 */
router.get(
  "/users",
  authMiddleware.requireAnyPermission([
    "system:users:manage",
    "system:manage",
    "system:view",
  ]),
  validate([
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
  ]),
  adminController.getUsers
);

router.get(
  "/users/:userId",
  authMiddleware.requireAnyPermission([
    "system:users:manage",
    "system:manage",
    "system:view",
  ]),
  validate([param("userId").isUUID()]),
  adminController.getUserById
);

router.put(
  "/users/:userId",
  authMiddleware.requireAnyPermission([
    "system:users:manage",
    "system:manage",
  ]),
  validate([
    param("userId").isUUID(),
    body("email").optional().isEmail(),
    body("firstName").optional().isString().notEmpty(),
    body("lastName").optional().isString().notEmpty(),
    body("phone").optional().isString(),
    body("role").optional().isString(),
    body("status").optional().isString(),
    body("organizationId").optional().isString(),
  ]),
  adminController.updateUser
);

router.delete(
  "/users/:userId",
  authMiddleware.requireAnyPermission([
    "system:users:manage",
    "system:manage",
  ]),
  validate([param("userId").isUUID()]),
  adminController.deleteUser
);

/**
 * ORGANIZATIONS
 */
router.get(
  "/organizations",
  authMiddleware.requireAnyPermission([
    "system:organizations:manage",
    "system:manage",
    "system:view",
  ]),
  validate([
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
  ]),
  adminController.getOrganizations
);

router.get(
  "/organizations/:organizationId",
  authMiddleware.requireAnyPermission([
    "system:organizations:manage",
    "system:manage",
    "system:view",
  ]),
  validate([param("organizationId").isUUID()]),
  adminController.getOrganizationById
);

router.put(
  "/organizations/:organizationId",
  authMiddleware.requireAnyPermission([
    "system:organizations:manage",
    "system:manage",
  ]),
  validate([
    param("organizationId").isUUID(),
    body("name").optional().isString().notEmpty(),
    body("email").optional().isEmail(),
    body("phone").optional().isString(),
    body("status").optional().isString(),
    body("city").optional().isString(),
    body("state").optional().isString(),
    body("addressLine1").optional().isString(),
    body("zipCode").optional().isPostalCode("US"),
  ]),
  adminController.updateOrganization
);

/**
 * LICENSES
 */
router.get(
  "/licenses",
  authMiddleware.requireAnyPermission([
    "system:licenses:verify",
    "system:manage",
  ]),
  validate([
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
  ]),
  adminController.getLicenses
);

router.get(
  "/licenses/:licenseId",
  authMiddleware.requireAnyPermission([
    "system:licenses:verify",
    "system:manage",
  ]),
  validate([param("licenseId").isUUID()]),
  adminController.getLicenseById
);

router.put(
  "/licenses/:licenseId/verify",
  authMiddleware.requireAnyPermission([
    "system:licenses:verify",
    "system:manage",
  ]),
  validate([
    param("licenseId").isUUID(),
    body("status").isString().notEmpty(),
    body("verificationNotes").optional().isString(),
  ]),
  adminController.verifyLicense
);

/**
 * COMPLIANCE
 */
router.get(
  "/compliance/issues",
  authMiddleware.requireAnyPermission([
    "system:compliance:manage",
    "system:manage",
    "system:view",
  ]),
  validate([
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("severity").optional().isString(),
    query("type").optional().isString(),
    query("status").optional().isString(),
    query("search").optional().isString(),
  ]),
  adminController.getComplianceIssues
);

/**
 * ANALYTICS
 */
router.get(
  "/analytics",
  authMiddleware.requireAnyPermission([
    "system:analytics:system",
    "system:manage",
    "system:view",
  ]),
  adminController.getPlatformAnalytics
);

export default router;

