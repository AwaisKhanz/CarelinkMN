"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Grid3x3, List, MapPin, SlidersHorizontal } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared";
import {
  SearchFilters,
  AISearchInput,
  ProviderCard,
} from "@/components/public";
import { usePageMetadata } from "../use-page-metadata";
import { publicService } from "@/lib/api";
import {
  PublicSearchParams,
  PublicSearchResponse,
  ProviderPublicProfile,
} from "@carelink/types";
import { toast } from "sonner";
import {
  VIEW_MODES,
  SORT_OPTIONS,
  RESULTS_PER_PAGE_OPTIONS,
  DEFAULT_RESULTS_PER_PAGE,
  ViewMode,
  SortOption,
} from "@/lib/constants/public";

// Get default sort option from constants
const DEFAULT_SORT_OPTION = SORT_OPTIONS[0].value;
import { buildSearchUrl, parseSearchUrl } from "@/lib/utils/public";
import { useAuth } from "@/contexts/auth-context";
import { useDebounce } from "@/hooks/use-debounce";

export default function PublicSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [filters, setFilters] = useState<Partial<PublicSearchParams>>({});
  const [viewMode, setViewMode] = useState<ViewMode>(VIEW_MODES.GRID);
  const [sortBy, setSortBy] = useState<SortOption>(DEFAULT_SORT_OPTION);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_RESULTS_PER_PAGE);

  // Results
  const [providers, setProviders] = useState<ProviderPublicProfile[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    setTitle("Search Providers");
    setDescription("Find care providers in Minnesota");
  }, [setTitle, setDescription]);

  // Parse URL params on mount
  useEffect(() => {
    const parsed = parseSearchUrl(searchParams);
    if (parsed.search) setSearchQuery(parsed.search);
    if (parsed) setFilters(parsed);
    if (parsed.sortBy) setSortBy(parsed.sortBy as SortOption);
    if (parsed.page) setPage(parsed.page);
    if (parsed.limit) setPageSize(parsed.limit);
  }, []);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearchQuery) params.set("search", debouncedSearchQuery);
    if (filters && Object.keys(filters).length > 0) {
      const filterParams = buildSearchUrl({
        search: searchQuery,
        ...filters,
        sortBy: filters.sortBy || DEFAULT_SORT_OPTION,
        page,
        limit: pageSize || DEFAULT_RESULTS_PER_PAGE,
      });
      const filterSearchParams = new URLSearchParams(filterParams);
      filterSearchParams.forEach((value, key) => {
        params.set(key, value);
      });
    }
    if (sortBy !== DEFAULT_SORT_OPTION) params.set("sortBy", sortBy);
    if (page > 1) params.set("page", page.toString());
    if (pageSize !== DEFAULT_RESULTS_PER_PAGE)
      params.set("pageSize", pageSize.toString());

    const newUrl = `/public/search${params.toString() ? `?${params.toString()}` : ""}`;
    router.replace(newUrl, { scroll: false });
  }, [debouncedSearchQuery, filters, sortBy, page, pageSize, router]);

  // Fetch providers
  const fetchProviders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const searchParams: PublicSearchParams = {
        search: debouncedSearchQuery || undefined,
        ...filters,
        sortBy: filters.sortBy || DEFAULT_SORT_OPTION,
        page,
        limit: pageSize || DEFAULT_RESULTS_PER_PAGE,
      };

      const response = await publicService.searchProviders(searchParams);

      if (response.success && response.data) {
        setProviders(response.data.providers || []);
        setTotalResults(response.data.total || 0);
        setTotalPages(response.data.totalPages || 0);
      } else {
        setError(response.message || "Failed to search providers");
        toast.error(response.message || "Failed to search providers");
      }
    } catch (err) {
      console.error("Error searching providers:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to search providers";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchQuery, filters, sortBy, page, pageSize]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  // Fetch favorites if user is authenticated
  useEffect(() => {
    if (user?.id) {
      publicService
        .getFavorites()
        .then((response) => {
          if (response.success && response.data) {
            const favoriteIds = new Set(
              response.data.favorites.map((f) => f.providerId)
            );
            setFavorites(favoriteIds);
          }
        })
        .catch((err) => {
          console.error("Error fetching favorites:", err);
        });
    }
  }, [user?.id]);

  const handleFavoriteToggle = async (
    providerId: string,
    isFavorite: boolean
  ) => {
    if (!user?.id) {
      toast.error("Please sign in to save favorites");
      return;
    }

    try {
      if (isFavorite) {
        await publicService.addFavorite({ providerId });
        setFavorites((prev) => new Set([...prev, providerId]));
        toast.success("Added to favorites");
      } else {
        const favorite = Array.from(favorites).find((id) => id === providerId);
        if (favorite) {
          // We need the favorite ID to remove it
          const response = await publicService.getFavorites();
          if (response.success && response.data) {
            const fav = response.data.favorites.find(
              (f) => f.providerId === providerId
            );
            if (fav) {
              await publicService.removeFavorite(fav.id);
              setFavorites((prev) => {
                const next = new Set(prev);
                next.delete(providerId);
                return next;
              });
              toast.success("Removed from favorites");
            }
          }
        }
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
      toast.error("Failed to update favorite");
    }
  };

  const handleFiltersChange = (newFilters: Partial<PublicSearchParams>) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setFilters({});
    setPage(1);
  };

  const handleAIFiltersApplied = (aiFilters: Partial<PublicSearchParams>) => {
    setFilters((prev) => ({ ...prev, ...aiFilters }));
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  const hasActiveFilters =
    searchQuery || (filters && Object.keys(filters).length > 0);

  if (error && providers.length === 0) {
    return (
      <ErrorState
        title="Error Searching Providers"
        message={error}
        action={{
          label: "Retry",
          onClick: fetchProviders,
          variant: "healthcare",
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Search Providers
          </h1>
          <p className="text-muted-foreground mt-1">
            Find care providers in Minnesota
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            {showFilters ? "Hide" : "Show"} Filters
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card variant="healthcare">
        <div className="p-4">
          <AISearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            onFiltersApplied={handleAIFiltersApplied}
            placeholder="Search by name, location, services, or use AI to describe what you're looking for..."
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="lg:col-span-1">
            <SearchFilters
              filters={filters || {}}
              onFiltersChange={handleFiltersChange}
              onClear={handleClearFilters}
            />
          </div>
        )}

        {/* Results */}
        <div className={showFilters ? "lg:col-span-3" : "lg:col-span-4"}>
          {/* Results Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></span>
                      Searching...
                    </span>
                  ) : totalResults > 0 ? (
                    <>
                      Found{" "}
                      <span className="font-semibold text-foreground">
                        {totalResults}
                      </span>{" "}
                      provider{totalResults !== 1 ? "s" : ""}
                    </>
                  ) : (
                    "No providers found"
                  )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as SortOption)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1 border rounded-md">
                <Button
                  variant={viewMode === VIEW_MODES.GRID ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode(VIEW_MODES.GRID)}
                  className="rounded-r-none"
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === VIEW_MODES.LIST ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode(VIEW_MODES.LIST)}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && providers.length === 0 && (
            <LoadingState message="Searching providers..." />
          )}

          {/* Empty State */}
          {!isLoading && providers.length === 0 && (
            <EmptyState
              icon={MapPin}
              title="No providers found"
              description={
                hasActiveFilters
                  ? "Try adjusting your search filters or search query"
                  : "Start searching to find care providers"
              }
              action={
                hasActiveFilters
                  ? {
                      label: "Clear Filters",
                      onClick: handleClearFilters,
                      variant: "healthcare",
                    }
                  : undefined
              }
            />
          )}

          {/* Results Grid/List */}
          {providers.length > 0 && (
            <div className={isLoading ? "opacity-50 transition-opacity" : ""}>
              <div
                className={
                  viewMode === VIEW_MODES.GRID
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    : "space-y-4"
                }
              >
                {providers.map((provider) => (
                  <ProviderCard
                    key={provider.id}
                    provider={provider}
                    viewMode={viewMode}
                    isFavorite={favorites.has(provider.id)}
                    onFavoriteToggle={handleFavoriteToggle}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Results per page:
                    </span>
                    <Select
                      value={pageSize.toString()}
                      onValueChange={(value) =>
                        handlePageSizeChange(parseInt(value, 10))
                      }
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RESULTS_PER_PAGE_OPTIONS.map((size) => (
                          <SelectItem key={size} value={size.toString()}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
