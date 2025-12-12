import { Request, Response } from 'express';
import { serviceService } from '../services/service.service';
import { ApiResponse } from '@carelink/types';
import { AuthenticatedRequest } from '../types/auth';

export class ServiceController {
  constructor() {
    this.getAllServices = this.getAllServices.bind(this);
    this.getServiceById = this.getServiceById.bind(this);
    this.createService = this.createService.bind(this);
    this.updateService = this.updateService.bind(this);
    this.deleteService = this.deleteService.bind(this);
    this.getServicesForProvider = this.getServicesForProvider.bind(this);
    this.getServiceCategories = this.getServiceCategories.bind(this);
  }

  /**
   * Get all services
   * GET /api/services
   */
  async getAllServices(req: Request, res: Response): Promise<void> {
    try {
      const { category, isActive, includeInactive } = req.query;

      const services = await serviceService.getAllServices({
        category: category as string | undefined,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        includeInactive: includeInactive === 'true',
      });

      res.status(200).json({
        success: true,
        data: services,
        message: 'Services retrieved successfully',
      } as ApiResponse);
    } catch (error) {
      console.error('Get services error:', error);
      res.status(500).json({
        success: false,
        error: 'Service retrieval failed',
        message:
          error instanceof Error
            ? error.message
            : 'An error occurred while retrieving services',
      } as ApiResponse);
    }
  }

  /**
   * Get service by ID
   * GET /api/services/:id
   */
  async getServiceById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const service = await serviceService.getServiceById(id);

      res.status(200).json({
        success: true,
        data: service,
        message: 'Service retrieved successfully',
      } as ApiResponse);
    } catch (error) {
      console.error('Get service error:', error);
      const statusCode = error instanceof Error && error.message === 'Service not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: 'Service retrieval failed',
        message:
          error instanceof Error
            ? error.message
            : 'An error occurred while retrieving the service',
      } as ApiResponse);
    }
  }

  /**
   * Create service
   * POST /api/services
   */
  async createService(req: Request, res: Response): Promise<void> {
    try {
      const { code, name, description, category, licenseTypeIds, isActive } = req.body;

      const service = await serviceService.createService({
        code,
        name,
        description,
        category,
        licenseTypeIds: licenseTypeIds || [],
        isActive,
      });

      res.status(201).json({
        success: true,
        data: service,
        message: 'Service created successfully',
      } as ApiResponse);
    } catch (error) {
      console.error('Create service error:', error);
      const statusCode = error instanceof Error && error.message.includes('already exists') ? 409 : 500;
      res.status(statusCode).json({
        success: false,
        error: 'Service creation failed',
        message:
          error instanceof Error
            ? error.message
            : 'An error occurred while creating the service',
      } as ApiResponse);
    }
  }

  /**
   * Update service
   * PUT /api/services/:id
   */
  async updateService(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, category, licenseTypeIds, isActive } = req.body;

      const service = await serviceService.updateService(id, {
        name,
        description,
        category,
        licenseTypeIds,
        isActive,
      });

      res.status(200).json({
        success: true,
        data: service,
        message: 'Service updated successfully',
      } as ApiResponse);
    } catch (error) {
      console.error('Update service error:', error);
      const statusCode = error instanceof Error && error.message === 'Service not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: 'Service update failed',
        message:
          error instanceof Error
            ? error.message
            : 'An error occurred while updating the service',
      } as ApiResponse);
    }
  }

  /**
   * Delete service
   * DELETE /api/services/:id
   */
  async deleteService(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await serviceService.deleteService(id);

      res.status(200).json({
        success: true,
        message: 'Service deleted successfully',
      } as ApiResponse);
    } catch (error) {
      console.error('Delete service error:', error);
      const statusCode = error instanceof Error && error.message === 'Service not found' 
        ? 404 
        : error instanceof Error && error.message.includes('Cannot delete')
        ? 409
        : 500;
      res.status(statusCode).json({
        success: false,
        error: 'Service deletion failed',
        message:
          error instanceof Error
            ? error.message
            : 'An error occurred while deleting the service',
      } as ApiResponse);
    }
  }

  /**
   * Get services for provider (filtered by licenses)
   * GET /api/services/provider/:providerId
   */
  async getServicesForProvider(req: Request, res: Response): Promise<void> {
    try {
      const { providerId } = req.params;
      const services = await serviceService.getServicesForProvider(providerId);

      res.status(200).json({
        success: true,
        data: services,
        message: 'Services retrieved successfully',
      } as ApiResponse);
    } catch (error) {
      console.error('Get provider services error:', error);
      res.status(500).json({
        success: false,
        error: 'Service retrieval failed',
        message:
          error instanceof Error
            ? error.message
            : 'An error occurred while retrieving services',
      } as ApiResponse);
    }
  }

  /**
   * Get service categories
   * GET /api/services/categories
   */
  async getServiceCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await serviceService.getServiceCategories();

      res.status(200).json({
        success: true,
        data: categories,
        message: 'Service categories retrieved successfully',
      } as ApiResponse);
    } catch (error) {
      console.error('Get service categories error:', error);
      res.status(500).json({
        success: false,
        error: 'Category retrieval failed',
        message:
          error instanceof Error
            ? error.message
            : 'An error occurred while retrieving categories',
      } as ApiResponse);
    }
  }
}
