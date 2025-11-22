# Family Member / Public User Dashboard - Implementation Plan

## Overview
This document outlines the comprehensive implementation plan for the Family Member (Public User) dashboard, ensuring 100% compliance with the PRD and schema requirements.

## PRD Requirements Summary

### Primary Needs
- Find appropriate care quickly
- Understand payer acceptance
- Compare facilities and services
- Contact providers directly

### Key Features (from PRD)
1. **Public Search with Filters**
   - Location (County/City/ZIP + radius)
   - License types with sub-categories
   - Service types (controlled vocabulary)
   - Payer acceptance (MA, Medicare, Private, CADI, BI/TBI, EW, DD)
   - Accessibility features
   - Availability (Open-only toggle)
   - Performance: Sub-1 second response time (p95)

2. **Results Display**
   - 20 results per page
   - Grid/List/Map views
   - Deep-link safe URLs
   - Verified/New badges

3. **AI-Powered Search (CareBot)**
   - Natural language to structured filters
   - 90%+ accuracy on MN-specific vocabulary
   - Rate limiting: 10 queries/min/user
   - Graceful fallback to manual filters

4. **Provider Profiles**
   - Photos display
   - Detailed information
   - Contact functionality

5. **Save Favorites**
   - Save providers to favorites list
   - Manage favorites

6. **Referral Handoff**
   - Hand off to case managers for formal referral

## Schema Analysis

### Relevant Models
- `User` (role: PUBLIC)
- `Provider` (with homes, services, openings)
- `Home` (with photos, amenities, services)
- `Opening` (availability, payers, requirements)
- `Service` (controlled vocabulary)
- `License` (license types)
- `Referral` (for handoff to case managers)

### Missing Models (Need to Add)
- `Favorite` - For saving favorite providers
  ```prisma
  model Favorite {
    id         String   @id @default(uuid())
    userId     String
    user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    providerId String
    provider   Provider @relation(fields: [providerId], references: [id], onDelete: Cascade)
    createdAt  DateTime @default(now())
    
    @@unique([userId, providerId])
    @@index([userId])
    @@index([providerId])
    @@schema("core")
  }
  ```

## Implementation Plan

### Phase 1: Shared Resources (Types, Constants, Utils)

#### 1.1 Shared Types (`packages/types/src/index.ts`)
```typescript
// Public Search Types
export interface PublicSearchFilters {
  search?: string;
  location?: {
    type: 'county' | 'city' | 'zip';
    value: string;
    radius?: number; // in miles
  };
  licenseTypes?: string[];
  serviceTypes?: string[];
  payers?: Payer[];
  accessibility?: {
    wheelchairAccessible?: boolean;
    singleLevel?: boolean;
    hasElevator?: boolean;
    hasRollInShower?: boolean;
  };
  availability?: 'open-only' | 'all';
  verified?: boolean;
}

export interface PublicSearchParams extends PublicSearchFilters {
  page?: number;
  limit?: number;
  sortBy?: 'relevance' | 'distance' | 'rating' | 'newest';
  viewMode?: 'grid' | 'list' | 'map';
}

export interface PublicSearchResponse {
  providers: Provider[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProviderPublicProfile {
  id: string;
  organizationName: string;
  description?: string;
  logo?: string;
  verified: boolean;
  subscriptionTier: SubscriptionTier;
  homes: HomePublicProfile[];
  primaryLicenseType: string;
  licenses: Array<{
    licenseType: string;
    licenseNumber: string;
    expirationDate: Date;
  }>;
  averageRating?: number;
  reviewCount: number;
  distance?: number; // in miles, if location provided
}

export interface HomePublicProfile {
  id: string;
  name: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zipCode: string;
    county: string;
  };
  location: {
    latitude: number;
    longitude: number;
  };
  photos: Array<{
    url: string;
    caption?: string;
    isPrimary: boolean;
  }>;
  capacity: number;
  currentOccupancy: number;
  accessibility: {
    wheelchairAccessible: boolean;
    singleLevel: boolean;
    hasElevator: boolean;
    hasRollInShower: boolean;
  };
  services: Array<{
    id: string;
    code: string;
    name: string;
    category: string;
  }>;
  openings: Array<{
    id: string;
    spotsAvailable: number;
    availableFrom: Date;
    acceptedPayers: Payer[];
    careLevels: string[];
    supportedNeeds: string[];
  }>;
}

export interface Favorite {
  id: string;
  userId: string;
  providerId: string;
  provider: ProviderPublicProfile;
  createdAt: Date;
}

export interface GetFavoritesResponse {
  favorites: Favorite[];
  total: number;
}

export interface CreateFavoriteData {
  providerId: string;
}

export interface CareBotQueryRequest {
  query: string;
  userId?: string; // Optional for rate limiting
}

export interface CareBotQueryResponse {
  filters: Partial<PublicSearchFilters>;
  explanation?: string;
  confidence?: number;
}
```

