import { apiService } from "../config";
import {
  PublicSearchParams,
  PublicSearchResponse,
  ProviderPublicProfile,
  GetFavoritesResponse,
  Favorite,
  CreateFavoriteData,
  CareBotQueryRequest,
  CareBotQueryResponse,
  GetPublicProviderParams,
  ApiResponse,
} from "@carelink/types";

// ============================================
// PUBLIC SEARCH SERVICE (Family Member Dashboard)
// ============================================

export const publicService = {
  /**
   * Search providers (public, no auth required)
   */
  async searchProviders(
    params: PublicSearchParams
  ): Promise<ApiResponse<PublicSearchResponse>> {
    const searchParams = new URLSearchParams();

    // Basic pagination
    if (params.page) {
      searchParams.append("page", params.page.toString());
    }
    if (params.limit) {
      searchParams.append("limit", params.limit.toString());
    }

    // Search query
    if (params.search) {
      searchParams.append("search", params.search);
    }

    // Location
    if (params.location) {
      searchParams.append("locationType", params.location.type);
      searchParams.append("locationValue", params.location.value);
      if (params.location.radius) {
        searchParams.append("radius", params.location.radius.toString());
      }
    }

    // Arrays
    if (params.licenseTypes && params.licenseTypes.length > 0) {
      searchParams.append("licenseTypes", params.licenseTypes.join(","));
    }

    if (params.serviceTypes && params.serviceTypes.length > 0) {
      searchParams.append("serviceTypes", params.serviceTypes.join(","));
    }

    if (params.payers && params.payers.length > 0) {
      searchParams.append("payers", params.payers.join(","));
    }

    // Accessibility
    if (params.accessibility) {
      if (params.accessibility.wheelchairAccessible !== undefined) {
        searchParams.append(
          "wheelchairAccessible",
          params.accessibility.wheelchairAccessible.toString()
        );
      }
      if (params.accessibility.singleLevel !== undefined) {
        searchParams.append(
          "singleLevel",
          params.accessibility.singleLevel.toString()
        );
      }
      if (params.accessibility.hasElevator !== undefined) {
        searchParams.append(
          "hasElevator",
          params.accessibility.hasElevator.toString()
        );
      }
      if (params.accessibility.hasRollInShower !== undefined) {
        searchParams.append(
          "hasRollInShower",
          params.accessibility.hasRollInShower.toString()
        );
      }
    }

    // Availability
    if (params.availability) {
      searchParams.append("availability", params.availability);
    }

    // Verified
    if (params.verified !== undefined) {
      searchParams.append("verified", params.verified.toString());
    }

    // Sort
    if (params.sortBy) {
      searchParams.append("sortBy", params.sortBy);
    }

    // View mode
    if (params.viewMode) {
      searchParams.append("viewMode", params.viewMode);
    }

    const query = searchParams.toString();
    return apiService.get<PublicSearchResponse>(
      `/api/public/providers${query ? `?${query}` : ""}`
    );
  },

  /**
   * Get provider public profile (public, no auth required)
   */
  async getProviderProfile(
    providerId: string,
    userLocation?: { lat: number; lon: number }
  ): Promise<ApiResponse<ProviderPublicProfile>> {
    const searchParams = new URLSearchParams();

    if (userLocation) {
      searchParams.append("lat", userLocation.lat.toString());
      searchParams.append("lon", userLocation.lon.toString());
    }

    const query = searchParams.toString();
    return apiService.get<ProviderPublicProfile>(
      `/api/public/providers/${providerId}${query ? `?${query}` : ""}`
    );
  },

  /**
   * Get user's favorites (auth required)
   */
  async getFavorites(): Promise<ApiResponse<GetFavoritesResponse>> {
    return apiService.get<GetFavoritesResponse>("/api/public/favorites");
  },

  /**
   * Add provider to favorites (auth required)
   */
  async addFavorite(
    data: CreateFavoriteData
  ): Promise<ApiResponse<Favorite>> {
    return apiService.post<Favorite>("/api/public/favorites", data);
  },

  /**
   * Remove provider from favorites (auth required)
   */
  async removeFavorite(favoriteId: string): Promise<ApiResponse<void>> {
    return apiService.delete<void>(`/api/public/favorites/${favoriteId}`);
  },

  /**
   * Parse natural language query using AI (CareBot)
   * Optional auth for rate limiting
   */
  async parseQuery(
    query: string
  ): Promise<ApiResponse<CareBotQueryResponse>> {
    return apiService.post<CareBotQueryResponse>("/api/public/carebot/parse", {
      query,
    });
  },
};

// Export types for convenience
export type {
  PublicSearchParams,
  PublicSearchResponse,
  ProviderPublicProfile,
  GetFavoritesResponse,
  Favorite,
  CreateFavoriteData,
  CareBotQueryRequest,
  CareBotQueryResponse,
  GetPublicProviderParams,
};

