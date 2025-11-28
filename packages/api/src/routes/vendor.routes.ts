import { Router } from "express";
import { param, query } from "express-validator";
import { VendorController } from "../controllers/vendor.controller";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { VENDOR_PERMISSIONS } from "../lib/rbac";
import { BookingStatus, LeadStatus } from "@carelink/types";

const router: Router = Router();
const vendorController = new VendorController();
const authMiddleware = new AuthMiddleware();

// Get vendor by user ID
router.get(
  "/vendors/by-user/:userId",
  [
    param("userId").isUUID().withMessage("Invalid user ID"),
  ],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(VENDOR_PERMISSIONS.DASHBOARD_VIEW),
  vendorController.getVendorByUserId
);

// Search/List vendors
router.get(
  "/vendors",
  [
    query("search").optional().isString().withMessage("Search must be a string"),
    query("organizationId").optional().isUUID().withMessage("Invalid organization ID"),
    query("category").optional().isString().withMessage("Category must be a string"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  ],
  validate([]),
  authMiddleware.requireAuth,
  vendorController.searchVendors
);

// Get vendor by vendor ID
router.get(
  "/vendors/:vendorId",
  [
    param("vendorId").isUUID().withMessage("Invalid vendor ID"),
  ],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(VENDOR_PERMISSIONS.DASHBOARD_VIEW),
  vendorController.getVendorById
);

// Update vendor profile
router.put(
  "/vendors/:vendorId",
  [
    param("vendorId").isUUID().withMessage("Invalid vendor ID"),
  ],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(VENDOR_PERMISSIONS.PROFILE_MANAGE),
  vendorController.updateVendor
);

// Get vendor leads
router.get(
  "/vendors/:vendorId/leads",
  [
    param("vendorId").isUUID().withMessage("Invalid vendor ID"),
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
    query("status").optional().isIn(Object.values(LeadStatus)).withMessage("Invalid lead status"),
    query("source").optional().isString().withMessage("Source must be a string"),
    query("search").optional().isString().withMessage("Search must be a string"),
  ],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(VENDOR_PERMISSIONS.LEADS_VIEW),
  vendorController.getVendorLeads
);

// Update lead status
router.put(
  "/vendors/:vendorId/leads/:leadId/status",
  [
    param("vendorId").isUUID().withMessage("Invalid vendor ID"),
    param("leadId").isUUID().withMessage("Invalid lead ID"),
  ],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(VENDOR_PERMISSIONS.LEADS_MANAGE),
  vendorController.updateLeadStatus
);

// Get vendor bookings
router.get(
  "/vendors/:vendorId/bookings",
  [
    param("vendorId").isUUID().withMessage("Invalid vendor ID"),
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
    query("status").optional().isIn(Object.values(BookingStatus)).withMessage("Invalid booking status"),
    query("search").optional().isString().withMessage("Search must be a string"),
  ],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(VENDOR_PERMISSIONS.BOOKINGS_VIEW),
  vendorController.getVendorBookings
);

// Update booking status
router.put(
  "/vendors/:vendorId/bookings/:bookingId/status",
  [
    param("vendorId").isUUID().withMessage("Invalid vendor ID"),
    param("bookingId").isUUID().withMessage("Invalid booking ID"),
  ],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(VENDOR_PERMISSIONS.BOOKINGS_MANAGE),
  vendorController.updateBookingStatus
);

// Get vendor analytics
router.get(
  "/vendors/:vendorId/analytics",
  [
    param("vendorId").isUUID().withMessage("Invalid vendor ID"),
  ],
  validate([]),
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(VENDOR_PERMISSIONS.ANALYTICS_VIEW),
  vendorController.getVendorAnalytics
);

export default router;
