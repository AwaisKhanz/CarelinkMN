import { Prisma } from "@prisma/client";
import { db } from "@carelink/database";
import { auditService } from "./audit.service";
import { AuditResult } from "@prisma/client";
import { isServiceAllowedForProvider } from "./util/service-licenses";
import { UserRole, UserStatus } from "@carelink/types";
import crypto from "crypto";

export interface CreateProviderData {
  organizationId: string;
  primaryLicenseType: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  acceptsReferrals?: boolean;
  responseTimeHours?: number;
}

export interface UpdateProviderData {
  description?: string;
  logo?: string;
  coverImage?: string;
  acceptsReferrals?: boolean;
  responseTimeHours?: number;
  verified?: boolean;
  verificationNotes?: string;
}

export interface ProviderQueryOptions {
  includeHomes?: boolean;
  includeServices?: boolean;
  includeOpenings?: boolean;
}

export class ProviderService {
  // Verify user has access to provider
  async verifyProviderAccess(
    userId: string,
    providerId: string
  ): Promise<boolean> {
    try {
      const provider = await db.provider.findFirst({
        where: {
          id: providerId,
          organization: {
            users: {
              some: {
                id: userId,
              },
            },
          },
        },
      });

      return !!provider;
    } catch (error) {
      console.error("Verify provider access error:", error);
      return false;
    }
  }

  // Create a new provider
  async createProvider(data: CreateProviderData): Promise<any> {
    try {
      const provider = await db.provider.create({
        data: {
          organizationId: data.organizationId,
          primaryLicenseType: data.primaryLicenseType,
          description: data.description,
          logo: data.logo,
          coverImage: data.coverImage,
          acceptsReferrals: data.acceptsReferrals ?? true,
          responseTimeHours: data.responseTimeHours,
          verified: false, // New providers start unverified
        },
        include: {
          organization: true,
          licenses: true,
        },
      });

      // Log audit event
      await auditService.logAuditEvent(
        "system", // No user ID for system events
        "provider.create",
        "Provider",
        provider.id,
        {
          organizationId: data.organizationId,
          primaryLicenseType: data.primaryLicenseType,
        },
        undefined,
        undefined,
        AuditResult.SUCCESS
      );

      return provider;
    } catch (error) {
      console.error("Create provider error:", error);
      throw new Error("Failed to create provider");
    }
  }

  // Get provider by ID with optional includes
  async getProvider(
    id: string,
    options: ProviderQueryOptions = {}
  ): Promise<any> {
    try {
      const include: Prisma.ProviderInclude = {
        organization: true,
        licenses: true,
      };

      if (options.includeHomes) {
        include.homes = {
          include: {
            photos: true,
            services: {
              include: {
                service: true,
              },
            },
            amenities: true,
          },
        };
      }

      if (options.includeServices) {
        include.services = {
          include: {
            service: true,
          },
        };
      }

      if (options.includeOpenings) {
        include.openings = {
          where: {
            status: "OPEN",
          },
          include: {
            home: true,
          },
        };
      }

      const provider = await db.provider.findUnique({
        where: { id },
        include,
      });

      return provider;
    } catch (error) {
      console.error("Get provider error:", error);
      throw new Error("Failed to retrieve provider");
    }
  }

