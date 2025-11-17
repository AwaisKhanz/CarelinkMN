"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
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
import {
  Plus,
  RefreshCw,
  MapPin,
  Calendar,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  Loader2,
  XCircle,
  CheckCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import {
  openingService,
  Opening,
  OpeningStatus,
  Gender,
  Payer,
} from "@/lib/api";
import { usePageMetadata } from "../use-page-metadata";
import { cn } from "@/lib/utils";
import { useProviderId } from "@/hooks/use-provider-data";
import { useProviderHomes } from "@/hooks/use-provider-homes";
import { calculateHoursUntilExpiry } from "@/lib/utils/provider";
import { DataTable } from "@/components/ui/data-table";
import { StatsCard } from "@/components/ui/stats-card";
import { format } from "date-fns";
import { useDebounce } from "@/hooks/use-debounce";
import {
  BulkActionsToolbar,
  BulkAction,
} from "@/components/ui/bulk-actions-toolbar";
import { Checkbox } from "@/components/ui/checkbox";
import { PAYER_LABELS, OPENING_STATUS_CONFIG } from "@/lib/constants";
import { ProviderDeleteDialog } from "@/components/provider";
import { RequirePermission } from "@/components/auth/require-permission";
import { PROVIDER_CAPABILITIES } from "@/lib/permissions/provider-capabilities";
import { usePermissions } from "@/hooks/use-permissions";

function OpeningsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use provider ID from context hook directly
  const providerId = useProviderId();

  // Use provider homes hook for homes data
  const { homes: homesData, isLoading: homesLoading } = useProviderHomes();
  const { canManageOpenings } = usePermissions();

  // Transform homes data for filter dropdown
  const homes = useMemo(() => {
    return homesData.map((home) => ({
      id: home.id,
      name: home.name,
    }));
  }, [homesData]);

  // Initialize selectedHomeId from query params if present
  const [selectedHomeId, setSelectedHomeId] = useState<string>(() => {
    const homeIdFromQuery = searchParams?.get("homeId");
    return homeIdFromQuery || "all";
  });
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedOpenings, setSelectedOpenings] = useState<string[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [openingToDelete, setOpeningToDelete] = useState<Opening | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Set page metadata
  useEffect(() => {
    setTitle("Bed Management");
    setDescription("Manage openings and bed availability");
  }, [setTitle, setDescription]);

  // Use shared status config from constants
  const STATUS_CONFIG = OPENING_STATUS_CONFIG;

  // Fetch openings with filters and search
  useEffect(() => {
    if (providerId) {
      fetchOpenings();
    }
  }, [
    providerId,
    selectedHomeId,
    selectedStatus,
    debouncedSearch,
    pagination.page,
  ]);

  const fetchOpenings = async () => {
    if (!providerId) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = {
        providerId,
        page: pagination.page,
        limit: pagination.limit,
        includeExpired: true,
        ...(selectedHomeId !== "all" && { homeId: selectedHomeId }),
        ...(selectedStatus !== "all" && {
          status: selectedStatus as OpeningStatus,
        }),
        ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
      };

      const response = await openingService.getOpenings(params);
      if (response.success && response.data) {
        setOpenings(response.data.openings);
        setPagination({
          page: response.data.pagination.page,
          limit: response.data.pagination.limit,
          total: response.data.pagination.total,
          pages: response.data.pagination.pages,
        });
      } else {
        setError(response.message || "Failed to fetch openings");
        toast.error("Failed to load openings");
      }
    } catch (err) {
      console.error("Error fetching openings:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Network error or server unreachable"
      );
      toast.error("Failed to load openings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOpenings();
    setIsRefreshing(false);
  };

  const handleRefreshOpening = async (openingId: string) => {
    try {
      await openingService.refreshOpening(openingId);
      toast.success("Opening refreshed");
      fetchOpenings();
    } catch (err) {
      console.error("Error refreshing opening:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to refresh opening"
      );
    }
  };

  const handleDeleteOpening = async (openingId: string) => {
    const opening = openings.find((o) => o.id === openingId);
    if (opening) {
      setOpeningToDelete(opening);
      setDeleteDialogOpen(true);
    }
  };

  const confirmDeleteOpening = async () => {
    if (!openingToDelete) return;

    try {
      await openingService.deleteOpening(openingToDelete.id);
      toast.success("Opening deleted successfully");
      setDeleteDialogOpen(false);
      setOpeningToDelete(null);
      fetchOpenings();
    } catch (err) {
      console.error("Error deleting opening:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete opening"
      );
    }
  };

  const handleStatusChange = async (
    openingId: string,
    newStatus: OpeningStatus
  ) => {
    try {
      await openingService.updateOpeningStatus(openingId, newStatus);
      toast.success("Opening status updated");
      fetchOpenings();
    } catch (err) {
      console.error("Error updating opening status:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update opening status"
      );
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    setSelectedOpenings([]); // Clear selection on page change
  };

  // Bulk operations
  const handleSelectAll = () => {
    setSelectedOpenings(openings.map((o) => o.id));
  };

  const handleDeselectAll = () => {
    setSelectedOpenings([]);
  };

  const handleToggleSelection = (openingId: string) => {
    setSelectedOpenings((prev) =>
      prev.includes(openingId)
        ? prev.filter((id) => id !== openingId)
        : [...prev, openingId]
    );
  };

  const handleBulkRefresh = async () => {
    if (selectedOpenings.length === 0) return;

    setIsBulkUpdating(true);
    try {
      const results = await Promise.allSettled(
        selectedOpenings.map((id) => openingService.refreshOpening(id))
      );

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      if (successful > 0) {
        toast.success(
          `Refreshed ${successful} opening${successful > 1 ? "s" : ""}`
        );
      }
      if (failed > 0) {
        toast.error(
          `Failed to refresh ${failed} opening${failed > 1 ? "s" : ""}`
        );
      }

      setSelectedOpenings([]);
      fetchOpenings();
    } catch (err) {
      console.error("Error refreshing openings:", err);
      toast.error("Failed to refresh openings");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkStatusUpdate = async (newStatus: OpeningStatus) => {
    if (selectedOpenings.length === 0) return;

    setIsBulkUpdating(true);
    try {
      const results = await Promise.allSettled(
        selectedOpenings.map((id) =>
          openingService.updateOpeningStatus(id, newStatus)
        )
      );

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      if (successful > 0) {
        toast.success(
          `Updated ${successful} opening${successful > 1 ? "s" : ""} to ${OPENING_STATUS_CONFIG[newStatus].label}`
        );
      }
      if (failed > 0) {
        toast.error(
          `Failed to update ${failed} opening${failed > 1 ? "s" : ""}`
        );
      }

      setSelectedOpenings([]);
      fetchOpenings();
    } catch (err) {
      console.error("Error updating opening statuses:", err);
      toast.error("Failed to update opening statuses");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Use shared utility function
  const getHoursUntilExpiry = calculateHoursUntilExpiry;

  // Define columns
  const columns: ColumnDef<Opening>[] = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) =>
          canManageOpenings ? (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={
                  openings.length > 0 &&
                  selectedOpenings.length === openings.length
                }
                onCheckedChange={(checked) => {
                  if (checked) {
                    handleSelectAll();
                  } else {
                    handleDeselectAll();
                  }
                }}
              />
            </div>
          ) : null,
        cell: ({ row }: { row: { original: Opening } }) =>
          canManageOpenings ? (
            <Checkbox
              checked={selectedOpenings.includes(row.original.id)}
              onCheckedChange={() => handleToggleSelection(row.original.id)}
              onClick={(e) => e.stopPropagation()}
            />
          ) : null,
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "home",
        header: "Home",
        cell: ({ row }: { row: { original: Opening } }) => {
          const opening = row.original;
          return (
            <div className="flex flex-col">
              <span className="font-semibold">
                {opening.home?.name || "Unknown Home"}
              </span>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {opening.home?.city}, {opening.home?.state}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }: { row: { original: Opening } }) => {
          const opening = row.original;
          const statusConfig = OPENING_STATUS_CONFIG[opening.status];
          const StatusIcon = statusConfig.icon;
          return (
            <Badge variant={statusConfig.color} className="gap-1.5">
              <StatusIcon className="w-3 h-3" />
              {statusConfig.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "spotsAvailable",
        header: "Spots",
        cell: ({ row }: { row: { original: Opening } }) => {
          const opening = row.original;
          return (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold">{opening.spotsAvailable}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "availableFrom",
        header: "Available From",
        cell: ({ row }: { row: { original: Opening } }) => {
          const opening = row.original;
          return (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>
                {format(new Date(opening.availableFrom), "MMM dd, yyyy")}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "acceptedPayers",
        header: "Accepted Payers",
        cell: ({ row }: { row: { original: Opening } }) => {
          const opening = row.original;
          return (
            <div className="flex flex-wrap gap-1">
              {opening.acceptedPayers.slice(0, 2).map((payer: Payer) => (
                <Badge key={payer} variant="healthcareInfo" className="text-xs">
                  {PAYER_LABELS[payer]}
                </Badge>
              ))}
              {opening.acceptedPayers.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{opening.acceptedPayers.length - 2}
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "freshnessTimestamp",
        header: "Freshness",
        cell: ({ row }: { row: { original: Opening } }) => {
          const opening = row.original;
          const hoursUntilExpiry = getHoursUntilExpiry(
            opening.freshnessTimestamp
          );
          const isStale = hoursUntilExpiry < 0;
          const isExpiringSoon =
            hoursUntilExpiry >= 0 && hoursUntilExpiry <= 12;

          if (isStale) {
            return (
              <div className="flex items-center gap-2">
                <Badge variant="healthcareError" className="gap-1.5">
                  <XCircle className="w-3 h-3" />
                  Expired
                </Badge>
                {canManageOpenings && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRefreshOpening(opening.id);
                    }}
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Refresh
                  </Button>
                )}
              </div>
            );
          }

          if (isExpiringSoon) {
            return (
              <Badge variant="healthcareWarning" className="gap-1.5">
                <AlertCircle className="w-3 h-3" />
                {hoursUntilExpiry}h left
              </Badge>
            );
          }

          return (
            <Badge variant="healthcareSuccess" className="gap-1.5">
              <CheckCircle className="w-3 h-3" />
              Fresh
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }: { row: { original: Opening } }) => {
          const opening = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`/provider/openings/${opening.id}`)
                  }
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                {canManageOpenings && (
                  <>
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(`/provider/openings/${opening.id}/edit`)
                      }
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    {!opening.isFresh && (
                      <DropdownMenuItem
                        onClick={() => handleRefreshOpening(opening.id)}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => handleDeleteOpening(opening.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [
      router,
      openings,
      selectedOpenings,
      handleSelectAll,
      handleDeselectAll,
      handleToggleSelection,
      canManageOpenings,
    ]
  );

  const totalSpots = openings.reduce(
    (sum, opening) => sum + opening.spotsAvailable,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bed Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage openings and track bed availability
          </p>
        </div>
        {canManageOpenings && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")}
              />
              Refresh
            </Button>
            <Button
              onClick={() => router.push("/provider/openings/create")}
              className="w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Opening
            </Button>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Total Openings" value={pagination.total} />
        <StatsCard title="Total Spots Available" value={totalSpots} />
        <StatsCard
          title="Open Openings"
          value={openings.filter((o) => o.status === OpeningStatus.OPEN).length}
          valueClassName="text-success"
        />
        <StatsCard
          title="Expired Openings"
          value={
            openings.filter((o) => o.status === OpeningStatus.EXPIRED).length
          }
          valueClassName="text-destructive"
        />
      </div>

      {/* View Toggle and Data Display */}
      <Card variant="healthcare">
        <CardHeader>
          <div>
            <CardTitle>Openings</CardTitle>
            <CardDescription>
              Manage and track all bed openings and availability
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Bulk Actions Toolbar */}
            {canManageOpenings && selectedOpenings.length > 0 && (
              <BulkActionsToolbar
                selectedCount={selectedOpenings.length}
                totalCount={openings.length}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                actions={[
                  {
                    label: "Refresh",
                    icon: <RefreshCw className="h-4 w-4" />,
                    onClick: handleBulkRefresh,
                    variant: "outline",
                    disabled: isBulkUpdating,
                  },
                  {
                    label: "Mark as Open",
                    icon: <CheckCircle className="h-4 w-4" />,
                    onClick: () => handleBulkStatusUpdate(OpeningStatus.OPEN),
                    variant: "outline",
                    disabled: isBulkUpdating,
                  },
                  {
                    label: "Mark as Filled",
                    icon: <CheckCircle className="h-4 w-4" />,
                    onClick: () => handleBulkStatusUpdate(OpeningStatus.FILLED),
                    variant: "outline",
                    disabled: isBulkUpdating,
                  },
                  {
                    label: "Mark as Expired",
                    icon: <XCircle className="h-4 w-4" />,
                    onClick: () =>
                      handleBulkStatusUpdate(OpeningStatus.EXPIRED),
                    variant: "outline",
                    disabled: isBulkUpdating,
                  },
                ]}
              />
            )}
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <Select
                value={selectedHomeId}
                onValueChange={(value) => {
                  setSelectedHomeId(value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                  setSelectedOpenings([]); // Clear selection on filter change
                }}
              >
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Filter by home" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Homes</SelectItem>
                  {homes.map((home: { id: string; name: string }) => (
                    <SelectItem key={home.id} value={home.id}>
                      {home.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedStatus}
                onValueChange={(value) => {
                  setSelectedStatus(value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                  setSelectedOpenings([]); // Clear selection on filter change
                }}
              >
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(OPENING_STATUS_CONFIG).map(
                    ([status, config]) => (
                      <SelectItem key={status} value={status}>
                        <Badge
                          variant={config.color}
                          className="flex items-center gap-1.5"
                        >
                          <config.icon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <DataTable
              columns={columns}
              data={openings}
              isLoading={isLoading}
              searchKey="global"
              searchPlaceholder="Search openings..."
              searchValue={searchQuery}
              onSearchChange={(value) => {
                setSearchQuery(value);
                setPagination((prev) => ({ ...prev, page: 1 }));
                setSelectedOpenings([]); // Clear selection on search change
              }}
              enablePagination={true}
              pageSize={pagination.limit}
              currentPage={pagination.page}
              totalPages={pagination.pages}
              totalItems={pagination.total}
              onPageChange={handlePageChange}
              variant="healthcare"
              onRowClick={(opening) =>
                router.push(`/provider/openings/${opening.id}`)
              }
              emptyMessage="No openings found. Create a new opening to get started."
            />
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ProviderDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Opening"
        description="Are you sure you want to delete this opening? This action cannot be undone. All associated data will be permanently removed."
        itemDetails={
          openingToDelete?.home?.name ? (
            <>
              <strong>Home:</strong> {openingToDelete.home.name}
              <br />
              <strong>Spots Available:</strong> {openingToDelete.spotsAvailable}
            </>
          ) : undefined
        }
        onConfirm={confirmDeleteOpening}
        variant="delete"
      />
    </div>
  );
}

function OpeningsPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-muted-foreground">Loading openings...</p>
          </div>
        </div>
      }
    >
      <OpeningsPageContent />
    </Suspense>
  );
}

export default function OpeningsPage() {
  return (
    <RequirePermission
      permission={PROVIDER_CAPABILITIES.OPENINGS_MANAGE}
      title="Access Restricted"
      description="You don't have permission to manage openings. Please contact your organization administrator if you need access."
    >
      <OpeningsPageWrapper />
    </RequirePermission>
  );
}
