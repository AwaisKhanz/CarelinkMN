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
  Calendar,
  MapPin,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  FileText,
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
  placementService,
  providerService,
  Placement,
  PlacementStatus,
  GetPlacementsParams,
} from "@/lib/api";
import { usePageMetadata } from "../use-page-metadata";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/ui/data-table";
import { StatsCard } from "@/components/ui/stats-card";
import { format } from "date-fns";
import { useDebounce } from "@/hooks/use-debounce";
import { FeatureGate } from "@/components/subscription/feature-gate";
import { PROVIDER_FEATURE_GATES } from "@/lib/constants";
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
  PlacementStatus,
  {
    label: string;
    variant:
      | "default"
      | "healthcareSuccess"
      | "healthcareWarning"
      | "healthcareError"
      | "healthcareInfo";
  }
> = {
  [PlacementStatus.PENDING]: {
    label: "Pending",
    variant: "healthcareWarning",
  },
  [PlacementStatus.CONFIRMED]: {
    label: "Confirmed",
    variant: "healthcareSuccess",
  },
  [PlacementStatus.IN_PROGRESS]: {
    label: "In Progress",
    variant: "healthcareInfo",
  },
  [PlacementStatus.COMPLETED]: {
    label: "Completed",
    variant: "healthcareSuccess",
  },
  [PlacementStatus.CANCELLED]: {
    label: "Cancelled",
    variant: "healthcareError",
  },
};

