// ============================================
// PUBLIC SEARCH UTILITIES (Family Member Dashboard)
// ============================================

import type {
  PublicSearchParams,
  ProviderPublicProfile,
  Favorite,
  PublicSearchLocation,
} from "@carelink/types";
import {
  VIEW_MODES,
  SORT_OPTIONS,
  AI_SEARCH_RATE_LIMIT,
  AI_SEARCH_MIN_QUERY_LENGTH,
  DEFAULT_RESULTS_PER_PAGE,
} from "@/lib/constants/public";

// Re-export constants for convenience
export {
  AI_SEARCH_RATE_LIMIT,
  AI_SEARCH_MIN_QUERY_LENGTH,
} from "@/lib/constants/public";

// ============================================
// URL Building & Parsing
// ============================================

/**
 * Build a deep-link safe URL with search state
 */
export function buildSearchUrl(filters: PublicSearchParams): string {
  const params = new URLSearchParams();

  if (filters.search) {
    params.append("search", filters.search);
  }

  if (filters.location) {
    params.append("locationType", filters.location.type);
    params.append("locationValue", filters.location.value);
    if (filters.location.radius) {
      params.append("radius", filters.location.radius.toString());
    }
  }

  if (filters.licenseTypes && filters.licenseTypes.length > 0) {
    params.append("licenseTypes", filters.licenseTypes.join(","));
  }

  if (filters.serviceTypes && filters.serviceTypes.length > 0) {
    params.append("serviceTypes", filters.serviceTypes.join(","));
  }

  if (filters.payers && filters.payers.length > 0) {
    params.append("payers", filters.payers.join(","));
  }

  if (filters.accessibility) {
    const acc = filters.accessibility;
    if (acc.wheelchairAccessible) params.append("wheelchairAccessible", "true");
    if (acc.singleLevel) params.append("singleLevel", "true");
    if (acc.hasElevator) params.append("hasElevator", "true");
    if (acc.hasRollInShower) params.append("hasRollInShower", "true");
  }

  if (filters.availability) {
    params.append("availability", filters.availability);
  }

  if (filters.verified !== undefined) {
    params.append("verified", filters.verified.toString());
  }

  if (filters.page && filters.page > 1) {
    params.append("page", filters.page.toString());
  }

  if (filters.limit && filters.limit !== DEFAULT_RESULTS_PER_PAGE) {
    params.append("limit", filters.limit.toString());
  }

  if (filters.sortBy && filters.sortBy !== "relevance") {
    params.append("sortBy", filters.sortBy);
  }

  if (filters.viewMode && filters.viewMode !== VIEW_MODES.GRID) {
    params.append("viewMode", filters.viewMode);
  }

  return params.toString();
}

/**
 * Parse URL parameters back to search filters
 */
export function parseSearchUrl(
  searchParams: URLSearchParams
): Partial<PublicSearchParams> {
  const filters: Partial<PublicSearchParams> = {};

  const search = searchParams.get("search");
  if (search) filters.search = search;

  const locationType = searchParams.get("locationType") as
    | "county"
    | "city"
    | "zip"
    | null;
  const locationValue = searchParams.get("locationValue");
  if (locationType && locationValue) {
    const location: PublicSearchLocation = {
      type: locationType,
      value: locationValue,
    };
    const radius = searchParams.get("radius");
    if (radius) {
      location.radius = parseInt(radius, 10);
    }
    filters.location = location;
  }

  const licenseTypes = searchParams.get("licenseTypes");
  if (licenseTypes) {
    filters.licenseTypes = licenseTypes.split(",");
  }

  const serviceTypes = searchParams.get("serviceTypes");
  if (serviceTypes) {
    filters.serviceTypes = serviceTypes.split(",");
  }

  const payers = searchParams.get("payers");
  if (payers) {
    filters.payers = payers.split(",") as any[];
  }

  const accessibility: any = {};
  if (searchParams.get("wheelchairAccessible") === "true") {
    accessibility.wheelchairAccessible = true;
  }
  if (searchParams.get("singleLevel") === "true") {
    accessibility.singleLevel = true;
  }
  if (searchParams.get("hasElevator") === "true") {
    accessibility.hasElevator = true;
  }
  if (searchParams.get("hasRollInShower") === "true") {
    accessibility.hasRollInShower = true;
  }
  if (Object.keys(accessibility).length > 0) {
    filters.accessibility = accessibility;
  }

  const availability = searchParams.get("availability");
  if (availability === "open-only" || availability === "all") {
    filters.availability = availability;
  }

  const verified = searchParams.get("verified");
  if (verified === "true" || verified === "false") {
    filters.verified = verified === "true";
  }

  const page = searchParams.get("page");
  if (page) {
    const pageNum = parseInt(page, 10);
    if (!isNaN(pageNum) && pageNum > 0) {
      filters.page = pageNum;
    }
  }

  const limit = searchParams.get("limit");
  if (limit) {
    const limitNum = parseInt(limit, 10);
    if (!isNaN(limitNum) && limitNum > 0) {
      filters.limit = limitNum;
    }
  }

  const sortBy = searchParams.get("sortBy");
  if (sortBy && SORT_OPTIONS.some((opt) => opt.value === sortBy)) {
    filters.sortBy = sortBy as any;
  }

  const viewMode = searchParams.get("viewMode");
  if (viewMode && Object.values(VIEW_MODES).includes(viewMode as any)) {
    filters.viewMode = viewMode as any;
  }

  return filters;
}

