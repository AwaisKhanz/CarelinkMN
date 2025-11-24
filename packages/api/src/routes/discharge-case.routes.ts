import { Router } from "express";
import { body, param, query } from "express-validator";
import { DischargeCaseController } from "../controllers/discharge-case.controller";
import { TransportBookingController } from "../controllers/transport-booking.controller";
import { ConsentController } from "../controllers/consent.controller";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { DischargeStatus, Payer, Gender, BookingStatus, ConsentType, CaptureMethod } from "@carelink/types";
import { HOSPITAL_SW_PERMISSIONS } from "../lib/rbac";

const router: Router = Router();
const dischargeCaseController = new DischargeCaseController();
const authMiddleware = new AuthMiddleware();

// All routes require authentication
router.use(authMiddleware.requireAuth);

// Discharge Case CRUD operations
// Create discharge case
router.post(
  "/discharge-cases",
  authMiddleware.requirePermission(HOSPITAL_SW_PERMISSIONS.DISCHARGE_CASES_CREATE),
  [
    body("hospitalId").isUUID().withMessage("Hospital ID must be a valid UUID"),
    body("patientInitials")
      .isLength({ min: 2, max: 2 })
      .matches(/^[A-Z]{2}$/)
      .withMessage("Patient initials must be exactly 2 uppercase letters"),
    body("patientAge")
      .isInt({ min: 0, max: 120 })
      .withMessage("Patient age must be between 0 and 120"),
    body("patientGender")
      .isIn(Object.values(Gender))
      .withMessage("Invalid patient gender"),
    body("diagnosisCodes")
      .isArray({ min: 1 })
      .withMessage("At least one diagnosis code is required"),
    body("diagnosisCodes.*")
      .isString()
      .notEmpty()
      .withMessage("Each diagnosis code must be a non-empty string"),
    body("mobilityStatus")
      .isString()
      .notEmpty()
      .withMessage("Mobility status is required"),
    body("cognitiveStatus")
      .optional()
      .isString()
      .withMessage("Cognitive status must be a string"),
    body("behavioralConcerns")
      .optional()
      .isArray()
      .withMessage("Behavioral concerns must be an array"),
    body("behavioralConcerns.*")
      .optional()
      .isString()
      .withMessage("Each behavioral concern must be a string"),
    body("dmeNeeds")
      .optional()
      .isArray()
      .withMessage("DME needs must be an array"),
    body("dmeNeeds.*")
      .optional()
      .isString()
      .withMessage("Each DME need must be a string"),
    body("medicationManagement")
      .isBoolean()
      .withMessage("Medication management must be a boolean"),
    body("currentLocation")
      .isString()
      .notEmpty()
      .withMessage("Current location is required"),
    body("targetDischargeDate")
      .isISO8601()
      .withMessage("Target discharge date must be a valid ISO 8601 date"),
    body("preferredCounties")
      .isArray({ min: 1 })
      .withMessage("At least one preferred county is required"),
    body("preferredCounties.*")
      .isString()
      .notEmpty()
      .withMessage("Each preferred county must be a non-empty string"),
    body("preferredCities")
      .optional()
      .isArray()
      .withMessage("Preferred cities must be an array"),
    body("preferredCities.*")
      .optional()
      .isString()
      .withMessage("Each preferred city must be a string"),
    body("requiresProximity")
      .optional()
      .isBoolean()
      .withMessage("Requires proximity must be a boolean"),
    body("proximityZipCode")
      .optional({ values: "falsy" })
      .custom((value, { req }) => {
        // Only validate if requiresProximity is true
        if (req.body.requiresProximity === true) {
          if (!value || value.trim() === "") {
            throw new Error("Proximity zip code is required when proximity is required");
          }
          if (!/^\d{5}(-\d{4})?$/.test(value)) {
            throw new Error("Proximity zip code must be a valid ZIP code");
          }
        }
        // If requiresProximity is false or not set, allow empty/null/undefined
        return true;
      }),
    body("maxDistanceMiles")
      .optional({ values: "falsy" })
      .custom((value, { req }) => {
        // Only validate if requiresProximity is true
        if (req.body.requiresProximity === true && value !== undefined && value !== null) {
          if (!Number.isInteger(value) || value < 1) {
            throw new Error("Max distance must be a positive integer");
          }
        }
        return true;
      }),
    body("primaryInsurance")
      .isIn(Object.values(Payer))
      .withMessage("Invalid primary insurance"),
    body("secondaryInsurance")
      .optional({ values: "falsy" })
      .isIn(Object.values(Payer))
      .withMessage("Invalid secondary insurance"),
    body("needsTransport")
      .optional()
      .isBoolean()
      .withMessage("Needs transport must be a boolean"),
    body("transportType")
      .optional({ values: "falsy" })
      .custom((value, { req }) => {
        // Only validate if needsTransport is true
        if (req.body.needsTransport === true) {
          if (!value || value.trim() === "") {
            throw new Error("Transport type is required when transport is needed");
          }
        }
        // If needsTransport is false or not set, allow empty/null/undefined
        return true;
      }),
  ],
  validate([]),
  dischargeCaseController.createDischargeCase
);

