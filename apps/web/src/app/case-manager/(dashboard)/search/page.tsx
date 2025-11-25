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
  X,
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
import { LoadingState, ErrorState } from "@/components/shared";
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
import { MultiSelect } from "@/components/ui/multi-select";

function CaseManagerSearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const caseManagerId = useCaseManagerId();
  const { setTitle, setDescription } = usePageMetadata();
  const { canUseAISearch, hasCapability } = useRolePermissions();
  const canManageShortlist = hasCapability(
    CASE_MANAGER_CAPABILITIES.SHORTLIST_MANAGE
  );

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
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

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
      setAiExplanation(null);
      try {
        const response = await aiSearchService.parseQuery(query);
        if (response.success && response.data) {
          const filters = response.data.filters;
          const explanation = response.data.explanation;

          // Store explanation for display
          if (explanation) {
            setAiExplanation(explanation);
          }

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
        setAiExplanation(null);
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
        status: OrganizationStatus.VERIFIED,
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

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCounties([]);
    setSelectedLicenseTypes([]);
    setSelectedServices([]);
    setSelectedPayers([]);
    setAvailabilityFilter("all");
    setAiExplanation(null);
  };

  // Option mapping for MultiSelect
  const countyOptions = MINNESOTA_COUNTIES.map((county) => ({
    label: county,
    value: county,
  }));

  const licenseOptions = LICENSE_TYPES.map((type) => ({
    label: type.label,
    value: type.value,
  }));

  const serviceOptions = SUPPORTED_NEEDS.map((service) => ({
    label: service.label,
    value: service.value,
  }));

  const payerOptions = PAYER_OPTIONS.map((payer) => ({
    label: payer.label,
    value: payer.value,
  }));

  if (isLoading && providers.length === 0) {
    return <LoadingState message="Searching providers..." fullHeight />;
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Search Providers</h1>
          <p className="text-muted-foreground mt-1">
            {referralId
              ? `Find providers for referral ${referralNumber || referralId}`
              : "Find and filter providers across Minnesota"}
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

      {/* Search & Filters Area */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-4 space-y-4">
          {/* Top Row: Search Input */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              {useAISearch && (
                <Sparkles className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary w-4 h-4" />
              )}
              <Input
                placeholder={
                  useAISearch
                    ? "Try: '144D homes in Hennepin County accepting MA'"
                    : "Search by provider name, city, or keywords..."
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
            
            {/* AI Toggle */}
            {canUseAISearch && (
              <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-muted/30 min-w-fit">
                <input
                  type="checkbox"
                  id="ai-search"
                  checked={useAISearch}
                  onChange={(e) => setUseAISearch(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <Label
                  htmlFor="ai-search"
                  className="text-sm font-medium cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  CareBot AI
                </Label>
              </div>
            )}
          </div>

          {/* AI Explanation */}
          {aiExplanation && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium text-foreground mb-1">
                  CareBot Explanation
                </p>
                <p className="text-xs text-muted-foreground">{aiExplanation}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-5 w-5 -mt-1 -mr-1"
                onClick={() => setAiExplanation(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <MultiSelect
              options={countyOptions}
              selected={selectedCounties}
              onChange={setSelectedCounties}
              placeholder="Counties"
              searchPlaceholder="Search counties..."
              variant="healthcare"
              badgeDisplayLimit={1}
            />
            
            <MultiSelect
              options={licenseOptions}
              selected={selectedLicenseTypes}
              onChange={setSelectedLicenseTypes}
              placeholder="License Types"
              searchPlaceholder="Search licenses..."
              variant="healthcare"
              badgeDisplayLimit={1}
            />

            <MultiSelect
              options={serviceOptions}
              selected={selectedServices}
              onChange={setSelectedServices}
              placeholder="Services"
              searchPlaceholder="Search services..."
              variant="healthcare"
              badgeDisplayLimit={1}
            />

            <MultiSelect
              options={payerOptions}
              selected={selectedPayers}
              onChange={(values) => setSelectedPayers(values)}
              placeholder="Payers"
              searchPlaceholder="Search payers..."
              variant="healthcare"
              badgeDisplayLimit={1}
            />

            <Select
              value={availabilityFilter}
              onValueChange={setAvailabilityFilter}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Availability</SelectItem>
                <SelectItem value="available">Available Now</SelectItem>
                <SelectItem value="waitlist">Waitlist Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters Summary & Clear */}
          {(selectedCounties.length > 0 ||
            selectedLicenseTypes.length > 0 ||
            selectedServices.length > 0 ||
            selectedPayers.length > 0 ||
            availabilityFilter !== "all") && (
            <div className="flex items-center justify-between pt-2">
              <div className="flex flex-wrap gap-2">
                {selectedCounties.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedCounties.length} Counties
                  </Badge>
                )}
                {selectedLicenseTypes.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedLicenseTypes.length} Licenses
                  </Badge>
                )}
                {selectedServices.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedServices.length} Services
                  </Badge>
                )}
                {selectedPayers.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedPayers.length} Payers
                  </Badge>
                )}
                {availabilityFilter !== "all" && (
                  <Badge variant="secondary" className="text-xs">
                    {availabilityFilter === "available" ? "Available Now" : "Waitlist Only"}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-xs h-7"
              >
                Clear All
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Results ({pagination.total})
          </h2>
          <div className="flex items-center gap-2">
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

        {providers.length === 0 ? (
          <div className="text-center py-12 bg-muted/10 rounded-lg border border-dashed border-muted-foreground/20">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No providers found</h3>
            <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
              Try adjusting your filters or search query to find more results.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={handleClearFilters}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {providers.map((provider) => (
              <ProviderSearchResultCard
                key={provider.id}
                provider={provider}
                isSelected={selectedProviders.includes(provider.id)}
                onSelect={() => handleSelectProvider(provider.id)}
                onView={() =>
                  router.push(
                    `/case-manager/providers/${provider.id}${
                      referralId ? `?referralId=${referralId}` : ""
                    }`
                  )
                }
                onAddToShortlist={() => {
                  setSelectedProviders([provider.id]);
                  setAddToShortlistDialogOpen(true);
                }}
                referralId={referralId || undefined}
              />
            ))}
          </div>
        )}
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
              Referral {referralNumber}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
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
