"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { usePageMetadata } from "../use-page-metadata";
import { adminService } from "@/lib/api";
import type { Organization } from "@/lib/api/types/organization.types";
import { toast } from "sonner";
import { format } from "date-fns";
import { OrganizationStatus, OrganizationType } from "@carelink/types";
import { useDebounce } from "@/hooks/use-debounce";
import { RequirePermission } from "@/components/auth/require-permission";
import { SYSTEM_CAPABILITIES } from "@/lib/permissions/capabilities";
import { LoadingState, ErrorState, EmptyState, StatsGrid } from "@/components/shared";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Eye,
  Edit,
  MoreVertical,
  Building2,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getOrganizationStatusBadgeConfig,
  getOrganizationDisplayName,
} from "@/lib/utils/admin";
import { SearchFilterBar } from "@/components/ui/search-filter-bar";

function AdminOrganizationsPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState<string>("");
  const debouncedSearch = useDebounce(searchInput, 500);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    setTitle("Organization Management");
    setDescription("Manage all organizations in the system");
  }, [setTitle, setDescription]);

  const fetchOrganizations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await adminService.getOrganizations({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        type: typeFilter !== "all" ? typeFilter : undefined,
        status:
          statusFilter !== "all"
            ? (statusFilter as OrganizationStatus)
            : undefined,
      });

      if (response.success && response.data) {
        setOrganizations(response.data.organizations);
        setPagination((prev) => ({
          ...prev,
          total: response.data!.pagination.total,
          pages: response.data!.pagination.pages,
        }));
      } else {
        setError(response.message || "Failed to load organizations");
        toast.error(response.message || "Failed to load organizations");
      }
    } catch (err) {
      console.error("Error fetching organizations:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load organizations"
      );
      toast.error("Failed to load organizations");
    } finally {
      setIsLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    debouncedSearch,
    typeFilter,
    statusFilter,
  ]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Reset page when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [debouncedSearch, typeFilter, statusFilter]);

  const handleRefresh = useCallback(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const handlePageChange = useCallback((newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  }, []);

  // Calculate stats
  const stats = useMemo(() => {
    const totalOrgs = pagination.total;
    const verifiedOrgs = organizations.filter(
      (org) => org.status === OrganizationStatus.VERIFIED
    ).length;
    const pendingOrgs = organizations.filter(
      (org) => org.status === OrganizationStatus.PENDING
    ).length;
    const suspendedOrgs = organizations.filter(
      (org) => org.status === OrganizationStatus.SUSPENDED
    ).length;

    return [
      {
        label: "Total Organizations",
        value: totalOrgs.toLocaleString(),
        icon: <Building2 className="h-4 w-4 text-muted-foreground" />,
        description: "All registered organizations",
      },
      {
        label: "Verified",
        value: verifiedOrgs.toLocaleString(),
        icon: <Building2 className="h-4 w-4 text-muted-foreground" />,
        description: "Active and verified",
      },
      {
        label: "Pending",
        value: pendingOrgs.toLocaleString(),
        icon: <Building2 className="h-4 w-4 text-muted-foreground" />,
        description: "Awaiting verification",
      },
      {
        label: "Suspended",
        value: suspendedOrgs.toLocaleString(),
        icon: <Building2 className="h-4 w-4 text-muted-foreground" />,
        description: "Suspended organizations",
      },
    ];
  }, [organizations, pagination.total]);

  const columns: ColumnDef<Organization>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Organization",
        cell: ({ row }: { row: { original: Organization } }) => {
          const org = row.original;
          return (
            <div>
              <div className="font-medium">
                {getOrganizationDisplayName(org)}
              </div>
              <div className="text-sm text-muted-foreground">{org.email}</div>
            </div>
          );
        },
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }: { row: { original: Organization } }) => {
          return (
            <Badge variant="outline" className="capitalize">
              {row.original.type?.replace("_", " ").toLowerCase()}
            </Badge>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }: { row: { original: Organization } }) => {
          const status = row.original.status as OrganizationStatus;
          const config = getOrganizationStatusBadgeConfig(status);
          return <Badge variant={config.variant}>{config.label}</Badge>;
        },
      },
      {
        accessorKey: "city",
        header: "Location",
        cell: ({ row }: { row: { original: Organization } }) => {
          const org = row.original;
          return org.city && org.state
            ? `${org.city}, ${org.state}`
            : org.state || "—";
        },
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }: { row: { original: Organization } }) => {
          const createdAt = row.original.createdAt;
          return createdAt ? format(new Date(createdAt), "MMM d, yyyy") : "—";
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }: { row: { original: Organization } }) => {
          const org = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => router.push(`/admin/organizations/${org.id}`)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`/admin/organizations/${org.id}/edit`)
                  }
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Organization
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [router]
  );

  // Remove the full page loading check that hides filters
  // if (isLoading && organizations.length === 0) {
  //   return <LoadingState message="Loading organizations..." fullHeight />;
  // }

  if (error && organizations.length === 0) {
    return (
      <ErrorState
        title="Error Loading Organizations"
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
      {/* Stats */}
      <StatsGrid stats={stats} columns={4} variant="card" />

      {/* Filters and Search */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Organizations</CardTitle>
          <CardDescription>Manage all system organizations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchFilterBar
                searchQuery={searchInput}
                onSearchChange={setSearchInput}
                searchPlaceholder="Search by name or email..."
              />
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value={OrganizationType.PROVIDER}>
                    Provider
                  </SelectItem>
                  <SelectItem value={OrganizationType.CASE_MANAGEMENT}>
                    Case Management
                  </SelectItem>
                  <SelectItem value={OrganizationType.HOSPITAL}>
                    Hospital
                  </SelectItem>
                  <SelectItem value={OrganizationType.VRS}>VRS</SelectItem>
                  <SelectItem value={OrganizationType.VENDOR}>
                    Vendor
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value={OrganizationStatus.VERIFIED}>
                    Verified
                  </SelectItem>
                  <SelectItem value={OrganizationStatus.PENDING}>
                    Pending
                  </SelectItem>
                  <SelectItem value={OrganizationStatus.SUSPENDED}>
                    Suspended
                  </SelectItem>
                  <SelectItem value={OrganizationStatus.DEACTIVATED}>
                    Deactivated
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!isLoading && organizations.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No organizations found"
              description="No organizations match your current filters"
            />
          ) : (
            <DataTable
              columns={columns}
              data={organizations}
              isLoading={isLoading}
              enablePagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              totalItems={pagination.total}
              pageSize={pagination.limit}
              onPageChange={handlePageChange}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminOrganizationsPage() {
  return (
    <RequirePermission
      permission={SYSTEM_CAPABILITIES.ORGANIZATIONS_MANAGE}
      title="Access Restricted"
      description="You don't have permission to manage organizations."
    >
      <AdminOrganizationsPageContent />
    </RequirePermission>
  );
}
