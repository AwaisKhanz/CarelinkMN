"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { usePageMetadata } from "../use-page-metadata";
import { useCaseManagerId } from "@/hooks/use-case-manager-data";
import {
  providerService,
  Provider,
  GetProvidersParams,
  aiSearchService,
} from "@/lib/api";
import { openingService } from "@/lib/api";
import { referralService } from "@/lib/api";
import { toast } from "sonner";
import {
  Search,
  MapPin,
  Clock,
  Users,
  Building,
  CheckCircle2,
  XCircle,
  Loader2,
  Filter,
  AlertCircle,
  Plus,
  Sparkles,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Payer,
  OpeningStatus,
  OrganizationType,
  OrganizationStatus,
} from "@carelink/types";
import {
  LICENSE_TYPES,
  MINNESOTA_COUNTIES,
  PAYER_OPTIONS,
  CARE_LEVELS,
  SUPPORTED_NEEDS,
  PAYER_LABELS,
} from "@/lib/constants";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CaseManagerLoadingState,
  CaseManagerErrorState,
} from "@/components/case-manager";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ProviderSearchResultCard } from "./components/provider-search-result-card";
import { ProviderWithAvailability } from "@carelink/types";
import { RequirePermission } from "@/components/auth/require-permission";
import { CASE_MANAGER_CAPABILITIES } from "@/lib/permissions/capabilities";
import { useRolePermissions } from "@/hooks/use-role-permissions";

function CaseManagerSearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const caseManagerId = useCaseManagerId();
  const { setTitle, setDescription } = usePageMetadata();
  const { canUseAISearch } = useRolePermissions();

  const referralId = searchParams.get("referralId");
  const referralNumber = searchParams.get("referralNumber");

  const [providers, setProviders] = useState<ProviderWithAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and filters
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [selectedCounties, setSelectedCounties] = useState<string[]>([]);
  const [selectedLicenseTypes, setSelectedLicenseTypes] = useState<string[]>(
    []
  );
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedPayers, setSelectedPayers] = useState<string[]>([]);
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  // Selection
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [addToShortlistDialogOpen, setAddToShortlistDialogOpen] =
    useState(false);
  const [shortlistNotes, setShortlistNotes] = useState("");
  const [isAddingToShortlist, setIsAddingToShortlist] = useState(false);

  // CareBot AI Search
  const [useAISearch, setUseAISearch] = useState(false);
  const [isParsingQuery, setIsParsingQuery] = useState(false);

  useEffect(() => {
    setTitle("Search Providers");
    setDescription(
      referralId
        ? `Search providers for referral ${referralNumber || referralId}`
        : "Find providers for your referrals"
    );
  }, [setTitle, setDescription, referralId, referralNumber]);

  const handleAISearch = useCallback(
    async (query: string) => {
      if (!user?.id) return;

      setIsParsingQuery(true);
      try {
        const response = await aiSearchService.parseQuery(query);
        if (response.success && response.data?.filters) {
          const filters = response.data.filters;

          // Apply parsed filters
          if (filters.counties && filters.counties.length > 0) {
            setSelectedCounties(filters.counties);
          }
          if (filters.cities && filters.cities.length > 0) {
            // Cities can be used for additional filtering if needed
          }
          if (filters.licenseTypes && filters.licenseTypes.length > 0) {
            setSelectedLicenseTypes(filters.licenseTypes);
          }
          if (filters.payers && filters.payers.length > 0) {
            setSelectedPayers(filters.payers as Payer[]);
          }
          if (filters.maxDistance) {
            // Max distance can be used for filtering if needed
          }
          if (filters.hasAvailability) {
            setAvailabilityFilter("available");
          }

          toast.success("AI search filters applied!");
        }
      } catch (err) {
        console.error("AI search error:", err);
        // Fallback to regular search - don't show error, just use manual filters
      } finally {
        setIsParsingQuery(false);
      }
    },
    [user?.id]
  );

  // Handle AI search query parsing
  useEffect(() => {
    if (useAISearch && debouncedSearch && debouncedSearch.length > 10) {
      handleAISearch(debouncedSearch);
    }
  }, [debouncedSearch, useAISearch, handleAISearch]);

  useEffect(() => {
    if (caseManagerId || user?.id) {
      fetchProviders();
    }
  }, [
    caseManagerId,
    user?.id,
    debouncedSearch,
    selectedCounties,
    selectedLicenseTypes,
    selectedServices,
    selectedPayers,
    availabilityFilter,
    pagination.page,
  ]);

  const fetchProviders = useCallback(async () => {
    if (!caseManagerId && !user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const params: GetProvidersParams = {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        status: "ACTIVE",
        county: selectedCounties.length === 1 ? selectedCounties[0] : undefined,
      };

      const response = await providerService.getProviders(params);

      if (response.success && response.data) {
        // Get providers and enrich with availability data
        const providersList = response.data.providers || [];

        // Enrich providers with availability information
        const enrichedProviders = await Promise.all(
          providersList.map(async (provider) => {
            try {
              // Get openings for this provider to check availability
              const openingsResponse = await openingService.getOpenings({
                providerId: provider.id,
                status: OpeningStatus.OPEN,
                limit: 100,
              });

              const openings = openingsResponse.data?.openings || [];
              const homes = provider.homes || [];

              // Calculate statistics
              const openHomes = homes.filter((home) => home.isActive);
              const totalOpenings = openings.reduce(
                (sum, opening) => sum + (opening.spotsAvailable || 0),
                0
              );

              // Check if provider matches selected filters
              const matchingServices =
                selectedServices.length > 0
                  ? selectedServices.filter((service) =>
                      provider.organization?.name
                        .toLowerCase()
                        .includes(service.toLowerCase())
                    )
                  : [];

              // Check payer acceptance (simplified - would need to check openings)
              const acceptsPayer =
                selectedPayers.length === 0 ||
                openings.some((opening) =>
                  opening.acceptedPayers?.some((payer) =>
                    selectedPayers.includes(payer)
                  )
                );

              return {
                ...provider,
                openHomesCount: openHomes.length,
                totalOpenings,
                matchingServices,
                acceptsPayer,
              };
            } catch (err) {
              console.error(`Error enriching provider ${provider.id}:`, err);
              return {
                ...provider,
                openHomesCount: 0,
                totalOpenings: 0,
                matchingServices: [],
                acceptsPayer: true,
              };
            }
          })
        );

        // Map enriched providers to ProviderWithAvailability format
        const mappedProviders: ProviderWithAvailability[] =
          enrichedProviders.map((provider) => ({
            ...provider,
            organization: provider.organization
              ? {
                  id: provider.organization.id,
                  name: provider.organization.name,
                  type: provider.organization.type as OrganizationType,
                  status:
                    "status" in provider.organization
                      ? (provider.organization.status as OrganizationStatus)
                      : undefined,
                  email: provider.organization.email,
                  phone: provider.organization.phone,
                  city: provider.organization.city,
                  state: provider.organization.state,
                  county: provider.organization.county,
                }
              : undefined,
            homes: provider.homes?.map((home) => ({
              id: home.id,
              name: home.name,
              city: home.city || "",
              state: home.state || "",
            })),
          }));

        // Apply client-side filters (for multi-select filters)
        const filteredProviders = mappedProviders.filter((provider) => {
          // County filter (multiple)
          if (
            selectedCounties.length > 0 &&
            !selectedCounties.includes(provider.organization?.county || "")
          ) {
            return false;
          }

          // License type filter
          if (
            selectedLicenseTypes.length > 0 &&
            !provider.licenses?.some((license) =>
              selectedLicenseTypes.includes(license.licenseType)
            )
          ) {
            return false;
          }

          // Availability filter
          const providerOpenings = provider.totalOpenings || 0;
          if (availabilityFilter === "available" && providerOpenings === 0) {
            return false;
          }
          if (availabilityFilter === "waitlist" && providerOpenings > 0) {
            return false;
          }

          // Payer filter
          const providerAcceptsPayer = provider.acceptsPayer ?? true;
          if (!providerAcceptsPayer) {
            return false;
          }

          return true;
        });

        setProviders(filteredProviders);

        if (response.data?.pagination) {
          setPagination((prev) => ({
            ...prev,
            total: response.data?.pagination?.total || 0,
            pages: response.data?.pagination?.pages || 0,
          }));
        }
      } else {
        setError(response.message || "Failed to load providers");
      }
    } catch (err) {
      console.error("Error fetching providers:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch providers"
      );
      toast.error("Failed to load providers");
    } finally {
      setIsLoading(false);
    }
  }, [
    caseManagerId,
    user?.id,
    debouncedSearch,
    selectedCounties,
    selectedLicenseTypes,
    selectedServices,
    selectedPayers,
    availabilityFilter,
    pagination.page,
    pagination.limit,
  ]);

  const handleSelectProvider = (providerId: string) => {
    setSelectedProviders((prev) =>
      prev.includes(providerId)
        ? prev.filter((id) => id !== providerId)
        : [...prev, providerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProviders.length === providers.length) {
      setSelectedProviders([]);
    } else {
      setSelectedProviders(providers.map((p) => p.id));
    }
  };

  const handleClearSelection = () => {
    setSelectedProviders([]);
  };

  const handleAddToShortlist = async () => {
    if (!referralId) {
      toast.error("No referral selected. Please select a referral first.");
      router.push("/case-manager/referrals");
      return;
    }

    const providerIds =
      selectedProviders.length > 0
        ? selectedProviders
        : selectedProviders.length === 0 && providers.length === 1
          ? [providers[0].id]
          : [];

    if (providerIds.length === 0) {
      toast.error("Please select at least one provider");
      return;
    }

    setIsAddingToShortlist(true);
    try {
      const response = await referralService.addToShortlist(referralId, {
        providerIds,
        notes: shortlistNotes || undefined,
      });

      if (response.success) {
        toast.success(
          `${providerIds.length} provider${providerIds.length !== 1 ? "s" : ""} added to shortlist`
        );
        setAddToShortlistDialogOpen(false);
        setShortlistNotes("");
        setSelectedProviders([]);
        router.push(`/case-manager/referrals/${referralId}`);
      } else {
        toast.error(response.message || "Failed to add providers to shortlist");
      }
    } catch (err) {
      console.error("Error adding to shortlist:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to add to shortlist"
      );
    } finally {
      setIsAddingToShortlist(false);
    }
  };

  const toggleCounty = (county: string) => {
    setSelectedCounties((prev) =>
      prev.includes(county)
        ? prev.filter((c) => c !== county)
        : [...prev, county]
    );
  };

  const toggleLicenseType = (licenseType: string) => {
    setSelectedLicenseTypes((prev) =>
      prev.includes(licenseType)
        ? prev.filter((l) => l !== licenseType)
        : [...prev, licenseType]
    );
  };

  const toggleService = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  const togglePayer = (payer: Payer) => {
    setSelectedPayers((prev) =>
      prev.includes(payer) ? prev.filter((p) => p !== payer) : [...prev, payer]
    );
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCounties([]);
    setSelectedLicenseTypes([]);
    setSelectedServices([]);
    setSelectedPayers([]);
    setAvailabilityFilter("all");
  };

  if (isLoading && providers.length === 0) {
    return (
      <CaseManagerLoadingState message="Searching providers..." fullHeight />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Search Providers</h1>
          <p className="text-muted-foreground mt-1">
            {referralId
              ? `Find providers for referral ${referralNumber || referralId}`
              : "Find providers for your referrals"}
          </p>
        </div>
        {referralId && (
          <Button
            variant="outline"
            onClick={() => router.push(`/case-manager/referrals/${referralId}`)}
          >
            Back to Referral
          </Button>
        )}
      </div>

      {/* Referral Context Banner */}
      {referralId && (
        <Card variant="healthcare" className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">
                  Searching for: Referral {referralNumber || referralId}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Select providers to add to shortlist
                </p>
              </div>
              <Button
                variant="healthcare"
                onClick={() => setAddToShortlistDialogOpen(true)}
                disabled={selectedProviders.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Selected to Shortlist ({selectedProviders.length})
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <Card variant="healthcare">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  Filters
                </CardTitle>
                {(selectedCounties.length > 0 ||
                  selectedLicenseTypes.length > 0 ||
                  selectedServices.length > 0 ||
                  selectedPayers.length > 0 ||
                  searchQuery ||
                  availabilityFilter !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Search */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="search">Search</Label>
                  <div className="flex items-center gap-2">
                    {canUseAISearch && (
                      <>
                        <Label
                          htmlFor="ai-search"
                          className="text-xs text-muted-foreground cursor-pointer"
                        >
                          CareBot AI
                        </Label>
                        <input
                          type="checkbox"
                          id="ai-search"
                          checked={useAISearch}
                          onChange={(e) => setUseAISearch(e.target.checked)}
                          className="h-4 w-4 rounded border-border"
                        />
                      </>
                    )}
                  </div>
                </div>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  {useAISearch && (
                    <Sparkles className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary w-4 h-4" />
                  )}
                  <Input
                    id="search"
                    placeholder={
                      useAISearch
                        ? "Try: '144D homes in Hennepin County accepting MA'"
                        : "Provider name, service..."
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={useAISearch ? "pl-10 pr-10" : "pl-10"}
                    disabled={isParsingQuery}
                  />
                  {isParsingQuery && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
                  )}
                </div>
                {useAISearch && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Use natural language to search. AI will parse your query and
                    apply filters automatically.
                  </p>
                )}
              </div>

              {/* Location Filter */}
              <div>
                <Label>Location (Counties)</Label>
                <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-3 mt-2 space-y-2">
                  {MINNESOTA_COUNTIES.slice(0, 20).map((county) => (
                    <div key={county} className="flex items-center space-x-2">
                      <Checkbox
                        id={`county-${county}`}
                        checked={selectedCounties.includes(county)}
                        onCheckedChange={() => toggleCounty(county)}
                      />
                      <Label
                        htmlFor={`county-${county}`}
                        className="font-normal cursor-pointer text-sm"
                      >
                        {county}
                      </Label>
                    </div>
                  ))}
                  {MINNESOTA_COUNTIES.length > 20 && (
                    <p className="text-xs text-muted-foreground pt-2">
                      + {MINNESOTA_COUNTIES.length - 20} more counties
                    </p>
                  )}
                </div>
              </div>

              {/* License Types Filter */}
              <div>
                <Label>License Types</Label>
                <div className="space-y-2 mt-2">
                  {LICENSE_TYPES.map((license) => (
                    <div
                      key={license.value}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`license-${license.value}`}
                        checked={selectedLicenseTypes.includes(license.value)}
                        onCheckedChange={() => toggleLicenseType(license.value)}
                      />
                      <Label
                        htmlFor={`license-${license.value}`}
                        className="font-normal cursor-pointer text-sm"
                      >
                        {license.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Services Filter */}
              <div>
                <Label>Services</Label>
                <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-3 mt-2 space-y-2">
                  {SUPPORTED_NEEDS.map((service) => (
                    <div
                      key={service.value}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`service-${service.value}`}
                        checked={selectedServices.includes(service.value)}
                        onCheckedChange={() => toggleService(service.value)}
                      />
                      <Label
                        htmlFor={`service-${service.value}`}
                        className="font-normal cursor-pointer text-sm"
                      >
                        {service.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payer Filter */}
              <div>
                <Label>Accepted Payers</Label>
                <div className="space-y-2 mt-2">
                  {PAYER_OPTIONS.map((payer) => (
                    <div
                      key={payer.value}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`payer-${payer.value}`}
                        checked={selectedPayers.includes(payer.value)}
                        onCheckedChange={() => togglePayer(payer.value)}
                      />
                      <Label
                        htmlFor={`payer-${payer.value}`}
                        className="font-normal cursor-pointer text-sm"
                      >
                        {payer.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Availability Filter */}
              <div>
                <Label htmlFor="availability">Availability</Label>
                <Select
                  value={availabilityFilter}
                  onValueChange={setAvailabilityFilter}
                >
                  <SelectTrigger id="availability" className="mt-2">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="available">Available Now</SelectItem>
                    <SelectItem value="waitlist">Waitlist Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-4">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {pagination.total} provider{pagination.total !== 1 ? "s" : ""}{" "}
                found
              </p>
            </div>
            <div className="flex items-center gap-2">
              {referralId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddToShortlistDialogOpen(true)}
                  disabled={selectedProviders.length === 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Selected ({selectedProviders.length})
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={
                  selectedProviders.length === providers.length
                    ? handleClearSelection
                    : handleSelectAll
                }
              >
                {selectedProviders.length === providers.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <CaseManagerErrorState
              title="Error Loading Providers"
              message={error}
              action={{
                label: "Retry",
                onClick: fetchProviders,
                variant: "healthcare",
              }}
            />
          )}

          {/* Results List */}
          {providers.length === 0 ? (
            <Card variant="healthcare">
              <CardContent className="pt-12 pb-12">
                <div className="text-center">
                  <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-2">
                    No providers found
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your filters or search query
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {providers.map((provider) => (
                <ProviderSearchResultCard
                  key={provider.id}
                  provider={provider}
                  isSelected={selectedProviders.includes(provider.id)}
                  onSelect={() => handleSelectProvider(provider.id)}
                  onView={() =>
                    router.push(`/case-manager/search/${provider.id}`)
                  }
                  referralId={referralId || undefined}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2">
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
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                }
                disabled={pagination.page >= pagination.pages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Add to Shortlist Dialog */}
      <Dialog
        open={addToShortlistDialogOpen}
        onOpenChange={setAddToShortlistDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Shortlist</DialogTitle>
            <DialogDescription>
              Add {selectedProviders.length} provider
              {selectedProviders.length !== 1 ? "s" : ""} to the shortlist for
              this referral
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="shortlist-notes">Notes (Optional)</Label>
              <Textarea
                id="shortlist-notes"
                placeholder="Add any notes about these providers..."
                value={shortlistNotes}
                onChange={(e) => setShortlistNotes(e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Selected providers: {selectedProviders.length}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddToShortlistDialogOpen(false)}
            >
              Cancel
            </Button>
            {canManageShortlist && (
              <Button
                variant="healthcare"
                onClick={handleAddToShortlist}
                disabled={isAddingToShortlist}
              >
                {isAddingToShortlist ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Shortlist
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CaseManagerSearchPage() {
  return (
    <RequirePermission
      permission={CASE_MANAGER_CAPABILITIES.SEARCH_VIEW}
      title="Access Restricted"
      description="You don't have permission to search providers."
    >
      <CaseManagerSearchPageContent />
    </RequirePermission>
  );
}
