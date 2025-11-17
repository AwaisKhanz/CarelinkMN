"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  MapPin,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Filter,
  HomeIcon,
  Camera,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { homeService, Home, GetHomesParams } from "@/lib/api";
import { usePageMetadata } from "../use-page-metadata";
import { useDebounce } from "@/hooks/use-debounce";
import { useProviderId } from "@/hooks/use-provider-data";
import { SearchFilterBar } from "@/components/ui/search-filter-bar";
import { getOccupancyColor } from "@/lib/utils/provider";
import {
  BulkActionsToolbar,
  BulkAction,
} from "@/components/ui/bulk-actions-toolbar";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ProviderDeleteDialog } from "@/components/provider";
import { RequirePermission } from "@/components/auth/require-permission";
import { PROVIDER_CAPABILITIES } from "@/lib/permissions/provider-capabilities";

interface HomeFilters {
  search: string;
  status: string;
  page: number;
  limit: number;
}

function ProviderHomesPageContent() {
  const router = useRouter();
  const { user, token } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const [homes, setHomes] = useState<Home[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500);
  const [filters, setFilters] = useState<HomeFilters>({
    search: "",
    status: "all",
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
  });
  const providerId = useProviderId();
  const [selectedHomes, setSelectedHomes] = useState<string[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [homeToDelete, setHomeToDelete] = useState<Home | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Set page metadata
  useEffect(() => {
    setTitle("Homes");
    setDescription("Manage your care homes and facilities");
  }, [setTitle, setDescription]);

  // Update filters when debounced search changes
  useEffect(() => {
    setFilters((prev) => ({ ...prev, search: debouncedSearch, page: 1 }));
  }, [debouncedSearch]);

  useEffect(() => {
    if (providerId) {
      fetchHomes();
    }
  }, [providerId, filters]);

  const fetchHomes = async () => {
    if (!providerId) return;

    // Only show searching indicator if we already have data (not initial load)
    const isSearchingState = homes.length > 0;
    if (isSearchingState) {
      setIsSearching(true);
    } else {
      setIsInitialLoading(true);
    }
    setError(null);

    try {
      const params: GetHomesParams = {
        page: filters.page,
        limit: filters.limit,
        search: filters.search || undefined,
        status: filters.status !== "all" ? filters.status : undefined,
      };

      const response = await homeService.getProviderHomes(providerId, params);

      if (response.success) {
        setHomes(response.data?.homes || []);
        setPagination(response.data?.pagination || { total: 0, pages: 0 });
      } else {
        setError(response.message || "Failed to fetch homes");
        toast.error("Failed to load homes");
      }
    } catch (err) {
      console.error("Error fetching homes:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Network error or server unreachable"
      );
      toast.error("Failed to load homes");
    } finally {
      setIsInitialLoading(false);
      setIsSearching(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchInput(value);
  };

  const handleStatusFilter = (value: string) => {
    setFilters((prev) => ({ ...prev, status: value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleSelectHome = (homeId: string) => {
    setSelectedHomes((prev) =>
      prev.includes(homeId)
        ? prev.filter((id) => id !== homeId)
        : [...prev, homeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedHomes.length === homes.length) {
      setSelectedHomes([]);
    } else {
      setSelectedHomes(homes.map((h) => h.id));
    }
  };

  const handleDeselectAll = () => {
    setSelectedHomes([]);
  };

  const handleBulkActivate = async () => {
    if (selectedHomes.length === 0) return;

    setIsBulkUpdating(true);
    try {
      const updatePromises = selectedHomes.map((homeId) =>
        homeService.updateHome(homeId, { id: homeId, isActive: true })
      );
      await Promise.all(updatePromises);
      toast.success(`Activated ${selectedHomes.length} home(s) successfully`);
      setSelectedHomes([]);
      await fetchHomes();
    } catch (err) {
      console.error("Error bulk activating homes:", err);
      toast.error("Failed to activate homes");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedHomes.length === 0) return;

    setIsBulkUpdating(true);
    try {
      const updatePromises = selectedHomes.map((homeId) =>
        homeService.updateHome(homeId, { id: homeId, isActive: false })
      );
      await Promise.all(updatePromises);
      toast.success(`Deactivated ${selectedHomes.length} home(s) successfully`);
      setSelectedHomes([]);
      await fetchHomes();
    } catch (err) {
      console.error("Error bulk deactivating homes:", err);
      toast.error("Failed to deactivate homes");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleDeleteHome = async (homeId: string) => {
    const home = homes.find((h) => h.id === homeId);
    if (home) {
      setHomeToDelete(home);
      setDeleteDialogOpen(true);
    }
  };

  const confirmDeleteHome = async () => {
    if (!homeToDelete) return;

    try {
      await homeService.deleteHome(homeToDelete.id);
      toast.success("Home deleted successfully");
      setDeleteDialogOpen(false);
      setHomeToDelete(null);
      fetchHomes();
    } catch (err) {
      console.error("Error deleting home:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete home");
    }
  };

  // Use shared utility function

  if (isInitialLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Filters Skeleton */}
        <Card variant="healthcare">
          <CardHeader>
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-48" />
            </div>
          </CardContent>
        </Card>

        {/* Homes Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={`skeleton-${index}`} variant="healthcare">
              <Skeleton className="h-48 w-full rounded-t-lg" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <div className="flex items-center gap-4 pt-2 border-t border-border">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Homes</h1>
            {homes.length > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={
                    selectedHomes.length > 0 &&
                    selectedHomes.length === homes.length
                  }
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleSelectAll();
                    } else {
                      handleDeselectAll();
                    }
                  }}
                  ref={(el) => {
                    if (el) {
                      const input = (el as any).querySelector?.(
                        'input[type="checkbox"]'
                      ) as HTMLInputElement | null;
                      if (input) {
                        input.indeterminate =
                          selectedHomes.length > 0 &&
                          selectedHomes.length < homes.length;
                      }
                    }
                  }}
                />
                <span className="text-sm text-muted-foreground">
                  Select All
                </span>
              </div>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            Manage your care homes and facilities
          </p>
        </div>
        {canManageHomes && (
          <Button
            onClick={() => router.push("/provider/homes/create")}
            className="w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Home
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SearchFilterBar
            searchQuery={searchInput}
            onSearchChange={handleSearch}
            searchPlaceholder="Search homes by name, city, or county..."
            filterValue={filters.status}
            onFilterChange={handleStatusFilter}
            filterOptions={[
              { value: "all", label: "All Homes" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            filterPlaceholder="Filter by status"
          />
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions Toolbar */}
      {selectedHomes.length > 0 && (
        <BulkActionsToolbar
          selectedCount={selectedHomes.length}
          totalCount={homes.length}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          actions={[
            {
              label: "Activate",
              icon: <CheckCircle2 className="h-4 w-4" />,
              onClick: handleBulkActivate,
              variant: "default",
              disabled: isBulkUpdating,
            },
            {
              label: "Deactivate",
              icon: <XCircle className="h-4 w-4" />,
              onClick: handleBulkDeactivate,
              variant: "outline",
              disabled: isBulkUpdating,
            },
          ]}
        />
      )}

      {/* Homes Grid */}
      {isSearching ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Show existing homes with overlay */}
          {homes.map((home) => {
            const primaryPhoto =
              home.photos?.find((p) => p.isPrimary) || home.photos?.[0];

            return (
              <Card
                key={home.id}
                className="overflow-hidden hover:shadow-lg transition-all duration-200 border-border/50 group cursor-pointer opacity-50 relative"
              >
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
                {/* Photo Section */}
                <div className="relative h-48 bg-muted overflow-hidden">
                  {primaryPhoto ? (
                    <>
                      <img
                        src={primaryPhoto.url}
                        alt={primaryPhoto.caption || `${home.name}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Status badge */}
                      <div className="absolute top-3 left-3">
                        <Badge
                          variant={
                            home.isActive ? "healthcareSuccess" : "secondary"
                          }
                          className="font-medium"
                        >
                          {home.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {/* Photo count */}
                      {home.photos && home.photos.length > 1 && (
                        <div className="absolute top-3 right-3">
                          <Badge variant="healthcareInfo" className="gap-1.5">
                            <Camera className="w-3 h-3" />
                            {home.photos.length}
                          </Badge>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <ImageIcon className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                        {home.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1.5 text-sm">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">
                          {home.city}, {home.state}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  {/* Occupancy */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Occupancy
                      </span>
                    </div>
                    <span
                      className={`text-base font-semibold ${getOccupancyColor(home.currentOccupancy, home.capacity)}`}
                    >
                      {home.currentOccupancy}/{home.capacity}
                    </span>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex items-center gap-4 pt-2 border-t border-border">
                    {home.amenities && home.amenities.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {home.amenities.length} amenit
                        {home.amenities.length === 1 ? "y" : "ies"}
                      </span>
                    )}
                    {home.services && home.services.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {home.services.length} service
                        {home.services.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : homes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <HomeIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No homes found
              </h3>
              <p className="text-muted-foreground mb-4">
                {filters.search || filters.status !== "all"
                  ? "No homes match your current filters."
                  : "Get started by adding your first care home."}
              </p>
              {canManageHomes && (
                <Button onClick={() => router.push("/provider/homes/create")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Home
                </Button>
              )}
              {!canManageHomes && (
                <p className="text-sm text-muted-foreground">
                  Only provider owners can add homes. Contact your provider
                  owner to add a new home.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {homes.map((home) => {
            const primaryPhoto =
              home.photos?.find((p) => p.isPrimary) || home.photos?.[0];

            return (
              <Card
                key={home.id}
                className={cn(
                  "overflow-hidden hover:shadow-lg transition-all duration-200 border-border/50 group relative",
                  selectedHomes.includes(home.id) &&
                    "ring-2 ring-primary border-primary"
                )}
              >
                {/* Selection Checkbox */}
                {canManageHomes && (
                  <div
                    className="absolute top-2 left-2 z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={selectedHomes.includes(home.id)}
                      onCheckedChange={() => handleSelectHome(home.id)}
                      className="bg-background/90 backdrop-blur-sm"
                    />
                  </div>
                )}
                <div
                  className="cursor-pointer"
                  onClick={() => router.push(`/provider/homes/${home.id}`)}
                >
                  {/* Photo Section */}
                  <div className="relative h-48 bg-muted overflow-hidden">
                    {primaryPhoto ? (
                      <>
                        <img
                          src={primaryPhoto.url}
                          alt={primaryPhoto.caption || `${home.name}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Status badge */}
                        <div className="absolute top-3 left-3">
                          <Badge
                            variant={
                              home.isActive ? "healthcareSuccess" : "secondary"
                            }
                            className="font-medium"
                          >
                            {home.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        {/* Photo count */}
                        {home.photos && home.photos.length > 1 && (
                          <div className="absolute top-3 right-3">
                            <Badge variant="healthcareInfo" className="gap-1.5">
                              <Camera className="w-3 h-3" />
                              {home.photos.length}
                            </Badge>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <ImageIcon className="w-10 h-10 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-1">
                        <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                          {home.name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1.5 text-sm">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">
                            {home.city}, {home.state}
                          </span>
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/provider/homes/${home.id}`);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {canManageHomes ? (
                            <>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    `/provider/homes/${home.id}/edit`
                                  );
                                }}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteHome(home.id);
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <DropdownMenuItem disabled>
                              <Eye className="w-4 h-4 mr-2" />
                              View Only (Owner Only)
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-0">
                    {/* Occupancy */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Occupancy
                        </span>
                      </div>
                      <span
                        className={`text-base font-semibold ${getOccupancyColor(home.currentOccupancy, home.capacity)}`}
                      >
                        {home.currentOccupancy}/{home.capacity}
                      </span>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex items-center gap-4 pt-2 border-t border-border">
                      {home.amenities && home.amenities.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {home.amenities.length} amenit
                          {home.amenities.length === 1 ? "y" : "ies"}
                        </span>
                      )}
                      {home.services && home.services.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {home.services.length} service
                          {home.services.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(filters.page - 1)}
            disabled={filters.page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {filters.page} of {pagination.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(filters.page + 1)}
            disabled={filters.page === pagination.pages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ProviderDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Home"
        description="Are you sure you want to delete this home? This action cannot be undone. All associated openings and data will be permanently removed."
        itemName={homeToDelete?.name}
        onConfirm={confirmDeleteHome}
        variant="delete"
      />
    </div>
  );
}

export default function ProviderHomesPage() {
  return (
    <RequirePermission
      permission={PROVIDER_CAPABILITIES.HOMES_MANAGE}
      title="Access Restricted"
      description="You don't have permission to manage homes. Please contact your organization administrator if you need access."
    >
      <ProviderHomesPageContent />
    </RequirePermission>
  );
}
