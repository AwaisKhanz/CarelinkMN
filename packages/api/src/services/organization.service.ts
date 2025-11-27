import { db } from "@carelink/database";
import {
  OrganizationType,
  OrganizationStatus,
  UserRole,
} from "@carelink/types";
import { Prisma } from "@prisma/client";

interface GetOrganizationsOptions {
  page: number;
  limit: number;
  type?: string;
  status?: string;
}

interface CreateOrganizationData {
  name: string;
  type: OrganizationType;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  ein?: string;
  npi?: string;
  website?: string;
  fax?: string;
}

export class OrganizationService {
  // Update organization
  async updateOrganization(
    organizationId: string,
    data: Partial<CreateOrganizationData>
  ) {
    try {
      const organization = await db.organization.update({
        where: { id: organizationId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.email && { email: data.email }),
          ...(data.phone && { phone: data.phone }),
          ...(data.addressLine1 && { addressLine1: data.addressLine1 }),
          ...(data.addressLine2 !== undefined && {
            addressLine2: data.addressLine2,
          }),
          ...(data.city && { city: data.city }),
          ...(data.state && { state: data.state }),
          ...(data.zipCode && { zipCode: data.zipCode }),
          ...(data.county && { county: data.county }),
          ...(data.ein !== undefined && { ein: data.ein }),
          ...(data.npi !== undefined && { npi: data.npi }),
          ...(data.website !== undefined && { website: data.website }),
          ...(data.fax !== undefined && { fax: data.fax }),
          ...((data as any).logo !== undefined && { logo: (data as any).logo }),
          ...((data as any).coverImage !== undefined && { coverImage: (data as any).coverImage }),
        },
      });
      return organization;
    } catch (error) {
      console.error("Update organization error:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to update organization"
      );
    }
  }

  // Create organization
  async createOrganization(data: CreateOrganizationData, userId: string) {
    try {
      // Start transaction to create organization and link user
      const result = await db.$transaction(async (tx) => {
        // 1. Create the organization
        const organization = await tx.organization.create({
          data: {
            name: data.name,
            type: data.type,
            email: data.email,
            phone: data.phone,
            addressLine1: data.addressLine1,
            addressLine2: data.addressLine2,
            city: data.city,
            state: data.state,
            zipCode: data.zipCode,
            county: data.county,
            ein: data.ein,
            npi: data.npi,
            website: data.website,
            fax: data.fax,
            status: OrganizationStatus.PENDING,
          },
        });

        // 2. Link the user to this organization
        await tx.user.update({
          where: { id: userId },
          data: { organizationId: organization.id },
        });

        // 3. Get user data to determine role-specific records
        const user = await tx.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          throw new Error("User not found");
        }

        // 4. Create role-specific records based on user role
        if (
          user.role === UserRole.PROVIDER_OWNER ||
          user.role === UserRole.PROVIDER_STAFF
        ) {
          // Create provider record
          await tx.provider.create({
            data: {
              organizationId: organization.id,
              primaryLicenseType: "UNKNOWN", // Will be updated in onboarding
              description: "",
              subscriptionTier: "FREE",
              verified: false,
              acceptsReferrals: true,
            },
          });
        }

        return organization;
      });

      return result;
    } catch (error) {
      console.error("Create organization error:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to create organization"
      );
    }
  }

  // Get organizations with pagination and filters
  async getOrganizations(options: GetOrganizationsOptions) {
    try {
      const { page, limit, type, status } = options;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (type) where.type = type;
      if (status) where.status = status;

      const [organizations, total] = await Promise.all([
        db.organization.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            _count: {
              select: {
                users: true,
                providers: true,
              },
            },
          },
        }),
        db.organization.count({ where }),
      ]);

      return {
        organizations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Get organizations error:", error);
      throw new Error("Failed to retrieve organizations");
    }
  }

  // Get organization by ID
  async getOrganizationById(id: string) {
    try {
      const organization = await db.organization.findUnique({
        where: { id },
        include: {
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              status: true,
            },
          },
          providers: {
            select: {
              id: true,
              primaryLicenseType: true,
              verified: true,
              acceptsReferrals: true,
            },
          },
          _count: {
            select: {
              users: true,
              providers: true,
            },
          },
        },
      });

      return organization;
    } catch (error) {
      console.error("Get organization by ID error:", error);
      throw new Error("Failed to retrieve organization");
    }
  }

  // Search organizations
  async searchOrganizations(query: string, type?: string, limit: number = 10) {
    try {
      const where: any = {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { city: { contains: query, mode: "insensitive" } },
          { county: { contains: query, mode: "insensitive" } },
        ],
        status: {
          in: [OrganizationStatus.PENDING, OrganizationStatus.VERIFIED], // Show pending and verified organizations
        },
      };

      if (type) {
        where.type = type;
      }

      const organizations = await db.organization.findMany({
        where,
        take: limit,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          type: true,
          email: true,
          phone: true,
          city: true,
          state: true,
          county: true,
          status: true,
          _count: {
            select: {
              users: true,
              providers: true,
            },
          },
        },
      });

      return organizations;
    } catch (error) {
      console.error("Search organizations error:", error);
      // Return empty array instead of throwing error for better UX
      return [];
    }
  }
}
