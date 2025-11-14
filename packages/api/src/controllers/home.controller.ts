import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { HomeService } from "../services/home.service";
import { ApiResponse } from "../types";
import { AuthenticatedRequest } from "../types/auth";
import { UserRole } from "@carelink/types";

export class HomeController {
  private homeService: HomeService;

  constructor() {
    this.homeService = new HomeService();
  }

  // Create a new home for a provider
  async createHome(req: Request, res: Response): Promise<void> {
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

      const { providerId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;
      const homeData = req.body;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      // Only PROVIDER_OWNER can create homes
      if (user.role !== UserRole.PROVIDER_OWNER) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "Only provider owners can create homes",
        } as ApiResponse);
        return;
      }

      // Verify user has access to this provider
      if (!(await this.homeService.verifyProviderAccess(user.id, providerId))) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "You don't have access to this provider",
        } as ApiResponse);
        return;
      }

      const home = await this.homeService.createHome(providerId, homeData);

      res.status(201).json({
        success: true,
        data: home,
        message: "Home created successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Create home error:", error);
      res.status(500).json({
        success: false,
        error: "Home creation failed",
        message: "An error occurred while creating the home",
      } as ApiResponse);
    }
  }

  // Get all homes for a provider
  async getProviderHomes(req: Request, res: Response): Promise<void> {
    try {
      const { providerId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;
      const { page = 1, limit = 10, status, search } = req.query;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      // Verify user has access to this provider
      if (!(await this.homeService.verifyProviderAccess(user.id, providerId))) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "You don't have access to this provider",
        } as ApiResponse);
        return;
      }

      const homes = await this.homeService.getProviderHomes(providerId, {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as string,
        search: search as string,
      });

      res.status(200).json({
        success: true,
        data: homes,
        message: "Provider homes retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get provider homes error:", error);
      res.status(500).json({
        success: false,
        error: "Home retrieval failed",
        message: "An error occurred while retrieving homes",
      } as ApiResponse);
    }
  }

  // Get a specific home by ID
  async getHomeById(req: Request, res: Response): Promise<void> {
    try {
      const { homeId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const home = await this.homeService.getHomeById(homeId, user.id);

      if (!home) {
        res.status(404).json({
          success: false,
          error: "Home not found",
          message: "Home not found or you don't have access to it",
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: home,
        message: "Home retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get home by ID error:", error);
      res.status(500).json({
        success: false,
        error: "Home retrieval failed",
        message: "An error occurred while retrieving the home",
      } as ApiResponse);
    }
  }

  // Update a home
  async updateHome(req: Request, res: Response): Promise<void> {
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

      const { homeId } = req.params;
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

      // Only PROVIDER_OWNER can update homes
      if (user.role !== UserRole.PROVIDER_OWNER) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "Only provider owners can update homes",
        } as ApiResponse);
        return;
      }

      const home = await this.homeService.updateHome(
        homeId,
        updateData,
        user.id
      );

      if (!home) {
        res.status(404).json({
          success: false,
          error: "Home not found",
          message: "Home not found or you don't have access to it",
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: home,
        message: "Home updated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Update home error:", error);
      res.status(500).json({
        success: false,
        error: "Home update failed",
        message: "An error occurred while updating the home",
      } as ApiResponse);
    }
  }

  // Delete a home
  async deleteHome(req: Request, res: Response): Promise<void> {
    try {
      const { homeId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      // Only PROVIDER_OWNER can delete homes
      if (user.role !== UserRole.PROVIDER_OWNER) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "Only provider owners can delete homes",
        } as ApiResponse);
        return;
      }

      const success = await this.homeService.deleteHome(homeId, user.id);

      if (!success) {
        res.status(404).json({
          success: false,
          error: "Home not found",
          message: "Home not found or you don't have access to it",
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: "Home deleted successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Delete home error:", error);
      res.status(500).json({
        success: false,
        error: "Home deletion failed",
        message: "An error occurred while deleting the home",
      } as ApiResponse);
    }
  }

  // Get home services
  async getHomeServices(req: Request, res: Response): Promise<void> {
    try {
      const { homeId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const services = await this.homeService.getHomeServices(homeId, user.id);

      if (!services) {
        res.status(404).json({
          success: false,
          error: "Home not found",
          message: "Home not found or you don't have access to it",
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: services,
        message: "Home services retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get home services error:", error);
      res.status(500).json({
        success: false,
        error: "Service retrieval failed",
        message: "An error occurred while retrieving home services",
      } as ApiResponse);
    }
  }

  // Update home services
  async updateHomeServices(req: Request, res: Response): Promise<void> {
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

      const { homeId } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;
      const { serviceIds } = req.body;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      // Only PROVIDER_OWNER can update home services
      if (user.role !== UserRole.PROVIDER_OWNER) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "Only provider owners can update home services",
        } as ApiResponse);
        return;
      }

      const success = await this.homeService.updateHomeServices(
        homeId,
        serviceIds,
        user.id
      );

      if (!success) {
        res.status(404).json({
          success: false,
          error: "Home not found",
          message: "Home not found or you don't have access to it",
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: "Home services updated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Update home services error:", error);
      res.status(500).json({
        success: false,
        error: "Service update failed",
        message: "An error occurred while updating home services",
      } as ApiResponse);
    }
  }
}
