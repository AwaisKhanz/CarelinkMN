import { Router } from "express";
import { param } from "express-validator";
import { HospitalStaffController } from "../controllers/hospital-staff.controller";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { HOSPITAL_SW_PERMISSIONS } from "../lib/rbac";

const router: Router = Router();
const hospitalStaffController = new HospitalStaffController();
const authMiddleware = new AuthMiddleware();

// Get hospital staff by user ID
router.get(
  "/hospital-staff/by-user/:userId",
  [param("userId").isUUID().withMessage("Invalid user ID")],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(HOSPITAL_SW_PERMISSIONS.DASHBOARD_VIEW),
  hospitalStaffController.getHospitalStaffByUserId
);

// Update hospital staff profile
router.put(
  "/hospital-staff/by-user/:userId",
  [param("userId").isUUID().withMessage("Invalid user ID")],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(HOSPITAL_SW_PERMISSIONS.PROFILE_MANAGE),
  hospitalStaffController.updateHospitalStaff
);

export default router;
