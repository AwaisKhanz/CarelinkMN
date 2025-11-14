import { Prisma } from "@prisma/client";
import { db } from "@carelink/database";
import { auditService } from "./audit.service";
import { AuditResult } from "@prisma/client";

export interface CreateLicenseData {
  licenseType: string;
  licenseNumber: string;
  issuingState: string;
  issueDate: Date;
  expirationDate: Date;
  documentUrl: string;
}

export interface VerifyLicenseData {
  status: "PENDING" | "ACTIVE" | "EXPIRED" | "SUSPENDED" | "REVOKED";
  verificationNotes?: string;
  verifiedBy: string;
}

export class LicenseService {
  // Create a new license
  async createLicense(providerId: string, data: CreateLicenseData, userId: string): Promise<any> {
    try {
      // Check if license already exists
      const existingLicense = await db.license.findFirst({
        where: {
          providerId,
          licenseNumber: data.licenseNumber,
          issuingState: data.issuingState,
        },
      });

      if (existingLicense) {
        throw new Error("License with this number already exists for this provider");
      }

      const license = await db.license.create({
        data: {
          providerId,
          licenseType: data.licenseType,
          licenseNumber: data.licenseNumber,
          issuingState: data.issuingState,
          issueDate: data.issueDate,
          expirationDate: data.expirationDate,
          documentUrl: data.documentUrl,
          status: "PENDING", // New licenses start as pending
        },
        include: {
          provider: {
            include: {
              organization: true,
            },
          },
        },
      });

      // Log audit event
      await auditService.logAuditEvent(
        userId,
        "license.create",
        "License",
        license.id,
        {
          providerId,
          licenseType: data.licenseType,
          licenseNumber: data.licenseNumber,
          issuingState: data.issuingState,
        },
        undefined,
        undefined,
        AuditResult.SUCCESS
      );

      return license;
    } catch (error) {
      console.error("Create license error:", error);
      throw new Error("Failed to create license");
    }
  }

  // Get license by ID
  async getLicense(id: string): Promise<any> {
    try {
      const license = await db.license.findUnique({
        where: { id },
        include: {
          provider: {
            include: {
              organization: true,
            },
          },
        },
      });

      return license;
    } catch (error) {
      console.error("Get license error:", error);
      throw new Error("Failed to retrieve license");
    }
  }

