import { Router } from "express";
import { body, param, query } from "express-validator";
import { JobStatus, RetentionStatus, VRSClientStatus } from "@prisma/client";
import { vrsController } from "../controllers/vrs.controller";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { VRS_PERMISSIONS } from "../lib/rbac";

const CLIENT_STATUSES = Object.values(VRSClientStatus);
const JOB_STATUSES = Object.values(JobStatus);
const RETENTION_STATUSES = Object.values(RetentionStatus);

const retentionStatusValidation = (field: string) =>
  body(field)
    .optional({ nullable: true })
    .custom(
      (value) =>
        value === null ||
        value === undefined ||
        RETENTION_STATUSES.includes(value as RetentionStatus)
    )
    .withMessage("Invalid retention status");

const router: Router = Router();
const authMiddleware = new AuthMiddleware();

router.use(authMiddleware.requireAuth);

router.get(
  "/clients",
  authMiddleware.requireAnyPermission([
    VRS_PERMISSIONS.CLIENTS_VIEW,
    VRS_PERMISSIONS.DASHBOARD_VIEW,
  ]),
  validate([
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("status").optional().isIn(CLIENT_STATUSES),
    query("search").optional().isString(),
    query("employerId").optional().isUUID(),
  ]),
  vrsController.getClients
);

router.get(
  "/clients/:clientId",
  authMiddleware.requireAnyPermission([
    VRS_PERMISSIONS.CLIENTS_VIEW,
    VRS_PERMISSIONS.DASHBOARD_VIEW,
  ]),
  validate([param("clientId").isUUID()]),
  vrsController.getClientById
);

router.post(
  "/clients",
  authMiddleware.requireAnyPermission([VRS_PERMISSIONS.CLIENTS_CREATE]),
  validate([
    body("firstName").isString().notEmpty(),
    body("lastName").isString().notEmpty(),
    body("status").isIn(CLIENT_STATUSES),
  ]),
  vrsController.upsertClient
);

router.put(
  "/clients/:clientId",
  authMiddleware.requireAnyPermission([VRS_PERMISSIONS.CLIENTS_UPDATE]),
  validate([
    param("clientId").isUUID(),
    body("firstName").optional().isString().notEmpty(),
    body("lastName").optional().isString().notEmpty(),
    body("status").optional().isIn(CLIENT_STATUSES),
  ]),
  vrsController.upsertClient
);

router.delete(
  "/clients/:clientId",
  authMiddleware.requireAnyPermission([VRS_PERMISSIONS.CLIENTS_DELETE]),
  validate([param("clientId").isUUID()]),
  vrsController.deleteClient
);

router.get(
  "/employers",
  authMiddleware.requireAnyPermission([
    VRS_PERMISSIONS.EMPLOYERS_VIEW,
    VRS_PERMISSIONS.JOB_MATCHING_USE,
  ]),
  validate([
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("search").optional().isString(),
  ]),
  vrsController.getEmployers
);

router.get(
  "/employers/:employerId",
  authMiddleware.requireAnyPermission([
    VRS_PERMISSIONS.EMPLOYERS_VIEW,
    VRS_PERMISSIONS.JOB_MATCHING_USE,
  ]),
  validate([param("employerId").isUUID()]),
  vrsController.getEmployerById
);

router.post(
  "/employers",
  authMiddleware.requireAnyPermission([VRS_PERMISSIONS.EMPLOYERS_MANAGE]),
  validate([
    body("companyName").isString().notEmpty(),
    body("industry").optional().isString(),
    body("contactEmail").optional().isEmail(),
    body("contactPhone").optional().isString(),
  ]),
  vrsController.upsertEmployer
);

router.put(
  "/employers/:employerId",
  authMiddleware.requireAnyPermission([VRS_PERMISSIONS.EMPLOYERS_MANAGE]),
  validate([
    param("employerId").isUUID(),
    body("companyName").optional().isString().notEmpty(),
    body("industry").optional().isString(),
    body("contactEmail").optional().isEmail(),
    body("contactPhone").optional().isString(),
  ]),
  vrsController.upsertEmployer
);

router.get(
  "/jobs",
  authMiddleware.requireAnyPermission([
    VRS_PERMISSIONS.JOB_MATCHING_USE,
    VRS_PERMISSIONS.PLACEMENTS_VIEW,
  ]),
  validate([
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("status").optional().isIn(JOB_STATUSES),
    query("employerId").optional().isUUID(),
    query("search").optional().isString(),
  ]),
  vrsController.getJobs
);

router.get(
  "/jobs/:jobId",
  authMiddleware.requireAnyPermission([
    VRS_PERMISSIONS.JOB_MATCHING_USE,
    VRS_PERMISSIONS.PLACEMENTS_VIEW,
  ]),
  validate([param("jobId").isUUID()]),
  vrsController.getJobById
);

router.post(
  "/jobs",
  authMiddleware.requireAnyPermission([VRS_PERMISSIONS.JOB_MATCHING_USE]),
  validate([
    body("title").isString().notEmpty(),
    body("employerId").isUUID(),
    body("status").optional().isIn(JOB_STATUSES),
  ]),
  vrsController.upsertJob
);
router.put(
  "/jobs/:jobId",
  authMiddleware.requireAnyPermission([VRS_PERMISSIONS.JOB_MATCHING_USE]),
  validate([
    param("jobId").isUUID(),
    body("title").optional().isString().notEmpty(),
    body("status").optional().isIn(JOB_STATUSES),
  ]),
  vrsController.upsertJob
);

router.get(
  "/placements",
  authMiddleware.requireAnyPermission([VRS_PERMISSIONS.PLACEMENTS_VIEW]),
  validate([
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("status").optional().isIn(RETENTION_STATUSES),
  ]),
  vrsController.getPlacements
);

router.post(
  "/placements",
  authMiddleware.requireAnyPermission([VRS_PERMISSIONS.JOB_MATCHING_USE]),
  validate([
    body("clientId").isUUID().withMessage("Valid client ID is required"),
    body("jobId").isUUID().withMessage("Valid job ID is required"),
    body("placementDate")
      .isISO8601()
      .withMessage("Valid placement date is required"),
    body("startDate")
      .optional()
      .isISO8601()
      .withMessage("Valid start date is required"),
  ]),
  vrsController.createPlacement
);

router.put(
  "/placements/:placementId/retention",
  authMiddleware.requireAnyPermission([VRS_PERMISSIONS.PLACEMENTS_UPDATE]),
  validate([
    param("placementId").isUUID(),
    retentionStatusValidation("day30Status"),
    retentionStatusValidation("day60Status"),
    retentionStatusValidation("day90Status"),
    body("endDate").optional().isISO8601().toDate(),
    body("endReason").optional().isString(),
  ]),
  vrsController.updatePlacementRetention
);

router.get(
  "/analytics",
  authMiddleware.requireAnyPermission([
    VRS_PERMISSIONS.ANALYTICS_VIEW,
    VRS_PERMISSIONS.RETENTION_ANALYTICS_VIEW,
  ]),
  vrsController.getAnalytics
);

export default router;
