import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { AmenityService } from "../services/amenity.service";
import { ApiResponse } from "../types";
import { AuthenticatedRequest } from "../types/auth";

export class AmenityController {
  private amenityService: AmenityService;

  constructor() {
    this.amenityService = new AmenityService();
  }

  // Get all available amenities
  async getAmenities(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.query;

      const amenities = await this.amenityService.getAmenities(
        category as string
      );

      res.status(200).json({
        success: true,
        data: amenities,
        message: "Amenities retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get amenities error:", error);
      res.status(500).json({
        success: false,
        error: "Amenity retrieval failed",
        message: "An error occurred while retrieving amenities",
      } as ApiResponse);
    }
  }

  // Get amenity categories
  async getAmenityCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await this.amenityService.getAmenityCategories();

      res.status(200).json({
        success: true,
        data: categories,
        message: "Amenity categories retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get amenity categories error:", error);
      res.status(500).json({
        success: false,
        error: "Category retrieval failed",
        message: "An error occurred while retrieving amenity categories",
      } as ApiResponse);
    }
  }

  // Create a custom amenity for a provider
  async createCustomAmenity(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          message: "Please check your input data",
          details: errors.array(),
        } as ApiResponse);
        return;
      }

      const user = (req as unknown as AuthenticatedRequest).user;
      const { providerId } = req.params;
      const amenityData = req.body;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const amenity = await this.amenityService.createCustomAmenity(
        providerId,
        amenityData,
        user.id
      );

      res.status(201).json({
        success: true,
        data: amenity,
        message: "Custom amenity created successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Create custom amenity error:", error);
      res.status(500).json({
        success: false,
        error: "Amenity creation failed",
        message: "An error occurred while creating the custom amenity",
      } as ApiResponse);
    }
  }

  // Get custom amenities for a provider
  async getProviderCustomAmenities(req: Request, res: Response): Promise<void> {
    try {
      const { providerId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const amenities = await this.amenityService.getProviderCustomAmenities(
        providerId,
        user.id
      );

      res.status(200).json({
        success: true,
        data: amenities,
        message: "Provider custom amenities retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get provider custom amenities error:", error);
      res.status(500).json({
        success: false,
        error: "Amenity retrieval failed",
        message: "An error occurred while retrieving custom amenities",
      } as ApiResponse);
    }
  }
}
