import { Prisma } from "@prisma/client";
import { db } from "@carelink/database";
import {
  PublicSearchParams,
  PublicSearchResponse,
  ProviderPublicProfile,
  HomePublicProfile,
  Favorite,
  CareBotQueryResponse,
} from "@carelink/types";
import { Payer, OpeningStatus } from "@prisma/client";
import { AISearchService } from "./ai-search.service";

export class PublicService {
  private aiSearchService: AISearchService;

  constructor() {
    this.aiSearchService = new AISearchService();
  }

  /**
   * Public search for providers (no auth required)
   * Implements comprehensive filtering with distance calculation
   */
  async searchProviders(
    filters: PublicSearchParams
  ): Promise<PublicSearchResponse> {
    try {
      const {
        search,
        location,
        licenseTypes,
        serviceTypes,
        payers,
        accessibility,
        availability,
        verified,
        page = 1,
        limit = 20,
        sortBy = "relevance",
      } = filters;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.ProviderWhereInput = {
        // Only show active providers
        organization: {
          status: "VERIFIED",
        },
        // Only show providers with at least one active home
        homes: {
          some: {
            isActive: true,
          },
        },
      };

      // Search filter
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
            description: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            primaryLicenseType: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            homes: {
              some: {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          },
        ];
      }

      // License types filter
      if (licenseTypes && licenseTypes.length > 0) {
        where.primaryLicenseType = {
          in: licenseTypes,
        };
      }

      // Verified filter
      if (verified !== undefined) {
        where.verified = verified;
      }

      // Service types filter
      if (serviceTypes && serviceTypes.length > 0) {
        where.homes = {
          ...where.homes,
          some: {
            services: {
              some: {
                service: {
                  code: {
                    in: serviceTypes,
                  },
                },
              },
            },
          },
        };
      }

      // Payer filter
      if (payers && payers.length > 0) {
        where.homes = {
          ...where.homes,
          some: {
            openings: {
              some: {
                acceptedPayers: {
                  hasSome: payers as Payer[],
                },
                status: availability === "open-only" ? OpeningStatus.OPEN : undefined,
              },
            },
          },
        };
      }

      // Availability filter
      if (availability === "open-only") {
        where.homes = {
          ...where.homes,
          some: {
            openings: {
              some: {
                status: OpeningStatus.OPEN,
                spotsAvailable: {
                  gt: 0,
                },
                freshnessTimestamp: {
                  gte: new Date(Date.now() - 48 * 60 * 60 * 1000), // 48 hours
                },
              },
            },
          },
        };
      }

      // Accessibility filters
      if (accessibility) {
        const accWhere: Prisma.HomeWhereInput = {};
        if (accessibility.wheelchairAccessible !== undefined) {
          accWhere.wheelchairAccessible = accessibility.wheelchairAccessible;
        }
        if (accessibility.singleLevel !== undefined) {
          accWhere.singleLevel = accessibility.singleLevel;
        }
        if (accessibility.hasElevator !== undefined) {
          accWhere.hasElevator = accessibility.hasElevator;
        }
        if (accessibility.hasRollInShower !== undefined) {
          accWhere.hasRollInShower = accessibility.hasRollInShower;
        }

        if (Object.keys(accWhere).length > 0) {
          where.homes = {
            ...where.homes,
            some: accWhere,
          };
        }
      }

      // Location filter (county, city, zip)
      if (location) {
        const locationWhere: Prisma.HomeWhereInput = {};
        if (location.type === "county") {
          locationWhere.county = {
            equals: location.value,
            mode: "insensitive",
          };
        } else if (location.type === "city") {
          locationWhere.city = {
            equals: location.value,
            mode: "insensitive",
          };
        } else if (location.type === "zip") {
          locationWhere.zipCode = location.value;
        }

        if (Object.keys(locationWhere).length > 0) {
          where.homes = {
            ...where.homes,
            some: locationWhere,
          };
        }
      }

      // Get providers with all necessary relations
      const [providers, total] = await Promise.all([
        db.provider.findMany({
          where,
          skip,
          take: limit,
          include: {
            organization: true,
            homes: {
              where: {
                isActive: true,
              },
              include: {
                photos: {
                  orderBy: {
                    isPrimary: "desc",
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
                openings: {
                  where: {
                    status: availability === "open-only" ? OpeningStatus.OPEN : undefined,
                    spotsAvailable: {
                      gt: 0,
                    },
                  },
                  orderBy: {
                    availableFrom: "asc",
                  },
                },
                amenities: true,
              },
            },
            licenses: {
              where: {
                status: "ACTIVE",
              },
            },
          },
          orderBy: this.getOrderBy(sortBy),
        }),
        db.provider.count({ where }),
      ]);

      // Apply Diversity Caps (Max 2 per org in top results)
      // We reorder the fetched results to prioritize diversity
      const reorderedProviders = this.applyDiversityCaps(providers);

      // Map to public profile format
      const publicProfiles = await Promise.all(
        reorderedProviders.map((provider) => this.mapProviderToPublicProfile(provider, location))
      );

      return {
        providers: publicProfiles,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error("Public search providers error:", error);
      throw new Error("Failed to search providers");
    }
  }

  /**
   * Apply diversity caps to provider list
   * Max 2 providers per organization in the top results
   */
  private applyDiversityCaps(providers: any[]): any[] {
    const accepted: any[] = [];
    const deferred: any[] = [];
    const orgCounts: Record<string, number> = {};

    for (const provider of providers) {
      const orgId = provider.organizationId;
      const count = orgCounts[orgId] || 0;

      if (count < 2) {
        accepted.push(provider);
        orgCounts[orgId] = count + 1;
      } else {
        deferred.push(provider);
      }
    }

    return [...accepted, ...deferred];
  }

  /**
   * Get provider public profile by ID
   */
  async getProviderPublicProfile(
    providerId: string,
    userLocation?: { lat: number; lon: number }
  ): Promise<ProviderPublicProfile> {
    try {
      const provider = await db.provider.findUnique({
        where: {
          id: providerId,
        },
        include: {
          organization: true,
          homes: {
            where: {
              isActive: true,
            },
            include: {
              photos: {
                orderBy: {
                  isPrimary: "desc",
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
                openings: {
                  where: {
                    status: OpeningStatus.OPEN,
                    spotsAvailable: {
                      gt: 0,
                    },
                  },
                  orderBy: {
                    availableFrom: "asc",
                  },
                },
                amenities: true,
              },
            },
            licenses: {
              where: {
                status: "ACTIVE",
              },
            },
          },
        });

      if (!provider) {
        throw new Error("Provider not found");
      }

      // Check if provider is active
      if (provider.organization.status !== "VERIFIED") {
        throw new Error("Provider not available");
      }

      return this.mapProviderToPublicProfile(
        provider,
        userLocation
          ? {
              type: "zip",
              value: "",
              radius: undefined,
            }
          : undefined,
        userLocation
      );
    } catch (error) {
      console.error("Get provider public profile error:", error);
      throw new Error("Failed to get provider profile");
    }
  }

  /**
   * Get user's favorites
   */
  async getFavorites(userId: string): Promise<Favorite[]> {
    try {
      const favorites = await db.favorite.findMany({
        where: {
          userId,
        },
        include: {
          provider: {
            include: {
              organization: true,
              homes: {
                where: {
                  isActive: true,
                },
                include: {
                  photos: {
                    orderBy: {
                      isPrimary: "desc",
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
                  openings: {
                    where: {
                      status: OpeningStatus.OPEN,
                      spotsAvailable: {
                        gt: 0,
                      },
                    },
                  },
                },
              },
              licenses: {
                where: {
                  status: "ACTIVE",
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const mappedFavorites = await Promise.all(
        favorites.map(async (fav) => ({
          id: fav.id,
          userId: fav.userId,
          providerId: fav.providerId,
          provider: await this.mapProviderToPublicProfile(fav.provider),
          createdAt: fav.createdAt,
        }))
      );

      return mappedFavorites;
    } catch (error) {
      console.error("Get favorites error:", error);
      throw new Error("Failed to get favorites");
    }
  }

  /**
   * Add provider to favorites
   */
  async addFavorite(userId: string, providerId: string): Promise<Favorite> {
    try {
      // Check if provider exists
      const provider = await db.provider.findUnique({
        where: {
          id: providerId,
        },
      });

      if (!provider) {
        throw new Error("Provider not found");
      }

      // Check if already favorited
      const existing = await db.favorite.findUnique({
        where: {
          userId_providerId: {
            userId,
            providerId,
          },
        },
      });

      if (existing) {
        // Return existing favorite
        const favorites = await this.getFavorites(userId);
        return favorites.find((f) => f.id === existing.id)!;
      }

      // Create favorite
      const favorite = await db.favorite.create({
        data: {
          userId,
          providerId,
        },
        include: {
          provider: {
            include: {
              organization: true,
              homes: {
                where: {
                  isActive: true,
                },
                include: {
                  photos: {
                    orderBy: {
                      isPrimary: "desc",
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
                  openings: {
                    where: {
                      status: OpeningStatus.OPEN,
                      spotsAvailable: {
                        gt: 0,
                      },
                    },
                  },
                },
              },
              licenses: {
                where: {
                  status: "ACTIVE",
                },
              },
            },
          },
        },
      });

      const mappedProvider = await this.mapProviderToPublicProfile(favorite.provider);

      return {
        id: favorite.id,
        userId: favorite.userId,
        providerId: favorite.providerId,
        provider: mappedProvider,
        createdAt: favorite.createdAt,
      };
    } catch (error) {
      console.error("Add favorite error:", error);
      if (error instanceof Error && error.message === "Provider not found") {
        throw error;
      }
      throw new Error("Failed to add favorite");
    }
  }

  /**
   * Remove provider from favorites
   */
  async removeFavorite(userId: string, favoriteId: string): Promise<void> {
    try {
      // Verify ownership
      const favorite = await db.favorite.findUnique({
        where: {
          id: favoriteId,
        },
      });

      if (!favorite) {
        throw new Error("Favorite not found");
      }

      if (favorite.userId !== userId) {
        throw new Error("Unauthorized");
      }

      await db.favorite.delete({
        where: {
          id: favoriteId,
        },
      });
    } catch (error) {
      console.error("Remove favorite error:", error);
      if (error instanceof Error && (error.message === "Favorite not found" || error.message === "Unauthorized")) {
        throw error;
      }
      throw new Error("Failed to remove favorite");
    }
  }

  /**
   * Parse natural language query using AI (CareBot)
   */
  async parseNaturalLanguageQuery(
    query: string,
    userId?: string
  ): Promise<CareBotQueryResponse> {
    try {
      // Use AI search service to parse query
      const result = await this.aiSearchService.parseQuery(query);

      // Map AI search result to PublicSearchFilters format
      const filters: any = {};

      if (result.counties && result.counties.length > 0) {
        filters.location = {
          type: "county" as const,
          value: result.counties[0], // Use first county
        };
      } else if (result.cities && result.cities.length > 0) {
        filters.location = {
          type: "city" as const,
          value: result.cities[0], // Use first city
        };
      }

      if (result.maxDistance) {
        if (filters.location) {
          filters.location.radius = result.maxDistance;
        }
      }

      if (result.licenseTypes && result.licenseTypes.length > 0) {
        filters.licenseTypes = result.licenseTypes;
      }

      if (result.services && result.services.length > 0) {
        filters.serviceTypes = result.services;
      }

      if (result.payers && result.payers.length > 0) {
        filters.payers = result.payers;
      }

      if (result.hasAvailability) {
        filters.availability = "open-only" as const;
      }

      return {
        filters,
        explanation: result.explanation,
        confidence: undefined, // AI service doesn't return confidence
      };
    } catch (error) {
      console.error("Parse natural language query error:", error);
      throw new Error("Failed to parse query");
    }
  }

  /**
   * Map Prisma provider to public profile
   */
  private async mapProviderToPublicProfile(
    provider: any,
    location?: { type: string; value: string; radius?: number },
    userLocation?: { lat: number; lon: number }
  ): Promise<ProviderPublicProfile> {
    const homes: HomePublicProfile[] = provider.homes.map((home: any) => ({
      id: home.id,
      name: home.name,
      address: {
        line1: home.addressLine1,
        line2: home.addressLine2 || undefined,
        city: home.city,
        state: home.state,
        zipCode: home.zipCode,
        county: home.county,
      },
      location: {
        latitude: home.latitude,
        longitude: home.longitude,
      },
      photos: home.photos.map((photo: any) => ({
        url: photo.url,
        caption: photo.caption || undefined,
        isPrimary: photo.isPrimary,
      })),
      capacity: home.capacity,
      currentOccupancy: home.currentOccupancy,
      accessibility: {
        wheelchairAccessible: home.wheelchairAccessible,
        singleLevel: home.singleLevel,
        hasElevator: home.hasElevator,
        hasRollInShower: home.hasRollInShower,
      },
      services: home.services.map((hs: any) => ({
        id: hs.service.id,
        code: hs.service.code,
        name: hs.service.name,
        category: hs.service.category,
      })),
      openings: home.openings.map((opening: any) => ({
        id: opening.id,
        spotsAvailable: opening.spotsAvailable,
        availableFrom: opening.availableFrom,
        acceptedPayers: opening.acceptedPayers as Payer[],
        careLevels: opening.careLevels,
        supportedNeeds: opening.supportedNeeds,
      })),
    }));

    // Calculate distance if user location provided
    let distance: number | undefined;
    if (userLocation && homes.length > 0) {
      const home = homes[0]; // Use first home for distance
      distance = this.calculateDistance(
        userLocation.lat,
        userLocation.lon,
        home.location.latitude,
        home.location.longitude
      );
    }

    return {
      id: provider.id,
      organizationName: provider.organization.name,
      description: provider.description || undefined,
      logo: provider.logo || undefined,
      verified: provider.verified,
      subscriptionTier: provider.subscriptionTier,
      boostLevel: provider.boostLevel || 0,
      homes,
      primaryLicenseType: provider.primaryLicenseType,
      licenses: provider.licenses.map((license: any) => ({
        licenseType: license.licenseType,
        licenseNumber: license.licenseNumber,
        expirationDate: license.expirationDate,
      })),
      averageRating: undefined, // TODO: Add rating system
      reviewCount: 0, // TODO: Add review system
      distance,
      createdAt: provider.createdAt,
    };
  }

  /**
   * Get order by clause based on sort option
   */
  private getOrderBy(sortBy: string): Prisma.ProviderOrderByWithRelationInput {
    switch (sortBy) {
      case "distance":
        // Distance sorting would need to be done in application layer
        // For now, fall back to relevance
        return {
          boostLevel: "desc", // Boosted providers first
          verified: "desc",
          createdAt: "desc",
        };
      case "rating":
        // Rating sorting would need rating field
        // For now, fall back to relevance
        return {
          boostLevel: "desc", // Boosted providers first
          verified: "desc",
          createdAt: "desc",
        };
      case "newest":
        return {
          createdAt: "desc",
        };
      case "relevance":
      default:
        // Boost influence: Boosted providers appear higher
        // But verified status and subscription tier still matter
        return {
          boostLevel: "desc", // Primary ranking factor (0, 1, 2, 3)
          verified: "desc",    // Verified providers ranked higher
          subscriptionTier: "desc", // Higher tiers ranked higher
          createdAt: "desc",   // Newest first as tiebreaker
        };
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

