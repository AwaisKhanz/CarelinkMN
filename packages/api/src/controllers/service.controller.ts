import { Request, Response } from "express";
import { ProviderService } from "../services/provider.service";
import { ApiResponse } from "../types/common";
import { AuthenticatedRequest } from "../types/auth";

export class ServiceController {
  private providerService: ProviderService;

  constructor() {
    this.providerService = new ProviderService();
    this.getAvailableServices = this.getAvailableServices.bind(this);
  }

  /**
   * Get all available services
   * GET /api/services?providerId=xxx
   * If providerId is provided, filters services based on provider's active licenses
   */
  async getAvailableServices(req: Request, res: Response): Promise<void> {
    try {
      const { providerId } = req.query;
      const user = (req as unknown as AuthenticatedRequest).user;

      // If providerId is provided, filter by provider licenses
      const services = await this.providerService.getAvailableServices(
        providerId as string | undefined,
        user?.id
      );

      res.status(200).json({
        success: true,
        data: services,
        message: "Services retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get available services error:", error);
      res.status(500).json({
        success: false,
        error: "Service retrieval failed",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while retrieving services",
      } as ApiResponse);
    }
  }
}

