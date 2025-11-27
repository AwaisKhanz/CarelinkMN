"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Save,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { providerService } from "@/lib/api";
import type { Provider } from "@/lib/api";
import { useProviderId, useProviderData } from "@/hooks/use-provider-data";
import { useProviderHomes } from "@/hooks/use-provider-homes";
import { FileUploader, UploadedFile } from "@/components/ui/file-uploader";
import { Progress } from "@/components/ui/progress";
import { LicenseStatus } from "@carelink/types";

type ProviderProfileUpdateInput = Parameters<
  typeof providerService.updateProviderProfile
>[1];

const profileSchema = z.object({
  description: z
    .string()
    .max(2000, "Description must be less than 2000 characters")
    .optional(),
  acceptsReferrals: z.boolean().default(true),
  responseTimeHours: z.number().int().min(1).max(168).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileTab() {
  const [provider, setProvider] = useState<Provider | null>(null);
  const providerId = useProviderId();
  const [isLoading, setIsLoading] = useState(true);
  const [licenses, setLicenses] = useState<any[]>([]);
  const { homes } = useProviderHomes();
  const [isSaving, setIsSaving] = useState(false);
  const [logoFiles, setLogoFiles] = useState<UploadedFile[]>([]);
  const [coverImageFiles, setCoverImageFiles] = useState<UploadedFile[]>([]);
  const [profileImageFiles, setProfileImageFiles] = useState<UploadedFile[]>([]);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      description: "",
      acceptsReferrals: true,
      responseTimeHours: undefined,
    },
  });

  // Get provider from context
  const { provider: contextProvider, refetch: refetchProvider } =
    useProviderData();

  // Fetch licenses for completeness check
  useEffect(() => {
    if (providerId) {
      providerService
        .getProviderLicenses(providerId)
        .then((response) => {
          if (response.success && response.data) {
            setLicenses(response.data);
          }
        })
        .catch((err) => {
          console.error("Error fetching licenses:", err);
        });
    }
  }, [providerId]);

  // Get provider data from context
  useEffect(() => {
    if (contextProvider) {
      setProvider(contextProvider);

      // Set form values
      form.reset({
        description: contextProvider.description || "",
        acceptsReferrals: contextProvider.acceptsReferrals ?? true,
        responseTimeHours: contextProvider.responseTimeHours || undefined,
      });

      // Set logo and cover image if they exist
      if (contextProvider.logo) {
        // Determine mimeType from URL if possible
        const logoUrl = contextProvider.logo.toLowerCase();
        let logoMimeType = "image/jpeg"; // default
        if (logoUrl.includes(".png")) logoMimeType = "image/png";
        else if (logoUrl.includes(".gif")) logoMimeType = "image/gif";
        else if (logoUrl.includes(".webp")) logoMimeType = "image/webp";
        else if (logoUrl.includes(".svg")) logoMimeType = "image/svg+xml";

        setLogoFiles([
          {
            url: contextProvider.logo,
            fileName: "logo",
            isPrimary: true,
            mimeType: logoMimeType,
          },
        ]);
      }
      if (contextProvider.coverImage) {
        // Determine mimeType from URL if possible
        const coverUrl = contextProvider.coverImage.toLowerCase();
        let coverMimeType = "image/jpeg"; // default
        if (coverUrl.includes(".png")) coverMimeType = "image/png";
        else if (coverUrl.includes(".gif")) coverMimeType = "image/gif";
        else if (coverUrl.includes(".webp")) coverMimeType = "image/webp";
        else if (coverUrl.includes(".svg")) coverMimeType = "image/svg+xml";

        setCoverImageFiles([
          {
            url: contextProvider.coverImage,
            fileName: "cover-image",
            isPrimary: true,
            mimeType: coverMimeType,
          },
        ]);
      }
      setIsLoading(false);
    }
  }, [contextProvider, form]);

  // Load user profile image
  useEffect(() => {
    const loadUserProfileImage = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          if (data.user?.profileImage) {
            const imageUrl = data.user.profileImage.toLowerCase();
            let imageMimeType = "image/jpeg";
            if (imageUrl.includes(".png")) imageMimeType = "image/png";
            else if (imageUrl.includes(".gif")) imageMimeType = "image/gif";
            else if (imageUrl.includes(".webp")) imageMimeType = "image/webp";

            setProfileImageFiles([{
              url: data.user.profileImage,
              fileName: "profile-image",
              isPrimary: true,
              mimeType: imageMimeType,
            }]);
          }
        }
      } catch (error) {
        console.error("Error loading profile image:", error);
      }
    };
    loadUserProfileImage();
  }, []);

  const handleSubmit = async (data: ProfileFormData) => {
    if (!providerId) return;

    setIsSaving(true);

    try {
      const updateData: ProviderProfileUpdateInput = {
        description: data.description || undefined,
        acceptsReferrals: data.acceptsReferrals,
        responseTimeHours: data.responseTimeHours || undefined,
      };

      // Add logo URL if uploaded
      if (logoFiles.length > 0 && logoFiles[0].url) {
        updateData.logo = logoFiles[0].url;
      }

      // Add cover image URL if uploaded
      if (coverImageFiles.length > 0 && coverImageFiles[0].url) {
        updateData.coverImage = coverImageFiles[0].url;
      }

      await providerService.updateProviderProfile(providerId, updateData);
      
      // Update user profile image if uploaded
      if (profileImageFiles.length > 0 && profileImageFiles[0].url) {
        try {
          await fetch('/api/users/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profileImage: profileImageFiles[0].url }),
          });
        } catch (profileErr) {
          console.error("Error updating profile image:", profileErr);
          // Don't fail the whole save if profile image update fails
        }
      }
      
      toast.success("Profile updated successfully!");

      // Refresh provider data from context after update
      await refetchProvider();
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update profile"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <Card variant="healthcare">
        <CardContent className="pt-6">
          <p className="text-destructive text-center">
            Provider profile not found
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate profile completeness
  const calculateCompleteness = () => {
    const checks = {
      description: !!provider.description && provider.description.trim().length > 0,
      logo: !!provider.logo,
      coverImage: !!provider.coverImage,
      activeLicense: licenses.some((l) => l.status === LicenseStatus.ACTIVE),
      hasHomes: homes.length > 0,
      responseTime: !!provider.responseTimeHours,
    };

    const totalChecks = Object.keys(checks).length;
    const completedChecks = Object.values(checks).filter(Boolean).length;
    const percentage = Math.round((completedChecks / totalChecks) * 100);

    return { checks, percentage, completedChecks, totalChecks };
  };

  const completeness = calculateCompleteness();

  return (
    <div className="space-y-6">
      {/* Profile Completeness Indicator */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Profile Completeness
          </CardTitle>
          <CardDescription>
            Complete your profile to improve visibility and trust
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {completeness.percentage}% Complete
              </span>
              <span className="text-muted-foreground">
                {completeness.completedChecks} of {completeness.totalChecks} items
              </span>
            </div>
            <Progress value={completeness.percentage} className="h-2" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="flex items-center gap-2 text-sm">
              {completeness.checks.description ? (
                <CheckCircle className="h-4 w-4 text-success" />
              ) : (
                <Clock className="h-4 w-4 text-muted-foreground" />
              )}
              <span
                className={
                  completeness.checks.description
                    ? "text-foreground"
                    : "text-muted-foreground"
                }
              >
                Description
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {completeness.checks.logo ? (
                <CheckCircle className="h-4 w-4 text-success" />
              ) : (
                <Clock className="h-4 w-4 text-muted-foreground" />
              )}
              <span
                className={
                  completeness.checks.logo
                    ? "text-foreground"
                    : "text-muted-foreground"
                }
              >
                Logo
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {completeness.checks.coverImage ? (
                <CheckCircle className="h-4 w-4 text-success" />
              ) : (
                <Clock className="h-4 w-4 text-muted-foreground" />
              )}
              <span
                className={
                  completeness.checks.coverImage
                    ? "text-foreground"
                    : "text-muted-foreground"
                }
              >
                Cover Image
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {completeness.checks.activeLicense ? (
                <CheckCircle className="h-4 w-4 text-success" />
              ) : (
                <AlertCircle className="h-4 w-4 text-warning" />
              )}
              <span
                className={
                  completeness.checks.activeLicense
                    ? "text-foreground"
                    : "text-muted-foreground"
                }
              >
                Active License
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {completeness.checks.hasHomes ? (
                <CheckCircle className="h-4 w-4 text-success" />
              ) : (
                <AlertCircle className="h-4 w-4 text-warning" />
              )}
              <span
                className={
                  completeness.checks.hasHomes
                    ? "text-foreground"
                    : "text-muted-foreground"
                }
              >
                Care Homes
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {completeness.checks.responseTime ? (
                <CheckCircle className="h-4 w-4 text-success" />
              ) : (
                <Clock className="h-4 w-4 text-muted-foreground" />
              )}
              <span
                className={
                  completeness.checks.responseTime
                    ? "text-foreground"
                    : "text-muted-foreground"
                }
              >
                Response Time
              </span>
            </div>
          </div>
          {completeness.percentage < 100 && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Complete all items to maximize your profile visibility and
                improve trust with case managers.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Verification Status */}
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Verification Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {provider.verified ? "Verified" : "Pending Verification"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {provider.verified
                    ? "Your provider profile has been verified"
                    : "Your profile is pending admin review"}
                </p>
                {provider.verifiedAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Verified on:{" "}
                    {new Date(provider.verifiedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <Badge
                variant={
                  provider.verified ? "healthcareSuccess" : "healthcareWarning"
                }
              >
                {provider.verified ? "Verified" : "Pending"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your personal and provider profile details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Picture */}
            <div className="space-y-2">
              <Label>Profile Picture</Label>
              <FileUploader
                documentType="image"
                folder="users/profile-images"
                accept="image/*"
                maxSize={5 * 1024 * 1024} // 5MB
                maxFiles={1}
                multiple={false}
                files={profileImageFiles}
                onFilesChange={setProfileImageFiles}
                label="Upload Profile Picture"
                description="Upload your personal profile picture (JPG, PNG, max 5MB)"
                showPreview={true}
                previewSize="md"
                variant="healthcare"
              />
              <p className="text-xs text-muted-foreground">
                This image will be displayed in the sidebar and messages
              </p>
            </div>

            <Separator />

            {/* Logo */}
            <div className="space-y-2">
              <Label>Organization Logo</Label>
              <FileUploader
                documentType="image"
                folder="providers/logos"
                accept="image/*"
                maxSize={5 * 1024 * 1024} // 5MB
                maxFiles={1}
                multiple={false}
                files={logoFiles}
                onFilesChange={setLogoFiles}
                label="Upload Logo"
                description="Upload your organization logo (JPG, PNG, max 5MB)"
                showPreview={true}
                previewSize="md"
                variant="healthcare"
              />
            </div>

            {/* Cover Image */}
            <div className="space-y-2">
              <Label>Cover Image</Label>
              <FileUploader
                documentType="image"
                folder="providers/cover-images"
                accept="image/*"
                maxSize={10 * 1024 * 1024} // 10MB
                maxFiles={1}
                multiple={false}
                files={coverImageFiles}
                onFilesChange={setCoverImageFiles}
                label="Upload Cover Image"
                description="Upload a cover image for your provider profile (JPG, PNG, max 10MB)"
                showPreview={true}
                previewSize="lg"
                variant="healthcare"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="Describe your organization and services..."
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {form.watch("description")?.length || 0} / 2000 characters
              </p>
              {form.formState.errors.description && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Manage your provider preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Accept Referrals */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="acceptsReferrals">Accept Referrals</Label>
                <p className="text-sm text-muted-foreground">
                  Allow case managers and hospital staff to send you referrals
                </p>
              </div>
              <Switch
                id="acceptsReferrals"
                checked={form.watch("acceptsReferrals")}
                onCheckedChange={(checked) =>
                  form.setValue("acceptsReferrals", checked)
                }
              />
            </div>

            <Separator />

            {/* Response Time */}
            <div className="space-y-2">
              <Label htmlFor="responseTimeHours">
                Average Response Time (Hours)
              </Label>
              <Input
                id="responseTimeHours"
                type="number"
                min={1}
                max={168}
                {...form.register("responseTimeHours", {
                  valueAsNumber: true,
                })}
                placeholder="e.g., 24"
              />
              <p className="text-xs text-muted-foreground">
                How many hours on average do you respond to referrals? (1-168
                hours)
              </p>
              {form.formState.errors.responseTimeHours && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.responseTimeHours.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving} className="min-w-32">
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
