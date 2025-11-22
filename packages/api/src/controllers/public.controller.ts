import { Request, Response } from "express";
import { PublicService } from "../services/public.service";
import { ApiResponse, AuthenticatedRequest } from "../types";
import { PublicSearchParams, GetPublicProviderParams } from "@carelink/types";
import { validationResult } from "express-validator";

export class PublicController {
  private publicService: PublicService;

  constructor() {
    this.publicService = new PublicService();
  }

  /**
   * Public search for providers (no auth required)
   */
  searchProviders = async (req: Request, res: Response): Promise<void> => {
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

      // Parse query parameters
      const filters: PublicSearchParams = {
        search: req.query.search as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        sortBy: req.query.sortBy as any,
        viewMode: req.query.viewMode as any,
      };

      // Parse location
      if (req.query.locationType && req.query.locationValue) {
        filters.location = {
          type: req.query.locationType as "county" | "city" | "zip",
          value: req.query.locationValue as string,
          radius: req.query.radius
            ? parseInt(req.query.radius as string, 10)
            : undefined,
        };
      }

      // Parse arrays
      if (req.query.licenseTypes) {
        filters.licenseTypes = (req.query.licenseTypes as string).split(",");
      }

      if (req.query.serviceTypes) {
        filters.serviceTypes = (req.query.serviceTypes as string).split(",");
      }

      if (req.query.payers) {
        filters.payers = (req.query.payers as string).split(",") as any[];
      }

      // Parse accessibility
      if (
        req.query.wheelchairAccessible ||
        req.query.singleLevel ||
        req.query.hasElevator ||
        req.query.hasRollInShower
      ) {
        filters.accessibility = {
          wheelchairAccessible:
            req.query.wheelchairAccessible === "true"
              ? true
              : req.query.wheelchairAccessible === "false"
                ? false
                : undefined,
          singleLevel:
            req.query.singleLevel === "true"
              ? true
              : req.query.singleLevel === "false"
                ? false
                : undefined,
          hasElevator:
            req.query.hasElevator === "true"
              ? true
              : req.query.hasElevator === "false"
                ? false
                : undefined,
          hasRollInShower:
            req.query.hasRollInShower === "true"
              ? true
              : req.query.hasRollInShower === "false"
                ? false
                : undefined,
        };
      }

      // Parse availability
      if (req.query.availability === "open-only" || req.query.availability === "all") {
        filters.availability = req.query.availability;
      }

      // Parse verified
      if (req.query.verified === "true" || req.query.verified === "false") {
        filters.verified = req.query.verified === "true";
      }

      const result = await this.publicService.searchProviders(filters);

      res.status(200).json({
        success: true,
        data: result,
        message: "Providers retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Search providers error:", error);
      res.status(500).json({
        success: false,
        error: "Search failed",
        message: "An error occurred while searching providers",
      } as ApiResponse);
    }
  };

  /**
   * Get provider public profile (no auth required)
   */
  getProviderProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const { providerId } = req.params;

      // Optional user location for distance calculation
      const userLocation =
        req.query.lat && req.query.lon
          ? {
              lat: parseFloat(req.query.lat as string),
              lon: parseFloat(req.query.lon as string),
            }
          : undefined;

      const profile = await this.publicService.getProviderPublicProfile(
        providerId,
        userLocation
      );

      res.status(200).json({
        success: true,
        data: profile,
        message: "Provider profile retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get provider profile error:", error);
      if (error instanceof Error && error.message === "Provider not found") {
        res.status(404).json({
          success: false,
          error: "Provider not found",
          message: error.message,
        } as ApiResponse);
        return;
      }
      res.status(500).json({
        success: false,
        error: "Profile retrieval failed",
        message: "An error occurred while retrieving the provider profile",
      } as ApiResponse);
    }
  };

  /**
   * Get user's favorites (auth required)
   */
  getFavorites = async (req: Request, res: Response): Promise<void> => {
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

      const favorites = await this.publicService.getFavorites(user.id);

      res.status(200).json({
        success: true,
        data: {
          favorites,
          total: favorites.length,
        },
        message: "Favorites retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get favorites error:", error);
      res.status(500).json({
        success: false,
        error: "Favorites retrieval failed",
        message: "An error occurred while retrieving favorites",
      } as ApiResponse);
    }
  };

  /**
   * Add provider to favorites (auth required)
   */
  addFavorite = async (req: Request, res: Response): Promise<void> => {
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

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const { providerId } = req.body;

      if (!providerId) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          message: "Provider ID is required",
        } as ApiResponse);
        return;
      }

      const favorite = await this.publicService.addFavorite(user.id, providerId);

      res.status(201).json({
        success: true,
        data: favorite,
        message: "Provider added to favorites successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Add favorite error:", error);
      if (error instanceof Error && error.message === "Provider not found") {
        res.status(404).json({
          success: false,
          error: "Provider not found",
          message: error.message,
        } as ApiResponse);
        return;
      }
      res.status(500).json({
        success: false,
        error: "Add favorite failed",
        message: "An error occurred while adding favorite",
      } as ApiResponse);
    }
  };

  /**
   * Remove provider from favorites (auth required)
   */
  removeFavorite = async (req: Request, res: Response): Promise<void> => {
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

      const { favoriteId } = req.params;

      await this.publicService.removeFavorite(user.id, favoriteId);

      res.status(200).json({
        success: true,
        message: "Favorite removed successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Remove favorite error:", error);
      if (
        error instanceof Error &&
        (error.message === "Favorite not found" || error.message === "Unauthorized")
      ) {
        res.status(error.message === "Favorite not found" ? 404 : 403).json({
          success: false,
          error: error.message,
          message: error.message,
        } as ApiResponse);
        return;
      }
      res.status(500).json({
        success: false,
        error: "Remove favorite failed",
        message: "An error occurred while removing favorite",
      } as ApiResponse);
    }
  };

  /**
   * Parse natural language query using AI (CareBot)
   * Optional auth for rate limiting
   */
  parseQuery = async (req: Request, res: Response): Promise<void> => {
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

      const { query } = req.body;

      if (!query || typeof query !== "string") {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          message: "Query is required and must be a string",
        } as ApiResponse);
        return;
      }

      // Get user ID if authenticated (for rate limiting)
      const user = (req as unknown as AuthenticatedRequest).user;
      const userId = user?.id;

      const result = await this.publicService.parseNaturalLanguageQuery(
        query,
        userId
      );

      res.status(200).json({
        success: true,
        data: result,
        message: "Query parsed successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Parse query error:", error);
      res.status(500).json({
        success: false,
        error: "Query parsing failed",
        message: "An error occurred while parsing the query",
      } as ApiResponse);
    }
  };
}

