"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import type { BadgeProps } from "@/components/ui/badge";
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
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  LayoutGrid,
  Table,
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
import {
  openingService,
  providerService,
  homeService,
  Opening,
  OpeningStatus,
  Gender,
  Payer,
} from "@/lib/api";
import { usePageMetadata } from "../use-page-metadata";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/ui/data-table";
import { StatsCard } from "@/components/ui/stats-card";
import { KanbanBoard } from "@/components/ui/kanban-board";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { useDebounce } from "@/hooks/use-debounce";
import {
  BulkActionsToolbar,
  BulkAction,
} from "@/components/ui/bulk-actions-toolbar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const STATUS_CONFIG: Record<
  OpeningStatus,
  { label: string; color: BadgeProps["variant"]; icon: typeof Clock }
> = {
  [OpeningStatus.OPEN]: {
    label: "Open",
    color: "healthcareSuccess",
    icon: CheckCircle,
  },
  [OpeningStatus.PENDING]: {
    label: "Pending",
    color: "healthcareWarning",
    icon: Clock,
  },
  [OpeningStatus.FILLED]: {
    label: "Filled",
    color: "healthcareInfo",
    icon: CheckCircle,
  },
  [OpeningStatus.EXPIRED]: {
    label: "Expired",
    color: "secondary",
    icon: XCircle,
  },
};

const PAYER_LABELS: Record<Payer, string> = {
  MA: "Medical Assistance",
  MEDICARE: "Medicare",
  PRIVATE: "Private Pay",
  CADI: "CADI",
  BI_TBI: "BI/TBI",
  EW: "Elderly Waiver",
  DD: "Developmental Disabilities",
};

export default function OpeningsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [selectedHomeId, setSelectedHomeId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [homes, setHomes] = useState<Array<{ id: string; name: string }>>([]);
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

  // Get provider ID from user
  useEffect(() => {
    const fetchProviderId = async () => {
      if (!user) return;

      try {
        const provider = await providerService.getProviderByUserId(user.id);
        if (provider?.id) {
          setProviderId(provider.id);
        }
      } catch (error) {
        console.error("Error fetching provider ID:", error);
        toast.error("Failed to load provider information");
      }
    };

    fetchProviderId();
  }, [user]);

  // Fetch homes for filter
  useEffect(() => {
    const fetchHomes = async () => {
      if (!providerId) return;

      try {
        const response = await homeService.getProviderHomes(providerId, {
          limit: 100,
        });
        if (response.success && response.data) {
          setHomes(
            response.data.homes.map((home) => ({
              id: home.id,
              name: home.name,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching homes:", error);
      }
    };

    fetchHomes();
  }, [providerId]);

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
          `Updated ${successful} opening${successful > 1 ? "s" : ""} to ${STATUS_CONFIG[newStatus].label}`
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

  const getHoursUntilExpiry = (freshnessTimestamp: string) => {
    const now = new Date();
    const expiry = new Date(
      new Date(freshnessTimestamp).getTime() + 48 * 60 * 60 * 1000
    );
    const hours = Math.floor(
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60)
    );
    return hours;
  };

  // Define columns
  const columns: ColumnDef<Opening>[] = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
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
        ),
        cell: ({ row }: { row: { original: Opening } }) => (
          <Checkbox
            checked={selectedOpenings.includes(row.original.id)}
            onCheckedChange={() => handleToggleSelection(row.original.id)}
            onClick={(e) => e.stopPropagation()}
          />
        ),
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
          const statusConfig = STATUS_CONFIG[opening.status];
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Openings</CardTitle>
              <CardDescription>
                Manage and track all bed openings and availability
              </CardDescription>
            </div>
            <Tabs
              value={viewMode}
              onValueChange={(v) => setViewMode(v as "table" | "kanban")}
            >
              <TabsList variant="healthcare">
                <TabsTrigger value="table">
                  <Table className="h-4 w-4 mr-2" />
                  Table
                </TabsTrigger>
                <TabsTrigger value="kanban">
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Kanban
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as "table" | "kanban")}
          >
            <TabsContent value="table" className="mt-0">
              <div className="space-y-4">
                {/* Bulk Actions Toolbar */}
                {selectedOpenings.length > 0 && (
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
                        onClick: () =>
                          handleBulkStatusUpdate(OpeningStatus.OPEN),
                        variant: "outline",
                        disabled: isBulkUpdating,
                      },
                      {
                        label: "Mark as Filled",
                        icon: <CheckCircle className="h-4 w-4" />,
                        onClick: () =>
                          handleBulkStatusUpdate(OpeningStatus.FILLED),
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
                      {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                        <SelectItem key={status} value={status}>
                          <Badge
                            variant={config.color}
                            className="flex items-center gap-1.5"
                          >
                            <config.icon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                        </SelectItem>
                      ))}
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
            </TabsContent>
            <TabsContent value="kanban" className="mt-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center space-y-4">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading openings...</p>
                  </div>
                </div>
              ) : (
                <KanbanBoard
                  openings={openings}
                  onStatusChange={handleStatusChange}
                  onRefresh={handleRefreshOpening}
                  onView={(openingId) =>
                    router.push(`/provider/openings/${openingId}`)
                  }
                  onEdit={(openingId) =>
                    router.push(`/provider/openings/${openingId}/edit`)
                  }
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Opening</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this opening? This action cannot
              be undone. All associated data will be permanently removed.
              {openingToDelete?.home?.name && (
                <>
                  <br />
                  <br />
                  <strong>Home:</strong> {openingToDelete.home.name}
                  <br />
                  <strong>Spots Available:</strong>{" "}
                  {openingToDelete.spotsAvailable}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOpeningToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteOpening}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