#### 1.2 Shared Constants (`apps/web/src/lib/constants/public.ts`)
```typescript
// View Modes
export const VIEW_MODES = {
  GRID: 'grid',
  LIST: 'list',
  MAP: 'map',
} as const;

export type ViewMode = typeof VIEW_MODES[keyof typeof VIEW_MODES];

// Sort Options
export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'distance', label: 'Distance' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest First' },
] as const;

// Search Radius Options
export const RADIUS_OPTIONS = [
  { value: 5, label: '5 miles' },
  { value: 10, label: '10 miles' },
  { value: 25, label: '25 miles' },
  { value: 50, label: '50 miles' },
  { value: 100, label: '100+ miles' },
] as const;

// Results Per Page
export const RESULTS_PER_PAGE_OPTIONS = [10, 20, 50, 100] as const;
export const DEFAULT_RESULTS_PER_PAGE = 20;

// AI Search Rate Limits
export const AI_SEARCH_RATE_LIMIT = 10; // queries per minute
export const AI_SEARCH_MIN_QUERY_LENGTH = 10;

// Badge Configurations
export const VERIFIED_BADGE_CONFIG = {
  label: 'Verified',
  variant: 'healthcareSuccess' as const,
};

export const NEW_BADGE_CONFIG = {
  label: 'New',
  variant: 'healthcareInfo' as const,
};
```

#### 1.3 Shared Utilities (`apps/web/src/lib/utils/public.ts`)
```typescript
// Search Utilities
export function buildSearchUrl(filters: PublicSearchParams): string {
  // Build deep-link safe URL with search state
}

export function parseSearchUrl(searchParams: URLSearchParams): PublicSearchParams {
  // Parse URL parameters back to search filters
}

// Distance Calculation
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Haversine formula for distance calculation
}

// Provider Display
export function getProviderDisplayName(provider: ProviderPublicProfile): string {
  return provider.organizationName;
}

export function getProviderBadges(provider: ProviderPublicProfile): Array<{
  label: string;
  variant: string;
}> {
  // Return verified, new, etc. badges
}

// Favorites Utilities
export function isFavorite(
  providerId: string,
  favorites: Favorite[]
): boolean {
  return favorites.some((f) => f.providerId === providerId);
}

// AI Search Utilities
export function canUseAISearch(
  lastQueryTime: number,
  queryCount: number
): boolean {
  // Check rate limiting
}
```

### Phase 2: Backend Implementation

#### 2.1 Database Schema Updates
- Add `Favorite` model to schema.prisma
- Run migration

#### 2.2 Backend Service (`packages/api/src/services/public.service.ts`)
```typescript
export class PublicService {
  // Public search (no auth required)
  async searchProviders(filters: PublicSearchParams): Promise<PublicSearchResponse> {
    // Implement comprehensive search with all filters
    // Include distance calculation if location provided
    // Apply sorting
    // Return paginated results
  }

  // Get provider public profile
  async getProviderPublicProfile(providerId: string, userLocation?: { lat: number; lon: number }): Promise<ProviderPublicProfile> {
    // Get provider with homes, services, openings
    // Calculate distance if user location provided
    // Return public-safe profile
  }

  // Favorites Management
  async getFavorites(userId: string): Promise<Favorite[]> {
    // Get user's favorites
  }

  async addFavorite(userId: string, providerId: string): Promise<Favorite> {
    // Add provider to favorites
    // Check for duplicates
  }

  async removeFavorite(userId: string, providerId: string): Promise<void> {
    // Remove favorite
  }

  // AI Search (CareBot)
  async parseNaturalLanguageQuery(query: string, userId?: string): Promise<CareBotQueryResponse> {
    // Call OpenAI API to parse query
    // Apply rate limiting
    // Return structured filters
  }
}
```

