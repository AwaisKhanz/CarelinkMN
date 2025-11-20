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
  VendorLoadingState,
  VendorErrorState,
} from "@/components/vendor";
import { RequirePermission } from "@/components/auth/require-permission";
import { VENDOR_CAPABILITIES } from "@/lib/permissions/capabilities";
import { format } from "date-fns";

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

export default function VendorSettingsPage() {
  const { user, updateProfile } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
    setDescription("Manage your vendor account settings");
  }, [setTitle, setDescription]);

  const loadUserData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
      });
    } catch (err) {
      console.error("Error loading user data:", err);
      toast.error("Failed to load user data");
    } finally {
      setIsLoading(false);
    }
  }, [user, form]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsSaving(true);
    try {
      await updateProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
      });
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <VendorLoadingState message="Loading settings..." />;
  }

  return (
    <RequirePermission
      permission={VENDOR_CAPABILITIES.PROFILE_MANAGE}
      title="Access Restricted"
      description="You don't have permission to manage settings."
    >
      <div className="space-y-6">
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    {...form.register("firstName")}
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.firstName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    {...form.register("lastName")}
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  {...form.register("phone")}
                  />
                  {form.formState.errors.phone && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.phone.message}
                    </p>
                  )}
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
            </form>
          </CardContent>
        </Card>

        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="font-medium">{user?.email}</div>
              </div>
              <Badge variant="outline">Verified</Badge>
            </div>
            <Separator />
            <div>
              <div className="text-sm text-muted-foreground">Role</div>
              <div className="font-medium">{user?.role}</div>
            </div>
            <Separator />
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="mt-1">
                <Badge
                  variant={
                    user?.status === "ACTIVE"
                      ? "healthcareSuccess"
                      : user?.status === "PENDING_VERIFICATION"
                      ? "healthcareWarning"
                      : "destructive"
                  }
                >
                  {user?.status || "Unknown"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </RequirePermission>
  );
}

