"use client";

import { useEffect, useState } from "react";
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
  homeService,
  placementService,
  analyticsService,
  openingService,
  Provider,
  Home,
  Opening,
  Placement,
  ProviderHomesResponse,
  ProviderReferralsResponse,
  OpeningStatus,
} from "@/lib/api";
import { StatsCard } from "@/components/ui/stats-card";
import { FeatureGate } from "@/components/subscription/feature-gate";
import { useSubscription } from "@/hooks/use-subscription";
import { PROVIDER_FEATURE_GATES } from "@/lib/constants";
import { billingService, Subscription } from "@/lib/services/billing.service";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import type { BadgeProps } from "@/components/ui/badge";
import { Referral, Urgency, ReferralStatus } from "@carelink/types";
import { SLABadge } from "@/components/ui/sla-badge";

export default function ProviderDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const {
    tier,
    hasFeature,
    isLoading: isSubscriptionLoading,
  } = useSubscription();

  const [provider, setProvider] = useState<Provider | null>(null);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [homes, setHomes] = useState<Home[]>([]);
  const [recentReferrals, setRecentReferrals] = useState<Referral[]>([]);
  const [recentPlacements, setRecentPlacements] = useState<Placement[]>([]);
  const [expiringOpenings, setExpiringOpenings] = useState<Opening[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalHomes: 0,
    activeHomes: 0,
    totalOpenings: 0,
    activeOpenings: 0,
    totalPlacements: 0,
    completedPlacements: 0,
    pendingPlacements: 0,
    totalResidents: 0,
    availableSpots: 0,
    pendingReferrals: 0,
    urgentReferrals: 0,
    averageResponseTime: 0, // in hours
  });

  const analyticsGate = PROVIDER_FEATURE_GATES.analytics;
  const placementsGate = PROVIDER_FEATURE_GATES.placements;

  useEffect(() => {
    setTitle("Provider Dashboard");
    setDescription(`Welcome back, ${user?.firstName} ${user?.lastName}`);
  }, [setTitle, setDescription, user]);

  // Fetch provider ID
  useEffect(() => {
    const fetchProviderId = async () => {
      if (!user?.organizationId) return;

      try {
        const providerData = await providerService.getProviderByOrganizationId(
          user.organizationId
        );
        if (providerData?.id) {
          setProviderId(providerData.id);
          setProvider(providerData);
        }
      } catch (error) {
        console.error("Error fetching provider ID:", error);
      }
    };

    fetchProviderId();
  }, [user?.organizationId]);

  // Fetch subscription data
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user?.organizationId) return;

      try {
        const subscriptionData = await billingService.getSubscription();
        setSubscription(subscriptionData);
      } catch (error) {
        console.error("Error fetching subscription:", error);
        // Don't block dashboard if subscription fetch fails
      }
    };

    fetchSubscription();
  }, [user?.organizationId]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!providerId || isSubscriptionLoading) return;

      try {
        setIsLoading(true);

        // Fetch homes for capacity calculation (always available)
        try {
          const homesResponse = await homeService.getProviderHomes(providerId, {
            page: 1,
            limit: 100,
          });
          if (homesResponse.success && homesResponse.data) {
            const data = homesResponse.data as ProviderHomesResponse;
            const homesData = data?.homes ?? [];
            setHomes(homesData);

            // Calculate available spots
            const totalCap = homesData.reduce(
              (sum, home) => sum + (home.capacity - home.currentOccupancy),
              0
            );
            setStats((prev) => ({ ...prev, availableSpots: totalCap }));
          }
        } catch (error) {
          console.error("Error fetching homes:", error);
          // Continue even if homes fetch fails
        }

        // Fetch recent referrals (always available)
        try {
          const referralsResponse = await providerService.getProviderReferrals(
            providerId,
            {
              page: 1,
              limit: 5,
              status: "all",
            }
          );
          if (referralsResponse.success && referralsResponse.data) {
            const data = referralsResponse.data as ProviderReferralsResponse;
            const referrals = data.referrals ?? [];
            setRecentReferrals(referrals);
            setStats((prev) => ({
              ...prev,
              pendingReferrals: referrals.filter(
                (referral) => referral.status === ReferralStatus.NEW
              ).length,
              urgentReferrals: referrals.filter(
                (r: Referral) => r.urgency === "URGENT"
              ).length,
            }));
          }
        } catch (error) {
          console.error("Error fetching referrals:", error);
          // Continue even if referrals fetch fails
        }

        // Fetch analytics for summary stats (requires PRO plan)
        // Check tier directly instead of hasFeature to avoid dependency issues
        if (tier !== "FREE") {
          try {
            const analyticsResponse =
              await analyticsService.getProviderAnalytics({
                providerId,
              });
            if (analyticsResponse.success && analyticsResponse.data) {
              const analytics = analyticsResponse.data;
              setStats((prev) => ({
                ...prev,
                totalHomes: analytics.summary.totalHomes,
                activeHomes: analytics.summary.totalHomes,
                totalOpenings: analytics.summary.activeOpenings,
                activeOpenings: analytics.summary.activeOpenings,
                totalPlacements: analytics.summary.totalPlacements,
                completedPlacements: analytics.summary.completedPlacements,
                pendingPlacements: analytics.summary.pendingPlacements,
                totalResidents: analytics.summary.completedPlacements,
                averageResponseTime:
                  analytics.responseTime.averageResponseTime || 0,
              }));
            }
          } catch (error) {
            console.error(
              "Error fetching analytics (may require PRO plan):",
              error
            );
            // Continue even if analytics fetch fails
          }
        }

        // Fetch recent placements (requires PRO plan)
        if (tier !== "FREE") {
          try {
            const placementsResponse = await placementService.getPlacements({
              providerId,
              page: 1,
              limit: 5,
            });
            if (placementsResponse.success && placementsResponse.data) {
              const placements = placementsResponse.data.placements || [];
              setRecentPlacements(placements);
            }
          } catch (error) {
            console.error(
              "Error fetching placements (may require PRO plan):",
              error
            );
            // Continue even if placements fetch fails
          }
        }

        // Fetch openings to check for expiring ones (always available)
        try {
          const openingsResponse = await openingService.getOpenings({
            providerId,
            status: OpeningStatus.OPEN,
            page: 1,
            limit: 100, // Get all open openings to check expiry
            includeExpired: false,
          });
          if (openingsResponse.success && openingsResponse.data) {
            const openings = openingsResponse.data.openings || [];

            // Check which openings are expiring soon (within 12 hours)
            const now = new Date();
            const expiring = openings.filter((opening) => {
              const freshnessTimestamp = new Date(opening.freshnessTimestamp);
              const expiryTime = new Date(
                freshnessTimestamp.getTime() + 48 * 60 * 60 * 1000
              );
              const hoursUntilExpiry =
                (expiryTime.getTime() - now.getTime()) / (1000 * 60 * 60);
              return hoursUntilExpiry >= 0 && hoursUntilExpiry <= 12;
            });

            setExpiringOpenings(expiring);
          }
        } catch (error) {
          console.error("Error fetching openings:", error);
          // Continue even if openings fetch fails
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
    // Only depend on providerId, isSubscriptionLoading, and tier
    // hasFeature is a function and shouldn't be in dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId, isSubscriptionLoading, tier]);

  const getUrgencyBadge = (urgency: Urgency) => {
    const config: Record<
      Urgency,
      { label: string; variant: BadgeProps["variant"]; icon: typeof Clock }
    > = {
      [Urgency.URGENT]: {
        label: "Urgent",
        variant: "healthcareError",
        icon: AlertCircle,
      },
      [Urgency.HIGH]: {
        label: "High",
        variant: "healthcareWarning",
        icon: Clock,
      },
      [Urgency.ROUTINE]: {
        label: "Routine",
        variant: "healthcareInfo",
        icon: Calendar,
      },
    };

    const { label, variant, icon: Icon } = config[urgency];
    return (
      <Badge variant={variant} className="whitespace-nowrap">
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const getReferralStatusBadge = (status: ReferralStatus) => {
    const config: Record<
      ReferralStatus,
      { label: string; variant: BadgeProps["variant"] }
    > = {
      [ReferralStatus.NEW]: {
        label: "New",
        variant: "healthcareInfo",
      },
      [ReferralStatus.IN_REVIEW]: {
        label: "In Review",
        variant: "healthcareWarning",
      },
      [ReferralStatus.TOURING]: {
        label: "Touring",
        variant: "healthcarePrimary",
      },
      [ReferralStatus.OFFER_MADE]: {
        label: "Offer Made",
        variant: "healthcareSuccess",
      },
      [ReferralStatus.PLACED]: {
        label: "Placed",
        variant: "healthcareSuccess",
      },
      [ReferralStatus.CLOSED]: {
        label: "Closed",
        variant: "outline",
      },
      [ReferralStatus.CANCELLED]: {
        label: "Cancelled",
        variant: "destructive",
      },
    };

    const { label, variant } = config[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  // Check if subscription is expiring soon (within 7 days)
  const isSubscriptionExpiringSoon =
    subscription?.status === "ACTIVE" &&
    subscription.currentPeriodEnd &&
    new Date(subscription.currentPeriodEnd).getTime() - Date.now() <
      7 * 24 * 60 * 60 * 1000;

  // Check if subscription is cancelled
  const isSubscriptionCancelled = subscription?.status === "CANCELLED";

  // Check if subscription has scheduled cancellation
  const hasScheduledCancellation =
    subscription?.status === "ACTIVE" && subscription?.cancelAt;

  if (isLoading || isSubscriptionLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
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
            {provider?.organization?.name || "Your organization"}
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

      {/* Subscription Warnings */}
      {isSubscriptionExpiringSoon && (
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
                  {subscription.currentPeriodEnd &&
                    format(new Date(subscription.currentPeriodEnd), "PPP")}
                  . Renew now to continue accessing all features.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() =>
                  router.push("/provider/settings?tab=subscription")
                }
              >
                Renew
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {hasScheduledCancellation && subscription.cancelAt && (
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
                  {format(new Date(subscription.cancelAt), "PPP")}. You'll lose
                  access to PRO features after this date.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  router.push("/provider/settings?tab=subscription")
                }
              >
                Manage
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isSubscriptionCancelled && subscription.currentPeriodEnd && (
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
                  {format(new Date(subscription.currentPeriodEnd), "PPP")}.
                  After this date, you'll be moved to the Free plan.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() =>
                  router.push("/provider/settings?tab=subscription")
                }
              >
                Reactivate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expiring Openings Alert */}
      {expiringOpenings.length > 0 && (
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
                    const freshnessTimestamp = new Date(
                      opening.freshnessTimestamp
                    );
                    const expiryTime = new Date(
                      freshnessTimestamp.getTime() + 48 * 60 * 60 * 1000
                    );
                    const hoursUntilExpiry = Math.floor(
                      (expiryTime.getTime() - Date.now()) / (1000 * 60 * 60)
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
              <Button
                size="sm"
                onClick={() => router.push("/provider/openings")}
              >
                Manage Openings
              </Button>
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/provider/referrals")}
            >
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
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
            <Button
              variant="healthcare"
              className="w-full justify-start"
              onClick={() => router.push("/provider/openings/create")}
            >
              <Bed className="mr-2 h-4 w-4" />
              Create Opening
            </Button>
            <Button
              variant="healthcareSecondary"
              className="w-full justify-start"
              onClick={() => router.push("/provider/residents")}
            >
              <Users className="mr-2 h-4 w-4" />
              View Residents
            </Button>
            <Button
              variant="healthcareSecondary"
              className="w-full justify-start"
              onClick={() => router.push("/provider/referrals")}
            >
              <FileText className="mr-2 h-4 w-4" />
              Review Referrals
            </Button>
            <Button
              variant="healthcareSecondary"
              className="w-full justify-start"
              onClick={() => router.push("/provider/messages")}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Messages
            </Button>
          </CardContent>
        </Card>

        {/* Management Links */}
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Management</CardTitle>
            <CardDescription>Manage your organization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="healthcareSecondary"
              className="w-full justify-start"
              onClick={() => router.push("/provider/homes")}
            >
              <HomeIcon className="mr-2 h-4 w-4" />
              Homes
            </Button>
            <Button
              variant="healthcareSecondary"
              className="w-full justify-start"
              onClick={() => router.push("/provider/openings")}
            >
              <Bed className="mr-2 h-4 w-4" />
              Bed Management
            </Button>
            <Button
              variant="healthcareSecondary"
              className="w-full justify-start"
              onClick={() => router.push("/provider/services")}
            >
              <Package className="mr-2 h-4 w-4" />
              Services
            </Button>
            <Button
              variant="healthcareSecondary"
              className="w-full justify-start"
              onClick={() => router.push("/provider/licenses")}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Licenses
            </Button>
            <Button
              variant="healthcareSecondary"
              className="w-full justify-start"
              onClick={() => router.push("/provider/analytics")}
            >
              <Settings className="mr-2 h-4 w-4" />
              Analytics
            </Button>
            <Button
              variant="healthcareSecondary"
              className="w-full justify-start"
              onClick={() => router.push("/provider/settings")}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/provider/placements")}
              >
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
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