#### 2.3 Backend Controller (`packages/api/src/controllers/public.controller.ts`)
```typescript
export class PublicController {
  // Public search endpoint (no auth required)
  async searchProviders(req: Request, res: Response): Promise<void> {
    // Validate filters
    // Call service
    // Return results
  }

  // Get provider profile (no auth required)
  async getProviderProfile(req: Request, res: Response): Promise<void> {
    // Get provider ID from params
    // Optionally get user location from query
    // Call service
    // Return profile
  }

  // Favorites endpoints (auth required for PUBLIC role)
  async getFavorites(req: Request, res: Response): Promise<void> {
    // Require auth
    // Get user ID from token
    // Call service
    // Return favorites
  }

  async addFavorite(req: Request, res: Response): Promise<void> {
    // Require auth
    // Validate provider ID
    // Call service
    // Return favorite
  }

  async removeFavorite(req: Request, res: Response): Promise<void> {
    // Require auth
    // Validate favorite ID
    // Call service
    // Return success
  }

  // AI Search endpoint (auth optional for rate limiting)
  async parseQuery(req: Request, res: Response): Promise<void> {
    // Validate query
    // Check rate limits if user authenticated
    // Call service
    // Return parsed filters
  }
}
```

#### 2.4 Backend Routes (`packages/api/src/routes/public.routes.ts`)
```typescript
// Public routes (no auth required)
router.get('/providers', publicController.searchProviders);
router.get('/providers/:id', publicController.getProviderProfile);

// AI Search (optional auth for rate limiting)
router.post('/carebot/parse', 
  authMiddleware.optionalAuth, // Optional auth
  publicController.parseQuery
);

// Favorites routes (auth required)
router.get('/favorites',
  authMiddleware.requireAuth,
  authMiddleware.requireRole([UserRole.PUBLIC]),
  publicController.getFavorites
);

router.post('/favorites',
  authMiddleware.requireAuth,
  authMiddleware.requireRole([UserRole.PUBLIC]),
  publicController.addFavorite
);

router.delete('/favorites/:id',
  authMiddleware.requireAuth,
  authMiddleware.requireRole([UserRole.PUBLIC]),
  publicController.removeFavorite
);
```

### Phase 3: Frontend API Service

#### 3.1 Frontend Service (`apps/web/src/lib/api/services/public.service.ts`)
```typescript
export const publicService = {
  // Search providers (public, no auth)
  async searchProviders(params: PublicSearchParams): Promise<ApiResponse<PublicSearchResponse>> {
    // Build query params
    // Call API
    // Return response
  },

  // Get provider profile (public, no auth)
  async getProviderProfile(providerId: string, userLocation?: { lat: number; lon: number }): Promise<ApiResponse<ProviderPublicProfile>> {
    // Build query params with location if provided
    // Call API
    // Return response
  },

  // Favorites (auth required)
  async getFavorites(): Promise<ApiResponse<GetFavoritesResponse>> {
    // Call API
    // Return favorites
  },

  async addFavorite(providerId: string): Promise<ApiResponse<Favorite>> {
    // Call API
    // Return favorite
  },

  async removeFavorite(favoriteId: string): Promise<ApiResponse<void>> {
    // Call API
    // Return success
  },

  // AI Search
  async parseQuery(query: string): Promise<ApiResponse<CareBotQueryResponse>> {
    // Call API
    // Return parsed filters
  },
};
```

### Phase 4: Frontend Components

#### 4.1 Shared Components (`apps/web/src/components/public/`)
- `public-loading-state.tsx` - Loading state component
- `public-error-state.tsx` - Error state component
- `public-empty-state.tsx` - Empty state component
- `provider-card.tsx` - Provider card for grid/list views
- `provider-card-grid.tsx` - Grid view container
- `provider-card-list.tsx` - List view container
- `provider-map.tsx` - Map view component
- `search-filters.tsx` - Comprehensive filter panel
- `search-results-header.tsx` - Results header with view toggle, sort, etc.
- `ai-search-input.tsx` - AI-powered search input with CareBot
- `favorite-button.tsx` - Add/remove favorite button
- `provider-badges.tsx` - Verified/New badges
- `referral-handoff-dialog.tsx` - Dialog for handing off to case manager

### Phase 5: Frontend Pages