// ============================================
// Distance Calculation
// ============================================

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in miles
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// ============================================
// Provider Display
// ============================================

/**
 * Get provider display name
 */
export function getProviderDisplayName(
  provider: ProviderPublicProfile
): string {
  return provider.organizationName;
}

/**
 * Get provider badges (verified, new, etc.)
 */
export function getProviderBadges(
  provider: ProviderPublicProfile
): Array<{ label: string; variant: string }> {
  const badges: Array<{ label: string; variant: string }> = [];

  if (provider.verified) {
    badges.push({
      label: "Verified",
      variant: "healthcareSuccess",
    });
  }

  // Check if provider is "new" (created within last 30 days)
  // This would need to be added to ProviderPublicProfile if needed
  // For now, we'll just return verified badge

  return badges;
}

// ============================================
// Favorites Utilities
// ============================================

/**
 * Check if a provider is in favorites
 */
export function isFavorite(providerId: string, favorites: Favorite[]): boolean {
  return favorites.some((f) => f.providerId === providerId);
}

/**
 * Get favorite ID for a provider
 */
export function getFavoriteId(
  providerId: string,
  favorites: Favorite[]
): string | undefined {
  const favorite = favorites.find((f) => f.providerId === providerId);
  return favorite?.id;
}

// ============================================
// AI Search Utilities
// ============================================

/**
 * Check if user can use AI search based on rate limiting
 */
export function canUseAISearch(
  lastQueryTime: number | null,
  queryCount: number
): boolean {
  if (queryCount >= AI_SEARCH_RATE_LIMIT) {
    if (lastQueryTime) {
      const timeSinceLastQuery = Date.now() - lastQueryTime;
      const oneMinute = 60 * 1000;
      // Reset count if more than 1 minute has passed
      return timeSinceLastQuery > oneMinute;
    }
    return false;
  }
  return true;
}

/**
 * Check if query is long enough for AI search
 */
export function isQueryLongEnough(query: string): boolean {
  return query.trim().length >= AI_SEARCH_MIN_QUERY_LENGTH;
}

// ============================================
// Formatting Utilities
// ============================================

/**
 * Format distance for display
 */
export function formatDistance(distance?: number): string {
  if (distance === undefined || distance === null) {
    return "";
  }
  if (distance < 1) {
    return `${Math.round(distance * 10) / 10} mi`;
  }
  return `${Math.round(distance)} mi`;
}

/**
 * Format rating for display
 */
export function formatRating(rating?: number): string {
  if (rating === undefined || rating === null) {
    return "N/A";
  }
  return rating.toFixed(1);
}

/**
 * Format availability text
 */
export function formatAvailability(
  spotsAvailable: number,
  capacity?: number
): string {
  if (spotsAvailable === 0) {
    return "No availability";
  }
  if (capacity && spotsAvailable < capacity) {
    return `${spotsAvailable} of ${capacity} spots available`;
  }
  return `${spotsAvailable} spot${spotsAvailable > 1 ? "s" : ""} available`;
}