  // Update license
  async updateLicense(id: string, data: Partial<CreateLicenseData>, userId: string): Promise<any> {
    try {
      const license = await db.license.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          provider: {
            include: {
              organization: true,
            },
          },
        },
      });

      // Log audit event
      await auditService.logAuditEvent(
        userId,
        "license.update",
        "License",
        id,
        {
          updatedFields: Object.keys(data),
        },
        undefined,
        undefined,
        AuditResult.SUCCESS
      );

      return license;
    } catch (error) {
      console.error("Update license error:", error);
      throw new Error("Failed to update license");
    }
  }

  // Verify license
  async verifyLicense(id: string, data: VerifyLicenseData): Promise<any> {
    try {
      const license = await db.license.update({
        where: { id },
        data: {
          status: data.status,
          verifiedBy: data.verifiedBy,
          verifiedAt: new Date(),
          updatedAt: new Date(),
        },
        include: {
          provider: {
            include: {
              organization: true,
            },
          },
        },
      });

      // If license is approved, check if provider should be verified
      if (data.status === "ACTIVE") {
        await this.checkProviderVerification(license.providerId);
      }

      // Log audit event
      await auditService.logAuditEvent(
        data.verifiedBy,
        "license.verify",
        "License",
        id,
        {
          status: data.status,
        },
        undefined,
        undefined,
        AuditResult.SUCCESS
      );

      return license;
    } catch (error) {
      console.error("Verify license error:", error);
      throw new Error("Failed to verify license");
    }
  }

  // Get provider licenses
  async getProviderLicenses(providerId: string, filters: { status?: string } = {}): Promise<any[]> {
    try {
      const where: Prisma.LicenseWhereInput = {
        providerId,
      };

      if (filters.status) {
        where.status = filters.status as any;
      }

      const licenses = await db.license.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return licenses;
    } catch (error) {
      console.error("Get provider licenses error:", error);
      throw new Error("Failed to retrieve provider licenses");
    }
  }

  // Check if provider should be verified based on active licenses
  private async checkProviderVerification(providerId: string): Promise<void> {
    try {
      const activeLicenses = await db.license.count({
        where: {
          providerId,
          status: "ACTIVE",
        },
      });

      if (activeLicenses > 0) {
        // Check if provider is already verified
        const provider = await db.provider.findUnique({
          where: { id: providerId },
          select: { verified: true },
        });

        if (!provider?.verified) {
          await db.provider.update({
            where: { id: providerId },
            data: {
              verified: true,
              verifiedAt: new Date(),
            },
          });

          // Log audit event
          await auditService.logAuditEvent(
            "system", // System event
            "provider.auto_verify",
            "Provider",
            providerId,
            {
              reason: "Active license verified",
              activeLicensesCount: activeLicenses,
            },
            undefined,
            undefined,
            AuditResult.SUCCESS
          );
        }
      }
    } catch (error) {
      console.error("Check provider verification error:", error);
      // Don't throw here as this is a background process
    }
  }

  // Get expiring licenses
  async getExpiringLicenses(days: number = 30): Promise<any[]> {
    try {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + days);

      const licenses = await db.license.findMany({
        where: {
          status: "ACTIVE",
          expirationDate: {
            lte: expirationDate,
            gte: new Date(), // Not already expired
          },
        },
        include: {
          provider: {
            include: {
              organization: true,
            },
          },
        },
        orderBy: {
          expirationDate: 'asc',
        },
      });

      return licenses;
    } catch (error) {
      console.error("Get expiring licenses error:", error);
      throw new Error("Failed to retrieve expiring licenses");
    }
  }

  // Get expired licenses
  async getExpiredLicenses(): Promise<any[]> {
    try {
      const licenses = await db.license.findMany({
        where: {
          status: "ACTIVE",
          expirationDate: {
            lt: new Date(),
          },
        },
        include: {
          provider: {
            include: {
              organization: true,
            },
          },
        },
        orderBy: {
          expirationDate: 'desc',
        },
      });

      // Update expired licenses
      if (licenses.length > 0) {
        await db.license.updateMany({
          where: {
            id: {
              in: licenses.map(l => l.id),
            },
          },
          data: {
            status: "EXPIRED",
            updatedAt: new Date(),
          },
        });
      }

      return licenses;
    } catch (error) {
      console.error("Get expired licenses error:", error);
      throw new Error("Failed to retrieve expired licenses");
    }
  }

  // Validate license with external system (placeholder for MN state integration)
  async validateLicenseWithState(licenseNumber: string, issuingState: string): Promise<{
    valid: boolean;
    status?: string;
    expirationDate?: Date;
    details?: any;
  }> {
    try {
      // This would integrate with Minnesota state licensing system
      // For now, return a mock response
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock validation logic
      const isValid = licenseNumber.length >= 6 && issuingState === "MN";
      
      if (isValid) {
        return {
          valid: true,
          status: "ACTIVE",
          expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          details: {
            licenseType: "HEALTHCARE_FACILITY",
            facilityName: "Sample Healthcare Facility",
            address: "123 Healthcare St, Minneapolis, MN 55401",
          },
        };
      } else {
        return {
          valid: false,
          details: {
            error: "Invalid license number or state",
          },
        };
      }
    } catch (error) {
      console.error("Validate license with state error:", error);
      return {
        valid: false,
        details: {
          error: "Unable to validate license at this time",
        },
      };
    }
  }

  // Get license statistics
  async getLicenseStats(): Promise<{
    total: number;
    active: number;
    pending: number;
    expired: number;
    suspended: number;
    rejected: number;
    expiringSoon: number;
  }> {
    try {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const [
        total,
        active,
        pending,
        expired,
        suspended,
        rejected,
        expiringSoon,
      ] = await Promise.all([
        db.license.count(),
        db.license.count({ where: { status: "ACTIVE" } }),
        db.license.count({ where: { status: "PENDING" } }),
        db.license.count({ where: { status: "EXPIRED" } }),
        db.license.count({ where: { status: "SUSPENDED" } }),
        db.license.count({ where: { status: "REVOKED" } }),
        db.license.count({
          where: {
            status: "ACTIVE",
            expirationDate: {
              lte: thirtyDaysFromNow,
              gte: new Date(),
            },
          },
        }),
      ]);

      return {
        total,
        active,
        pending,
        expired,
        suspended,
        rejected,
        expiringSoon,
      };
    } catch (error) {
      console.error("Get license stats error:", error);
      throw new Error("Failed to retrieve license statistics");
    }
  }

  // Delete license
  async deleteLicense(id: string, userId: string): Promise<void> {
    try {
      // Check if license exists and verify access
      const license = await db.license.findUnique({
        where: { id },
        include: {
          provider: {
            include: {
              organization: {
                include: {
                  users: {
                    where: { id: userId },
                  },
                },
              },
            },
          },
        },
      });

      if (!license) {
        throw new Error("License not found");
      }

      // Verify user has access to this provider
      if (license.provider.organization.users.length === 0) {
        throw new Error("Access denied");
      }

      // Delete the license
      await db.license.delete({
        where: { id },
      });

      // Log audit event
      await auditService.logAuditEvent(
        userId,
        "license.delete",
        "License",
        id,
        {
          providerId: license.providerId,
          licenseNumber: license.licenseNumber,
        },
        undefined,
        undefined,
        AuditResult.SUCCESS
      );
    } catch (error) {
      console.error("Delete license error:", error);
      throw new Error("Failed to delete license");
    }
  }
}
