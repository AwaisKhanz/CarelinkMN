"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Save,
  User,
  Mail,
  Phone,
  Building,
  Shield,
  LogOut,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import { profileToasts } from "@/lib/toast";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");
  const { user, updateProfile, changePassword, logout } = useAuth();

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const onProfileSubmit = async (data: ProfileForm) => {
    try {
      await updateProfile(data);
      profileToasts.updateSuccess();
    } catch (err) {
      profileToasts.updateError(
        err instanceof Error
          ? err.message
          : "An error occurred while updating your profile"
      );
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    try {
      await changePassword(data.currentPassword, data.newPassword);
      profileToasts.passwordChangeSuccess();
      passwordForm.reset();
    } catch (err) {
      profileToasts.passwordChangeError(
        err instanceof Error
          ? err.message
          : "An error occurred while changing your password"
      );
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">
            Please sign in to view your profile
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Profile Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {user.firstName} {user.lastName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Role</span>
                    <Badge variant="secondary">
                      {user.role.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  {user.organization && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Organization</span>
                      <span className="text-sm text-muted-foreground">
                        {user.organization.name}
                      </span>
                    </div>
                  )}
                </div>
                <Separator className="my-4" />
                <Button variant="outline" className="w-full" onClick={logout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Profile Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal information and contact details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          {...profileForm.register("firstName")}
                          className={
                            profileForm.formState.errors.firstName
                              ? "border-destructive"
                              : ""
                          }
                        />
                        {profileForm.formState.errors.firstName && (
                          <p className="text-sm text-destructive">
                            {profileForm.formState.errors.firstName.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          {...profileForm.register("lastName")}
                          className={
                            profileForm.formState.errors.lastName
                              ? "border-destructive"
                              : ""
                          }
                        />
                        {profileForm.formState.errors.lastName && (
                          <p className="text-sm text-destructive">
                            {profileForm.formState.errors.lastName.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        {...profileForm.register("email")}
                        className={
                          profileForm.formState.errors.email
                            ? "border-destructive"
                            : ""
                        }
                      />
                      {profileForm.formState.errors.email && (
                        <p className="text-sm text-destructive">
                          {profileForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        {...profileForm.register("phone")}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={profileForm.formState.isSubmitting}
                    >
                      {profileForm.formState.isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save changes
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Password Change */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Change Password
                  </CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        {...passwordForm.register("currentPassword")}
                        className={
                          passwordForm.formState.errors.currentPassword
                            ? "border-destructive"
                            : ""
                        }
                      />
                      {passwordForm.formState.errors.currentPassword && (
                        <p className="text-sm text-destructive">
                          {
                            passwordForm.formState.errors.currentPassword
                              .message
                          }
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        {...passwordForm.register("newPassword")}
                        className={
                          passwordForm.formState.errors.newPassword
                            ? "border-destructive"
                            : ""
                        }
                      />
                      {passwordForm.formState.errors.newPassword && (
                        <p className="text-sm text-destructive">
                          {passwordForm.formState.errors.newPassword.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        {...passwordForm.register("confirmPassword")}
                        className={
                          passwordForm.formState.errors.confirmPassword
                            ? "border-destructive"
                            : ""
                        }
                      />
                      {passwordForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-destructive">
                          {
                            passwordForm.formState.errors.confirmPassword
                              .message
                          }
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={passwordForm.formState.isSubmitting}
                    >
                      {passwordForm.formState.isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 mr-2" />
                          Update password
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