// Get all discharge cases
router.get(
  "/discharge-cases",
  authMiddleware.requirePermission(HOSPITAL_SW_PERMISSIONS.DISCHARGE_CASES_VIEW),
  [
    query("status")
      .optional()
      .isIn(Object.values(DischargeStatus))
      .withMessage("Invalid discharge status"),
    query("hospitalId")
      .optional()
      .isUUID()
      .withMessage("Hospital ID must be a valid UUID"),
    query("socialWorkerId")
      .optional()
      .isUUID()
      .withMessage("Social worker ID must be a valid UUID"),
    query("search")
      .optional()
      .isString()
      .withMessage("Search must be a string"),
    query("targetDischargeDateFrom")
      .optional()
      .isISO8601()
      .withMessage("Target discharge date from must be a valid ISO 8601 date"),
    query("targetDischargeDateTo")
      .optional()
      .isISO8601()
      .withMessage("Target discharge date to must be a valid ISO 8601 date"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
  ],
  validate([]),
  dischargeCaseController.getDischargeCases
);

// Get discharge case by ID
router.get(
  "/discharge-cases/:id",
  authMiddleware.requirePermission(HOSPITAL_SW_PERMISSIONS.DISCHARGE_CASES_VIEW),
  [
    param("id").isUUID().withMessage("Discharge case ID must be a valid UUID"),
  ],
  validate([]),
  dischargeCaseController.getDischargeCaseById
);

// Update discharge case
router.put(
  "/discharge-cases/:id",
  authMiddleware.requirePermission(HOSPITAL_SW_PERMISSIONS.DISCHARGE_CASES_UPDATE),
  [
    param("id").isUUID().withMessage("Discharge case ID must be a valid UUID"),
    body("patientInitials")
      .optional()
      .isLength({ min: 2, max: 2 })
      .matches(/^[A-Z]{2}$/)
      .withMessage("Patient initials must be exactly 2 uppercase letters"),
    body("patientAge")
      .optional()
      .isInt({ min: 0, max: 120 })
      .withMessage("Patient age must be between 0 and 120"),
    body("patientGender")
      .optional()
      .isIn(Object.values(Gender))
      .withMessage("Invalid patient gender"),
    body("diagnosisCodes")
      .optional()
      .isArray({ min: 1 })
      .withMessage("At least one diagnosis code is required"),
    body("mobilityStatus")
      .optional()
      .isString()
      .notEmpty()
      .withMessage("Mobility status is required"),
    body("status")
      .optional()
      .isIn(Object.values(DischargeStatus))
      .withMessage("Invalid discharge status"),
    body("targetDischargeDate")
      .optional()
      .isISO8601()
      .withMessage("Target discharge date must be a valid ISO 8601 date"),
    body("actualDischargeDate")
      .optional()
      .isISO8601()
      .withMessage("Actual discharge date must be a valid ISO 8601 date"),
  ],
  validate([]),
  dischargeCaseController.updateDischargeCase
);

// Delete discharge case
router.delete(
  "/discharge-cases/:id",
  authMiddleware.requirePermission(HOSPITAL_SW_PERMISSIONS.DISCHARGE_CASES_DELETE),
  [
    param("id").isUUID().withMessage("Discharge case ID must be a valid UUID"),
  ],
  validate([]),
  dischargeCaseController.deleteDischargeCase
);

// Get discharge case invitations
router.get(
  "/discharge-cases/:id/invitations",
  authMiddleware.requirePermission(HOSPITAL_SW_PERMISSIONS.DISCHARGE_CASES_VIEW),
  [
    param("id").isUUID().withMessage("Discharge case ID must be a valid UUID"),
  ],
  validate([]),
  dischargeCaseController.getDischargeCaseInvitations
);

// Send provider invitations
router.post(
  "/discharge-cases/:id/invitations",
  authMiddleware.requirePermission(HOSPITAL_SW_PERMISSIONS.PROVIDER_INVITATIONS_SEND),
  [
    param("id").isUUID().withMessage("Discharge case ID must be a valid UUID"),
    body("providerIds")
      .isArray({ min: 1 })
      .withMessage("At least one provider ID is required"),
    body("providerIds.*")
      .isUUID()
      .withMessage("Each provider ID must be a valid UUID"),
  ],
  validate([]),
  dischargeCaseController.sendProviderInvitations
);

// Get discharge checklist
router.get(
  "/discharge-cases/:id/checklist",
  authMiddleware.requirePermission(HOSPITAL_SW_PERMISSIONS.CHECKLISTS_MANAGE),
  [
    param("id").isUUID().withMessage("Discharge case ID must be a valid UUID"),
  ],
  validate([]),
  dischargeCaseController.getDischargeChecklist
);

// Update discharge checklist
router.put(
  "/discharge-cases/:id/checklist",
  authMiddleware.requirePermission(HOSPITAL_SW_PERMISSIONS.CHECKLISTS_MANAGE),
  [
    param("id").isUUID().withMessage("Discharge case ID must be a valid UUID"),
    body("consentObtained")
      .optional()
      .isBoolean()
      .withMessage("Consent obtained must be a boolean"),
    body("insuranceVerified")
      .optional()
      .isBoolean()
      .withMessage("Insurance verified must be a boolean"),
    body("medsReconciled")
      .optional()
      .isBoolean()
      .withMessage("Meds reconciled must be a boolean"),
    body("equipmentOrdered")
      .optional()
      .isBoolean()
      .withMessage("Equipment ordered must be a boolean"),
    body("transportArranged")
      .optional()
      .isBoolean()
      .withMessage("Transport arranged must be a boolean"),
    body("patientEducated")
      .optional()
      .isBoolean()
      .withMessage("Patient educated must be a boolean"),
    body("documentsSent")
      .optional()
      .isBoolean()
      .withMessage("Documents sent must be a boolean"),
    body("followUpScheduled")
      .optional()
      .isBoolean()
      .withMessage("Follow up scheduled must be a boolean"),
    body("day1Contact")
      .optional()
      .isBoolean()
      .withMessage("Day 1 contact must be a boolean"),
    body("day2Contact")
      .optional()
      .isBoolean()
      .withMessage("Day 2 contact must be a boolean"),
    body("day7Contact")
      .optional()
      .isBoolean()
      .withMessage("Day 7 contact must be a boolean"),
    body("day30Contact")
      .optional()
      .isBoolean()
      .withMessage("Day 30 contact must be a boolean"),
  ],
  validate([]),
  dischargeCaseController.updateDischargeChecklist
);

// Trigger AI matching
router.post(
  "/discharge-cases/:id/ai-matching",
  authMiddleware.requirePermission(HOSPITAL_SW_PERMISSIONS.AI_MATCHING_USE),
  [
    param("id").isUUID().withMessage("Discharge case ID must be a valid UUID"),
  ],
  validate([]),
  dischargeCaseController.triggerAIMatching
);

const transportBookingController = new TransportBookingController();
const consentController = new ConsentController();

// Transport Booking routes
// Get transport booking by discharge case ID
router.get(
  "/discharge-cases/:dischargeCaseId/transport-booking",
  authMiddleware.requirePermission(HOSPITAL_SW_PERMISSIONS.NEMT_BOOKING_MANAGE),
  [
    param("dischargeCaseId")
      .isUUID()
      .withMessage("Discharge case ID must be a valid UUID"),
  ],
  validate([]),
  transportBookingController.getTransportBookingByDischargeCaseId
);

// Create transport booking
router.post(
  "/discharge-cases/:dischargeCaseId/transport-booking",
  authMiddleware.requirePermission(HOSPITAL_SW_PERMISSIONS.NEMT_BOOKING_MANAGE),
  [
    param("dischargeCaseId")
      .isUUID()
      .withMessage("Discharge case ID must be a valid UUID"),
    body("vendorId").isUUID().withMessage("Vendor ID must be a valid UUID"),
    body("pickupAddress")
      .isString()
      .notEmpty()
      .withMessage("Pickup address is required"),
    body("pickupTime")
      .isISO8601()
      .withMessage("Pickup time must be a valid ISO 8601 date"),
    body("dropoffAddress")
      .isString()
      .notEmpty()
      .withMessage("Dropoff address is required"),
    body("vehicleType")
      .isString()
      .isIn(["AMBULANCE", "WHEELCHAIR_VAN", "SEDAN"])
      .withMessage("Vehicle type must be AMBULANCE, WHEELCHAIR_VAN, or SEDAN"),
    body("equipmentNeeded")
      .optional()
      .isArray()
      .withMessage("Equipment needed must be an array"),
    body("attendantRequired")
      .optional()
      .isBoolean()
      .withMessage("Attendant required must be a boolean"),
    body("estimatedCost")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Estimated cost must be a positive number"),
    body("payerType")
      .isIn(Object.values(Payer))
      .withMessage("Invalid payer type"),
  ],
  validate([]),
  transportBookingController.createTransportBooking
);

// Update transport booking
router.put(
  "/transport-bookings/:id",
  authMiddleware.requirePermission(HOSPITAL_SW_PERMISSIONS.NEMT_BOOKING_MANAGE),
  [
    param("id").isUUID().withMessage("Transport booking ID must be a valid UUID"),
    body("status")
      .optional()
      .isIn(Object.values(BookingStatus))
      .withMessage("Invalid booking status"),
    body("pickupTime")
      .optional()
      .isISO8601()
      .withMessage("Pickup time must be a valid ISO 8601 date"),
    body("estimatedCost")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Estimated cost must be a positive number"),
    body("actualCost")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Actual cost must be a positive number"),
  ],
  validate([]),
  transportBookingController.updateTransportBooking
);

// Delete transport booking
router.delete(
  "/transport-bookings/:id",
  authMiddleware.requirePermission(HOSPITAL_SW_PERMISSIONS.NEMT_BOOKING_MANAGE),
  [
    param("id").isUUID().withMessage("Transport booking ID must be a valid UUID"),
  ],
  validate([]),
  transportBookingController.deleteTransportBooking
);

// Consent routes
// Get consent by discharge case ID
router.get(
  "/discharge-cases/:dischargeCaseId/consent",
  authMiddleware.requirePermission(HOSPITAL_SW_PERMISSIONS.CONSENT_MANAGE),
  [
    param("dischargeCaseId")
      .isUUID()
      .withMessage("Discharge case ID must be a valid UUID"),
  ],
  validate([]),
  consentController.getConsentByDischargeCaseId
);

// Create consent
router.post(
  "/discharge-cases/:dischargeCaseId/consent",
  authMiddleware.requirePermission(HOSPITAL_SW_PERMISSIONS.CONSENT_MANAGE),
  [
    param("dischargeCaseId")
      .isUUID()
      .withMessage("Discharge case ID must be a valid UUID"),
    body("consentType")
      .isIn(Object.values(ConsentType))
      .withMessage("Invalid consent type"),
    body("consentVersion")
      .isString()
      .notEmpty()
      .withMessage("Consent version is required"),
    body("captureMethod")
      .isIn(Object.values(CaptureMethod))
      .withMessage("Invalid capture method"),
    body("witnessName")
      .optional()
      .isString()
      .withMessage("Witness name must be a string"),
    body("witnessTitle")
      .optional()
      .isString()
      .withMessage("Witness title must be a string"),
    body("signatureData")
      .optional()
      .isString()
      .withMessage("Signature data must be a string"),
    body("expiresAt")
      .optional()
      .isISO8601()
      .withMessage("Expires at must be a valid ISO 8601 date"),
  ],
  validate([]),
  consentController.createConsent
);

// Update consent
router.put(
  "/consents/:id",
  authMiddleware.requirePermission(HOSPITAL_SW_PERMISSIONS.CONSENT_MANAGE),
  [
    param("id").isUUID().withMessage("Consent ID must be a valid UUID"),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("Is active must be a boolean"),
    body("revokedAt")
      .optional()
      .isISO8601()
      .withMessage("Revoked at must be a valid ISO 8601 date"),
    body("revokedReason")
      .optional()
      .isString()
      .withMessage("Revoked reason must be a string"),
  ],
  validate([]),
  consentController.updateConsent
);

// Get Hospital SW analytics
router.get(
  "/hospital-sw/analytics",
  authMiddleware.requirePermission(HOSPITAL_SW_PERMISSIONS.ANALYTICS_VIEW),
  [
    query("startDate")
      .optional()
      .isISO8601()
      .withMessage("Start date must be a valid ISO 8601 date"),
    query("endDate")
      .optional()
      .isISO8601()
      .withMessage("End date must be a valid ISO 8601 date"),
  ],
  validate([]),
  dischargeCaseController.getHospitalSWAnalytics.bind(dischargeCaseController)
);

// Discharge case matching endpoints
// Get match score for a specific provider - Hospital SW can view scores
router.get(
  "/discharge-cases/:id/match/:providerId",
  authMiddleware.requirePermission(HOSPITAL_SW_PERMISSIONS.DISCHARGE_CASES_VIEW),
  [
    param("id").isUUID().withMessage("Discharge case ID must be a valid UUID"),
    param("providerId").isUUID().withMessage("Provider ID must be a valid UUID"),
  ],
  validate([]),
  dischargeCaseController.getProviderMatchScore.bind(dischargeCaseController)
);

// Get top-matched providers for a discharge case - Hospital SW can view
router.get(
  "/discharge-cases/:id/top-providers",
  authMiddleware.requirePermission(HOSPITAL_SW_PERMISSIONS.DISCHARGE_CASES_VIEW),
  [
    param("id").isUUID().withMessage("Discharge case ID must be a valid UUID"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
  ],
  validate([]),
  dischargeCaseController.getTopMatchedProviders.bind(dischargeCaseController)
);

export default router;