export default function PlacementsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providerId, setProviderId] = useState<string | null>(null);

  // State for server-side filtering and pagination
  const [searchQuery, setSearchQuery] = useState<string>("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });
  const [placementToCancel, setPlacementToCancel] = useState<Placement | null>(
    null
  );
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const placementsGate = PROVIDER_FEATURE_GATES.placements;

  useEffect(() => {
    setTitle("Placement Management");
    setDescription("Manage resident placements and track placement status");
  }, [setTitle, setDescription]);

  // Fetch provider ID
  useEffect(() => {
    const fetchProviderId = async () => {
      if (!user?.organizationId) return;

      try {
        const provider = await providerService.getProviderByOrganizationId(
          user.organizationId
        );
        if (provider?.id) {
          setProviderId(provider.id);
        }
      } catch (err) {
        console.error("Error fetching provider ID:", err);
      }
    };

    fetchProviderId();
  }, [user?.organizationId]);

  // Fetch placements based on filters and pagination
  useEffect(() => {
    if (providerId) {
      fetchPlacements();
    }
  }, [providerId, debouncedSearch, selectedStatus, pagination.page]);

  const fetchPlacements = async () => {
    if (!providerId) return;

    setIsLoading(true);
    setError(null);

    try {
      const params: GetPlacementsParams = {
        providerId,
        page: pagination.page,
        limit: pagination.limit,
      };

      if (selectedStatus !== "all") {
        params.status = selectedStatus as PlacementStatus;
      }
      if (debouncedSearch) {
        params.search = debouncedSearch.trim();
      }

      const response = await placementService.getPlacements(params);
      if (response.success && response.data) {
        setPlacements(response.data.placements);
        setPagination((prev) => ({
          ...prev,
          total: response.data!.pagination.total,
          pages: response.data!.pagination.pages,
        }));
      } else {
        setError(response.message || "Failed to fetch placements");
        toast.error("Failed to load placements");
      }
    } catch (err) {
      console.error("Error fetching placements:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Network error or server unreachable"
      );
      toast.error("Failed to load placements");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchPlacements();
    setIsRefreshing(false);
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  // Reset page to 1 when filters or search change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [debouncedSearch, selectedStatus]);

  const handleStatusUpdate = async (
    placementId: string,
    newStatus: PlacementStatus
  ) => {
    try {
      const response = await placementService.updatePlacementStatus(
        placementId,
        newStatus
      );
      if (response.success) {
        toast.success("Placement status updated successfully");
        await fetchPlacements();
      } else {
        toast.error(response.message || "Failed to update status");
      }
    } catch (err) {
      console.error("Error updating placement status:", err);
      toast.error("Failed to update placement status");
    }
  };

  const handleCancelPlacement = async (placementId: string) => {
    const placement = placements.find((p) => p.id === placementId);
    if (placement) {
      setPlacementToCancel(placement);
      setCancelDialogOpen(true);
    }
  };

  const confirmCancelPlacement = async () => {
    if (!placementToCancel) return;

    try {
      const response = await placementService.cancelPlacement(
        placementToCancel.id
      );
      if (response.success) {
        toast.success("Placement cancelled successfully");
        setCancelDialogOpen(false);
        setPlacementToCancel(null);
        await fetchPlacements();
      } else {
        toast.error(response.message || "Failed to cancel placement");
      }
    } catch (err) {
      console.error("Error cancelling placement:", err);
      toast.error("Failed to cancel placement");
    }
  };

  const columns: ColumnDef<Placement>[] = useMemo(
    () => [
      {
        accessorKey: "referral",
        header: "Referral/Case",
        cell: ({ row }: { row: { original: Placement } }) => {
          const placement = row.original;
          if (placement.referral) {
            return (
              <div className="flex flex-col">
                <span className="font-medium">
                  {placement.referral.referralNumber}
                </span>
                <span className="text-sm text-muted-foreground">Referral</span>
              </div>
            );
          }
          if (placement.dischargeCase) {
            return (
              <div className="flex flex-col">
                <span className="font-medium">
                  {placement.dischargeCase.caseNumber}
                </span>
                <span className="text-sm text-muted-foreground">
                  Discharge Case
                </span>
              </div>
            );
          }
          return <span className="text-muted-foreground">N/A</span>;
        },
      },
      {
        accessorKey: "opening",
        header: "Home & Opening",
        cell: ({ row }: { row: { original: Placement } }) => {
          const placement = row.original;
          if (placement.opening?.home) {
            return (
              <div className="flex flex-col">
                <span className="font-medium">
                  {placement.opening.home.name}
                </span>
                <span className="text-sm text-muted-foreground">
                  {placement.opening.home.city}, {placement.opening.home.state}
                </span>
              </div>
            );
          }
          return <span className="text-muted-foreground">N/A</span>;
        },
      },
      {
        accessorKey: "placementDate",
        header: "Placement Date",
        cell: ({ row }: { row: { original: Placement } }) => {
          const placement = row.original;
          return (
            <div className="flex flex-col">
              <span className="whitespace-nowrap">
                {format(new Date(placement.placementDate), "MMM dd, yyyy")}
              </span>
              {placement.moveInDate && (
                <span className="text-sm text-muted-foreground">
                  Move-in:{" "}
                  {format(new Date(placement.moveInDate), "MMM dd, yyyy")}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }: { row: { original: Placement } }) => {
          const placement = row.original;
          const config = STATUS_CONFIG[placement.status];
          return <Badge variant={config.variant}>{config.label}</Badge>;
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }: { row: { original: Placement } }) => {
          const placement = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`/provider/placements/${placement.id}`)
                  }
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                {placement.status === PlacementStatus.PENDING && (
                  <>
                    <DropdownMenuItem
                      onClick={() =>
                        handleStatusUpdate(
                          placement.id,
                          PlacementStatus.CONFIRMED
                        )
                      }
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Confirm
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleCancelPlacement(placement.id)}
                      className="text-destructive"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel
                    </DropdownMenuItem>
                  </>
                )}
                {placement.status === PlacementStatus.CONFIRMED && (
                  <DropdownMenuItem
                    onClick={() =>
                      handleStatusUpdate(
                        placement.id,
                        PlacementStatus.IN_PROGRESS
                      )
                    }
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Mark In Progress
                  </DropdownMenuItem>
                )}
                {placement.status === PlacementStatus.IN_PROGRESS && (
                  <DropdownMenuItem
                    onClick={() =>
                      handleStatusUpdate(
                        placement.id,
                        PlacementStatus.COMPLETED
                      )
                    }
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark Completed
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [router]
  );

  const totalPlacements = pagination.total;
  const pendingPlacements = placements.filter(
    (p) => p.status === PlacementStatus.PENDING
  ).length;
  const confirmedPlacements = placements.filter(
    (p) => p.status === PlacementStatus.CONFIRMED
  ).length;
  const completedPlacements = placements.filter(
    (p) => p.status === PlacementStatus.COMPLETED
  ).length;

  const content = (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Placement Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage resident placements and track placement status
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
        <StatsCard title="Total Placements" value={totalPlacements} />
        <StatsCard
          title="Pending"
          value={pendingPlacements}
          valueClassName="text-warning"
        />
        <StatsCard
          title="Confirmed"
          value={confirmedPlacements}
          valueClassName="text-success"
        />
        <StatsCard
          title="Completed"
          value={completedPlacements}
          valueClassName="text-success"
        />
      </div>

      {/* Data Table */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Placements</CardTitle>
          <CardDescription>
            Manage and track all resident placements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={placements}
            isLoading={isLoading}
            searchKey="global"
            searchPlaceholder="Search placements..."
            searchValue={searchQuery}
            onSearchChange={(value) => {
              setSearchQuery(value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            enablePagination={true}
            pageSize={pagination.limit}
            currentPage={pagination.page}
            totalPages={pagination.pages}
            totalItems={pagination.total}
            onPageChange={handlePageChange}
            variant="healthcare"
            onRowClick={(placement) =>
              router.push(`/provider/placements/${placement.id}`)
            }
            emptyMessage="No placements found."
            filters={
              <Select
                value={selectedStatus}
                onValueChange={(value) => {
                  setSelectedStatus(value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
              >
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                    <SelectItem key={status} value={status}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
          />
        </CardContent>
      </Card>

      {/* Cancel Placement Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Placement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this placement? This action will
              restore the opening spot and cannot be undone.
              {placementToCancel && (
                <>
                  <br />
                  <br />
                  <strong>Referral ID:</strong>{" "}
                  {placementToCancel.referralId || "N/A"}
                  <br />
                  <strong>Status:</strong> {placementToCancel.status}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPlacementToCancel(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelPlacement}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Placement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  return (
    <FeatureGate
      feature={placementsGate.feature}
      requiredPlan={placementsGate.requiredPlan}
      bannerDescription={placementsGate.description}
    >
      {content}
    </FeatureGate>
  );
}