  // Update provider
  async updateProvider(
    id: string,
    data: UpdateProviderData,
    userId: string
  ): Promise<any> {
    try {
      const provider = await db.provider.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          organization: true,
          licenses: true,
        },
      });

      // Log audit event
      await auditService.logAuditEvent(
        userId,
        "provider.update",
        "Provider",
        id,
        {
          updatedFields: Object.keys(data),
        },
        undefined,
        undefined,
        AuditResult.SUCCESS
      );

      return provider;
    } catch (error) {
      console.error("Update provider error:", error);
      throw new Error("Failed to update provider");
    }
  }

  // Get provider public profile (optimized for public viewing)
  async getProviderPublicProfile(id: string): Promise<any> {
    try {
      const provider = await db.provider.findUnique({
        where: {
          id,
          verified: true, // Only show verified providers publicly
        },
        select: {
          id: true,
          primaryLicenseType: true,
          description: true,
          logo: true,
          coverImage: true,
          acceptsReferrals: true,
          responseTimeHours: true,
          verified: true,
          verifiedAt: true,
          createdAt: true,
          organization: {
            select: {
              id: true,
              name: true,
              type: true,
              addressLine1: true,
              addressLine2: true,
              city: true,
              state: true,
              zipCode: true,
              county: true,
              phone: true,
              website: true,
            },
          },
          licenses: {
            where: {
              status: "ACTIVE",
            },
            select: {
              licenseType: true,
              licenseNumber: true,
              expirationDate: true,
            },
          },
          homes: {
            where: {
              isActive: true,
            },
            select: {
              id: true,
              name: true,
              addressLine1: true,
              addressLine2: true,
              city: true,
              state: true,
              zipCode: true,
              county: true,
              capacity: true,
              currentOccupancy: true,
              wheelchairAccessible: true,
              singleLevel: true,
              hasElevator: true,
              hasRollInShower: true,
              acceptingNew: true,
              photos: {
                where: {
                  isPrimary: true,
                },
                select: {
                  url: true,
                  caption: true,
                },
                take: 1,
              },
              services: {
                where: {
                  isActive: true,
                },
                select: {
                  service: {
                    select: {
                      id: true,
                      name: true,
                      description: true,
                      category: true,
                    },
                  },
                  notes: true,
                },
              },
              amenities: {
                select: {
                  amenityType: true,
                  description: true,
                },
              },
            },
          },
        },
      });

      return provider;
    } catch (error) {
      console.error("Get provider public profile error:", error);
      throw new Error("Failed to retrieve provider public profile");
    }
  }

  // Update provider profile
  async updateProviderProfile(
    id: string,
    data: UpdateProviderData,
    userId: string
  ): Promise<any> {
    try {
      const provider = await db.provider.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          organization: true,
          licenses: true,
        },
      });

      // Log audit event
      await auditService.logAuditEvent(
        userId,
        "provider.profile.update",
        "Provider",
        id,
        {
          updatedFields: Object.keys(data),
        },
        undefined,
        undefined,
        AuditResult.SUCCESS
      );

      return provider;
    } catch (error) {
      console.error("Update provider profile error:", error);
      throw new Error("Failed to update provider profile");
    }
  }

  // Get providers by organization
  async getProvidersByOrganization(organizationId: string): Promise<any[]> {
    try {
      const providers = await db.provider.findMany({
        where: { organizationId },
        include: {
          organization: true,
          licenses: true,
          homes: {
            where: {
              isActive: true,
            },
            select: {
              id: true,
              name: true,
              city: true,
              county: true,
              capacity: true,
              currentOccupancy: true,
              acceptingNew: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return providers;
    } catch (error) {
      console.error("Get providers by organization error:", error);
      throw new Error("Failed to retrieve providers");
    }
  }

  // Verify provider
  async verifyProvider(
    id: string,
    verifiedBy: string,
    verificationNotes?: string
  ): Promise<any> {
    try {
      const provider = await db.provider.update({
        where: { id },
        data: {
          verified: true,
          verifiedAt: new Date(),
          verificationNotes,
        },
        include: {
          organization: true,
          licenses: true,
        },
      });

      // Log audit event
      await auditService.logAuditEvent(
        verifiedBy,
        "provider.verify",
        "Provider",
        id,
        {
          verificationNotes,
        },
        undefined,
        undefined,
        AuditResult.SUCCESS
      );

      return provider;
    } catch (error) {
      console.error("Verify provider error:", error);
      throw new Error("Failed to verify provider");
    }
  }

  // Get provider statistics
  async getProviderStats(id: string): Promise<any> {
    try {
      const [
        totalHomes,
        activeHomes,
        totalOpenings,
        activeOpenings,
        totalPlacements,
        recentPlacements,
      ] = await Promise.all([
        db.home.count({
          where: { providerId: id },
        }),
        db.home.count({
          where: {
            providerId: id,
            isActive: true,
          },
        }),
        db.opening.count({
          where: { providerId: id },
        }),
        db.opening.count({
          where: {
            providerId: id,
            status: "OPEN",
          },
        }),
        db.placement.count({
          where: { providerId: id },
        }),
        db.placement.count({
          where: {
            providerId: id,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        }),
      ]);

      return {
        totalHomes,
        activeHomes,
        totalOpenings,
        activeOpenings,
        totalPlacements,
        recentPlacements,
        occupancyRate:
          activeHomes > 0 ? (activeHomes - activeOpenings) / activeHomes : 0,
      };
    } catch (error) {
      console.error("Get provider stats error:", error);
      throw new Error("Failed to retrieve provider statistics");
    }
  }

  // Search providers (for admin/management)
  async searchProviders(filters: {
    search?: string;
    verified?: boolean;
    subscriptionTier?: string;
    organizationType?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    providers: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const {
        search,
        verified,
        subscriptionTier,
        organizationType,
        page = 1,
        limit = 20,
      } = filters;

      const where: Prisma.ProviderWhereInput = {};

      if (search) {
        where.OR = [
          {
            organization: {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
          {
            primaryLicenseType: {
              contains: search,
              mode: "insensitive",
            },
          },
        ];
      }

      if (verified !== undefined) {
        where.verified = verified;
      }

      if (subscriptionTier) {
        where.subscriptionTier = subscriptionTier as any;
      }

      if (organizationType) {
        where.organization = {
          type: organizationType as any,
        };
      }

      const [providers, total] = await Promise.all([
        db.provider.findMany({
          where,
          include: {
            organization: true,
            licenses: true,
            _count: {
              select: {
                homes: true,
                openings: true,
                placements: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.provider.count({ where }),
      ]);

      return {
        providers,
        total,
        page,
        limit,
      };
    } catch (error) {
      console.error("Search providers error:", error);
      throw new Error("Failed to search providers");
    }
  }

  // Get provider by user ID
  async getProviderByUserId(userId: string): Promise<any> {
    try {
      const provider = await db.provider.findFirst({
        where: {
          organization: {
            users: {
              some: {
                id: userId,
              },
            },
          },
        },
        include: {
          organization: true,
          homes: true,
          services: {
            include: {
              service: true,
            },
          },
        },
      });

      return provider;
    } catch (error) {
      console.error("Get provider by user ID error:", error);
      throw new Error("Failed to get provider by user ID");
    }
  }

  // Get provider by organization ID
  async getProviderByOrganizationId(organizationId: string): Promise<any> {
    try {
      const provider = await db.provider.findFirst({
        where: {
          organizationId,
        },
        include: {
          organization: true,
          licenses: {
            // Include all licenses (not just ACTIVE) so frontend can show status
            // Frontend will filter for ACTIVE licenses when needed
          },
          homes: {
            where: {
              isActive: true,
            },
          },
          services: {
            where: {
              isActive: true,
            },
            include: {
              service: true,
            },
          },
        },
      });

      return provider;
    } catch (error) {
      console.error("Get provider by organization ID error:", error);
      throw new Error("Failed to get provider by organization ID");
    }
  }

  // Get provider services
  async getProviderServices(
    providerId: string,
    userId: string
  ): Promise<any[]> {
    try {
      // Verify user has access to this provider
      const provider = await db.provider.findFirst({
        where: {
          id: providerId,
          organization: {
            users: {
              some: {
                id: userId,
              },
            },
          },
        },
        include: {
          services: {
            include: {
              service: true,
            },
            where: {
              isActive: true,
            },
          },
        },
      });

      if (!provider) {
        throw new Error("Provider not found or access denied");
      }

      return provider.services;
    } catch (error) {
      console.error("Get provider services error:", error);
      throw new Error("Failed to retrieve provider services");
    }
  }

  // Update provider services
  async updateProviderServices(
    providerId: string,
    serviceIds: string[],
    userId: string
  ): Promise<boolean> {
    try {
      // Normalize input: ensure array of unique string IDs
      const uniqueServiceIds = Array.from(
        new Set((serviceIds || []).filter((id) => typeof id === "string"))
      );

      // Fetch provider with licenses and current services in one query
      const provider = await db.provider.findFirst({
        where: {
          id: providerId,
          organization: {
            users: {
              some: {
                id: userId,
              },
            },
          },
        },
        include: {
          licenses: true,
          services: {
            where: { isActive: true },
            select: { serviceId: true },
          },
        },
      });

      if (!provider) {
        return false;
      }

      // Validate services exist and are active
      if (uniqueServiceIds.length > 0) {
        const servicesFound = await db.service.findMany({
          where: {
            id: { in: uniqueServiceIds },
            isActive: true,
          },
          select: { id: true, licenseTypes: true, name: true },
        });

        if (servicesFound.length !== uniqueServiceIds.length) {
          const foundIds = new Set(servicesFound.map((s) => s.id));
          const missing = uniqueServiceIds.filter((id) => !foundIds.has(id));
          throw new Error(
            `One or more services are invalid or inactive: ${missing.join(", ")}`
          );
        }

        // Enforce license constraints: each selected service must be permitted by at least one provider license type
        // Only consider ACTIVE licenses for validation (PENDING licenses can view but not select services)
        const providerLicenseTypes = new Set(
          provider.licenses
            .filter((l) => l.status === "ACTIVE")
            .map((l) => l.licenseType)
        );
        const invalidServices = servicesFound.filter((s) => {
          // Use the centralized license matching utility for consistency
          return !isServiceAllowedForProvider(
            s.licenseTypes,
            Array.from(providerLicenseTypes)
          );
        });

        if (invalidServices.length > 0) {
          const serviceNames = invalidServices
            .map((s) => s.name || s.id)
            .join(", ");
          const providerLicenses =
            Array.from(providerLicenseTypes).join(", ") || "none";

          // Build a more helpful error message
          const requiredLicenses = invalidServices
            .flatMap((s) => s.licenseTypes || [])
            .filter((lt, idx, arr) => arr.indexOf(lt) === idx) // unique
            .filter((lt) => !providerLicenseTypes.has(lt))
            .join(", ");

          if (providerLicenses === "none") {
            throw new Error(
              `Selected services require licenses that your provider does not have. Services: ${serviceNames}. Required licenses: ${requiredLicenses}. Please add the required licenses to tour provider profile.`
            );
          } else {
            throw new Error(
              `Selected services require licenses that your provider does not have. Services: ${serviceNames}. Your provider has: ${providerLicenses}. Required licenses: ${requiredLicenses}. Please add the required licenses to your provider profile.`
            );
          }
        }
      }

      const currentServiceIds = provider.services.map((ps) => ps.serviceId);

      // Find services to add and remove
      const servicesToAdd = uniqueServiceIds.filter(
        (id) => !currentServiceIds.includes(id)
      );
      const servicesToRemove = currentServiceIds.filter(
        (id) => !uniqueServiceIds.includes(id)
      );

      // Use transaction to update services atomically
      // The transaction client (tx) has the same API as db, so we can access models directly
      await db.$transaction(async (tx) => {
        // Remove services - delete them (maintains data integrity)
        if (servicesToRemove.length > 0) {
          await tx.providerService.deleteMany({
            where: {
              providerId,
              serviceId: { in: servicesToRemove },
            },
          });
        }

        // Add new services
        if (servicesToAdd.length > 0) {
          await tx.providerService.createMany({
            data: servicesToAdd.map((serviceId) => ({
              providerId,
              serviceId,
              isActive: true,
            })),
            skipDuplicates: true,
          });
        }
      });

      // Log audit event
      await auditService.logAuditEvent(
        userId,
        "provider.services.update",
        "Provider",
        providerId,
        {
          serviceIds,
          serviceCount: serviceIds.length,
        },
        undefined,
        undefined,
        AuditResult.SUCCESS
      );

      return true;
    } catch (error) {
      console.error("Update provider services error:", error);
      // Preserve original error message if it's a meaningful error
      if (error instanceof Error && error.message) {
        // Re-throw validation errors (license constraints, invalid services) as-is
        if (
          error.message.includes("not allowed by provider licenses") ||
          error.message.includes(
            "require licenses that your provider does not have"
          ) ||
          error.message.includes("invalid or inactive")
        ) {
          throw error;
        }
      }
      // For unexpected errors, throw a generic message
      throw new Error("Failed to update provider services");
    }
  }

  // Get available services for providers
  // If providerId is provided, filters services based on provider's active licenses
  async getAvailableServices(
    providerId?: string,
    userId?: string
  ): Promise<any[]> {
    try {
      let providerLicenseTypes: Set<string> | null = null;

      // If providerId is provided, fetch provider licenses to filter services
      if (providerId) {
        // Try to find provider - if userId is provided, verify access, otherwise just get provider
        const provider = userId
          ? await db.provider.findFirst({
              where: {
                id: providerId,
                organization: {
                  users: {
                    some: {
                      id: userId,
                    },
                  },
                },
              },
              include: {
                licenses: {
                  // Include both ACTIVE and PENDING licenses
                  // PENDING licenses are allowed for service selection, but services may require ACTIVE status for actual use
                  // ACTIVE licenses are required for validation when updating services
                  where: {
                    status: {
                      in: ["ACTIVE", "PENDING"],
                    },
                  },
                },
              },
            })
          : await db.provider.findFirst({
              where: {
                id: providerId,
              },
              include: {
                licenses: {
                  where: {
                    status: {
                      in: ["ACTIVE", "PENDING"],
                    },
                  },
                },
              },
            });

        if (provider) {
          providerLicenseTypes = new Set(
            provider.licenses.map((l) => l.licenseType)
          );
        }
      }

      const services = await db.service.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          category: true,
          licenseTypes: true,
        },
        orderBy: [{ category: "asc" }, { name: "asc" }],
      });

      // Filter services based on provider licenses if providerId was provided
      if (providerLicenseTypes !== null) {
        return services.filter((service) => {
          // Use the centralized license matching utility for consistency
          return isServiceAllowedForProvider(
            service.licenseTypes,
            Array.from(providerLicenseTypes)
          );
        });
      }

      // If no providerId, return all services
      return services;
    } catch (error) {
      console.error("Get available services error:", error);
      throw new Error("Failed to retrieve available services");
    }
  }

  // Get provider referrals
  async getProviderReferrals(
    providerId: string,
    filters: {
      page?: number;
      limit?: number;
      status?: string;
    }
  ): Promise<{
    referrals: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const { page = 1, limit = 10, status } = filters;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.ReferralWhereInput = {
        shortlist: {
          some: {
            providerId,
          },
        },
      };

      // Add status filter if provided
      if (status && status !== "all") {
        where.status = status as any;
      }

      // Get referrals with pagination
      const [referrals, total] = await Promise.all([
        db.referral.findMany({
          where,
          include: {
            caseManager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
            shortlist: {
              where: {
                providerId,
              },
              select: {
                id: true,
                status: true,
                addedAt: true,
                contactedAt: true,
                respondedAt: true,
                notes: true,
              },
            },
            messages: {
              where: {
                providerId,
              },
              select: {
                id: true,
                status: true,
                createdAt: true,
                lastMessageAt: true,
              },
              take: 1,
              orderBy: {
                lastMessageAt: "desc",
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: limit,
        }),
        db.referral.count({ where }),
      ]);

      const pages = Math.ceil(total / limit);

      return {
        referrals,
        pagination: {
          page,
          limit,
          total,
          pages,
        },
      };
    } catch (error) {
      console.error("Get provider referrals error:", error);
      throw new Error("Failed to retrieve provider referrals");
    }
  }

  /**
   * Get all staff members (PROVIDER_STAFF users) for a provider's organization
   */
  async getOrganizationStaff(
    providerId: string,
    userId: string
  ): Promise<any[]> {
    try {
      // Verify user has access to this provider
      const hasAccess = await this.verifyProviderAccess(userId, providerId);
      if (!hasAccess) {
        throw new Error("Access denied");
      }

      // Get provider to find organization
      const provider = await db.provider.findUnique({
        where: { id: providerId },
        select: { organizationId: true },
      });

      if (!provider) {
        throw new Error("Provider not found");
      }

      // Get all PROVIDER_STAFF users in this organization
      const staff = await db.user.findMany({
        where: {
          organizationId: provider.organizationId,
          role: UserRole.PROVIDER_STAFF,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return staff;
    } catch (error) {
      console.error("Get organization staff error:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to retrieve organization staff"
      );
    }
  }

  /**
   * Invite a new staff member to the provider's organization
   */
  async inviteStaff(
    providerId: string,
    userId: string,
    staffData: {
      email: string;
      firstName: string;
      lastName: string;
      phone?: string;
    }
  ): Promise<any> {
    try {
      // Verify user is PROVIDER_OWNER and has access
      const currentUser = await db.user.findUnique({
        where: { id: userId },
        select: {
          role: true,
          organizationId: true,
          firstName: true,
          lastName: true,
        },
      });

      if (!currentUser || currentUser.role !== UserRole.PROVIDER_OWNER) {
        throw new Error("Only provider owners can invite staff");
      }

      const hasAccess = await this.verifyProviderAccess(userId, providerId);
      if (!hasAccess) {
        throw new Error("Access denied");
      }

      // Get provider to find organization
      const provider = await db.provider.findUnique({
        where: { id: providerId },
        select: {
          organizationId: true,
          organization: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!provider) {
        throw new Error("Provider not found");
      }

      if (provider.organizationId !== currentUser.organizationId) {
        throw new Error("Access denied");
      }

      // Check if user already exists
      const existingUser = await db.user.findUnique({
        where: { email: staffData.email },
      });

      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      // Generate a temporary password (user will reset it)
      const { hashPassword } = await import("../lib/password");
      const tempPassword = crypto.randomBytes(16).toString("hex");
      const hashedPassword = await hashPassword(tempPassword);

      // Create staff user
      const staffUser = await db.user.create({
        data: {
          email: staffData.email,
          firstName: staffData.firstName,
          lastName: staffData.lastName,
          phone: staffData.phone,
          password: hashedPassword,
          role: UserRole.PROVIDER_STAFF,
          organizationId: provider.organizationId,
          status: UserStatus.PENDING_VERIFICATION,
        },
      });

      // Create password reset token for invitation (used for account setup)
      const { AuthRepository } = await import(
        "../repositories/auth.repository"
      );
      const authRepository = new AuthRepository();
      const resetToken = await authRepository.createPasswordResetToken(
        staffUser.id,
        { expiresInMs: 24 * 60 * 60 * 1000 } // 24 hours for staff invites
      );

      // Send staff invitation email
      const { EmailService } = await import("./email.service");
      const emailService = new EmailService();
      const inviterName = `${currentUser.firstName} ${currentUser.lastName}`;
      const organizationName =
        provider.organization?.name || "your organization";
      await emailService.sendStaffInvitationEmail(
        staffUser,
        inviterName,
        organizationName,
        resetToken
      );

      // Log audit event
      await auditService.logAuditEvent(
        userId,
        "STAFF_INVITED",
        "Staff",
        staffUser.id,
        {
          providerId,
          staffEmail: staffData.email,
        }
      );

      // Return staff user with limited fields
      return {
        id: staffUser.id,
        email: staffUser.email,
        firstName: staffUser.firstName,
        lastName: staffUser.lastName,
        phone: staffUser.phone,
        status: staffUser.status,
        createdAt: staffUser.createdAt,
        updatedAt: staffUser.updatedAt,
      };
    } catch (error) {
      console.error("Invite staff error:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to invite staff"
      );
    }
  }

  /**
   * Remove a staff member from the provider's organization
   */
  async removeStaff(
    providerId: string,
    userId: string,
    staffUserId: string
  ): Promise<boolean> {
    try {
      // Verify user is PROVIDER_OWNER and has access
      const currentUser = await db.user.findUnique({
        where: { id: userId },
        select: { role: true, organizationId: true },
      });

      if (!currentUser || currentUser.role !== UserRole.PROVIDER_OWNER) {
        throw new Error("Only provider owners can remove staff");
      }

      const hasAccess = await this.verifyProviderAccess(userId, providerId);
      if (!hasAccess) {
        throw new Error("Access denied");
      }

      // Get staff user
      const staffUser = await db.user.findUnique({
        where: { id: staffUserId },
        select: { organizationId: true, role: true },
      });

      if (!staffUser || staffUser.role !== UserRole.PROVIDER_STAFF) {
        throw new Error("Staff member not found");
      }

      if (staffUser.organizationId !== currentUser.organizationId) {
        throw new Error("Access denied");
      }

      // Deactivate the staff user (don't delete to maintain audit trail)
      await db.user.update({
        where: { id: staffUserId },
        data: { status: UserStatus.DEACTIVATED },
      });

      // Log audit event
      await auditService.logAuditEvent(
        userId,
        "STAFF_REMOVED",
        "Staff",
        staffUserId,
        {
          providerId,
        }
      );

      return true;
    } catch (error) {
      console.error("Remove staff error:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to remove staff"
      );
    }
  }

  /**
   * Resend invitation email to a pending staff member
   */
  async resendStaffInvite(
    providerId: string,
    userId: string,
    staffUserId: string
  ): Promise<boolean> {
    try {
      // Verify user is PROVIDER_OWNER and has access
      const currentUser = await db.user.findUnique({
        where: { id: userId },
        select: {
          role: true,
          organizationId: true,
          firstName: true,
          lastName: true,
        },
      });

      if (!currentUser || currentUser.role !== UserRole.PROVIDER_OWNER) {
        throw new Error("Only provider owners can resend invitations");
      }

      const hasAccess = await this.verifyProviderAccess(userId, providerId);
      if (!hasAccess) {
        throw new Error("Access denied");
      }

      // Load provider for organization context
      const provider = await db.provider.findUnique({
        where: { id: providerId },
        select: {
          organizationId: true,
          organization: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!provider) {
        throw new Error("Provider not found");
      }

      if (provider.organizationId !== currentUser.organizationId) {
        throw new Error("Access denied");
      }

      // Load staff user
      const staffUser = await db.user.findUnique({
        where: { id: staffUserId },
      });

      if (!staffUser || staffUser.role !== UserRole.PROVIDER_STAFF) {
        throw new Error("Staff member not found");
      }

      if (staffUser.organizationId !== currentUser.organizationId) {
        throw new Error("Access denied");
      }

      if (staffUser.status === UserStatus.ACTIVE) {
        throw new Error("Staff member has already activated their account");
      }

      // Generate new token and send invitation email
      const { AuthRepository } = await import(
        "../repositories/auth.repository"
      );
      const authRepository = new AuthRepository();
      const resetToken = await authRepository.createPasswordResetToken(
        staffUser.id,
        { expiresInMs: 24 * 60 * 60 * 1000 }
      );

      const { EmailService } = await import("./email.service");
      const emailService = new EmailService();
      const inviterName = `${currentUser.firstName} ${currentUser.lastName}`;
      const organizationName =
        provider.organization?.name || "your organization";
      await emailService.sendStaffInvitationEmail(
        staffUser,
        inviterName,
        organizationName,
        resetToken
      );

      // Ensure status remains pending and updatedAt reflects resend
      await db.user.update({
        where: { id: staffUserId },
        data: {
          status: UserStatus.PENDING_VERIFICATION,
        },
      });

      await auditService.logAuditEvent(
        userId,
        "STAFF_INVITE_RESENT",
        "Staff",
        staffUserId,
        {
          providerId,
          staffEmail: staffUser.email,
        }
      );

      return true;
    } catch (error) {
      console.error("Resend staff invite error:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to resend staff invitation"
      );
    }
  }
}
