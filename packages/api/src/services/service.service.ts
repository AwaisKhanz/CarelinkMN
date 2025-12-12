import { Request, Response } from 'express';
import { db } from "@carelink/database";
import { ApiResponse } from '@carelink/types';

export class ServiceService {
  // Get all services with license types
  async getAllServices(filters?: {
    category?: string;
    isActive?: boolean;
    includeInactive?: boolean;
  }): Promise<any[]> {
    const where: any = {};

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    } else if (!filters?.includeInactive) {
      where.isActive = true;
    }

    return db.service.findMany({
      where,
      include: {
        serviceLicenseTypes: {
          include: {
            licenseType: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  // Get service by ID
  async getServiceById(id: string): Promise<any> {
    const service = await db.service.findUnique({
      where: { id },
      include: {
        serviceLicenseTypes: {
          include: {
            licenseType: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (!service) {
      throw new Error('Service not found');
    }

    return service;
  }

  // Create service with license types
  async createService(data: {
    code: string;
    name: string;
    description?: string;
    category: string;
    licenseTypeIds: string[];
    isActive?: boolean;
  }): Promise<any> {
    // Check if service code already exists
    const existing = await db.service.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new Error('Service with this code already exists');
    }

    // Create service with license type associations
    const service = await db.service.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        category: data.category,
        isActive: data.isActive ?? true,
        serviceLicenseTypes: {
          create: data.licenseTypeIds.map((licenseTypeId) => ({
            licenseTypeId,
          })),
        },
      },
      include: {
        serviceLicenseTypes: {
          include: {
            licenseType: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    return service;
  }

  // Update service and license types
  async updateService(
    id: string,
    data: {
      name?: string;
      description?: string;
      category?: string;
      licenseTypeIds?: string[];
      isActive?: boolean;
    }
  ): Promise<any> {
    const service = await db.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new Error('Service not found');
    }

    // If licenseTypeIds provided, update associations
    if (data.licenseTypeIds !== undefined) {
      // Delete existing associations
      await db.serviceLicenseType.deleteMany({
        where: { serviceId: id },
      });

      // Create new associations
      if (data.licenseTypeIds.length > 0) {
        await db.serviceLicenseType.createMany({
          data: data.licenseTypeIds.map((licenseTypeId) => ({
            serviceId: id,
            licenseTypeId,
          })),
        });
      }
    }

    // Update service
    const updated = await db.service.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        isActive: data.isActive,
      },
      include: {
        serviceLicenseTypes: {
          include: {
            licenseType: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    return updated;
  }

  // Delete service
  async deleteService(id: string): Promise<void> {
    const service = await db.service.findUnique({
      where: { id },
      include: {
        providerServices: true,
        homeServices: true,
      },
    });

    if (!service) {
      throw new Error('Service not found');
    }

    // Check if service is in use
    if (service.providerServices.length > 0 || service.homeServices.length > 0) {
      throw new Error(
        'Cannot delete service that is currently assigned to providers or homes. Please remove all assignments first.'
      );
    }

    // Delete service (cascade will delete serviceLicenseTypes)
    await db.service.delete({
      where: { id },
    });
  }

  // Get services for a specific provider (filtered by their licenses)
  async getServicesForProvider(providerId: string): Promise<any[]> {
    // Get provider's active license types
    const licenses = await db.license.findMany({
      where: {
        providerId,
        status: 'ACTIVE',
      },
      select: {
        licenseTypeId: true,
      },
    });

    const licenseTypeIds = licenses.map((l) => l.licenseTypeId);

    if (licenseTypeIds.length === 0) {
      // No active licenses, return empty array
      return [];
    }

    // Get services that match ANY of the provider's license types
    return db.service.findMany({
      where: {
        isActive: true,
        serviceLicenseTypes: {
          some: {
            licenseTypeId: { in: licenseTypeIds },
          },
        },
      },
      include: {
        serviceLicenseTypes: {
          include: {
            licenseType: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  // Get service categories
  async getServiceCategories(): Promise<string[]> {
    const services = await db.service.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    return services.map((s) => s.category);
  }
}

export const serviceService = new ServiceService();
