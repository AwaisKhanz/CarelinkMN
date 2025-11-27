"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, RefreshCw, Eye, Download } from "lucide-react";
import { placementService, Placement, PlacementStatus } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { format } from "date-fns";
import { PLACEMENT_STATUS_CONFIG } from "@/lib/constants";
import { RequirePermission } from "@/components/auth/require-permission";
import { SYSTEM_CAPABILITIES } from "@/lib/permissions/capabilities";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { LoadingState, ErrorState, PageHeader, StatsGrid } from "@/components/shared";

function AdminPlacementsPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });

  const fetchPlacements = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (statusFilter !== "all") {
        params.status = statusFilter as PlacementStatus;
      }
      if (searchQuery) {
        params.search = searchQuery;
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
      }
    } catch (err) {
      console.error("Error fetching placements:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch placements");
      toast.error("Failed to load placements");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, searchQuery]);

  useEffect(() => {
    fetchPlacements();
  }, [fetchPlacements]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPlacements();
  };

  const handleViewPlacement = (placement: Placement) => {
    router.push(`/admin/placements/${placement.id}`);
  };

  const columns: ColumnDef<Placement>[] = [
    {
      accessorKey: "id",
      header: "Placement ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.id.slice(0, 8)}...</span>
      ),
    },
    {
      accessorKey: "provider",
      header: "Provider",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">
            {row.original.provider?.organization?.name || "Unknown"}
          </div>
          <div className="text-xs text-muted-foreground">
            {row.original.opening?.home?.name}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "source",
      header: "Source",
      cell: ({ row }) => {
        if (row.original.referralId) {
          return <Badge variant="outline">Referral</Badge>;
        }
        if (row.original.dischargeCaseId) {
          return <Badge variant="outline">Discharge Case</Badge>;
        }
        return <Badge variant="outline">Direct</Badge>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const config = PLACEMENT_STATUS_CONFIG[row.original.status] || PLACEMENT_STATUS_CONFIG.PENDING;
        return (
          <Badge variant={config.variant as any}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "placementDate",
      header: "Placement Date",
      cell: ({ row }) => (
        <span>
          {row.original.placementDate
            ? format(new Date(row.original.placementDate), "MMM d, yyyy")
            : "—"}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.original.createdAt), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleViewPlacement(row.original)}
        >
          <Eye className="h-4 w-4 mr-2" />
          View
        </Button>
      ),
    },
  ];

  const stats = {
    total: pagination.total,
    pending: placements.filter((p) => p.status === PlacementStatus.PENDING).length,
    confirmed: placements.filter((p) => p.status === PlacementStatus.CONFIRMED).length,
    active: placements.filter((p) => p.status === PlacementStatus.IN_PROGRESS).length,
    completed: placements.filter((p) => p.status === PlacementStatus.COMPLETED).length,
  };

  if (isLoading && placements.length === 0) {
    return <LoadingState message="Loading placements..." fullHeight />;
  }

  if (error && placements.length === 0) {
    return (
      <ErrorState
        title="Error Loading Placements"
        message={error}
        action={{
          label: "Retry",
          onClick: handleRefresh,
          variant: "healthcare",
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Placement Management"
        description="Monitor and manage all placements across the platform"
        actions={[
          {
            label: isRefreshing ? "Refreshing..." : "Refresh",
            onClick: handleRefresh,
            icon: RefreshCw,
            variant: "outline" as const,
            loading: isRefreshing,
          },
        ]}
      />

      <StatsGrid
        stats={[
          { label: "Total Placements", value: stats.total },
          {
            label: "Pending",
            value: stats.pending,
            valueClassName: "text-warning",
          },
          {
            label: "Confirmed",
            value: stats.confirmed,
            valueClassName: "text-info",
          },
          {
            label: "Active",
            value: stats.active,
            valueClassName: "text-success",
          },
          {
            label: "Completed",
            value: stats.completed,
            valueClassName: "text-muted-foreground",
          },
        ]}
        columns={5}
      />

      <Card variant="healthcare">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Placements</CardTitle>
              <CardDescription>
                {pagination.total} placement{pagination.total !== 1 ? "s" : ""} found
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Search placements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value={PlacementStatus.PENDING}>Pending</SelectItem>
                <SelectItem value={PlacementStatus.CONFIRMED}>Confirmed</SelectItem>
                <SelectItem value={PlacementStatus.IN_PROGRESS}>Active</SelectItem>
                <SelectItem value={PlacementStatus.COMPLETED}>Completed</SelectItem>
                <SelectItem value={PlacementStatus.CANCELLED}>Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DataTable
            columns={columns}
            data={placements}
            isLoading={isLoading}
            currentPage={pagination.page}
            totalPages={pagination.pages}
            totalItems={pagination.total}
            pageSize={pagination.limit}
            onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminPlacementsPage() {
  return (
    <RequirePermission
      permission={SYSTEM_CAPABILITIES.SYSTEM_VIEW}
      title="Access Restricted"
      description="You don't have permission to view placements."
    >
      <AdminPlacementsPageContent />
    </RequirePermission>
  );
}
