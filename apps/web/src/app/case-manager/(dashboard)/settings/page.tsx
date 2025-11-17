"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  FileText,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { caseManagerService, CaseManager } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useCaseManager } from "@/contexts/case-manager-context";
import { usePageMetadata } from "../use-page-metadata";
import { CaseManagerLoadingState, CaseManagerErrorState } from "@/components/case-manager";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { FormError } from "@/components/ui/form-error";
import { FileUploader, UploadedFile } from "@/components/ui/file-uploader";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  NotificationPreferences,
  DefaultReferralSettings,
  Urgency,
  Payer,
} from "@carelink/types";
import {
  CARE_LEVELS,
  SUPPORTED_NEEDS,
  MINNESOTA_COUNTIES,
  PAYER_OPTIONS,
  URGENCY_CONFIG,
} from "@/lib/constants";
import { RequirePermission } from "@/components/auth/require-permission";
import { CASE_MANAGER_CAPABILITIES } from "@/lib/permissions/capabilities";

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
  licenseNumber: z
    .string()
    .max(100, "License number must be less than 100 characters")
    .optional(),
  licenseExpiry: z.date().optional().nullable(),
  licenseDocumentUrl: z.string().url().optional().or(z.literal("")),
  licenseFileName: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

function CaseManagerSettingsPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { caseManager: contextCaseManager, caseManagerId, refetch: refetchCaseManager } = useCaseManager();
  const { setTitle, setDescription } = usePageMetadata();

  const [caseManager, setCaseManager] = useState<CaseManager | null>(contextCaseManager);
  const [isLoading, setIsLoading] = useState(!contextCaseManager);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // Notification preferences state
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    emailNotifications: true,
    emailNewReferrals: true,
    emailProviderResponses: true,
    emailPlacementUpdates: true,
    emailUrgentCases: true,
    inAppNotifications: true,
    inAppNewReferrals: true,
    inAppProviderResponses: true,
    inAppPlacementUpdates: true,
    inAppUrgentCases: true,
  });

  // Default referral settings state
  const [defaultReferralSettings, setDefaultReferralSettings] = useState<DefaultReferralSettings>({
    defaultUrgency: Urgency.ROUTINE,
    defaultPrimaryPayer: undefined,
    defaultPreferredCounties: [],
    defaultPreferredCities: [],
    defaultMaxDistance: undefined,
    defaultCareLevels: [],
    defaultServicesNeeded: [],
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      licenseNumber: "",
      licenseExpiry: null,
      licenseDocumentUrl: "",
      licenseFileName: "",
    },
  });

  useEffect(() => {
    setTitle("Case Manager Settings");
    setDescription("Manage your profile and preferences");
  }, [setTitle, setDescription]);

  useEffect(() => {
    // Use case manager from context if available
    if (contextCaseManager) {
      setCaseManager(contextCaseManager);
      setIsLoading(false);
      return;
    }

    const fetchCaseManager = async () => {
      if (!caseManagerId && !user?.id) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await caseManagerService.getCaseManagerByUserId(
          caseManagerId || user!.id
        );

        if (response.success && response.data) {
          const data = response.data;
          setCaseManager(data);

          // Set form values
          form.reset({
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            phone: data.phone || "",
            licenseNumber: data.licenseNumber || "",
            licenseExpiry: data.licenseExpiry
              ? new Date(data.licenseExpiry)
              : null,
            licenseDocumentUrl: data.licenseDocumentUrl || "",
            licenseFileName: data.licenseFileName || "",
          });

          // Set uploaded files if license document exists
          if (data.licenseDocumentUrl) {
            setUploadedFiles([
              {
                url: data.licenseDocumentUrl,
                fileName: data.licenseFileName || "License document",
              },
            ]);
          } else {
            setUploadedFiles([]);
          }

          // Set notification preferences
          if (data.notificationPreferences) {
            setNotificationPrefs(data.notificationPreferences);
          }

          // Set default referral settings
          if (data.defaultReferralSettings) {
            setDefaultReferralSettings(data.defaultReferralSettings);
          }
        } else {
          setError(response.message || "Failed to load case manager profile");
          toast.error(response.message || "Failed to load profile");
        }
      } catch (err) {
        console.error("Error fetching case manager:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load profile"
        );
        toast.error("Failed to load case manager profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCaseManager();
  }, [contextCaseManager, caseManagerId, user?.id, form]);

  const handleSubmit = async (data: ProfileFormData) => {
    if (!caseManagerId && !user?.id) return;

    setIsSaving(true);
    setError(null);

    try {
      const updateData = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
        licenseNumber: data.licenseNumber || undefined,
        licenseExpiry: data.licenseExpiry
          ? data.licenseExpiry.toISOString()
          : undefined,
        licenseDocumentUrl: uploadedFiles[0]?.url || data.licenseDocumentUrl || undefined,
        licenseFileName: uploadedFiles[0]?.fileName || data.licenseFileName || undefined,
        notificationPreferences: notificationPrefs,
        defaultReferralSettings: defaultReferralSettings,
      };

      const response = await caseManagerService.updateCaseManager(
        caseManagerId || user!.id,
        updateData
      );

      if (response.success && response.data) {
        setCaseManager(response.data);
        // Refetch from context to sync
        await refetchCaseManager();
        toast.success("Profile updated successfully!");
      } else {
        setError(response.message || "Failed to update profile");
        toast.error(response.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err instanceof Error ? err.message : "Failed to update profile");
      toast.error(
        err instanceof Error ? err.message : "Failed to update profile"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <CaseManagerLoadingState message="Loading settings..." fullHeight />;
  }

  if (error && !caseManager) {
    return (
      <CaseManagerErrorState
        title="Error Loading Profile"
        message={error}
        action={{
          label: "Retry",
          onClick: async () => {
            await refetchCaseManager();
            window.location.reload();
          },
          variant: "healthcare",
        }}
      />
    );
  }

  if (!caseManager) {
    return (
      <CaseManagerErrorState
        title="Profile Not Found"
        message="Case manager profile not found. Please contact support."
        action={{
          label: "Go to Dashboard",
          onClick: () => router.push("/case-manager/dashboard"),
          variant: "healthcare",
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Case Manager Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your profile and preferences
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Card variant="healthcare" className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-foreground mb-1">Error</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Profile Information */}
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your personal information and contact details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="firstName"
                  {...form.register("firstName")}
                  placeholder="John"
                  className={cn(
                    form.formState.errors.firstName && "border-destructive"
                  )}
                />
                <FormError error={form.formState.errors.firstName} />
              </div>

              <div>
                <Label htmlFor="lastName">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lastName"
                  {...form.register("lastName")}
                  placeholder="Doe"
                  className={cn(
                    form.formState.errors.lastName && "border-destructive"
                  )}
                />
                <FormError error={form.formState.errors.lastName} />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={caseManager.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email cannot be changed. Contact support if you need to update
                your email.
              </p>
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                {...form.register("phone")}
                placeholder="(555) 123-4567"
                className={cn(
                  form.formState.errors.phone && "border-destructive"
                )}
              />
              <FormError error={form.formState.errors.phone} />
            </div>

            <Separator />

            <div className="space-y-4">
              <div>
                <Label htmlFor="licenseNumber">License Number</Label>
                <Input
                  id="licenseNumber"
                  {...form.register("licenseNumber")}
                  placeholder="Enter your license number"
                  className={cn(
                    form.formState.errors.licenseNumber && "border-destructive"
                  )}
                />
                <FormError error={form.formState.errors.licenseNumber} />
                <p className="text-xs text-muted-foreground mt-1">
                  Your professional license number
                </p>
              </div>

              <div>
                <Label htmlFor="licenseExpiry">License Expiry Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="licenseExpiry"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !form.watch("licenseExpiry") && "text-muted-foreground",
                        form.formState.errors.licenseExpiry && "border-destructive"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.watch("licenseExpiry") ? (
                        format(form.watch("licenseExpiry")!, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.watch("licenseExpiry") || undefined}
                      onSelect={(date) => {
                        form.setValue("licenseExpiry", date || null, {
                          shouldValidate: true,
                        });
                      }}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormError error={form.formState.errors.licenseExpiry} />
              </div>

              <div className="md:col-span-2">
                <Label>License Document</Label>
                <FileUploader
                  documentType="license"
                  folder="licenses"
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxSize={10 * 1024 * 1024} // 10MB
                  maxFiles={1}
                  multiple={false}
                  files={uploadedFiles}
                  onFilesChange={setUploadedFiles}
                  label="Upload License Document"
                  description="Upload a copy of your professional license document (PDF, JPG, PNG)"
                  showPreview={true}
                  variant="healthcare"
                />
                {caseManager.licenseDocumentUrl && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Current document: {caseManager.licenseFileName || "License document"}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organization Details */}
        {caseManager.organization && (
          <Card variant="healthcare">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organization Details
              </CardTitle>
              <CardDescription>
                Your organization information (read-only)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Organization Name</Label>
                  <Input
                    value={caseManager.organization.name}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div>
                  <Label>Organization Type</Label>
                  <Input
                    value={caseManager.organization.type}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Organization Email</Label>
                  <Input
                    value={caseManager.organization.email}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div>
                  <Label>Organization Phone</Label>
                  <Input
                    value={caseManager.organization.phone}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              {caseManager.organization.city && (
                <div>
                  <Label>Location</Label>
                  <Input
                    value={`${caseManager.organization.city}, ${caseManager.organization.state}`}
                    disabled
                    className="bg-muted"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Account Status */}
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Account Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {caseManager.isActive ? "Active" : "Inactive"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {caseManager.isActive
                    ? "Your account is active and you can manage referrals"
                    : "Your account is inactive. Contact support for assistance."}
                </p>
                {caseManager.createdAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Member since:{" "}
                    {format(new Date(caseManager.createdAt), "MMMM dd, yyyy")}
                  </p>
                )}
              </div>
              <Badge
                variant={
                  caseManager.isActive ? "healthcareSuccess" : "healthcareWarning"
                }
              >
                {caseManager.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Manage how you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Notifications */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  checked={notificationPrefs.emailNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationPrefs((prev) => ({
                      ...prev,
                      emailNotifications: checked,
                      // Disable individual email settings if master is off
                      emailNewReferrals: checked ? prev.emailNewReferrals : false,
                      emailProviderResponses: checked ? prev.emailProviderResponses : false,
                      emailPlacementUpdates: checked ? prev.emailPlacementUpdates : false,
                      emailUrgentCases: checked ? prev.emailUrgentCases : false,
                    }))
                  }
                />
              </div>
              {notificationPrefs.emailNotifications && (
                <div className="ml-6 space-y-3 border-l-2 border-border pl-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="emailNewReferrals" className="font-normal">
                      New Referrals
                    </Label>
                    <Switch
                      id="emailNewReferrals"
                      checked={notificationPrefs.emailNewReferrals}
                      onCheckedChange={(checked) =>
                        setNotificationPrefs((prev) => ({
                          ...prev,
                          emailNewReferrals: checked,
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="emailProviderResponses" className="font-normal">
                      Provider Responses
                    </Label>
                    <Switch
                      id="emailProviderResponses"
                      checked={notificationPrefs.emailProviderResponses}
                      onCheckedChange={(checked) =>
                        setNotificationPrefs((prev) => ({
                          ...prev,
                          emailProviderResponses: checked,
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="emailPlacementUpdates" className="font-normal">
                      Placement Updates
                    </Label>
                    <Switch
                      id="emailPlacementUpdates"
                      checked={notificationPrefs.emailPlacementUpdates}
                      onCheckedChange={(checked) =>
                        setNotificationPrefs((prev) => ({
                          ...prev,
                          emailPlacementUpdates: checked,
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="emailUrgentCases" className="font-normal">
                      Urgent Cases
                    </Label>
                    <Switch
                      id="emailUrgentCases"
                      checked={notificationPrefs.emailUrgentCases}
                      onCheckedChange={(checked) =>
                        setNotificationPrefs((prev) => ({
                          ...prev,
                          emailUrgentCases: checked,
                        }))
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* In-App Notifications */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">In-App Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications in the application
                  </p>
                </div>
                <Switch
                  checked={notificationPrefs.inAppNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationPrefs((prev) => ({
                      ...prev,
                      inAppNotifications: checked,
                      // Disable individual in-app settings if master is off
                      inAppNewReferrals: checked ? prev.inAppNewReferrals : false,
                      inAppProviderResponses: checked ? prev.inAppProviderResponses : false,
                      inAppPlacementUpdates: checked ? prev.inAppPlacementUpdates : false,
                      inAppUrgentCases: checked ? prev.inAppUrgentCases : false,
                    }))
                  }
                />
              </div>
              {notificationPrefs.inAppNotifications && (
                <div className="ml-6 space-y-3 border-l-2 border-border pl-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="inAppNewReferrals" className="font-normal">
                      New Referrals
                    </Label>
                    <Switch
                      id="inAppNewReferrals"
                      checked={notificationPrefs.inAppNewReferrals}
                      onCheckedChange={(checked) =>
                        setNotificationPrefs((prev) => ({
                          ...prev,
                          inAppNewReferrals: checked,
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="inAppProviderResponses" className="font-normal">
                      Provider Responses
                    </Label>
                    <Switch
                      id="inAppProviderResponses"
                      checked={notificationPrefs.inAppProviderResponses}
                      onCheckedChange={(checked) =>
                        setNotificationPrefs((prev) => ({
                          ...prev,
                          inAppProviderResponses: checked,
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="inAppPlacementUpdates" className="font-normal">
                      Placement Updates
                    </Label>
                    <Switch
                      id="inAppPlacementUpdates"
                      checked={notificationPrefs.inAppPlacementUpdates}
                      onCheckedChange={(checked) =>
                        setNotificationPrefs((prev) => ({
                          ...prev,
                          inAppPlacementUpdates: checked,
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="inAppUrgentCases" className="font-normal">
                      Urgent Cases
                    </Label>
                    <Switch
                      id="inAppUrgentCases"
                      checked={notificationPrefs.inAppUrgentCases}
                      onCheckedChange={(checked) =>
                        setNotificationPrefs((prev) => ({
                          ...prev,
                          inAppUrgentCases: checked,
                        }))
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Default Referral Settings */}
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Default Referral Settings
            </CardTitle>
            <CardDescription>
              Set default preferences that will be pre-filled when creating new referrals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Default Urgency */}
              <div>
                <Label htmlFor="defaultUrgency">Default Urgency</Label>
                <Select
                  value={defaultReferralSettings.defaultUrgency}
                  onValueChange={(value) =>
                    setDefaultReferralSettings((prev) => ({
                      ...prev,
                      defaultUrgency: value as Urgency,
                    }))
                  }
                >
                  <SelectTrigger id="defaultUrgency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(URGENCY_CONFIG).map(([value, config]) => (
                      <SelectItem key={value} value={value}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Default Primary Payer */}
              <div>
                <Label htmlFor="defaultPrimaryPayer">Default Primary Payer</Label>
                <Select
                  value={defaultReferralSettings.defaultPrimaryPayer || ""}
                  onValueChange={(value) =>
                    setDefaultReferralSettings((prev) => ({
                      ...prev,
                      defaultPrimaryPayer: value ? (value as Payer) : undefined,
                    }))
                  }
                >
                  <SelectTrigger id="defaultPrimaryPayer">
                    <SelectValue placeholder="Select default payer (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None (No default)</SelectItem>
                    {PAYER_OPTIONS.map((payer) => (
                      <SelectItem key={payer.value} value={payer.value}>
                        {payer.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Default Preferred Counties */}
            <div>
              <Label>Default Preferred Counties</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Select counties that will be pre-selected when creating new referrals
              </p>
              <div className="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-2">
                {MINNESOTA_COUNTIES.map((county) => (
                  <div key={county} className="flex items-center space-x-2">
                    <Checkbox
                      id={`county-${county}`}
                      checked={defaultReferralSettings.defaultPreferredCounties.includes(county)}
                      onCheckedChange={(checked) => {
                        setDefaultReferralSettings((prev) => ({
                          ...prev,
                          defaultPreferredCounties: checked
                            ? [...prev.defaultPreferredCounties, county]
                            : prev.defaultPreferredCounties.filter((c) => c !== county),
                        }));
                      }}
                    />
                    <Label
                      htmlFor={`county-${county}`}
                      className="font-normal cursor-pointer"
                    >
                      {county}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Default Care Levels */}
            <div>
              <Label>Default Care Levels</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Select care levels that will be pre-selected when creating new referrals
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {CARE_LEVELS.map((level) => (
                  <div key={level.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`careLevel-${level.value}`}
                      checked={defaultReferralSettings.defaultCareLevels.includes(level.value)}
                      onCheckedChange={(checked) => {
                        setDefaultReferralSettings((prev) => ({
                          ...prev,
                          defaultCareLevels: checked
                            ? [...prev.defaultCareLevels, level.value]
                            : prev.defaultCareLevels.filter((l) => l !== level.value),
                        }));
                      }}
                    />
                    <Label
                      htmlFor={`careLevel-${level.value}`}
                      className="font-normal cursor-pointer"
                    >
                      {level.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Default Services Needed */}
            <div>
              <Label>Default Services Needed</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Select services that will be pre-selected when creating new referrals
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {SUPPORTED_NEEDS.map((service) => (
                  <div key={service.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`service-${service.value}`}
                      checked={defaultReferralSettings.defaultServicesNeeded.includes(service.value)}
                      onCheckedChange={(checked) => {
                        setDefaultReferralSettings((prev) => ({
                          ...prev,
                          defaultServicesNeeded: checked
                            ? [...prev.defaultServicesNeeded, service.value]
                            : prev.defaultServicesNeeded.filter((s) => s !== service.value),
                        }));
                      }}
                    />
                    <Label
                      htmlFor={`service-${service.value}`}
                      className="font-normal cursor-pointer"
                    >
                      {service.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Default Max Distance */}
            <div>
              <Label htmlFor="defaultMaxDistance">Default Max Distance (miles)</Label>
              <Input
                id="defaultMaxDistance"
                type="number"
                min="0"
                max="500"
                placeholder="Optional"
                value={defaultReferralSettings.defaultMaxDistance || ""}
                onChange={(e) =>
                  setDefaultReferralSettings((prev) => ({
                    ...prev,
                    defaultMaxDistance: e.target.value
                      ? parseInt(e.target.value, 10)
                      : undefined,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Maximum distance in miles from preferred location
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-2">
          <Button
            type="submit"
            variant="healthcare"
            disabled={isSaving}
            className="min-w-[120px]"
          >
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
    </div>
  );
}

export default function CaseManagerSettingsPage() {
  return (
    <RequirePermission
      permission={CASE_MANAGER_CAPABILITIES.PROFILE_MANAGE}
      title="Access Restricted"
      description="You don't have permission to manage settings."
    >
      <CaseManagerSettingsPageContent />
    </RequirePermission>
  );
}

