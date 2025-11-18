import { Request, Response } from "express";
import { MessageTemplateService } from "../services/message-template.service";
import { ApiResponse, AuthenticatedRequest } from "../types";
import { validationResult } from "express-validator";

export class MessageTemplateController {
  private templateService: MessageTemplateService;

  constructor() {
    this.templateService = new MessageTemplateService();
    this.getTemplates = this.getTemplates.bind(this);
    this.getTemplateById = this.getTemplateById.bind(this);
    this.createTemplate = this.createTemplate.bind(this);
    this.updateTemplate = this.updateTemplate.bind(this);
    this.deleteTemplate = this.deleteTemplate.bind(this);
  }

  /**
   * Get all templates for the authenticated user
   * GET /api/message-templates
   */
  async getTemplates(req: Request, res: Response): Promise<void> {
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

      const includeOrganization =
        req.query.includeOrganization !== "false"; // Default to true

      const templates = await this.templateService.getTemplates(
        user.id,
        includeOrganization
      );

      res.status(200).json({
        success: true,
        data: templates,
        message: "Templates retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get templates error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve templates",
        message: "An error occurred while retrieving templates",
      } as ApiResponse);
    }
  }

  /**
   * Get template by ID
   * GET /api/message-templates/:id
   */
  async getTemplateById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const template = await this.templateService.getTemplateById(id, user.id);

      res.status(200).json({
        success: true,
        data: template,
        message: "Template retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get template by ID error:", error);
      const statusCode =
        error instanceof Error && error.message.includes("not found") ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: "Failed to retrieve template",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while retrieving the template",
      } as ApiResponse);
    }
  }

  /**
   * Create a new template
   * POST /api/message-templates
   */
  async createTemplate(req: Request, res: Response): Promise<void> {
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

      const template = await this.templateService.createTemplate(
        user.id,
        req.body
      );

      res.status(201).json({
        success: true,
        data: template,
        message: "Template created successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Create template error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create template",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while creating the template",
      } as ApiResponse);
    }
  }

  /**
   * Update a template
   * PUT /api/message-templates/:id
   */
  async updateTemplate(req: Request, res: Response): Promise<void> {
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

      const { id } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const template = await this.templateService.updateTemplate(
        id,
        user.id,
        req.body
      );

      res.status(200).json({
        success: true,
        data: template,
        message: "Template updated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Update template error:", error);
      const statusCode =
        error instanceof Error && error.message.includes("not found") ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: "Failed to update template",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while updating the template",
      } as ApiResponse);
    }
  }

  /**
   * Delete a template
   * DELETE /api/message-templates/:id
   */
  async deleteTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      await this.templateService.deleteTemplate(id, user.id);

      res.status(200).json({
        success: true,
        message: "Template deleted successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Delete template error:", error);
      const statusCode =
        error instanceof Error && error.message.includes("not found") ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: "Failed to delete template",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while deleting the template",
      } as ApiResponse);
    }
  }
}

