"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  User,
  Building,
  History,
  Shield,
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Clock,
  Edit,
  Loader2,
  Lock,
  Ban,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";
import { apiService } from "@/lib/api/config";
import { toast } from "sonner";
import { UserRole, UserStatus } from "@carelink/types";
import { usePageMetadata } from "../../use-page-metadata";
import { RequirePermission } from "@/components/auth/require-permission";
import { SYSTEM_CAPABILITIES } from "@/lib/permissions/capabilities";
import { getUserStatusBadgeConfig, getUserDisplayName } from "@/lib/utils/admin";
import { USER_ROLE_LABELS } from "@/lib/constants";

interface AuditLog {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  result: string;
  timestamp: string;
  ipAddress?: string;
}

interface UserDetails {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: UserRole;
    status: UserStatus;
    organizationId?: string;
    createdAt: string;
    updatedAt: string;
    lastLoginAt?: string;
    organization?: {
      id: string;
      name: string;
      type: string;
    };
  };
  recentActivity: AuditLog[];
}

function UserDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const { setTitle, setDescription } = usePageMetadata();
  const [data, setData] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Edit state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "" as UserRole,
    status: "" as UserStatus,
  });

  useEffect(() => {
    setTitle("User Details");
    setDescription("View and manage user profile and activity");
    if (params.id) {
      fetchUserDetails(params.id as string);
    }
  }, [params.id, setTitle, setDescription]);

  const fetchUserDetails = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await apiService.get<UserDetails>(
        `/api/admin/users/${id}/details`
      );

      if (response.success && response.data) {
        setData(response.data);
      } else {
        toast.error("Failed to load user details");
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      toast.error("Failed to load user details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = () => {
    if (!data) return;
    setEditForm({
      firstName: data.user.firstName,
      lastName: data.user.lastName,
      email: data.user.email,
      phone: data.user.phone || "",
      role: data.user.role,
      status: data.user.status,
    });
    setEditDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!data) return;

    setIsSaving(true);
    try {
      const response = await apiService.put(
        `/api/admin/users/${data.user.id}`,
        editForm
      );

      if (response.success) {
        toast.success("User updated successfully");
        setEditDialogOpen(false);
        fetchUserDetails(data.user.id); // Refresh data
      } else {
        toast.error(response.message || "Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading user details...</div>;
  }

  if (!data) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-lg font-medium">User not found</h3>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/admin/users")}
        >
          Back to List
        </Button>
      </div>
    );
  }

  const { user, recentActivity } = data;
  const statusConfig = getUserStatusBadgeConfig(user.status);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/users")}
          className="pl-0 hover:bg-transparent"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>
        <div className="flex items-center gap-3">
          <Badge variant={statusConfig.variant} className="text-sm px-3 py-1">
            {statusConfig.label}
          </Badge>
          <Button variant="outline" onClick={handleEditClick}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Content - User Profile */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>User Profile</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                  {user.firstName[0]}
                  {user.lastName[0]}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{getUserDisplayName(user)}</h2>
                  <Badge variant="outline" className="mt-1 capitalize">
                    {USER_ROLE_LABELS[user.role] || user.role}
                  </Badge>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Email
                  </Label>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4" /> Phone
                  </Label>
                  <p className="font-medium">{user.phone || "—"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Joined
                  </Label>
                  <p className="font-medium">
                    {format(new Date(user.createdAt), "MMMM d, yyyy")}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Last Login
                  </Label>
                  <p className="font-medium">
                    {user.lastLoginAt
                      ? format(new Date(user.lastLoginAt), "MMM d, yyyy h:mm a")
                      : "Never"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                <CardTitle>Recent Activity</CardTitle>
              </div>
              <CardDescription>
                Last 10 actions performed by this user
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium text-sm">{log.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.resourceType} • {log.ipAddress || "Unknown IP"}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            log.result === "SUCCESS" ? "outline" : "destructive"
                          }
                          className="mb-1"
                        >
                          {log.result}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(log.timestamp), "MMM d, h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground italic text-center py-4">
                  No recent activity found
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Organization & Security */}
        <div className="space-y-6">
          {user.organization && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  <CardTitle>Organization</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-medium text-lg">
                    {user.organization.name}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <p className="font-medium">{user.organization.type}</p>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    router.push(`/admin/organizations/${user.organization!.id}`)
                  }
                >
                  View Organization
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>Security</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Lock className="mr-2 h-4 w-4" />
                Reset Password
              </Button>
              {user.status !== UserStatus.DEACTIVATED && (
                <Button
                  variant="outline"
                  className="w-full justify-start text-destructive hover:text-destructive"
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Deactivate User
                </Button>
              )}
              {user.status === UserStatus.DEACTIVATED && (
                <Button
                  variant="outline"
                  className="w-full justify-start text-green-600 hover:text-green-600"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Reactivate User
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
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

export default function UserDetailPage() {
  return (
    <RequirePermission
      permission={SYSTEM_CAPABILITIES.USERS_MANAGE}
      title="Access Restricted"
      description="You don't have permission to view user details."
    >
      <UserDetailPageContent />
    </RequirePermission>
  );
}
