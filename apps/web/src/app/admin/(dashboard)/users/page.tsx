"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { usePageMetadata } from "../use-page-metadata";
import { adminService } from "@/lib/api";
import type { User } from "@/lib/api/services/auth.service";
import { toast } from "sonner";
import { format } from "date-fns";
import { UserStatus, UserRole } from "@carelink/types";
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
  Users,
  Search,
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getUserStatusBadgeConfig,
  getUserDisplayName,
} from "@/lib/utils/admin";
import { SearchFilterBar } from "@/components/ui/search-filter-bar";

function AdminUsersPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState<string>("");
  const debouncedSearch = useDebounce(searchInput, 500);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    setTitle("User Management");
    setDescription("Manage all users in the system");
  }, [setTitle, setDescription]);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await adminService.getUsers({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        role: roleFilter !== "all" ? (roleFilter as UserRole) : undefined,
        status: statusFilter !== "all" ? (statusFilter as UserStatus) : undefined,
      });

      if (response.success && response.data) {
        setUsers(response.data.users);
        setPagination((prev) => ({
          ...prev,
          total: response.data!.pagination.total,
          pages: response.data!.pagination.pages,
        }));
      } else {
        setError(response.message || "Failed to load users");
        toast.error(response.message || "Failed to load users");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err instanceof Error ? err.message : "Failed to load users");
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset page when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [debouncedSearch, roleFilter, statusFilter]);

  const handleRefresh = useCallback(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handlePageChange = useCallback((newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  }, []);

  // Calculate stats
  const stats = useMemo(() => {
    const totalUsers = pagination.total;
    const activeUsers = users.filter((u) => u.status === UserStatus.ACTIVE).length;
    const pendingUsers = users.filter(
      (u) => u.status === UserStatus.PENDING_VERIFICATION
    ).length;
    const suspendedUsers = users.filter((u) => u.status === UserStatus.SUSPENDED).length;

    return [
      {
        label: "Total Users",
        value: totalUsers.toLocaleString(),
        icon: <Users className="h-4 w-4 text-muted-foreground" />,
        description: "All registered users",
      },
      {
        label: "Active Users",
        value: activeUsers.toLocaleString(),
        icon: <Users className="h-4 w-4 text-muted-foreground" />,
        description: "Currently active",
      },
      {
        label: "Pending Verification",
        value: pendingUsers.toLocaleString(),
        icon: <Users className="h-4 w-4 text-muted-foreground" />,
        description: "Awaiting verification",
      },
      {
        label: "Suspended",
        value: suspendedUsers.toLocaleString(),
        icon: <Users className="h-4 w-4 text-muted-foreground" />,
        description: "Suspended accounts",
      },
    ];
  }, [users, pagination.total]);

  const columns: ColumnDef<User>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "User",
        cell: ({ row }: { row: { original: User } }) => {
          const user = row.original;
          return (
            <div>
              <div className="font-medium">{getUserDisplayName(user)}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
          );
        },
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }: { row: { original: User } }) => {
          return (
            <Badge variant="outline" className="capitalize">
              {row.original.role?.replace("_", " ").toLowerCase()}
            </Badge>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }: { row: { original: User } }) => {
          const status = row.original.status as UserStatus;
          const config = getUserStatusBadgeConfig(status);
          return <Badge variant={config.variant}>{config.label}</Badge>;
        },
      },
      {
        accessorKey: "organizationId",
        header: "Organization",
        cell: ({ row }: { row: { original: User } }) => {
          return row.original.organizationId || "—";
        },
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }: { row: { original: User } }) => {
          const createdAt = row.original.createdAt;
          return createdAt ? format(new Date(createdAt), "MMM d, yyyy") : "—";
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }: { row: { original: User } }) => {
          const user = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => router.push(`/admin/users/${user.id}`)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push(`/admin/users/${user.id}/edit`)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [router]
  );

  if (isLoading && users.length === 0) {
    return <LoadingState message="Loading users..." fullHeight />;
  }

  if (error && users.length === 0) {
    return (
      <ErrorState
        title="Error Loading Users"
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
          <CardTitle>Users</CardTitle>
          <CardDescription>Manage all system users</CardDescription>
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
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value={UserRole.SUPER_ADMIN}>Super Admin</SelectItem>
                  <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                  <SelectItem value={UserRole.PROVIDER_OWNER}>Provider Owner</SelectItem>
                  <SelectItem value={UserRole.PROVIDER_STAFF}>Provider Staff</SelectItem>
                  <SelectItem value={UserRole.CASE_MANAGER}>Case Manager</SelectItem>
                  <SelectItem value={UserRole.HOSPITAL_SW}>Hospital SW</SelectItem>
                  <SelectItem value={UserRole.VRS_SPECIALIST}>VRS Specialist</SelectItem>
                  <SelectItem value={UserRole.VENDOR}>Vendor</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value={UserStatus.ACTIVE}>Active</SelectItem>
                  <SelectItem value={UserStatus.PENDING_VERIFICATION}>
                    Pending Verification
                  </SelectItem>
                  <SelectItem value={UserStatus.SUSPENDED}>Suspended</SelectItem>
                  <SelectItem value={UserStatus.DEACTIVATED}>Deactivated</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {users.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No users found"
              description="No users match your current filters"
            />
          ) : (
            <DataTable
              columns={columns}
              data={users}
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

export default function AdminUsersPage() {
  return (
    <RequirePermission
      permission={SYSTEM_CAPABILITIES.USERS_MANAGE}
      title="Access Restricted"
      description="You don't have permission to manage users."
    >
      <AdminUsersPageContent />
    </RequirePermission>
  );
}

