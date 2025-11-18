"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bed,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Home as HomeIcon,
  Settings,
  FileText,
  MessageSquare,
  ShieldCheck,
  Package,
  Loader2,
  ArrowRight,
  Calendar,
  Info,
} from "lucide-react";
import { usePageMetadata } from "../use-page-metadata";
import {
  providerService,
  placementService,
  openingService,
  Opening,
  Placement,
  ProviderReferralsResponse,
  OpeningStatus,
} from "@/lib/api";
import { StatsCard } from "@/components/ui/stats-card";
import { FeatureGate } from "@/components/subscription/feature-gate";
import { useSubscription } from "@/hooks/use-subscription";
import { PROVIDER_FEATURE_GATES } from "@/lib/constants";
import { formatDistanceToNow, format } from "date-fns";
import type { BadgeProps } from "@/components/ui/badge";
import { Referral, Urgency, ReferralStatus } from "@carelink/types";
import { SLABadge } from "@/components/ui/sla-badge";
import { useSubscriptionContext } from "@/contexts/subscription-context";
import { useProviderId, useProviderData } from "@/hooks/use-provider-data";
import { useProviderHomes } from "@/hooks/use-provider-homes";
import { useProviderAnalytics } from "@/hooks/use-provider-analytics";
import { MAX_OPENINGS_FETCH_LIMIT, RECENT_ITEMS_LIMIT } from "@carelink/utils";
import {
  isOpeningExpiringSoon,
  isOpeningExpired,
  calculateHoursUntilExpiry,
  getUrgencyBadgeConfig,
  getReferralStatusBadgeConfig,
} from "@/lib/utils/provider";
import {
  ProviderLoadingState,
  ProviderErrorState,
} from "@/components/provider";
import { RequirePermission } from "@/components/auth/require-permission";
import { PROVIDER_CAPABILITIES } from "@/lib/permissions/provider-capabilities";
import { usePermissions } from "@/hooks/use-permissions";

// Types
interface DashboardStats {
  totalHomes: number;
  activeHomes: number;
  totalOpenings: number;
  activeOpenings: number;
  totalPlacements: number;
  completedPlacements: number;
  pendingPlacements: number;
  totalResidents: number;
  availableSpots: number;
  pendingReferrals: number;
  urgentReferrals: number;
  averageResponseTime: number;
}

// Helper functions are now imported from shared utils

function ProviderDashboardContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const { tier } = useSubscription();
  const {
    subscription,
    statusInfo: subscriptionStatusInfo,
    isExpiringSoon,
    hasScheduledCancellation,
    isCancelled,
  } = useSubscriptionContext();
  const providerId = useProviderId(); // Use hook instead of fetching
  const { provider, organizationName } = useProviderData(); // Get provider from context
  const {
    canManageOpenings,
    canViewResidents,
    canViewReferrals,
    canManageMessages,
    canManageHomes,
    canManageServices,
    canManageLicenses,
    canViewAnalytics,
    canManageSettings,
    canManagePlacements,
  } = usePermissions();

  // Use hooks for data fetching with caching
  const {
    homes,
    isLoading: homesLoading,
    error: homesError,
  } = useProviderHomes();
  const {
    analytics,
    isLoading: analyticsLoading,
    error: analyticsError,
  } = useProviderAnalytics();

  // State for data not yet in hooks
  const [recentReferrals, setRecentReferrals] = useState<Referral[]>([]);
  const [recentPlacements, setRecentPlacements] = useState<Placement[]>([]);
  const [expiringOpenings, setExpiringOpenings] = useState<Opening[]>([]);
  const [staleOpenings, setStaleOpenings] = useState<Opening[]>([]);
  const [expiringLicenses, setExpiringLicenses] = useState<any[]>([]);
  const [isLoadingAdditional, setIsLoadingAdditional] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Combine errors from hooks and additional data fetching
  const combinedError = error || homesError || analyticsError;

  // Refs for cleanup and preventing race conditions
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  // Computed loading state
  const isLoading = homesLoading || analyticsLoading || isLoadingAdditional;

  // Constants
  const analyticsGate = PROVIDER_FEATURE_GATES.analytics;
  const placementsGate = PROVIDER_FEATURE_GATES.placements;

  // Set page metadata
  useEffect(() => {
    setTitle("Provider Dashboard");
    setDescription(`Welcome back, ${user?.firstName} ${user?.lastName}`);
  }, [setTitle, setDescription, user?.firstName, user?.lastName]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  // Subscription is now fetched in SubscriptionProvider - no need to fetch here

  // Fetch dashboard data
  useEffect(() => {
    if (!providerId || !mountedRef.current) {
      return;
    }

    // Create abort controller for this fetch
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const fetchDashboardData = async () => {
      if (!mountedRef.current || abortController.signal.aborted) return;

      try {
        setIsLoadingAdditional(true);
        setError(null);

        // Fetch additional data (referrals, openings, placements)
        // Homes and analytics are now fetched via hooks with caching
        const [referralsResponse, openingsResponse, placementsResponse] =
          await Promise.all([
            // Fetch recent referrals (always available)
            providerService
              .getProviderReferrals(providerId, {
                page: 1,
                limit: RECENT_ITEMS_LIMIT,
                status: "all",
              })
              .catch((error) => {
                console.error("Error fetching referrals:", error);
                return null;
              }),

            // Fetch openings (always available)
            openingService
              .getOpenings({
                providerId,
                status: OpeningStatus.OPEN,
                page: 1,
                limit: MAX_OPENINGS_FETCH_LIMIT,
                includeExpired: false,
              })
              .catch((error) => {
                console.error("Error fetching openings:", error);
                return null;
              }),

            // Fetch placements (only for PRO+)
            tier !== "FREE"
              ? placementService
                  .getPlacements({
                    providerId,
                    page: 1,
                    limit: RECENT_ITEMS_LIMIT,
                  })
                  .catch((error) => {
                    console.error("Error fetching placements:", error);
                    return null;
                  })
              : Promise.resolve(null),
          ]);

        if (!mountedRef.current || abortController.signal.aborted) return;

        // Process referrals
        if (referralsResponse?.success && referralsResponse.data) {
          const referrals =
            (referralsResponse.data as ProviderReferralsResponse).referrals ??
            [];
          setRecentReferrals(referrals);
        }

        // Process openings
        if (openingsResponse?.success && openingsResponse.data) {
          const openings = openingsResponse.data.openings || [];
          const expiring = openings.filter((opening) =>
            isOpeningExpiringSoon(opening.freshnessTimestamp)
          );
          const stale = openings.filter((opening) =>
            isOpeningExpired(opening.freshnessTimestamp)
          );
          setExpiringOpenings(expiring);
          setStaleOpenings(stale);
        }

        // Fetch expiring licenses if user can manage licenses
        if (canManageLicenses && providerId) {
          try {
            const licensesResponse = await providerService.getProviderLicenses(
              providerId
            );
            if (licensesResponse.success && licensesResponse.data) {
              const now = new Date();
              const thirtyDaysFromNow = new Date(
                now.getTime() + 30 * 24 * 60 * 60 * 1000
              );
              const expiring = licensesResponse.data.filter((license: any) => {
                if (license.status !== "ACTIVE") return false;
                const expirationDate = new Date(license.expirationDate);
                return (
                  expirationDate >= now && expirationDate <= thirtyDaysFromNow
                );
              });
              setExpiringLicenses(expiring);
            }
          } catch (err) {
            console.error("Error fetching licenses:", err);
            // Don't set error state for license fetch failures
          }
        }

        // Process placements (if PRO+)
        if (placementsResponse?.success && placementsResponse.data) {
          const placements = placementsResponse.data.placements || [];
          setRecentPlacements(placements);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        if (mountedRef.current && !abortController.signal.aborted) {
          setError(
            error instanceof Error
              ? error.message
              : "Failed to load dashboard data"
          );
        }
      } finally {
        if (mountedRef.current && !abortController.signal.aborted) {
          setIsLoadingAdditional(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      abortController.abort();
    };
  }, [providerId, tier]);

  // Compute stats from context data and hooks
  const stats = useMemo<DashboardStats>(() => {
    const availableSpots = homes.reduce(
      (sum, home) => sum + (home.capacity - home.currentOccupancy),
      0
    );

    const pendingReferrals = recentReferrals.filter(
      (r) => r.status === ReferralStatus.NEW
    ).length;
    const urgentReferrals = recentReferrals.filter(
      (r) => r.urgency === Urgency.URGENT
    ).length;

    // Use analytics data if available (PRO+)
    const analyticsData = analytics;
    return {
      totalHomes: analyticsData?.summary.totalHomes || homes.length,
      activeHomes: analyticsData?.summary.totalHomes || homes.length,
      totalOpenings:
        analyticsData?.summary.activeOpenings || expiringOpenings.length,
      activeOpenings:
        analyticsData?.summary.activeOpenings || expiringOpenings.length,
      totalPlacements:
        analyticsData?.summary.totalPlacements || recentPlacements.length,
      completedPlacements:
        analyticsData?.summary.completedPlacements || recentPlacements.length,
      pendingPlacements: analyticsData?.summary.pendingPlacements || 0,
      totalResidents:
        analyticsData?.summary.completedPlacements || recentPlacements.length,
      availableSpots,
      pendingReferrals,
      urgentReferrals,
      averageResponseTime: analyticsData?.responseTime.averageResponseTime || 0,
    };
  }, [homes, recentReferrals, expiringOpenings, recentPlacements, analytics]);

  // Memoized badge renderers
  const getUrgencyBadge = useCallback((urgency: Urgency) => {
    const { label, variant, icon: Icon } = getUrgencyBadgeConfig(urgency);
    return (
      <Badge variant={variant} className="whitespace-nowrap">
        <Icon className="h-3 w-3 mr-1" aria-hidden="true" />
        {label}
      </Badge>
    );
  }, []);

  const getReferralStatusBadge = useCallback((status: ReferralStatus) => {
    const { label, variant } = getReferralStatusBadgeConfig(status);
    return <Badge variant={variant}>{label}</Badge>;
  }, []);

  // Use subscription status info from context (already computed)
  const subscriptionStatus = subscriptionStatusInfo;

  // Navigation handlers
  const handleNavigateToOnboarding = useCallback(() => {
    router.push("/provider/onboarding");
  }, [router]);

  const handleNavigateToSettings = useCallback(
    (tab?: string) => {
      const path = tab ? `/provider/settings?tab=${tab}` : "/provider/settings";
      router.push(path);
    },
    [router]
  );

  // Loading state
  if (isLoading) {
    return <ProviderLoadingState message="Loading dashboard..." />;
  }

  // Error state - provider not found or data fetch errors
  if (combinedError || (!providerId && user?.id)) {
    return (
      <ProviderErrorState
        title={combinedError ? "Error Loading Dashboard" : "Provider Not Found"}
        message={
          combinedError ||
          "We couldn't find your provider profile. This might happen if you just completed registration."
        }
        description={
          combinedError
            ? "Please try refreshing the page or contact support if the issue persists."
            : "Please complete your onboarding or contact support if you believe this is an error."
        }
        action={{
          label: combinedError ? "Refresh Page" : "Go to Onboarding",
          onClick: combinedError
            ? () => window.location.reload()
            : handleNavigateToOnboarding,
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {user?.firstName} {user?.lastName}
          </h1>
          <p className="text-muted-foreground mt-1">
            {organizationName ||
              provider?.organization?.name ||
              "Your organization"}
          </p>
        </div>
        {/* Subscription Status Badge */}
        <div className="flex items-center gap-2">
          <Badge
            variant={
              tier === "FREE"
                ? "outline"
                : tier === "PRO"
                  ? "healthcarePrimary"
                  : tier === "PREMIUM"
                    ? "healthcareSuccess"
                    : "healthcareWarning"
            }
            className="capitalize"
          >
            {tier} Plan
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
            >
              {subscription.status}
            </Badge>
          )}
        </div>
      </div>

      {/* Subscription Warnings - using context computed properties */}
      {isExpiringSoon && subscription && (
        <Card variant="healthcare" className="border-warning/50 bg-warning/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-foreground mb-1">
                  Subscription Expiring Soon
                </p>
                <p className="text-sm text-muted-foreground">
                  Your subscription expires on{" "}
                  {subscriptionStatus.expiryDate &&
                    format(subscriptionStatus.expiryDate, "PPP")}
                  . Renew now to continue accessing all features.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => handleNavigateToSettings("subscription")}
              >
                Renew
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {hasScheduledCancellation && subscription && (
        <Card variant="healthcare" className="border-warning/50 bg-warning/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-foreground mb-1">
                  Subscription Cancellation Scheduled
                </p>
                <p className="text-sm text-muted-foreground">
                  Your subscription will be cancelled on{" "}
                  {subscriptionStatus.cancelDate &&
                    format(subscriptionStatus.cancelDate, "PPP")}
                  . You'll lose access to PRO features after this date.
                </p>
              </div>
              {canManageSettings && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleNavigateToSettings("subscription")}
                >
                  Manage
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {isCancelled && subscription && subscriptionStatus.expiryDate && (
        <Card
          variant="healthcare"
          className="border-destructive/50 bg-destructive/5"
        >
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-foreground mb-1">
                  Subscription Cancelled
                </p>
                <p className="text-sm text-muted-foreground">
                  Your subscription was cancelled. You'll have access until{" "}
                  {format(subscriptionStatus.expiryDate, "PPP")}. After this
                  date, you'll be moved to the Free plan.
                </p>
              </div>
              {canManageSettings && (
                <Button
                  size="sm"
                  onClick={() => handleNavigateToSettings("subscription")}
                >
                  Reactivate
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stale Openings Alert */}
      {staleOpenings.length > 0 && (
        <Card variant="healthcare" className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-foreground mb-1">
                  {staleOpenings.length} Opening
                  {staleOpenings.length !== 1 ? "s" : ""} Expired
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  {staleOpenings.length === 1
                    ? "This opening has expired and will not appear in search results. Refresh it to make it active again."
                    : `${staleOpenings.length} openings have expired and will not appear in search results. Refresh them to make them active again.`}
                </p>
                <div className="space-y-2">
                  {staleOpenings.slice(0, 3).map((opening) => (
                    <div
                      key={opening.id}
                      className="flex items-center justify-between p-2 rounded bg-background/50 border border-border"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {opening.home?.name || "Unknown Home"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {opening.spotsAvailable} spot
                          {opening.spotsAvailable !== 1 ? "s" : ""} available
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          router.push(`/provider/openings/${opening.id}`)
                        }
                        aria-label={`View opening for ${opening.home?.name || "home"}`}
                      >
                        View
                      </Button>
                    </div>
                  ))}
                  {staleOpenings.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{staleOpenings.length - 3} more opening
                      {staleOpenings.length - 3 !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>
              {canManageOpenings && (
                <Button
                  size="sm"
                  onClick={() => router.push("/provider/openings")}
                >
                  Manage Openings
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expiring Openings Alert */}
      {expiringOpenings.length > 0 && staleOpenings.length === 0 && (
        <Card variant="healthcare" className="border-warning/50 bg-warning/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-foreground mb-1">
                  {expiringOpenings.length} Opening
                  {expiringOpenings.length !== 1 ? "s" : ""} Expiring Soon
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  {expiringOpenings.length === 1
                    ? "One of your openings will expire within 12 hours. Refresh it to keep it active."
                    : `${expiringOpenings.length} of your openings will expire within 12 hours. Refresh them to keep them active.`}
                </p>
                <div className="space-y-2">
                  {expiringOpenings.slice(0, 3).map((opening) => {
                    const hoursUntilExpiry = calculateHoursUntilExpiry(
                      opening.freshnessTimestamp
                    );
                    return (
                      <div
                        key={opening.id}
                        className="flex items-center justify-between p-2 rounded bg-background/50 border border-border"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {opening.home?.name || "Unknown Home"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {opening.spotsAvailable} spot
                            {opening.spotsAvailable !== 1 ? "s" : ""} available
                            {" • "}
                            {hoursUntilExpiry}h until expiry
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            router.push(`/provider/openings/${opening.id}`)
                          }
                          aria-label={`View opening for ${opening.home?.name || "home"}`}
                        >
                          View
                        </Button>
                      </div>
                    );
                  })}
                  {expiringOpenings.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{expiringOpenings.length - 3} more opening
                      {expiringOpenings.length - 3 !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>
              {canManageOpenings && (
                <Button
                  size="sm"
                  onClick={() => router.push("/provider/openings")}
                >
                  Manage Openings
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* License Expiry Alert */}
      {expiringLicenses.length > 0 && canManageLicenses && (
        <Card variant="healthcare" className="border-warning/50 bg-warning/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-foreground mb-1">
                  {expiringLicenses.length} License
                  {expiringLicenses.length !== 1 ? "s" : ""} Expiring Soon
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  {expiringLicenses.length === 1
                    ? "One of your licenses will expire within 30 days. Renew it to maintain compliance."
                    : `${expiringLicenses.length} of your licenses will expire within 30 days. Renew them to maintain compliance.`}
                </p>
                <div className="space-y-2">
                  {expiringLicenses.slice(0, 3).map((license: any) => {
                    const expirationDate = new Date(license.expirationDate);
                    const daysUntilExpiry = Math.ceil(
                      (expirationDate.getTime() - Date.now()) /
                        (1000 * 60 * 60 * 24)
                    );
                    return (
                      <div
                        key={license.id}
                        className="flex items-center justify-between p-2 rounded bg-background/50 border border-border"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {license.licenseType} - {license.licenseNumber}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Expires in {daysUntilExpiry} day
                            {daysUntilExpiry !== 1 ? "s" : ""} •{" "}
                            {format(expirationDate, "MMM d, yyyy")}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push("/provider/licenses")}
                          aria-label={`View license ${license.licenseNumber}`}
                        >
                          View
                        </Button>
                      </div>
                    );
                  })}
                  {expiringLicenses.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{expiringLicenses.length - 3} more license
                      {expiringLicenses.length - 3 !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>
              {canManageLicenses && (
                <Button
                  size="sm"
                  onClick={() => router.push("/provider/licenses")}
                >
                  Manage Licenses
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Available Spots"
          value={stats.availableSpots}
          description={`${stats.totalOpenings || 0} active openings`}
          valueClassName="text-success"
        />
        <FeatureGate
          feature={analyticsGate.feature}
          requiredPlan={analyticsGate.requiredPlan}
          showBanner={false}
          fallback={
            <StatsCard
              title="Current Residents"
              value="-"
              description="Upgrade to Pro to view"
              valueClassName="text-muted-foreground"
            />
          }
        >
          <StatsCard
            title="Current Residents"
            value={stats.totalResidents}
            description={`${homes.length} homes`}
          />
        </FeatureGate>
        <StatsCard
          title="Pending Referrals"
          value={stats.pendingReferrals}
          description={`${stats.urgentReferrals} urgent`}
          valueClassName={
            stats.urgentReferrals > 0 ? "text-destructive" : "text-warning"
          }
        />
        <FeatureGate
          feature={placementsGate.feature}
          requiredPlan={placementsGate.requiredPlan}
          showBanner={false}
          fallback={
            <StatsCard
              title="Total Placements"
              value="-"
              description="Upgrade to Pro to view"
              valueClassName="text-muted-foreground"
            />
          }
        >
          <StatsCard
            title="Total Placements"
            value={stats.totalPlacements}
            description={`${stats.completedPlacements} completed`}
            valueClassName="text-success"
          />
        </FeatureGate>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <FeatureGate
          feature={analyticsGate.feature}
          requiredPlan={analyticsGate.requiredPlan}
          showBanner={false}
          fallback={
            <StatsCard
              title="Avg Response Time"
              value="-"
              description="Upgrade to Pro to view"
              valueClassName="text-muted-foreground"
            />
          }
        >
          <StatsCard
            title="Avg Response Time"
            value={
              stats.averageResponseTime > 0
                ? `${Math.round(stats.averageResponseTime * 10) / 10}h`
                : "N/A"
            }
            description={
              <div className="flex items-center gap-2 mt-1">
                <span>Message response time</span>
                {stats.averageResponseTime > 0 && (
                  <SLABadge
                    responseTimeHours={stats.averageResponseTime}
                    showTime={false}
                    size="sm"
                  />
                )}
              </div>
            }
          />
        </FeatureGate>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Referrals */}
        <Card variant="healthcare">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Referrals</CardTitle>
              <CardDescription>
                Latest referral requests requiring attention
              </CardDescription>
            </div>
            {canViewReferrals && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/provider/referrals")}
              >
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {recentReferrals.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No referrals yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentReferrals.slice(0, 5).map((referral) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() =>
                      router.push(`/provider/referrals/${referral.id}`)
                    }
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {referral.urgency === "URGENT" ? (
                          <AlertCircle className="h-5 w-5 text-destructive" />
                        ) : (
                          <Clock className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {referral.referralNumber}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {referral.clientInitials}, {referral.clientAge} yrs
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getUrgencyBadge(referral.urgency)}
                      {getReferralStatusBadge(referral.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common provider tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {canManageOpenings && (
              <Button
                variant="healthcare"
                className="w-full justify-start"
                onClick={() => router.push("/provider/openings/create")}
              >
                <Bed className="mr-2 h-4 w-4" />
                Create Opening
              </Button>
            )}
            {canViewResidents && (
              <Button
                variant="healthcareSecondary"
                className="w-full justify-start"
                onClick={() => router.push("/provider/residents")}
              >
                <Users className="mr-2 h-4 w-4" />
                View Residents
              </Button>
            )}
            {canViewReferrals && (
              <Button
                variant="healthcareSecondary"
                className="w-full justify-start"
                onClick={() => router.push("/provider/referrals")}
              >
                <FileText className="mr-2 h-4 w-4" />
                Review Referrals
              </Button>
            )}
            {canManageMessages && (
              <Button
                variant="healthcareSecondary"
                className="w-full justify-start"
                onClick={() => router.push("/provider/messages")}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Messages
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Management Links */}
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Management</CardTitle>
            <CardDescription>Manage your organization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {canManageHomes && (
              <Button
                variant="healthcareSecondary"
                className="w-full justify-start"
                onClick={() => router.push("/provider/homes")}
              >
                <HomeIcon className="mr-2 h-4 w-4" />
                Homes
              </Button>
            )}
            {canManageOpenings && (
              <Button
                variant="healthcareSecondary"
                className="w-full justify-start"
                onClick={() => router.push("/provider/openings")}
              >
                <Bed className="mr-2 h-4 w-4" />
                Bed Management
              </Button>
            )}
            {canManageServices && (
              <Button
                variant="healthcareSecondary"
                className="w-full justify-start"
                onClick={() => router.push("/provider/services")}
              >
                <Package className="mr-2 h-4 w-4" />
                Services
              </Button>
            )}
            {canManageLicenses && (
              <Button
                variant="healthcareSecondary"
                className="w-full justify-start"
                onClick={() => router.push("/provider/licenses")}
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Licenses
              </Button>
            )}
            {canViewAnalytics && (
              <Button
                variant="healthcareSecondary"
                className="w-full justify-start"
                onClick={() => router.push("/provider/analytics")}
              >
                <Settings className="mr-2 h-4 w-4" />
                Analytics
              </Button>
            )}
            {canManageSettings && (
              <Button
                variant="healthcareSecondary"
                className="w-full justify-start"
                onClick={() => router.push("/provider/settings")}
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Placements */}
      <FeatureGate
        feature={placementsGate.feature}
        requiredPlan={placementsGate.requiredPlan}
        bannerDescription={placementsGate.description}
      >
        {recentPlacements.length > 0 && (
          <Card variant="healthcare">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Placements</CardTitle>
                <CardDescription>Latest successful placements</CardDescription>
              </div>
              {(canManagePlacements || canViewResidents) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/provider/placements")}
                >
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentPlacements.slice(0, 5).map((placement) => (
                  <div
                    key={placement.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() =>
                      router.push(`/provider/placements/${placement.id}`)
                    }
                  >
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <div>
                        <p className="font-medium text-sm">
                          {placement.referral?.clientInitials ||
                            placement.dischargeCase?.patientInitials ||
                            "Placement"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {placement.opening?.home?.name || "Home"} •{" "}
                          {formatDistanceToNow(new Date(placement.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="healthcareSuccess"
                      className="whitespace-nowrap"
                    >
                      {placement.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </FeatureGate>
    </div>
  );
}

export default function ProviderDashboard() {
  return (
    <RequirePermission
      permission={PROVIDER_CAPABILITIES.DASHBOARD_VIEW}
      title="Access Restricted"
      description="You don't have permission to access the provider dashboard."
    >
      <ProviderDashboardContent />
    </RequirePermission>
  );
}
