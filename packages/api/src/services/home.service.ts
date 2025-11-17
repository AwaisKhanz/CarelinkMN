import { db } from "@carelink/database";
import { Prisma } from "@prisma/client";
import { isServiceAllowedForProvider } from "./util/service-licenses";

export interface CreateHomeData {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  latitude: number;
  longitude: number;
  capacity: number;
  currentOccupancy?: number;
  // Accessibility features (boolean fields matching schema)
  wheelchairAccessible?: boolean;
  singleLevel?: boolean;
  hasElevator?: boolean;
  hasRollInShower?: boolean;
  // Media
  virtualTourUrl?: string;
  photos?: Array<{
    url: string;
    caption?: string;
    isPrimary?: boolean;
    order?: number;
  }>;
  // Amenities
  amenities?: Array<{ amenityType: string; description?: string }>;
  // Settings
  acceptingNew?: boolean;
  isActive?: boolean;
}

export interface HomeFilters {
  page: number;
  limit: number;
  status?: string;
  search?: string;
}

export class HomeService {
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

  // Create a new home
  async createHome(providerId: string, homeData: CreateHomeData) {
    try {
      const home = await db.home.create({
        data: {
          providerId,
          name: homeData.name,
          addressLine1: homeData.addressLine1,
          addressLine2: homeData.addressLine2,
          city: homeData.city,
          state: homeData.state,
          zipCode: homeData.zipCode,
          county: homeData.county,
          latitude: homeData.latitude,
          longitude: homeData.longitude,
          capacity: homeData.capacity,
          currentOccupancy: homeData.currentOccupancy || 0,
          // Accessibility features (boolean fields)
          wheelchairAccessible: homeData.wheelchairAccessible || false,
          singleLevel: homeData.singleLevel || false,
          hasElevator: homeData.hasElevator || false,
          hasRollInShower: homeData.hasRollInShower || false,
          // Media
          virtualTourUrl: homeData.virtualTourUrl,
          // Settings
          acceptingNew:
            homeData.acceptingNew !== undefined ? homeData.acceptingNew : true,
          isActive: homeData.isActive !== undefined ? homeData.isActive : true,
          // Map amenities to HomeAmenity records
          amenities: {
            create: (homeData.amenities || []).map((amenity) => ({
              amenityType: amenity.amenityType,
              description: amenity.description,
            })),
          },
          // Map photos to HomePhoto records
          photos: {
            create: (homeData.photos || []).map((photo, index) => ({
              url: typeof photo === "string" ? photo : photo.url,
              caption: typeof photo === "string" ? undefined : photo.caption,
              isPrimary:
                typeof photo === "string"
                  ? index === 0
                  : (photo.isPrimary ?? index === 0),
              order: typeof photo === "string" ? index : (photo.order ?? index),
            })),
          },
        },
        include: {
          provider: {
            include: {
              organization: true,
            },
          },
          services: {
            include: {
              service: true,
            },
          },
          amenities: true,
          photos: true,
        },
      });

      return home;
    } catch (error) {
      console.error("Create home error:", error);
      throw new Error("Failed to create home");
    }
  }

