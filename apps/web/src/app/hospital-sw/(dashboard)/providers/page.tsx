"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
  RefreshCw,
  MapPin,
  MoreVertical,
  Eye,
  Building,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { providerService } from "@/lib/api";
import { usePageMetadata } from "../use-page-metadata";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/ui/data-table";
import { useDebounce } from "@/hooks/use-debounce";
import { RequirePermission } from "@/components/auth/require-permission";
import { HOSPITAL_SW_CAPABILITIES } from "@/lib/permissions/capabilities";
import {
  HospitalSWLoadingState,
  HospitalSWErrorState,
  HospitalSWStatsGrid,
} from "@/components/hospital-sw";
import { useRolePermissions } from "@/hooks/use-role-permissions";
import { getLicenseTypeLabel } from "@/lib/constants";

interface ProviderListItem {
  id: string;
  organization?: {
    name: string;
    city?: string;
    state?: string;
    county?: string;
  };
  primaryLicenseType?: string;
  verified?: boolean;
  acceptsReferrals?: boolean;
  responseTimeHours?: number;
  _count?: {
    homes?: number;
    openings?: number;
  };
}

function HospitalSWProvidersPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const { hasCapability } = useRolePermissions();
  const canViewProviders = hasCapability(
    HOSPITAL_SW_CAPABILITIES.PROVIDERS_VIEW
  );

  const [providers, setProviders] = useState<ProviderListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for server-side filtering and pagination
  const [searchQuery, setSearchQuery] = useState<string>("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 1,
  });

  useEffect(() => {
    setTitle("Providers");
    setDescription("View and search for care providers in the network.");
  }, [setTitle, setDescription]);

  // Fetch providers based on filters and pagination
  const fetchProviders = useCallback(async () => {
    if (!canViewProviders) return;

    setIsLoading(true);
    setError(null);

    try {
      const filters: any = {
        page,
        limit,
      };

      if (debouncedSearch) {
        filters.search = debouncedSearch.trim();
      }

      // Use getProviders method
      const response = await providerService.getProviders(filters);
      if (response.success && response.data) {
        setProviders(response.data.providers || []);
        setPagination({
          total: response.data.pagination?.total || 0,
          pages: response.data.pagination?.pages || 1,
        });
      } else {
        setError(response.message || "Failed to fetch providers");
        toast.error("Failed to load providers");
      }
    } catch (err) {
      console.error("Error fetching providers:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Network error or server unreachable"
      );
      toast.error("Failed to load providers");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, canViewProviders]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleRefresh = useCallback(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  // Reset page to 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const columns: ColumnDef<ProviderListItem>[] = useMemo(
    () => [
      {
        accessorKey: "organization",
        header: "Provider",
        cell: ({ row }: { row: { original: ProviderListItem } }) => {
          const provider = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Building className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-medium">
                  {provider.organization?.name || "Unknown Provider"}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  {provider.organization?.city &&
                    provider.organization?.state && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>
                          {provider.organization.city},{" "}
                          {provider.organization.state}
                        </span>
                      </div>
                    )}
                  {provider.organization?.county && (
                    <span>• {provider.organization.county} County</span>
                  )}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "primaryLicenseType",
        header: "License Type",
        cell: ({ row }: { row: { original: ProviderListItem } }) => {
          const provider = row.original;
          return (
            <Badge variant="outline">
              {provider.primaryLicenseType
                ? getLicenseTypeLabel(provider.primaryLicenseType)
                : "N/A"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "homes",
        header: "Homes",
        cell: ({ row }: { row: { original: ProviderListItem } }) => {
          const provider = row.original;
          const homeCount = provider._count?.homes || 0;
          return (
            <div className="text-sm">
              {homeCount} {homeCount === 1 ? "Home" : "Homes"}
            </div>
          );
        },
      },
      {
        accessorKey: "openings",
        header: "Openings",
        cell: ({ row }: { row: { original: ProviderListItem } }) => {
          const provider = row.original;
          const openingCount = provider._count?.openings || 0;
          if (openingCount > 0) {
            return (
              <Badge variant="healthcareSuccess">
                {openingCount} {openingCount === 1 ? "Opening" : "Openings"}
              </Badge>
            );
          }
          return <Badge variant="outline">Waitlist</Badge>;
        },
      },
      {
        accessorKey: "responseTime",
        header: "Response Time",
        cell: ({ row }: { row: { original: ProviderListItem } }) => {
          const provider = row.original;
          if (provider.responseTimeHours) {
            return (
              <div className="flex items-center gap-1 text-sm">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span>Avg. {provider.responseTimeHours}h</span>
              </div>
            );
          }
          return <span className="text-muted-foreground">-</span>;
        },
      },
      {
        accessorKey: "verified",
        header: "Status",
        cell: ({ row }: { row: { original: ProviderListItem } }) => {
          const provider = row.original;
          return (
            <div className="flex items-center gap-2">
              {provider.verified && (
                <Badge variant="healthcareInfo">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
              {provider.acceptsReferrals === false && (
                <Badge variant="outline">Not Accepting</Badge>
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }: { row: { original: ProviderListItem } }) => {
          const provider = row.original;
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
                    router.push(`/hospital-sw/providers/${provider.id}`)
                  }
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [router]
  );

  const handleViewProvider = useCallback(
    (provider: ProviderListItem) => {
      router.push(`/hospital-sw/providers/${provider.id}`);
    },
    [router]
  );

  // Calculate stats
  const statsData = useMemo(() => {
    const total = pagination.total;
    const verified = providers.filter((p) => p.verified).length;
    const withOpenings = providers.filter(
      (p) => (p._count?.openings || 0) > 0
    ).length;
    const accepting = providers.filter(
      (p) => p.acceptsReferrals !== false
    ).length;

    return [
      {
        label: "Total Providers",
        value: total,
        icon: <Building className="h-4 w-4 text-muted-foreground" />,
        description: "All providers in network",
      },
      {
        label: "Verified",
        value: verified,
        icon: <CheckCircle2 className="h-4 w-4 text-muted-foreground" />,
        description: "Verified providers",
      },
      {
        label: "With Openings",
        value: withOpenings,
        icon: <Building className="h-4 w-4 text-muted-foreground" />,
        description: "Providers with available openings",
      },
      {
        label: "Accepting Referrals",
        value: accepting,
        icon: <CheckCircle2 className="h-4 w-4 text-muted-foreground" />,
        description: "Currently accepting referrals",
      },
    ];
  }, [providers, pagination]);

  if (isLoading && providers.length === 0) {
    return <HospitalSWLoadingState message="Loading providers..." fullHeight />;
  }

  if (error && providers.length === 0) {
    return (
      <HospitalSWErrorState
        message={error || "Failed to load providers"}
        action={{
          label: "Retry",
          onClick: handleRefresh,
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards - Use shared component */}
      <HospitalSWStatsGrid stats={statsData} columns={4} />

      {/* Data Table */}
      <Card variant="healthcare">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Providers</CardTitle>
              <CardDescription>
                Search and view care providers in the network
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw
                className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={providers}
            isLoading={isLoading}
            searchKey="global"
            searchPlaceholder="Search providers by name, location, or license type..."
            searchValue={searchQuery}
            onSearchChange={(value) => {
              setSearchQuery(value);
              setPage(1);
            }}
            enablePagination={true}
            pageSize={limit}
            currentPage={page}
            totalPages={pagination.pages}
            totalItems={pagination.total}
            onPageChange={handlePageChange}
            variant="healthcare"
            onRowClick={handleViewProvider}
            emptyMessage="No providers found."
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function HospitalSWProvidersPage() {
  return (
    <RequirePermission
      permission={HOSPITAL_SW_CAPABILITIES.PROVIDERS_VIEW}
      title="Access Restricted"
      description="You don't have permission to view providers. Please contact your organization administrator if you need access."
    >
      <HospitalSWProvidersPageContent />
    </RequirePermission>
  );
}
