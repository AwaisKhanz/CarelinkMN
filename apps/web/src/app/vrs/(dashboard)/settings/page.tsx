"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Save,
  Loader2,
  User,
  Bell,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { usePageMetadata } from "../use-page-metadata";
import {
  VRSLoadingState,
  VRSErrorState,
} from "@/components/vrs";
import { Switch } from "@/components/ui/switch";
import { RequirePermission } from "@/components/auth/require-permission";
import { VRS_CAPABILITIES } from "@/lib/permissions/capabilities";
import { apiService } from "@/lib/api";
import { NotificationPreferences, UserStatus } from "@carelink/types";
import { useRolePermissions } from "@/hooks/use-role-permissions";
import { format } from "date-fns";
import { getUserStatusBadgeConfig } from "@/lib/utils/admin";

const profileSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must be less than 50 characters"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name must be less than 50 characters"),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || /^\+?[\d\s\-()]+$/.test(val),
      "Invalid phone number format"
    ),
});

type ProfileFormData = z.infer<typeof profileSchema>;

function VRSSettingsPageContent() {
  const { user, updateProfile } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const { hasCapability } = useRolePermissions();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notificationPreferences, setNotificationPreferences] =
    useState<NotificationPreferences | null>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
    },
  });

  useEffect(() => {
    setTitle("Settings");
    setDescription("Manage your VRS specialist account settings");
  }, [setTitle, setDescription]);

  const loadUserData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Load profile data
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
      });

      // Load notification preferences
      try {
        const response = await apiService.get<{
          notificationPreferences: NotificationPreferences;
        }>("/api/users/notification-preferences");

        if (response.success && response.data?.notificationPreferences) {
          setNotificationPreferences(response.data.notificationPreferences);
        }
      } catch (err) {
        console.error("Error loading notification preferences:", err);
        // Not critical, continue
      }
    } catch (err) {
      console.error("Error loading user data:", err);
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  }, [user, form]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleProfileSubmit = async (data: ProfileFormData) => {
    setIsSaving(true);

    try {
      await updateProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
      });

      toast.success("Profile updated successfully");
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update profile"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotificationToggle = async (
    key: keyof NotificationPreferences,
    value: boolean
  ) => {
    if (!notificationPreferences) return;

    const updated = {
      ...notificationPreferences,
      [key]: value,
    };

    try {
      const response = await apiService.put<{
        notificationPreferences: NotificationPreferences;
      }>("/api/users/notification-preferences", {
        notificationPreferences: updated,
      });

      if (response.success) {
        setNotificationPreferences(updated);
        toast.success("Notification preferences updated");
      } else {
        toast.error(response.message || "Failed to update preferences");
      }
    } catch (err) {
      console.error("Error updating notification preferences:", err);
      toast.error("Failed to update notification preferences");
    }
  };

  if (isLoading) {
    return <VRSLoadingState message="Loading settings..." />;
  }

  if (error) {
    return (
      <VRSErrorState
        message={error}
        action={{
          label: "Retry",
          onClick: loadUserData,
        }}
      />
    );
  }

  if (!user) {
    return (
      <VRSErrorState message="User data not available" />
    );
  }

  const statusBadgeConfig = getUserStatusBadgeConfig(user.status as UserStatus);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

      <form onSubmit={form.handleSubmit(handleProfileSubmit)}>
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="firstName"
                  {...form.register("firstName")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lastName"
                  {...form.register("lastName")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                {...form.register("phone")}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" variant="healthcare" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your account details and status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="font-medium">{user.email}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Role</div>
              <div className="font-medium">VRS Specialist</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="mt-1">
                {statusBadgeConfig ? (
                  <Badge variant={statusBadgeConfig.variant}>
                    {statusBadgeConfig.label}
                  </Badge>
                ) : (
                  <Badge variant="outline">{user.status}</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Manage how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationPreferences ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={notificationPreferences.emailNotifications ?? true}
                  onCheckedChange={(checked) =>
                    handleNotificationToggle("emailNotifications", checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="smsNotifications">SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via SMS
                  </p>
                </div>
                <Switch
                  id="smsNotifications"
                  checked={notificationPreferences.emailNotifications ?? false}
                  onCheckedChange={(checked) =>
                    handleNotificationToggle("emailNotifications", checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="pushNotifications">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications in browser
                  </p>
                </div>
                <Switch
                  id="pushNotifications"
                  checked={notificationPreferences.emailNotifications ?? true}
                  onCheckedChange={(checked) =>
                    handleNotificationToggle("emailNotifications", checked)
                  }
                />
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Loading notification preferences...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VRSSettingsPage() {
  return (
    <RequirePermission
      permission={VRS_CAPABILITIES.DASHBOARD_VIEW}
      title="Access Restricted"
      description="You don't have permission to view settings."
    >
      <VRSSettingsPageContent />
    </RequirePermission>
  );
}