  // Get all homes for a provider with pagination and filters
  async getProviderHomes(providerId: string, filters: HomeFilters) {
    try {
      const { page, limit, status, search } = filters;
      const skip = (page - 1) * limit;

      const where: Prisma.HomeWhereInput = {
        providerId,
      };

      if (status) {
        where.isActive = status === "active";
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { city: { contains: search, mode: "insensitive" } },
          { county: { contains: search, mode: "insensitive" } },
        ];
      }

      const [homes, total] = await Promise.all([
        db.home.findMany({
          where,
          skip,
          take: limit,
          include: {
            provider: {
              include: {
                organization: true,
              },
            },
            services: {
              include: {
                service: true,
              },
            },
            amenities: true,
            photos: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        }),
        db.home.count({ where }),
      ]);

      return {
        homes,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Get provider homes error:", error);
      throw new Error("Failed to retrieve provider homes");
    }
  }

  // Get a specific home by ID
  async getHomeById(homeId: string, userId: string) {
    try {
      const home = await db.home.findFirst({
        where: {
          id: homeId,
          provider: {
            organization: {
              users: {
                some: {
                  id: userId,
                },
              },
            },
          },
        },
        include: {
          provider: {
            include: {
              organization: true,
              services: {
                include: {
                  service: true,
                },
                where: {
                  isActive: true,
                },
              },
            },
          },
          services: {
            include: {
              service: true,
            },
          },
          amenities: true,
          photos: true,
        },
      });

      return home;
    } catch (error) {
      console.error("Get home by ID error:", error);
      throw new Error("Failed to retrieve home");
    }
  }

  // Update a home
  async updateHome(
    homeId: string,
    updateData: Partial<CreateHomeData>,
    userId: string
  ) {
    try {
      // First verify access
      const existingHome = await db.home.findFirst({
        where: {
          id: homeId,
          provider: {
            organization: {
              users: {
                some: {
                  id: userId,
                },
              },
            },
          },
        },
      });

      if (!existingHome) {
        return null;
      }

      // Handle amenities and photos separately since they need special handling
      const { amenities, photos, ...otherData } = updateData;

      const home = await db.home.update({
        where: { id: homeId },
        data: {
          ...otherData,
          updatedAt: new Date(),
        },
        include: {
          provider: {
            include: {
              organization: true,
            },
          },
          services: {
            include: {
              service: true,
            },
          },
          amenities: true,
          photos: true,
        },
      });

      // Update amenities if provided
      if (amenities) {
        // Delete existing amenities
        await db.homeAmenity.deleteMany({
          where: { homeId },
        });

        // Create new amenities
        await db.homeAmenity.createMany({
          data: amenities.map((amenity) => ({
            homeId,
            amenityType:
              typeof amenity === "string" ? amenity : amenity.amenityType,
            description:
              typeof amenity === "string" ? undefined : amenity.description,
          })),
        });
      }

      // Update photos if provided
      if (photos) {
        // Delete existing photos
        await db.homePhoto.deleteMany({
          where: { homeId },
        });

        // Create new photos
        await db.homePhoto.createMany({
          data: photos.map((photo, index) => ({
            homeId,
            url: typeof photo === "string" ? photo : photo.url,
            caption: typeof photo === "string" ? undefined : photo.caption,
            isPrimary:
              typeof photo === "string"
                ? index === 0
                : (photo.isPrimary ?? index === 0),
            order: typeof photo === "string" ? index : (photo.order ?? index),
          })),
        });
      }

      return home;
    } catch (error) {
      console.error("Update home error:", error);
      throw new Error("Failed to update home");
    }
  }

  // Delete a home
  async deleteHome(homeId: string, userId: string): Promise<boolean> {
    try {
      // First verify access
      const existingHome = await db.home.findFirst({
        where: {
          id: homeId,
          provider: {
            organization: {
              users: {
                some: {
                  id: userId,
                },
              },
            },
          },
        },
      });

      if (!existingHome) {
        return false;
      }

      await db.home.delete({
        where: { id: homeId },
      });

      return true;
    } catch (error) {
      console.error("Delete home error:", error);
      throw new Error("Failed to delete home");
    }
  }

  // Get home services
  async getHomeServices(homeId: string, userId: string) {
    try {
      const home = await db.home.findFirst({
        where: {
          id: homeId,
          provider: {
            organization: {
              users: {
                some: {
                  id: userId,
                },
              },
            },
          },
        },
        include: {
          services: {
            include: {
              service: true,
            },
          },
          provider: {
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
          },
        },
      });

      if (!home) {
        return null;
      }

      // Get provider-level services (org defaults)
      const providerServiceIds = new Set(
        (home.provider?.services || []).map((ps) => ps.serviceId)
      );

      // Get home-level services (overrides/additions)
      const homeServiceIds = new Set(
        (home.services || []).map((hs) => hs.serviceId)
      );

      // Merge: provider services are inherited, home services override/add
      // Return both with indication of source
      const allServices = [
        // Provider services (inherited, unless overridden at home level)
        ...(home.provider?.services || []).map((ps) => ({
          ...ps,
          source: homeServiceIds.has(ps.serviceId) ? "override" : "inherited",
        })),
        // Home services that aren't in provider services (additions)
        ...(home.services || [])
          .filter((hs) => !providerServiceIds.has(hs.serviceId))
          .map((hs) => ({
            ...hs,
            source: "home" as const,
          })),
      ];

      return allServices;
    } catch (error) {
      console.error("Get home services error:", error);
      throw new Error("Failed to retrieve home services");
    }
  }

  // Update home services
  async updateHomeServices(
    homeId: string,
    serviceIds: string[],
    userId: string
  ): Promise<boolean> {
    try {
      // First verify access
      const existingHome = await db.home.findFirst({
        where: {
          id: homeId,
          provider: {
            organization: {
              users: {
                some: {
                  id: userId,
                },
              },
            },
          },
        },
        include: {
          provider: {
            include: {
              licenses: true,
            },
          },
        },
      });

      if (!existingHome) {
        return false;
      }

      // Normalize input: ensure array of unique string IDs
      const uniqueServiceIds = Array.from(
        new Set((serviceIds || []).filter((id) => typeof id === "string"))
      );

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
      }

      // Enforce license constraints for the provider that owns this home
      // Only consider ACTIVE licenses for validation (PENDING licenses can view but not select services)
      if (uniqueServiceIds.length > 0) {
        const services = await db.service.findMany({
          where: { id: { in: uniqueServiceIds } },
          select: { id: true, licenseTypes: true, name: true },
        });
        const activeLicenses = (existingHome.provider?.licenses || []).filter(
          (l) => l.status === "ACTIVE"
        );
        const providerLicenseTypes = new Set(
          activeLicenses.map((l) => l.licenseType)
        );
        
        // Check if provider has any active licenses
        if (providerLicenseTypes.size === 0) {
          throw new Error(
            "Cannot add services: Provider must have at least one ACTIVE license. Please ensure your licenses are verified and active."
          );
        }
        
        const invalidServices = services.filter((s) => {
          // Use the centralized license matching utility for consistency
          return !isServiceAllowedForProvider(
            s.licenseTypes,
            Array.from(providerLicenseTypes)
          );
        });
        if (invalidServices.length > 0) {
          const names = invalidServices.map((s) => s.name || s.id).join(", ");
          const licenseTypes = Array.from(providerLicenseTypes).join(", ");
          throw new Error(
            `Selected services not allowed by provider licenses: ${names}. Your active license types (${licenseTypes}) do not permit these services.`
          );
        }
      }

      // Get current services to determine what to add/remove
      const currentServices = await db.homeService.findMany({
        where: { homeId },
        select: { serviceId: true },
      });
      const currentServiceIds = currentServices.map((hs) => hs.serviceId);

      // Find services to add and remove
      const servicesToAdd = uniqueServiceIds.filter(
        (id) => !currentServiceIds.includes(id)
      );
      const servicesToRemove = currentServiceIds.filter(
        (id) => !uniqueServiceIds.includes(id)
      );

      // Use transaction to update services atomically
      await db.$transaction(async (tx) => {
        // Remove services
        if (servicesToRemove.length > 0) {
          await tx.homeService.deleteMany({
            where: {
              homeId,
              serviceId: { in: servicesToRemove },
            },
          });
        }

        // Add new services
        if (servicesToAdd.length > 0) {
          await tx.homeService.createMany({
            data: servicesToAdd.map((serviceId) => ({
              homeId,
              serviceId,
              isActive: true,
            })),
            skipDuplicates: true,
          });
        }
      });

      return true;
    } catch (error) {
      console.error("Update home services error:", error);
      throw new Error("Failed to update home services");
    }
  }

  // Get available services for assignment
  async getAvailableServices(providerId: string) {
    try {
      const services = await db.service.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
        },
      });

      return services;
    } catch (error) {
      console.error("Get available services error:", error);
      throw new Error("Failed to retrieve available services");
    }
  }

  // Get home analytics
  async getHomeAnalytics(homeId: string, userId: string) {
    try {
      const home = await db.home.findFirst({
        where: {
          id: homeId,
          provider: {
            organization: {
              users: {
                some: {
                  id: userId,
                },
              },
            },
          },
        },
        include: {
          openings: {
            where: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
              },
            },
          },
        },
      });

      if (!home) {
        return null;
      }

      const analytics = {
        totalOpenings: home.openings.length,
        filledOpenings: home.openings.filter((o) => o.status === "FILLED")
          .length,
        pendingOpenings: home.openings.filter((o) => o.status === "PENDING")
          .length,
        openOpenings: home.openings.filter((o) => o.status === "OPEN").length,
        occupancyRate: (home.currentOccupancy / home.capacity) * 100,
        averageFillTime: 0, // Calculate based on opening data
      };

      return analytics;
    } catch (error) {
      console.error("Get home analytics error:", error);
      throw new Error("Failed to retrieve home analytics");
    }
  }
}
