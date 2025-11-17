"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Users,
  Mail,
  Phone,
  Calendar,
  Trash2,
  Loader2,
  UserPlus,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Info,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { providerService, StaffMember } from "@/lib/api";
import { usePageMetadata } from "../use-page-metadata";
import { usePermissions } from "@/hooks/use-permissions";
import { Badge } from "@/components/ui/badge";
import {
  format,
  formatDistanceToNow,
  differenceInHours,
} from "date-fns";
import { useProvider } from "@/contexts/provider-context";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export default function ProviderStaffPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const { canManageStaff, isOwner } = usePermissions();
  const { provider } = useProvider();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [staffToRemove, setStaffToRemove] = useState<StaffMember | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [resendingStaffId, setResendingStaffId] = useState<string | null>(null);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
  });

  useEffect(() => {
    setTitle("Staff Management");
    setDescription("Manage your provider staff members");
  }, [setTitle, setDescription]);

  useEffect(() => {
    if (provider?.id) {
      fetchStaff();
    }
  }, [provider?.id]);

  const fetchStaff = async () => {
    if (!provider?.id) return;

    setIsLoading(true);
    try {
      const response = await providerService.getOrganizationStaff(provider.id);
      if (response.success && response.data) {
        setStaff(response.data);
      } else {
        toast.error(response.message || "Failed to load staff members.");
      }
    } catch (err) {
      console.error("Error fetching staff:", err);
      toast.error("Failed to load staff members.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!provider?.id) return;

    if (!inviteForm.email || !inviteForm.firstName || !inviteForm.lastName) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsInviting(true);
    try {
      const response = await providerService.inviteStaff(provider.id, {
        email: inviteForm.email,
        firstName: inviteForm.firstName,
        lastName: inviteForm.lastName,
        phone: inviteForm.phone || undefined,
      });

      if (response.success) {
        toast.success("Staff member invited successfully!");
        setIsInviteDialogOpen(false);
        setInviteForm({ email: "", firstName: "", lastName: "", phone: "" });
        await fetchStaff();
      } else {
        toast.error(response.message || "Failed to invite staff member.");
      }
    } catch (err) {
      console.error("Error inviting staff:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to invite staff member."
      );
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemove = async () => {
    if (!provider?.id || !staffToRemove) return;

    setIsRemoving(true);
    try {
      const response = await providerService.removeStaff(
        provider.id,
        staffToRemove.id
      );

      if (response.success) {
        toast.success("Staff member removed successfully.");
        setStaffToRemove(null);
        await fetchStaff();
      } else {
        toast.error(response.message || "Failed to remove staff member.");
      }
    } catch (err) {
      console.error("Error removing staff:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to remove staff member."
      );
    } finally {
      setIsRemoving(false);
    }
  };

  const handleResendInvite = async (member: StaffMember) => {
    if (!provider?.id) return;

    setResendingStaffId(member.id);
    try {
      const response = await providerService.resendStaffInvite(
        provider.id,
        member.id
      );

      if (response.success) {
        toast.success("Invitation resent successfully.");
        await fetchStaff();
      } else {
        toast.error(response.message || "Failed to resend invitation.");
      }
    } catch (err) {
      console.error("Error resending invitation:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to resend invitation."
      );
    } finally {
      setResendingStaffId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge variant="healthcareSuccess" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Active
          </Badge>
        );
      case "PENDING_VERIFICATION":
        return (
          <Badge variant="healthcareWarning" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "DEACTIVATED":
        return (
          <Badge variant="healthcareError" className="gap-1">
            <XCircle className="h-3 w-3" />
            Deactivated
          </Badge>
        );
      default:
        return (
          <Badge variant="healthcareSecondary" className="gap-1">
            {status}
          </Badge>
        );
    }
  };

  // Redirect if user doesn't have permission
  if (user && !canManageStaff) {
    return (
      <div className="space-y-6">
        <Card variant="healthcare">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
              <p className="text-muted-foreground">
                Only provider owners can manage staff members.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your provider staff members
          </p>
        </div>
        {canManageStaff && (
          <Button onClick={() => setIsInviteDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Staff
          </Button>
        )}
      </div>

      {/* Staff List */}
      {isLoading ? (
        <Card variant="healthcare">
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <p className="text-muted-foreground">Loading staff members...</p>
            </div>
          </CardContent>
        </Card>
      ) : staff.length === 0 ? (
        <Card variant="healthcare">
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No staff members</h3>
              <p className="text-muted-foreground mb-4">
                Get started by inviting your first staff member.
              </p>
              {canManageStaff && (
                <Button onClick={() => setIsInviteDialogOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Staff
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {staff.map((member) => {
            const lastInviteDate = new Date(
              member.updatedAt || member.createdAt
            );
            const hoursSinceInvite = differenceInHours(
              new Date(),
              lastInviteDate
            );
            const canResendInvite =
              member.status === "PENDING_VERIFICATION" &&
              hoursSinceInvite >= 24;

            return (
              <Card key={member.id} variant="healthcare">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {member.firstName} {member.lastName}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(member.status)}
                        </div>
                      </div>
                    </div>
                    <div className="ml-13 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        {member.email}
                      </div>
                      {member.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          {member.phone}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {member.status === "PENDING_VERIFICATION"
                          ? "Invited"
                          : "Joined"}{" "}
                        {format(new Date(member.createdAt), "MMM dd, yyyy")}
                      </div>
                      {member.lastLoginAt && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          Last login{" "}
                          {format(new Date(member.lastLoginAt), "MMM dd, yyyy")}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    {member.status === "PENDING_VERIFICATION" &&
                      canManageStaff && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResendInvite(member)}
                          disabled={
                            resendingStaffId === member.id || !canResendInvite
                          }
                        >
                          {resendingStaffId === member.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              {canResendInvite
                                ? "Resend Invite"
                                : "Resend in 24h"}
                            </>
                          )}
                        </Button>
                      )}
                    {canManageStaff && member.status !== "DEACTIVATED" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setStaffToRemove(member)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
                {member.status === "PENDING_VERIFICATION" && (
                  <div className="mt-4 rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <Info className="h-4 w-4 text-warning" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">
                          Waiting for activation
                        </p>
                        <p>
                          Invitation links remain valid for 24 hours. If they
                          miss it, send a fresh link once the current link
                          expires.
                        </p>
                        {!canResendInvite && (
                          <p className="text-xs">
                            You can resend this invitation after{" "}
                            {formatDistanceToNow(
                              new Date(
                                lastInviteDate.getTime() + 24 * 60 * 60 * 1000
                              ),
                              { addSuffix: true }
                            )}
                            .
                          </p>
                        )}
                        <p className="text-xs">
                          Last invitation sent{" "}
                          {formatDistanceToNow(lastInviteDate, {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      {/* Invite Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Staff Member</DialogTitle>
            <DialogDescription>
              Send an invitation to a new staff member. They will receive an
              email to set up their account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="staff@example.com"
                value={inviteForm.email}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, email: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={inviteForm.firstName}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, firstName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={inviteForm.lastName}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, lastName: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={inviteForm.phone}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, phone: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsInviteDialogOpen(false)}
              disabled={isInviting}
            >
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={isInviting}>
              {isInviting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Inviting...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <ConfirmationDialog
        open={!!staffToRemove}
        onOpenChange={(open) => !open && setStaffToRemove(null)}
        title="Remove Staff Member"
        description="Are you sure you want to remove this staff member? They will no longer have access to the provider dashboard. This action cannot be undone."
        itemName={
          staffToRemove
            ? `${staffToRemove.firstName} ${staffToRemove.lastName}`
            : undefined
        }
        onConfirm={handleRemove}
        confirmLabel="Remove"
        isProcessing={isRemoving}
        variant="destructive"
      />
    </div>
  );
}

