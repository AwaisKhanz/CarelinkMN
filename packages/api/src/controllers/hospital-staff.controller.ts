import { Request, Response } from "express";
import { HospitalStaffService } from "../services/hospital-staff.service";
import { ApiResponse, AuthenticatedRequest } from "../types";

export class HospitalStaffController {
  private hospitalStaffService: HospitalStaffService;

  constructor() {
    this.hospitalStaffService = new HospitalStaffService();
  }

  // Get hospital staff by user ID
  getHospitalStaffByUserId = async (req: Request, res: Response): Promise<void> => {
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

      // Users can only access their own hospital staff profile
      if (user.id !== userId) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "You can only access your own hospital staff profile",
        } as ApiResponse);
        return;
      }

      const hospitalStaff = await this.hospitalStaffService.getHospitalStaffByUserId(userId);

      if (!hospitalStaff) {
        res.status(404).json({
          success: false,
          error: "Hospital Staff not found",
          message: "No hospital staff profile found for this user",
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: hospitalStaff,
        message: "Hospital staff profile retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get hospital staff by user ID error:", error);
      res.status(500).json({
        success: false,
        error: "Hospital staff retrieval failed",
        message: "An error occurred while retrieving the hospital staff profile",
      } as ApiResponse);
    }
  }

  // Update hospital staff profile
  updateHospitalStaff = async (req: Request, res: Response): Promise<void> => {
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

      // Users can only update their own hospital staff profile
      if (user.id !== userId) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "You can only update your own hospital staff profile",
        } as ApiResponse);
        return;
      }

      const hospitalStaff = await this.hospitalStaffService.updateHospitalStaff(userId, updateData);

      res.status(200).json({
        success: true,
        data: hospitalStaff,
        message: "Hospital staff profile updated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Update hospital staff error:", error);
      res.status(500).json({
        success: false,
        error: "Hospital staff update failed",
        message: "An error occurred while updating the hospital staff profile",
      } as ApiResponse);
    }
  }
}
