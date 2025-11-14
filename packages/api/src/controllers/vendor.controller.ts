import { Request, Response } from "express";
import { VendorService } from "../services/vendor.service";
import { ApiResponse, AuthenticatedRequest } from "../types";

export class VendorController {
  private vendorService: VendorService;

  constructor() {
    this.vendorService = new VendorService();
  }

  // Get vendor by user ID
  async getVendorByUserId(req: Request, res: Response): Promise<void> {
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
  }

  // Update vendor profile
  async updateVendor(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
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

      // Users can only update their own vendor profile
      if (user.id !== userId) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "You can only update your own vendor profile",
        } as ApiResponse);
        return;
      }

      const vendor = await this.vendorService.updateVendor(userId, updateData);

      res.status(200).json({
        success: true,
        data: vendor,
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
  }
}
