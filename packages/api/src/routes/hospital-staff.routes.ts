import { Router } from "express";
import { param } from "express-validator";
import { HospitalStaffController } from "../controllers/hospital-staff.controller";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";

const router: Router = Router();
const hospitalStaffController = new HospitalStaffController();
const authMiddleware = new AuthMiddleware();

// Get hospital staff by user ID
router.get(
  "/hospital-staff/by-user/:userId",
  [param("userId").isUUID().withMessage("Invalid user ID")],
  validate([]),
  authMiddleware.requireAuth,
  hospitalStaffController.getHospitalStaffByUserId
);

// Update hospital staff profile
router.put(
  "/hospital-staff/by-user/:userId",
  [param("userId").isUUID().withMessage("Invalid user ID")],
  validate([]),
  authMiddleware.requireAuth,
  hospitalStaffController.updateHospitalStaff
);

export default router;
