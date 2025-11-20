import { Request, Response } from "express";
import { VendorService } from "../services/vendor.service";
import { ApiResponse, AuthenticatedRequest } from "../types";
import { BookingStatus, LeadStatus } from "@carelink/types";

export class VendorController {
  private vendorService: VendorService;

  constructor() {
    this.vendorService = new VendorService();
  }

  // Get vendor by user ID
  getVendorByUserId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      // Users can only access their own vendor profile
      if (user.id !== userId) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "You can only access your own vendor profile",
        } as ApiResponse);
        return;
      }

      const vendor = await this.vendorService.getVendorByUserId(userId);

      if (!vendor) {
        res.status(404).json({
          success: false,
          error: "Vendor not found",
          message: "No vendor profile found for this user",
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: vendor,
        message: "Vendor profile retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get vendor by user ID error:", error);
      res.status(500).json({
        success: false,
        error: "Vendor retrieval failed",
        message: "An error occurred while retrieving the vendor profile",
      } as ApiResponse);
    }
  };

  // Get vendor by vendor ID
  getVendorById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { vendorId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      // Get vendor to verify user has access
      const vendor = await this.vendorService.getVendorByUserId(user.id);

      if (!vendor || vendor.id !== vendorId) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "You can only access your own vendor profile",
        } as ApiResponse);
        return;
      }

      const vendorData = await this.vendorService.getVendorById(vendorId);

      if (!vendorData) {
        res.status(404).json({
          success: false,
          error: "Vendor not found",
          message: "Vendor profile not found",
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: vendorData,
        message: "Vendor profile retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get vendor by ID error:", error);
      res.status(500).json({
        success: false,
        error: "Vendor retrieval failed",
        message: "An error occurred while retrieving the vendor profile",
      } as ApiResponse);
    }
  };

  // Update vendor profile
  updateVendor = async (req: Request, res: Response): Promise<void> => {
    try {
      const { vendorId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;
      const updateData = req.body;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      // Verify user has access to this vendor
      const vendor = await this.vendorService.getVendorByUserId(user.id);

      if (!vendor || vendor.id !== vendorId) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "You can only update your own vendor profile",
        } as ApiResponse);
        return;
      }

      const updatedVendor = await this.vendorService.updateVendor(
        vendorId,
        updateData
      );

      res.status(200).json({
        success: true,
        data: updatedVendor,
        message: "Vendor profile updated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Update vendor error:", error);
      res.status(500).json({
        success: false,
        error: "Vendor update failed",
        message: "An error occurred while updating the vendor profile",
      } as ApiResponse);
    }
  };

  // Get vendor leads
  getVendorLeads = async (req: Request, res: Response): Promise<void> => {
    try {
      const { vendorId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      // Verify user has access to this vendor
      const vendor = await this.vendorService.getVendorByUserId(user.id);

      if (!vendor || vendor.id !== vendorId) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "You can only access your own vendor leads",
        } as ApiResponse);
        return;
      }

      const params = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        status: req.query.status as LeadStatus | undefined,
        source: req.query.source as string | undefined,
        search: req.query.search as string | undefined,
      };

      const leads = await this.vendorService.getVendorLeads(vendorId, params);

      res.status(200).json({
        success: true,
        data: leads,
        message: "Vendor leads retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get vendor leads error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve vendor leads",
        message: "An error occurred while retrieving vendor leads",
      } as ApiResponse);
    }
  };

  // Update lead status
  updateLeadStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { vendorId, leadId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      // Verify user has access to this vendor
      const vendor = await this.vendorService.getVendorByUserId(user.id);

      if (!vendor || vendor.id !== vendorId) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "You can only update your own vendor leads",
        } as ApiResponse);
        return;
      }

      const updatedLead = await this.vendorService.updateLeadStatus(
        leadId,
        vendorId,
        req.body
      );

      res.status(200).json({
        success: true,
        data: updatedLead,
        message: "Lead status updated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Update lead status error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update lead status",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while updating lead status",
      } as ApiResponse);
    }
  };

  // Get vendor bookings
  getVendorBookings = async (req: Request, res: Response): Promise<void> => {
    try {
      const { vendorId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      // Verify user has access to this vendor
      const vendor = await this.vendorService.getVendorByUserId(user.id);

      if (!vendor || vendor.id !== vendorId) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "You can only access your own vendor bookings",
        } as ApiResponse);
        return;
      }

      const params = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        status: req.query.status as BookingStatus | undefined,
        search: req.query.search as string | undefined,
      };

      const bookings = await this.vendorService.getVendorBookings(
        vendorId,
        params
      );

      res.status(200).json({
        success: true,
        data: bookings,
        message: "Vendor bookings retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get vendor bookings error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve vendor bookings",
        message: "An error occurred while retrieving vendor bookings",
      } as ApiResponse);
    }
  };

  // Update booking status
  updateBookingStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { vendorId, bookingId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      // Verify user has access to this vendor
      const vendor = await this.vendorService.getVendorByUserId(user.id);

      if (!vendor || vendor.id !== vendorId) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "You can only update your own vendor bookings",
        } as ApiResponse);
        return;
      }

      const { status, ...updateData } = req.body;

      if (!status) {
        res.status(400).json({
          success: false,
          error: "Bad Request",
          message: "Status is required",
        } as ApiResponse);
        return;
      }

      const updatedBooking = await this.vendorService.updateBookingStatus(
        bookingId,
        vendorId,
        status as BookingStatus,
        updateData
      );

      res.status(200).json({
        success: true,
        data: updatedBooking,
        message: "Booking status updated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Update booking status error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update booking status",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while updating booking status",
      } as ApiResponse);
    }
  };

  // Get vendor analytics
  getVendorAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { vendorId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      // Verify user has access to this vendor
      const vendor = await this.vendorService.getVendorByUserId(user.id);

      if (!vendor || vendor.id !== vendorId) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "You can only access your own vendor analytics",
        } as ApiResponse);
        return;
      }

      const analytics = await this.vendorService.getVendorAnalytics(vendorId);

      res.status(200).json({
        success: true,
        data: analytics,
        message: "Vendor analytics retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get vendor analytics error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve vendor analytics",
        message: "An error occurred while retrieving vendor analytics",
      } as ApiResponse);
    }
  };
}