#### 5.1 Dashboard Structure (`apps/web/src/app/public/(dashboard)/`)
```
public/
  (dashboard)/
    layout.tsx - Public dashboard layout with navigation
    use-page-metadata.tsx - Page metadata hook
    dashboard/
      page.tsx - Dashboard overview (favorites, recent searches)
    search/
      page.tsx - Main search page with filters, results, AI search
    providers/
      [providerId]/
        page.tsx - Provider detail page
    favorites/
      page.tsx - Favorites list page
    settings/
      page.tsx - User settings (profile, preferences)
```

### Phase 6: Features Implementation

#### 6.1 Public Search Page
- **Features:**
  - AI-powered search input (CareBot)
  - Comprehensive filter panel
  - View mode toggle (Grid/List/Map)
  - Sort options
  - Pagination
  - Deep-link URL support
  - Results display with badges
  - Distance calculation
  - Favorite toggle on each result

#### 6.2 Provider Detail Page
- **Features:**
  - Provider information
  - Home listings with photos
  - Services offered
  - Availability/openings
  - Payer acceptance
  - Accessibility features
  - Contact information
  - Favorite button
  - Referral handoff button
  - Map view of locations

#### 6.3 Favorites Page
- **Features:**
  - List of favorited providers
  - Remove favorite functionality
  - Quick link to provider detail
  - Search within favorites

#### 6.4 Dashboard Page
- **Features:**
  - Recent searches
  - Favorite providers
  - Quick search
  - Help/guidance

#### 6.5 Settings Page
- **Features:**
  - Profile management
  - Notification preferences
  - Search preferences (default radius, view mode, etc.)

## Implementation Checklist

### Backend
- [ ] Add `Favorite` model to schema.prisma
- [ ] Run database migration
- [ ] Create `PublicService` with search, profile, favorites, AI search methods
- [ ] Create `PublicController` with all endpoints
- [ ] Create `public.routes.ts` with proper auth/optional auth
- [ ] Add rate limiting for AI search
- [ ] Implement distance calculation
- [ ] Add comprehensive search filtering

### Frontend - Shared Resources
- [ ] Add public search types to `packages/types/src/index.ts`
- [ ] Create `apps/web/src/lib/constants/public.ts`
- [ ] Create `apps/web/src/lib/utils/public.ts`
- [ ] Export from `apps/web/src/lib/api/index.ts`

### Frontend - API Service
- [ ] Create `apps/web/src/lib/api/services/public.service.ts`
- [ ] Implement all service methods

### Frontend - Components
- [ ] Create loading/error/empty state components
- [ ] Create `ProviderCard` component
- [ ] Create grid/list/map view components
- [ ] Create search filters component
- [ ] Create AI search input component
- [ ] Create favorite button component
- [ ] Create referral handoff dialog

### Frontend - Pages
- [ ] Create dashboard layout
- [ ] Create search page
- [ ] Create provider detail page
- [ ] Create favorites page
- [ ] Create dashboard overview page
- [ ] Create settings page

### Features
- [ ] Implement AI-powered search (CareBot)
- [ ] Implement deep-link URL support
- [ ] Implement distance calculation
- [ ] Implement favorites functionality
- [ ] Implement referral handoff
- [ ] Implement view mode switching
- [ ] Implement sorting
- [ ] Implement pagination

### Testing & Validation
- [ ] Verify all PRD requirements met
- [ ] Verify schema compliance
- [ ] Test search performance (< 1s p95)
- [ ] Test AI search accuracy
- [ ] Test rate limiting
- [ ] Test favorites functionality
- [ ] Test referral handoff
- [ ] Test deep-link URLs
- [ ] Test all view modes
- [ ] Test accessibility

## Notes

1. **Public Search**: Should be accessible without authentication for basic search, but favorites and AI search may require authentication for rate limiting and personalization.

2. **Performance**: Search must meet sub-1 second response time requirement. Consider caching, database indexing, and query optimization.

3. **AI Search**: Implement rate limiting (10 queries/min/user) and graceful fallback to manual filters.

4. **Deep Links**: Ensure search state is preserved in URL for sharing and bookmarking.

5. **Distance Calculation**: Use Haversine formula for accurate distance calculation when user location is provided.

6. **Favorites**: Simple many-to-many relationship between User and Provider.

7. **Referral Handoff**: Should allow public users to initiate a referral that gets assigned to a case manager.

