"use client";

import { useState, useEffect, useMemo } from "react";
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
  Building2,
  CheckCircle,
  Clock,
  AlertCircle,
  Image as ImageIcon,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { providerService } from "@/lib/api";
import type { Provider } from "@/lib/api";
type ProviderProfileUpdateInput = Parameters<
  typeof providerService.updateProviderProfile
>[1];
import { useAuth } from "@/contexts/auth-context";
import { usePageMetadata } from "../use-page-metadata";
import { useProviderId, useProviderData } from "@/hooks/use-provider-data";
import { FileUploader, UploadedFile } from "@/components/ui/file-uploader";
import { cn } from "@/lib/utils";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";
import { billingService } from "@/lib/services/billing.service";
import { useSubscriptionContext } from "@/contexts/subscription-context";
import {
  getSubscriptionStatusInfo,
  isSubscriptionInWarningState,
} from "@/lib/utils/subscription";
import { format } from "date-fns";
import { usePermissions } from "@/hooks/use-permissions";
import { useRouter } from "next/navigation";

const profileSchema = z.object({
  description: z
    .string()
    .max(2000, "Description must be less than 2000 characters")
    .optional(),
  acceptsReferrals: z.boolean().default(true),
  responseTimeHours: z.number().int().min(1).max(168).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProviderSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const { canManageSettings, canManageSubscription } = usePermissions();
  const { subscription, refetch } = useSubscriptionContext(); // Use context instead

  // Redirect if user doesn't have permission to access settings
  useEffect(() => {
    if (user && !canManageSettings) {
      toast.error(
        "You don't have permission to access settings. Only provider owners can manage settings."
      );
      router.push("/provider/dashboard");
    }
  }, [user, canManageSettings, router]);

  const [provider, setProvider] = useState<Provider | null>(null);
  const providerId = useProviderId();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [logoFiles, setLogoFiles] = useState<UploadedFile[]>([]);
  const [coverImageFiles, setCoverImageFiles] = useState<UploadedFile[]>([]);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isDowngrading, setIsDowngrading] = useState(false);
  const [isCancellingDowngrade, setIsCancellingDowngrade] = useState(false);
  const [isManagingBilling, setIsManagingBilling] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      description: "",
      acceptsReferrals: true,
      responseTimeHours: undefined,
    },
  });

  useEffect(() => {
    setTitle("Provider Settings");
    setDescription("Manage your provider profile and settings");
  }, [setTitle, setDescription]);

  // Get provider from context
  const { provider: contextProvider, refetch: refetchProvider } = useProviderData();
  
  // Refresh subscription data
  const refreshSubscriptionData = async () => {
    try {
      // Refresh provider data from context
      await refetchProvider();
      
      // Refresh subscription from context
      await refetch();
    } catch (err) {
      console.error("Error refreshing subscription data:", err);
    }
  };

  const handleDowngrade = async () => {
    setIsDowngrading(true);
    try {
      const result = await billingService.scheduleDowngrade();
      const effectiveDate =
        result?.cancelAt || result?.currentPeriodEnd || null;
      toast.success(
        effectiveDate
          ? `Your subscription will end on ${format(
              new Date(effectiveDate),
              "MMM dd, yyyy"
            )}. You'll move to the Free plan after that date.`
          : "Your subscription will end at the end of the current billing period. You'll move to the Free plan afterwards."
      );
      await refreshSubscriptionData();
    } catch (err) {
      console.error("Error scheduling downgrade:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to schedule downgrade"
      );
    } finally {
      setIsDowngrading(false);
    }
  };

  const handleCancelDowngrade = async () => {
    setIsCancellingDowngrade(true);
    try {
      await billingService.cancelScheduledDowngrade();
      toast.success("Scheduled downgrade cancelled. Your plan remains active.");
      await refreshSubscriptionData();
    } catch (err) {
      console.error("Error cancelling downgrade:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to cancel downgrade"
      );
    } finally {
      setIsCancellingDowngrade(false);
    }
  };

  // Handle upgrade success/cancel from Stripe redirect
  useEffect(() => {
    const handleStripeRedirect = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const upgrade = searchParams.get("upgrade");

      if (upgrade === "success") {
        toast.success(
          "🎉 Subscription updated successfully! Your changes are now active."
        );
        // Wait a moment for webhooks to process
        await new Promise((resolve) => setTimeout(resolve, 1000));
        // Refresh subscription data to get latest status
        await refreshSubscriptionData();
        // Clean up URL
        window.history.replaceState({}, "", "/provider/settings");
      } else if (upgrade === "cancel") {
        toast.error(
          "Subscription update was cancelled. You can try again anytime."
        );
        // Clean up URL
        window.history.replaceState({}, "", "/provider/settings");
      }
    };

    handleStripeRedirect();
  }, [user?.id, refetch]);

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

  const handleUpgrade = async (tier: "PRO" | "PREMIUM") => {
    setIsUpgrading(true);
    try {
      const url = await billingService.createCheckoutSession(tier);

      // If URL contains our domain, it's a direct redirect (subscription was updated)
      if (url.includes(window.location.origin)) {
        toast.success("🎉 Subscription updated successfully!");
        // Wait for webhook to process
        await new Promise((resolve) => setTimeout(resolve, 1500));
        // Refresh data
        await refreshSubscriptionData();
        setIsUpgrading(false);
      } else {
        // It's a Stripe checkout URL
        window.location.href = url;
      }
    } catch (err) {
      console.error("Error creating checkout session:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update subscription"
      );
      setIsUpgrading(false);
    }
  };

  const handleManageBilling = async () => {
    setIsManagingBilling(true);
    try {
      const url = await billingService.createPortalSession();
      window.location.href = url;
    } catch (err) {
      console.error("Error creating portal session:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to open billing portal"
      );
      setIsManagingBilling(false);
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Provider Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your provider profile and preferences
          </p>
        </div>
      </div>

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

        {/* Subscription Management - Only for owners */}
        {canManageSubscription && (
          <Card variant="healthcare">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Subscription Management
              </CardTitle>
              <CardDescription>
                Manage your subscription plan and billing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Plan */}
              <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-lg capitalize">
                      {provider.subscriptionTier || "FREE"} Plan
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Current subscription tier
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="healthcarePrimary"
                      className="capitalize text-sm px-3 py-1"
                    >
                      {provider.subscriptionTier || "FREE"}
                    </Badge>
                    {subscription && (
                      <Badge
                        variant={
                          subscription.status === "ACTIVE"
                            ? "healthcareSuccess"
                            : subscription.status === "CANCELLED"
                              ? "healthcareWarning"
                              : "destructive"
                        }
                        className="text-sm px-3 py-1"
                      >
                        {subscription.status}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Subscription Details */}
                {subscription && (
                  <div className="pt-3 border-t border-border space-y-2">
                    {subscription.status === "CANCELLED" &&
                      subscription.canceledAt && (
                        <div className="flex items-center gap-2 text-sm">
                          <AlertCircle className="h-4 w-4 text-destructive" />
                          <span className="text-muted-foreground">
                            Cancelled on{" "}
                            <span className="font-medium text-foreground">
                              {format(
                                new Date(subscription.canceledAt),
                                "MMM dd, yyyy"
                              )}
                            </span>
                          </span>
                        </div>
                      )}
                    {subscription.status === "CANCELLED" &&
                      subscription.currentPeriodEnd && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Access until{" "}
                            <span className="font-medium text-foreground">
                              {format(
                                new Date(subscription.currentPeriodEnd),
                                "MMM dd, yyyy"
                              )}
                            </span>
                          </span>
                        </div>
                      )}
                    {subscription.status === "ACTIVE" &&
                      subscription.cancelAt && (
                        <div className="flex flex-col gap-3 text-sm rounded-md bg-warning/10 border border-warning/30 px-3 py-3">
                          <div className="flex items-start gap-2">
                            <Clock className="h-4 w-4 text-warning mt-0.5" />
                            <span className="text-muted-foreground">
                              <span className="font-medium text-foreground">
                                Scheduled to end on{" "}
                                {format(
                                  new Date(subscription.cancelAt),
                                  "MMM dd, yyyy"
                                )}
                              </span>
                              . You’ll continue to have{" "}
                              {provider.subscriptionTier?.toLowerCase() ??
                                "paid"}{" "}
                              features until this date, then automatically move
                              to the Free plan.
                            </span>
                          </div>
                          <div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCancelDowngrade}
                              disabled={isCancellingDowngrade}
                            >
                              {isCancellingDowngrade ? (
                                <>
                                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                  Cancelling...
                                </>
                              ) : (
                                "Cancel Downgrade"
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    {subscription.status === "ACTIVE" &&
                      !subscription.cancelAt &&
                      subscription.currentPeriodEnd && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span className="text-muted-foreground">
                            Renews on{" "}
                            <span className="font-medium text-foreground">
                              {format(
                                new Date(subscription.currentPeriodEnd),
                                "MMM dd, yyyy"
                              )}
                            </span>
                          </span>
                        </div>
                      )}
                    {subscription.status === "ACTIVE" &&
                      provider.subscriptionTier !== "FREE" &&
                      !subscription.cancelAt && (
                        <div className="pt-3 flex flex-wrap gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDowngrade}
                            disabled={isDowngrading}
                          >
                            {isDowngrading ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              "Cancel Subscription"
                            )}
                          </Button>
                        </div>
                      )}
                  </div>
                )}
              </div>

              {/* Renew Cancelled Subscription */}
              {subscription?.status === "CANCELLED" && (
                <>
                  <Separator />
                  <div className="p-4 rounded-lg border-2 border-destructive bg-destructive/5">
                    <div className="flex items-start gap-3 mb-4">
                      <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-base mb-1">
                          Your subscription has been cancelled
                        </p>
                        <p className="text-sm text-muted-foreground">
                          You'll have access to {provider.subscriptionTier}{" "}
                          features until{" "}
                          {format(
                            new Date(subscription.currentPeriodEnd),
                            "MMMM dd, yyyy"
                          )}
                          . Renew now to continue enjoying premium features.
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() =>
                        handleUpgrade(
                          provider.subscriptionTier as "PRO" | "PREMIUM"
                        )
                      }
                      disabled={isUpgrading}
                      className="w-full"
                    >
                      {isUpgrading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>Renew {provider.subscriptionTier} Plan</>
                      )}
                    </Button>
                  </div>
                </>
              )}

              {/* Available Plans */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">
                  {subscription?.status === "CANCELLED"
                    ? "Other Plans"
                    : provider.subscriptionTier === "FREE"
                      ? "Available Plans"
                      : "Upgrade or Change Plan"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {SUBSCRIPTION_PLANS.filter(
                    (plan) =>
                      plan.id === "PRO" ||
                      plan.id === "PREMIUM" ||
                      plan.id === "FREE"
                  ).map((plan) => {
                    const isFreePlan = plan.id === "FREE";
                    const currentTier = provider.subscriptionTier || "FREE";
                    const isCurrentPlan = plan.id === currentTier;
                    const downgradeScheduled = !!subscription?.cancelAt;
                    const canDowngrade =
                      isFreePlan &&
                      provider.subscriptionTier &&
                      provider.subscriptionTier !== "FREE" &&
                      subscription?.status === "ACTIVE" &&
                      !downgradeScheduled;

                    const buttonDisabled = isFreePlan
                      ? downgradeScheduled
                        ? isCancellingDowngrade
                        : !canDowngrade || isDowngrading
                      : isUpgrading || isCurrentPlan;

                    return (
                      <div
                        key={plan.id}
                        className={cn(
                          "p-4 rounded-lg border-2 transition-all",
                          isCurrentPlan && !isFreePlan
                            ? "border-success bg-success/5"
                            : plan.recommended && !isFreePlan
                              ? "border-primary bg-primary/5"
                              : isFreePlan && downgradeScheduled
                                ? "border-warning bg-warning/10"
                                : "border-border bg-background",
                          isCurrentPlan && !isFreePlan && "opacity-75"
                        )}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h5 className="font-semibold text-base">
                              {plan.name}
                            </h5>
                            <p className="text-sm text-muted-foreground">
                              {plan.description}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1">
                            {isCurrentPlan && (
                              <Badge
                                variant="healthcareSuccess"
                                className="text-xs"
                              >
                                Current Plan
                              </Badge>
                            )}
                            {!isCurrentPlan && plan.recommended && (
                              <Badge
                                variant="healthcarePrimary"
                                className="text-xs"
                              >
                                Popular
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-2xl font-bold mb-4">
                          {plan.price}
                          <span className="text-sm font-normal text-muted-foreground ml-1">
                            {plan.period}
                          </span>
                        </p>
                        <ul className="space-y-2 mb-4">
                          {plan.features.slice(0, 4).map((feature, idx) => (
                            <li
                              key={idx}
                              className="text-xs flex items-start gap-2"
                            >
                              <CheckCircle className="h-3 w-3 text-success mt-0.5 shrink-0" />
                              <span className="text-muted-foreground">
                                {feature}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <Button
                          onClick={() => {
                            if (isFreePlan) {
                              if (downgradeScheduled) {
                                handleCancelDowngrade();
                              } else {
                                handleDowngrade();
                              }
                            } else {
                              handleUpgrade(plan.id as "PRO" | "PREMIUM");
                            }
                          }}
                          disabled={buttonDisabled}
                          size="sm"
                          className="w-full"
                          variant={
                            isCurrentPlan && !isFreePlan
                              ? "outline"
                              : plan.recommended && !isFreePlan
                                ? "default"
                                : "outline"
                          }
                        >
                          {isFreePlan ? (
                            provider.subscriptionTier === "FREE" ? (
                              "Current Plan"
                            ) : downgradeScheduled ? (
                              isCancellingDowngrade ? (
                                <>
                                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                  Cancelling...
                                </>
                              ) : (
                                "Cancel Downgrade"
                              )
                            ) : isDowngrading ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                Scheduling...
                              </>
                            ) : (
                              "Schedule Downgrade"
                            )
                          ) : isCurrentPlan ? (
                            "Current Plan"
                          ) : isUpgrading ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : subscription?.status === "CANCELLED" ? (
                            `Renew ${plan.name}`
                          ) : (
                            `Change to ${plan.name}`
                          )}
                        </Button>
                        {isFreePlan &&
                          downgradeScheduled &&
                          subscription?.cancelAt && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Downgrade takes effect on{" "}
                              <span className="font-medium text-foreground">
                                {format(
                                  new Date(subscription.cancelAt),
                                  "MMM dd, yyyy"
                                )}
                              </span>
                              .
                            </p>
                          )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Manage Billing Button */}
              {(provider.subscriptionTier === "PRO" ||
                provider.subscriptionTier === "PREMIUM") && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Billing Portal</p>
                        <p className="text-sm text-muted-foreground">
                          {subscription?.status === "CANCELLED"
                            ? "View invoices and reactivate subscription"
                            : "Manage payment methods, view invoices, and cancel subscription"}
                        </p>
                      </div>
                      <Button
                        onClick={handleManageBilling}
                        disabled={isManagingBilling}
                        variant="outline"
                        size="sm"
                      >
                        {isManagingBilling ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Opening...
                          </>
                        ) : (
                          <>
                            {subscription?.status === "CANCELLED"
                              ? "Reactivate Subscription"
                              : "Manage Billing"}
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Cleanup Duplicates Button (for existing issues) */}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Profile Information */}
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your provider profile details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo */}
            <div className="space-y-2">
              <Label>Logo</Label>
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
