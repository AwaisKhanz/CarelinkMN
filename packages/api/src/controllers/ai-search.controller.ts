import { Request, Response } from "express";
import { AISearchService } from "../services/ai-search.service";
import { ApiResponse } from "../types/common";
import { AuthenticatedRequest } from "../types/auth";
import { body, validationResult } from "express-validator";

export class AISearchController {
  private aiSearchService: AISearchService;

  constructor() {
    this.aiSearchService = new AISearchService();
    this.parseQuery = this.parseQuery.bind(this);
  }

  /**
   * Parse natural language query into structured filters
   * POST /api/ai-search/parse
   */
  async parseQuery(req: Request, res: Response): Promise<void> {
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

      const { query } = req.body;

      // Check rate limit
      const canProceed = await this.aiSearchService.checkRateLimit(user.id);
      if (!canProceed) {
        res.status(429).json({
          success: false,
          error: "Rate limit exceeded",
          message: "You have exceeded the rate limit of 10 queries per minute. Please try again later.",
        } as ApiResponse);
        return;
      }

      // Parse query
      const filters = await this.aiSearchService.parseQuery(query);

      // Track search
      await this.aiSearchService.trackSearch(user.id, query, filters);

      res.status(200).json({
        success: true,
        data: {
          query,
          filters,
          explanation: filters.explanation,
        },
        message: "Query parsed successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Parse query error:", error);
      res.status(500).json({
        success: false,
        error: "Query parsing failed",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while parsing the query",
      } as ApiResponse);
    }
  }
}

