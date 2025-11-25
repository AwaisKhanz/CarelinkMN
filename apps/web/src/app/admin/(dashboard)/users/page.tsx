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
import { USER_ROLE_LABELS } from "@/lib/constants";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  // Dialog states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "" as UserRole,
    status: "" as UserStatus,
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

  const handleViewDetails = useCallback((user: User) => {
    setSelectedUser(user);
    setDetailDialogOpen(true);
  }, []);

  const handleEditUser = useCallback((user: User) => {
    setSelectedUser(user);
    setEditForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role as UserRole,
      status: user.status as UserStatus,
    });
    setEditDialogOpen(true);
  }, []);

  const handleSaveUser = useCallback(async () => {
    if (!selectedUser) return;

    setIsSaving(true);
    try {
      const response = await adminService.updateUser(selectedUser.id, editForm);
      
      if (response.success) {
        toast.success("User updated successfully");
        setEditDialogOpen(false);
        fetchUsers();
      } else {
        toast.error(response.message || "Failed to update user");
      }
    } catch (err) {
      console.error("Error updating user:", err);
      toast.error("Failed to update user");
    } finally {
      setIsSaving(false);
    }
  }, [selectedUser, editForm, fetchUsers]);

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
          const role = row.original.role;
          return (
            <Badge variant="outline">
              {role ? USER_ROLE_LABELS[role] || role : "N/A"}
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
                <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEditUser(user)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [handleViewDetails, handleEditUser]
  );

  // Remove the full page loading check that hides filters
  // if (isLoading && users.length === 0) {
  //   return <LoadingState message="Loading users..." fullHeight />;
  // }

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
                  <SelectItem value={UserRole.SUPER_ADMIN}>{USER_ROLE_LABELS.SUPER_ADMIN}</SelectItem>
                  <SelectItem value={UserRole.ADMIN}>{USER_ROLE_LABELS.ADMIN}</SelectItem>
                  <SelectItem value={UserRole.PROVIDER_OWNER}>{USER_ROLE_LABELS.PROVIDER_OWNER}</SelectItem>
                  <SelectItem value={UserRole.PROVIDER_STAFF}>{USER_ROLE_LABELS.PROVIDER_STAFF}</SelectItem>
                  <SelectItem value={UserRole.CASE_MANAGER}>{USER_ROLE_LABELS.CASE_MANAGER}</SelectItem>
                  <SelectItem value={UserRole.HOSPITAL_SW}>{USER_ROLE_LABELS.HOSPITAL_SW}</SelectItem>
                  <SelectItem value={UserRole.VRS_SPECIALIST}>{USER_ROLE_LABELS.VRS_SPECIALIST}</SelectItem>
                  <SelectItem value={UserRole.VENDOR}>{USER_ROLE_LABELS.VENDOR}</SelectItem>
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

          {!isLoading && users.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No users found"
              description="No users match your current filters"
            />
          ) : (
            <DataTable
              columns={columns}
              data={users}
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

      {/* User Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Detailed information about this user
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-medium">{getUserDisplayName(selectedUser)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">{selectedUser.phone || "—"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Role</Label>
                  <Badge variant="outline" className="capitalize">
                    {selectedUser.role?.replace("_", " ").toLowerCase()}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={getUserStatusBadgeConfig(selectedUser.status as UserStatus).variant}>
                    {getUserStatusBadgeConfig(selectedUser.status as UserStatus).label}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Organization ID</Label>
                  <p className="font-mono text-sm">{selectedUser.organizationId || "—"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created At</Label>
                  <p className="font-medium">
                    {selectedUser.createdAt
                      ? format(new Date(selectedUser.createdAt), "PPpp")
                      : "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Last Login</Label>
                  <p className="font-medium">
                    {selectedUser.lastLoginAt
                      ? format(new Date(selectedUser.lastLoginAt), "PPpp")
                      : "Never"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(value) => setEditForm({ ...editForm, role: value as UserRole })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserRole.ADMIN}>{USER_ROLE_LABELS.ADMIN}</SelectItem>
                    <SelectItem value={UserRole.PROVIDER_OWNER}>{USER_ROLE_LABELS.PROVIDER_OWNER}</SelectItem>
                    <SelectItem value={UserRole.PROVIDER_STAFF}>{USER_ROLE_LABELS.PROVIDER_STAFF}</SelectItem>
                    <SelectItem value={UserRole.CASE_MANAGER}>{USER_ROLE_LABELS.CASE_MANAGER}</SelectItem>
                    <SelectItem value={UserRole.HOSPITAL_SW}>{USER_ROLE_LABELS.HOSPITAL_SW}</SelectItem>
                    <SelectItem value={UserRole.VRS_SPECIALIST}>{USER_ROLE_LABELS.VRS_SPECIALIST}</SelectItem>
                    <SelectItem value={UserRole.VENDOR}>{USER_ROLE_LABELS.VENDOR}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value) => setEditForm({ ...editForm, status: value as UserStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserStatus.ACTIVE}>Active</SelectItem>
                    <SelectItem value={UserStatus.PENDING_VERIFICATION}>Pending Verification</SelectItem>
                    <SelectItem value={UserStatus.SUSPENDED}>Suspended</SelectItem>
                    <SelectItem value={UserStatus.DEACTIVATED}>Deactivated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="healthcare"
              onClick={handleSaveUser}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

