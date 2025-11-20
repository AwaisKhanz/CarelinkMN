import { Request, Response } from "express";
import { TransportBookingService } from "../services/transport-booking.service";
import { ApiResponse, AuthenticatedRequest } from "../types";
import {
  CreateTransportBookingData,
  UpdateTransportBookingData,
} from "@carelink/types";

export class TransportBookingController {
  private transportBookingService: TransportBookingService;

  constructor() {
    this.transportBookingService = new TransportBookingService();
  }

  /**
   * Create transport booking
   */
  createTransportBooking = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as unknown as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const { dischargeCaseId } = req.params;
      const data = req.body as Omit<CreateTransportBookingData, "dischargeCaseId">;
      const transportBooking = await this.transportBookingService.createTransportBooking(
        user.id,
        {
          ...data,
          dischargeCaseId,
        }
      );

      res.status(201).json({
        success: true,
        data: transportBooking,
        message: "Transport booking created successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Create transport booking error:", error);
      const statusCode =
        error instanceof Error &&
        (error.message.includes("not found") ||
          error.message.includes("Access denied") ||
          error.message.includes("already exists"))
          ? 400
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Failed to create transport booking",
        message:
          error instanceof Error ? error.message : "An error occurred while creating transport booking",
      } as ApiResponse);
    }
  };

  /**
   * Get transport booking by discharge case ID
   */
  getTransportBookingByDischargeCaseId = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const user = (req as unknown as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const { dischargeCaseId } = req.params;
      const transportBooking =
        await this.transportBookingService.getTransportBookingByDischargeCaseId(
          dischargeCaseId,
          user.id
        );

      if (!transportBooking) {
        res.status(404).json({
          success: false,
          error: "Not Found",
          message: "Transport booking not found",
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: transportBooking,
      } as ApiResponse);
    } catch (error) {
      console.error("Get transport booking error:", error);
      const statusCode =
        error instanceof Error && error.message.includes("Access denied")
          ? 403
          : error instanceof Error && error.message.includes("not found")
          ? 404
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Failed to get transport booking",
        message:
          error instanceof Error ? error.message : "An error occurred while getting transport booking",
      } as ApiResponse);
    }
  };

  /**
   * Update transport booking
   */
  updateTransportBooking = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as unknown as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const { id } = req.params;
      const data = req.body as UpdateTransportBookingData;
      const transportBooking = await this.transportBookingService.updateTransportBooking(
        id,
        user.id,
        data
      );

      res.status(200).json({
        success: true,
        data: transportBooking,
        message: "Transport booking updated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Update transport booking error:", error);
      const statusCode =
        error instanceof Error &&
        (error.message.includes("not found") || error.message.includes("Access denied"))
          ? 400
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Failed to update transport booking",
        message:
          error instanceof Error ? error.message : "An error occurred while updating transport booking",
      } as ApiResponse);
    }
  };

  /**
   * Delete transport booking
   */
  deleteTransportBooking = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as unknown as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const { id } = req.params;
      await this.transportBookingService.deleteTransportBooking(id, user.id);

      res.status(200).json({
        success: true,
        message: "Transport booking deleted successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Delete transport booking error:", error);
      const statusCode =
        error instanceof Error &&
        (error.message.includes("not found") || error.message.includes("Access denied"))
          ? 400
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Failed to delete transport booking",
        message:
          error instanceof Error ? error.message : "An error occurred while deleting transport booking",
      } as ApiResponse);
    }
  };
}

