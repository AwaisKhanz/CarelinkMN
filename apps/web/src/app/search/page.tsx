"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { providerService, Provider, GetProvidersParams } from "@/lib/api";
import { OrganizationStatus } from "@carelink/types";
import { Search, MapPin, Building, CheckCircle2, Loader2 } from "lucide-react";
import { MINNESOTA_COUNTIES } from "@/lib/constants";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { MultiSelect } from "@/components/ui/multi-select";

export default function PublicSearchPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [selectedCounties, setSelectedCounties] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchProviders();
  }, [debouncedSearch, selectedCounties, pagination.page]);

  const fetchProviders = async () => {
    setIsLoading(true);
    try {
      const params: GetProvidersParams = {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        status: OrganizationStatus.VERIFIED,
        county: selectedCounties.length > 0 ? selectedCounties.join(",") : undefined,
      };

      const response = await providerService.getProviders(params);

      if (response.success && response.data) {
        setProviders(response.data.providers || []);
        if (response.data.pagination) {
          setPagination((prev) => ({
            ...prev,
            total: response.data?.pagination?.total || 0,
            pages: response.data?.pagination?.pages || 0,
          }));
        }
      }
    } catch (err) {
      console.error("Error fetching providers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCounty = (county: string) => {
    setSelectedCounties((prev) =>
      prev.includes(county)
        ? prev.filter((c) => c !== county)
        : [...prev, county]
    );
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCounties([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 py-8">
        <div className="healthcare-container">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Browse Providers</h1>
            <p className="text-lg text-muted-foreground">
              Search verified care providers across Minnesota
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <Card className="bg-card border-border sticky top-20">
                <CardContent className="pt-6 space-y-6">
                  {/* Filter Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-border">
                    <h3 className="font-semibold text-lg text-foreground">Filters</h3>
                    {(selectedCounties.length > 0 || searchQuery) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearFilters}
                        className="text-primary hover:text-primary/80"
                      >
                        Clear all
                      </Button>
                    )}
                  </div>

                  {/* Search Input */}
                  <div className="space-y-2">
                    <Label htmlFor="search" className="text-sm font-medium text-foreground">
                      Search
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="search"
                        placeholder="Provider name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-background border-border"
                      />
                    </div>
                  </div>

                  {/* Location Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">
                      Location (Counties)
                    </Label>
                    <MultiSelect
                      options={MINNESOTA_COUNTIES.map((county) => ({
                        label: county,
                        value: county,
                      }))}
                      selected={selectedCounties}
                      onChange={setSelectedCounties}
                      placeholder="Select counties..."
                      searchPlaceholder="Search counties..."
                      emptyMessage="No counties found"
                      badgeDisplayLimit={2}
                      className="w-full"
                    />
                  </div>

                  {/* Active Filters */}
                  {selectedCounties.length > 0 && (
                    <div className="pt-4 border-t border-border">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Active Filters ({selectedCounties.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedCounties.map((county) => (
                          <Badge
                            key={county}
                            variant="secondary"
                            className="bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
                            onClick={() => toggleCounty(county)}
                          >
                            {county}
                            <span className="ml-1 hover:text-primary/70">×</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Results */}
            <div className="lg:col-span-3 space-y-4">
              {/* Results Header */}
              <div className="flex items-center justify-between bg-card border border-border rounded-lg px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {pagination.total} provider{pagination.total !== 1 ? "s" : ""} found
                  </p>
                  {selectedCounties.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Filtered by {selectedCounties.length} count{selectedCounties.length !== 1 ? "ies" : "y"}
                    </p>
                  )}
                </div>
              </div>

              {/* Provider Cards */}
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center space-y-3">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                    <p className="text-sm text-muted-foreground">Loading providers...</p>
                  </div>
                </div>
              ) : providers.length === 0 ? (
                <Card className="bg-card border-border">
                  <CardContent className="py-16 text-center">
                    <div className="space-y-3">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                        <Search className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">No providers found</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Try adjusting your filters or search query
                        </p>
                      </div>
                      {(selectedCounties.length > 0 || searchQuery) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleClearFilters}
                          className="mt-4"
                        >
                          Clear all filters
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {providers.map((provider) => (
                    <Card
                      key={provider.id}
                      className="bg-card border-border hover:border-primary/30 hover:shadow-md transition-all duration-200"
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-xl mb-2 text-foreground">
                              {provider.organization?.name || "Unknown Provider"}
                            </h3>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-4 w-4" />
                                <span>
                                  {provider.organization?.city || "N/A"},{" "}
                                  {provider.organization?.county || "N/A"} County
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {provider.verified && (
                              <Badge variant="secondary" className="bg-primary/10 text-primary">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                        </div>

                        {provider.description && (
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                            {provider.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 mb-4 pb-4 border-b border-border">
                          {provider.homes && provider.homes.length > 0 && (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Building className="h-4 w-4" />
                              <span className="font-medium text-foreground">
                                {provider.homes.length}
                              </span>
                              <span>Home{provider.homes.length !== 1 ? "s" : ""}</span>
                            </div>
                          )}
                          {provider.licenses && provider.licenses.length > 0 && (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="font-medium text-foreground">
                                {provider.licenses.length}
                              </span>
                              <span>License{provider.licenses.length !== 1 ? "s" : ""}</span>
                            </div>
                          )}
                        </div>

                        {provider.licenses && provider.licenses.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {provider.licenses.slice(0, 3).map((license) => (
                              <Badge key={license.id} variant="outline" className="text-xs font-normal">
                                {license.licenseType}
                              </Badge>
                            ))}
                            {provider.licenses.length > 3 && (
                              <Badge variant="outline" className="text-xs font-normal">
                                +{provider.licenses.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-3">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => router.push(`/public/providers/${provider.id}`)}
                            className="shadow-sm"
                          >
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                        }
                        disabled={pagination.page === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground px-4">
                        Page {pagination.page} of {pagination.pages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                        }
                        disabled={pagination.page === pagination.pages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
