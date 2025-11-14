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
  Eye,
  Calendar,
  MapPin,
  User,
  Building,
  Loader2,
  RefreshCw,
  FileText,
  Users,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import {
  placementService,
  providerService,
  homeService,
  Placement,
  PlacementStatus,
  GetPlacementsParams,
  Home,
} from "@/lib/api";
import { usePageMetadata } from "../use-page-metadata";
import { StatsCard } from "@/components/ui/stats-card";
import { SearchFilterBar } from "@/components/ui/search-filter-bar";
import { DataTable } from "@/components/ui/data-table";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { FeatureGate } from "@/components/subscription/feature-gate";
import { PROVIDER_FEATURE_GATES } from "@/lib/constants";

const residentsGateConfig = PROVIDER_FEATURE_GATES.residents;

const STATUS_CONFIG: Record<PlacementStatus, { label: string; variant: "default" | "healthcareSuccess" | "healthcareWarning" | "healthcareError" | "healthcareInfo" }> = {
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

// Active resident statuses (people currently living in homes)
const ACTIVE_RESIDENT_STATUSES = [
  PlacementStatus.CONFIRMED,
  PlacementStatus.IN_PROGRESS,
  PlacementStatus.COMPLETED,
];

const PAYER_LABELS: Record<string, string> = {
  MA: "Medical Assistance",
  MEDICARE: "Medicare",
  PRIVATE: "Private Pay",
  CADI: "CADI",
  BI_TBI: "BI/TBI",
  EW: "Elderly Waiver",
  DD: "Developmental Disabilities",
};

export default function ProviderResidentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();

  const [residents, setResidents] = useState<Placement[]>([]);
  const [homes, setHomes] = useState<Home[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [selectedHomeId, setSelectedHomeId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    setTitle("Residents");
    setDescription("Manage current residents in your care homes");
  }, [setTitle, setDescription]);

  // Get provider ID from user
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
      } catch (error) {
        console.error("Error fetching provider ID:", error);
        toast.error("Failed to load provider information");
      }
    };

    fetchProviderId();
  }, [user?.organizationId]);

  // Fetch homes for filter
  useEffect(() => {
    const fetchHomes = async () => {
      if (!providerId) return;

      try {
        const response = await homeService.getProviderHomes(providerId, {
          page: 1,
          limit: 100,
        });
        if (response.success && response.data) {
          setHomes(response.data.homes);
        }
      } catch (err) {
        console.error("Error fetching homes:", err);
      }
    };

    fetchHomes();
  }, [providerId]);

  // Fetch residents (active placements)
  useEffect(() => {
    if (providerId) {
      fetchResidents();
    }
  }, [providerId, selectedHomeId, statusFilter, pagination.page, debouncedSearch]);

  const fetchResidents = async () => {
    if (!providerId) return;

    try {
      setIsLoading(true);
      setError(null);

      const params: GetPlacementsParams = {
        providerId,
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter !== "all" ? (statusFilter as PlacementStatus) : undefined,
        search: debouncedSearch || undefined,
      };

      const response = await placementService.getPlacements(params);

      if (response.success && response.data) {
        let placements = response.data.placements || response.data || [];
        
        // Filter to only active residents (CONFIRMED, IN_PROGRESS, COMPLETED)
        placements = placements.filter((p: Placement) =>
          ACTIVE_RESIDENT_STATUSES.includes(p.status)
        );

        // Filter by home if selected
        if (selectedHomeId !== "all") {
          placements = placements.filter(
            (p: Placement) => p.opening?.home?.id === selectedHomeId
          );
        }

        setResidents(placements);
        
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        } else {
          // Calculate pagination from filtered results
          setPagination((prev) => ({
            ...prev,
            total: placements.length,
            pages: Math.ceil(placements.length / prev.limit),
          }));
        }
      } else {
        setError(response.message || "Failed to load residents");
      }
    } catch (err) {
      console.error("Error fetching residents:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch residents"
      );
      toast.error("Failed to load residents");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchResidents();
  };

  const handleViewResident = (placement: Placement) => {
    router.push(`/provider/placements/${placement.id}`);
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const totalResidents = residents.length;
    const byStatus = {
      confirmed: residents.filter((r) => r.status === PlacementStatus.CONFIRMED).length,
      inProgress: residents.filter((r) => r.status === PlacementStatus.IN_PROGRESS).length,
      completed: residents.filter((r) => r.status === PlacementStatus.COMPLETED).length,
    };
    
    // Group by home
    const byHome = homes.map((home) => ({
      homeId: home.id,
      homeName: home.name,
      count: residents.filter(
        (r) => r.opening?.home?.id === home.id
      ).length,
    }));

    return {
      total: totalResidents,
      confirmed: byStatus.confirmed,
      inProgress: byStatus.inProgress,
      completed: byStatus.completed,
      byHome,
    };
  }, [residents, homes]);

  // Define table columns
  const columns: ColumnDef<Placement>[] = useMemo(
    () => [
      {
        accessorKey: "resident",
        header: "Resident",
        cell: ({ row }) => {
          const placement = row.original;
          const clientInfo = placement.referral
            ? {
                initials: placement.referral.clientInitials,
                age: placement.referral.clientAge,
                gender: placement.referral.clientGender,
              }
            : placement.dischargeCase
            ? {
                initials: placement.dischargeCase.patientInitials,
                age: placement.dischargeCase.patientAge,
                gender: placement.dischargeCase.patientGender,
              }
            : null;

          if (!clientInfo) {
            return <span className="text-muted-foreground">-</span>;
          }

          return (
            <div className="whitespace-nowrap">
              <div className="font-medium">{clientInfo.initials}</div>
              <div className="text-sm text-muted-foreground">
                {clientInfo.age} yrs, {clientInfo.gender}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "home",
        header: "Home",
        cell: ({ row }) => {
          const placement = row.original;
          const home = placement.opening?.home;
          if (!home) {
            return <span className="text-muted-foreground">-</span>;
          }
          return (
            <div className="whitespace-nowrap">
              <div className="font-medium">{home.name}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {home.city}, {home.state}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "payer",
        header: "Payer",
        cell: ({ row }) => {
          const placement = row.original;
          const payer =
            placement.referral?.primaryPayer ||
            placement.dischargeCase?.primaryInsurance;
          if (!payer) {
            return <span className="text-muted-foreground">-</span>;
          }
          return (
            <Badge variant="outline" className="whitespace-nowrap">
              {PAYER_LABELS[payer] || payer}
            </Badge>
          );
        },
      },
      {
        accessorKey: "moveInDate",
        header: "Move-In Date",
        cell: ({ row }) => {
          const placement = row.original;
          const moveInDate = placement.moveInDate || placement.placementDate;
          if (!moveInDate) {
            return <span className="text-muted-foreground">-</span>;
          }
          return (
            <div className="text-sm whitespace-nowrap">
              {format(new Date(moveInDate), "MMM d, yyyy")}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const placement = row.original;
          const config = STATUS_CONFIG[placement.status];
          return (
            <Badge variant={config.variant} className="whitespace-nowrap">
              {config.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "duration",
        header: "Duration",
        cell: ({ row }) => {
          const placement = row.original;
          const moveInDate = placement.moveInDate || placement.placementDate;
          if (!moveInDate) {
            return <span className="text-muted-foreground">-</span>;
          }
          return (
            <div className="text-sm whitespace-nowrap">
              {formatDistanceToNow(new Date(moveInDate), { addSuffix: false })}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const placement = row.original;
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewResident(placement)}
              className="whitespace-nowrap"
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
          );
        },
      },
    ],
    []
  );

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Residents</h1>
          <p className="text-muted-foreground mt-1">
            Manage current residents in your care homes
          </p>
        </div>
        <Button
          variant="healthcareSecondary"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </>
          )}
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Total Residents" value={stats.total} />
        <StatsCard
          title="Confirmed"
          value={stats.confirmed}
          valueClassName="text-success"
        />
        <StatsCard
          title="In Progress"
          value={stats.inProgress}
          valueClassName="text-info"
        />
        <StatsCard
          title="Completed"
          value={stats.completed}
          valueClassName="text-success"
        />
      </div>

      {/* Home Statistics */}
      {stats.byHome.length > 0 && (
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Residents by Home</CardTitle>
            <CardDescription>
              Current resident count for each care home
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.byHome.map((homeStat) => (
                <div
                  key={homeStat.homeId}
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{homeStat.homeName}</span>
                  </div>
                  <Badge variant="healthcarePrimary">
                    {homeStat.count} resident{homeStat.count !== 1 ? "s" : ""}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card variant="healthcare">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <SearchFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search by resident initials, home name, or referral number..."
              filterValue={statusFilter}
              onFilterChange={setStatusFilter}
              filterOptions={[
                { value: "all", label: "All Status" },
                { value: PlacementStatus.CONFIRMED, label: "Confirmed" },
                { value: PlacementStatus.IN_PROGRESS, label: "In Progress" },
                { value: PlacementStatus.COMPLETED, label: "Completed" },
              ]}
              filterPlaceholder="Filter by status"
            />
            {homes.length > 0 && (
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium whitespace-nowrap">
                  Filter by Home:
                </label>
                <Select value={selectedHomeId} onValueChange={setSelectedHomeId}>
                  <SelectTrigger className="w-full md:w-[250px]">
                    <SelectValue placeholder="Select a home" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Homes</SelectItem>
                    {homes.map((home) => (
                      <SelectItem key={home.id} value={home.id}>
                        {home.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Residents Table */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Current Residents</CardTitle>
          <CardDescription>
            {residents.length} resident{residents.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={residents}
            isLoading={isLoading}
            variant="healthcare"
            enablePagination={true}
            currentPage={pagination.page}
            totalPages={pagination.pages}
            totalItems={pagination.total}
            onPageChange={(page) =>
              setPagination((prev) => ({ ...prev, page }))
            }
            emptyMessage="No residents found. Residents will appear here once placements are confirmed and move-in dates are set."
          />
        </CardContent>
      </Card>
    </div>
  );

  return (
    <FeatureGate
      feature={residentsGateConfig.feature}
      requiredPlan={residentsGateConfig.requiredPlan}
      bannerDescription={residentsGateConfig.description}
    >
      {content}
    </FeatureGate>
  );
}

