// ============================================
// PUBLIC SEARCH CONSTANTS (Family Member Dashboard)
// ============================================

// View Modes
export const VIEW_MODES = {
  GRID: "grid",
  LIST: "list",
  MAP: "map",
} as const;

export type ViewMode = (typeof VIEW_MODES)[keyof typeof VIEW_MODES];

// Sort Options
export const SORT_OPTIONS = [
  { value: "relevance", label: "Most Relevant" },
  { value: "distance", label: "Distance" },
  { value: "rating", label: "Highest Rated" },
  { value: "newest", label: "Newest First" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

// Search Radius Options (in miles)
export const RADIUS_OPTIONS = [
  { value: 5, label: "5 miles" },
  { value: 10, label: "10 miles" },
  { value: 25, label: "25 miles" },
  { value: 50, label: "50 miles" },
  { value: 100, label: "100+ miles" },
] as const;

// Results Per Page Options
export const RESULTS_PER_PAGE_OPTIONS = [10, 20, 50, 100] as const;
export const DEFAULT_RESULTS_PER_PAGE = 20;

// AI Search Configuration (re-exported from shared package)
export {
  AI_SEARCH_RATE_LIMIT,
  AI_SEARCH_MIN_QUERY_LENGTH,
} from "@carelink/utils";

// Badge Configurations
export const VERIFIED_BADGE_CONFIG = {
  label: "Verified",
  variant: "healthcareSuccess" as const,
};

export const NEW_BADGE_CONFIG = {
  label: "New",
  variant: "healthcareInfo" as const,
};

// Location Type Options
export const LOCATION_TYPE_OPTIONS = [
  { value: "county", label: "County" },
  { value: "city", label: "City" },
  { value: "zip", label: "ZIP Code" },
] as const;

export type LocationType = (typeof LOCATION_TYPE_OPTIONS)[number]["value"];

// Availability Filter Options
export const AVAILABILITY_FILTER_OPTIONS = [
  { value: "all", label: "All Providers" },
  { value: "open-only", label: "Open Availability Only" },
] as const;

export type AvailabilityFilter =
  (typeof AVAILABILITY_FILTER_OPTIONS)[number]["value"];
