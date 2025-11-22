"use client";

import { useState, useEffect, useCallback, type ComponentProps } from "react";
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
  Building2,
  User,
  Bell,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { usePageMetadata } from "../use-page-metadata";
import { LoadingState, ErrorState } from "@/components/shared";
import { Switch } from "@/components/ui/switch";
import { RequirePermission } from "@/components/auth/require-permission";
import { HOSPITAL_SW_CAPABILITIES } from "@/lib/permissions/capabilities";
import { apiService, hospitalStaffService } from "@/lib/api";
import { useRolePermissions } from "@/hooks/use-role-permissions";
import { format } from "date-fns";
import { OrganizationStatus } from "@carelink/types";

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
      (val) => !val || /^[\d\s\-\(\)]+$/.test(val),
      "Please enter a valid phone number"
    ),
  department: z
    .string()
    .max(100, "Department must be less than 100 characters")
    .optional(),
  title: z
    .string()
    .max(100, "Title must be less than 100 characters")
    .optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const formatLabel = (value?: string | null) => {
  if (!value) return "Unknown";
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

type BadgeVariant = ComponentProps<typeof Badge>["variant"];

const getStatusVariant = (status?: string | null): BadgeVariant => {
  switch (status) {
    case OrganizationStatus.VERIFIED:
      return "healthcareSuccess";
    case OrganizationStatus.PENDING:
      return "healthcareWarning";
    case OrganizationStatus.SUSPENDED:
      return "destructive";
    case OrganizationStatus.DEACTIVATED:
      return "healthcareError";
    default:
      return "outline";
  }
};

function HospitalSWSettingsPageContent() {
  const { user, updateProfile } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const { hasCapability } = useRolePermissions();
  const canManageProfile = hasCapability(
    HOSPITAL_SW_CAPABILITIES.PROFILE_MANAGE
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      department: "",
      title: "",
    },
  });

  useEffect(() => {
    setTitle("Hospital SW Settings");
    setDescription("Manage your profile and preferences");
  }, [setTitle, setDescription]);

  const loadUserData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Set form values from user data
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        department: "",
        title: "",
      });

      // Load hospital staff information (department, title) if available
      try {
        const hospitalStaff =
          await hospitalStaffService.getHospitalStaffByUserId(user.id);
        if (hospitalStaff) {
          form.setValue("department", hospitalStaff.department || "");
          form.setValue("title", hospitalStaff.title || "");
        }
      } catch (err) {
        // Hospital staff may not exist for all users, that's okay
        console.log("No hospital staff profile found:", err);
      }
    } catch (err) {
      console.error("Error loading user data:", err);
      setError("Failed to load user data");
    } finally {
      setIsLoading(false);
    }
  }, [user, form]);

  useEffect(() => {
    if (user && canManageProfile) {
      loadUserData();
    }
  }, [user, canManageProfile, loadUserData]);

  const onSubmit = useCallback(
    async (data: ProfileFormData) => {
      if (!user) return;

      setIsSaving(true);
      setError(null);

      try {
        // Update user profile
        const updateData: any = {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
        };

        // Update user profile through auth context
        if (updateProfile) {
          await updateProfile(updateData);
        } else {
          // Fallback: use API directly
          const response = await apiService.put(
            "/api/users/profile",
            updateData
          );
          if (!response.success) {
            throw new Error(response.message || "Failed to update profile");
          }
        }

        // Update hospital staff information (department, title) if available
        try {
          await hospitalStaffService.updateHospitalStaff(user.id, {
            department: data.department || undefined,
            title: data.title || undefined,
          });
        } catch (err) {
          // Hospital staff may not exist, that's okay - just log it
          console.log("Could not update hospital staff profile:", err);
        }

        toast.success("Profile updated successfully");
      } catch (err) {
        console.error("Error updating profile:", err);
        setError(
          err instanceof Error ? err.message : "Failed to update profile"
        );
        toast.error("Failed to update profile");
      } finally {
        setIsSaving(false);
      }
    },
    [user, updateProfile]
  );

  if (isLoading) {
    return <LoadingState message="Loading settings..." fullHeight />;
  }

  if (error && !user) {
    return (
      <ErrorState
        title="Error Loading Settings"
        message={error}
        action={{
          label: "Retry",
          onClick: loadUserData,
          variant: "healthcare",
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card variant="healthcare">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>Profile Information</CardTitle>
            </div>
            <CardDescription>
              Update your personal information and hospital staff details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="firstName"
                  {...form.register("firstName")}
                  placeholder="Enter your first name"
                />
                {form.formState.errors.firstName && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.firstName.message}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lastName"
                  {...form.register("lastName")}
                  placeholder="Enter your last name"
                />
                {form.formState.errors.lastName && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.lastName.message}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  {...form.register("phone")}
                  placeholder="(555) 123-4567"
                />
                {form.formState.errors.phone && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.phone.message}
                  </p>
                )}
              </div>

              {/* Email (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed. Contact support if you need to update
                  your email.
                </p>
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  {...form.register("department")}
                  placeholder="e.g., Social Work, Case Management"
                />
                {form.formState.errors.department && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.department.message}
                  </p>
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  {...form.register("title")}
                  placeholder="e.g., Social Worker, Discharge Coordinator"
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" variant="healthcare" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Account Information */}
      <Card variant="healthcare">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <CardTitle>Account Information</CardTitle>
          </div>
          <CardDescription>
            View your account and organization details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-muted-foreground">Role</Label>
              <p className="font-medium">{formatLabel(user?.role)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Organization</Label>
              <p className="font-medium">
                {user?.organization?.name || "Not assigned"}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Account Status</Label>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusVariant(user?.status)}>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {formatLabel(user?.status)}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function HospitalSWSettingsPage() {
  return (
    <RequirePermission
      permission={HOSPITAL_SW_CAPABILITIES.PROFILE_MANAGE}
      title="Access Restricted"
      description="You don't have permission to manage settings."
    >
      <HospitalSWSettingsPageContent />
    </RequirePermission>
  );
}
