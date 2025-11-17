"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Building,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  MapPin,
  Users,
  AlertCircle,
  Info,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import {
  homeService,
  providerService,
  Provider,
  Home,
  ProviderHomesResponse,
} from "@/lib/api";
import { usePageMetadata } from "../use-page-metadata";
import { useProviderId, useProviderData } from "@/hooks/use-provider-data";
import { useProviderHomes } from "@/hooks/use-provider-homes";
import { StatsCard } from "@/components/ui/stats-card";
import { DataTable } from "@/components/ui/data-table";
import { cn } from "@/lib/utils";
import { FeatureGate } from "@/components/subscription/feature-gate";
import { ProviderSubscriptionGuard } from "@/components/auth/provider-subscription-guard";
import { PROVIDER_FEATURE_GATES } from "@/lib/constants";
import { SubscriptionTier } from "@carelink/types";
import { RequirePermission } from "@/components/auth/require-permission";
import { PROVIDER_CAPABILITIES } from "@/lib/permissions/provider-capabilities";
import { usePermissions } from "@/hooks/use-permissions";

const availabilityGateConfig = PROVIDER_FEATURE_GATES.availability;

function ProviderAvailabilityPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const { canManageHomes } = usePermissions();

  const providerId = useProviderId();
  const { provider, refetch: refetchProvider } = useProviderData();
  const {
    homes,
    isLoading: homesLoading,
    refetch: refetchHomes,
  } = useProviderHomes();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle("Availability Management");
    setDescription(
      "Manage your organization's availability for referrals and new residents"
    );
  }, [setTitle, setDescription]);

  // Update loading state based on homes loading
  useEffect(() => {
    setIsLoading(homesLoading);
  }, [homesLoading]);

  const handleProviderAvailabilityToggle = async (
    acceptsReferrals: boolean
  ) => {
    if (!providerId) return;

    setIsSaving((prev) => ({ ...prev, provider: true }));

    try {
      await providerService.updateProviderProfile(providerId, {
        acceptsReferrals,
      });
      await refetchProvider();
      toast.success(
        acceptsReferrals
          ? "Your organization is now accepting referrals"
          : "Your organization is no longer accepting referrals"
      );
    } catch (err) {
      console.error("Error updating provider availability:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update availability"
      );
    } finally {
      setIsSaving((prev) => ({ ...prev, provider: false }));
    }
  };

  const handleHomeAvailabilityToggle = async (
    homeId: string,
    acceptingNew: boolean
  ) => {
    setIsSaving((prev) => ({ ...prev, [homeId]: true }));

    try {
      await homeService.updateHome(homeId, {
        id: homeId,
        acceptingNew,
      });

      // Refetch homes to update state
      await refetchHomes();

      toast.success(
        acceptingNew
          ? "Home is now accepting new residents"
          : "Home is no longer accepting new residents"
      );
    } catch (err) {
      console.error("Error updating home availability:", err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to update home availability"
      );
    } finally {
      setIsSaving((prev) => ({ ...prev, [homeId]: false }));
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const totalHomes = homes.length;
    const activeHomes = homes.filter((h) => h.isActive).length;
    const acceptingNewHomes = homes.filter(
      (h) => h.acceptingNew && h.isActive
    ).length;
    const totalCapacity = homes.reduce((sum, h) => sum + h.capacity, 0);
    const totalOccupancy = homes.reduce(
      (sum, h) => sum + h.currentOccupancy,
      0
    );
    const availableSpots = totalCapacity - totalOccupancy;

    return {
      totalHomes,
      activeHomes,
      acceptingNewHomes,
      totalCapacity,
      totalOccupancy,
      availableSpots,
    };
  }, [homes]);

  // Define table columns
  const columns: ColumnDef<Home>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Home Name",
        cell: ({ row }) => {
          const home = row.original;
          return (
            <div className="whitespace-nowrap">
              <div className="font-medium">{home.name}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {home.city}, {home.state}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const home = row.original;
          return (
            <div className="whitespace-nowrap">
              {home.isActive ? (
                <Badge variant="healthcareSuccess">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <XCircle className="h-3 w-3 mr-1" />
                  Inactive
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "occupancy",
        header: "Occupancy",
        cell: ({ row }) => {
          const home = row.original;
          const occupancyPercent =
            home.capacity > 0
              ? Math.round((home.currentOccupancy / home.capacity) * 100)
              : 0;
          return (
            <div className="whitespace-nowrap">
              <div className="font-medium">
                {home.currentOccupancy} / {home.capacity}
              </div>
              <div className="text-sm text-muted-foreground">
                {occupancyPercent}% occupied
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "acceptingNew",
        header: "Accepting New",
        cell: ({ row }) => {
          const home = row.original;
          const isSavingHome = isSaving[home.id] || false;

          if (!home.isActive) {
            return (
              <Badge variant="secondary" className="whitespace-nowrap">
                N/A (Inactive)
              </Badge>
            );
          }

          return (
            <div className="flex items-center gap-2 whitespace-nowrap">
              {canManageHomes ? (
                <>
                  <Switch
                    checked={home.acceptingNew}
                    onCheckedChange={(checked) =>
                      handleHomeAvailabilityToggle(home.id, checked)
                    }
                    disabled={isSavingHome}
                    variant="healthcare"
                  />
                  {isSavingHome && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </>
              ) : (
                <Badge
                  variant={
                    home.acceptingNew ? "healthcareSuccess" : "secondary"
                  }
                  className="whitespace-nowrap"
                >
                  {home.acceptingNew ? "Yes" : "No"}
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const home = row.original;
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/provider/homes/${home.id}`)}
              className="whitespace-nowrap"
            >
              View Details
            </Button>
          );
        },
      },
    ],
    [isSaving, router, canManageHomes]
  );

  if (isLoading) {
    return (
      <FeatureGate
        feature={availabilityGateConfig.feature}
        requiredPlan={availabilityGateConfig.requiredPlan}
        bannerDescription={availabilityGateConfig.description}
      >
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">
              Loading availability settings...
            </p>
          </div>
        </div>
      </FeatureGate>
    );
  }

  if (error && !provider) {
    return (
      <FeatureGate
        feature={availabilityGateConfig.feature}
        requiredPlan={availabilityGateConfig.requiredPlan}
        bannerDescription={availabilityGateConfig.description}
      >
        <Card variant="healthcare">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="w-full mt-4"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </FeatureGate>
    );
  }

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Availability Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your organization's availability for referrals and new
            residents
          </p>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Total Homes" value={stats.totalHomes} />
        <StatsCard
          title="Active Homes"
          value={stats.activeHomes}
          valueClassName="text-success"
        />
        <StatsCard
          title="Accepting New"
          value={stats.acceptingNewHomes}
          valueClassName="text-info"
        />
        <StatsCard
          title="Available Spots"
          value={stats.availableSpots}
          valueClassName="text-success"
        />
      </div>

      {/* Provider-Level Availability */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Organization Availability</CardTitle>
          <CardDescription>
            Control whether your organization accepts new referrals from case
            managers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">
                Accept New Referrals
              </Label>
              <p className="text-sm text-muted-foreground">
                Toggle to show or hide your organization in referral searches
              </p>
            </div>
            <Switch
              checked={provider?.acceptsReferrals ?? false}
              onCheckedChange={handleProviderAvailabilityToggle}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-info" />
                <p className="font-medium">Availability Summary</p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Keep your availability up to date to maintain priority placement
                in search results. Homes marked as "Accepting New" appear higher
                for case managers.
              </p>
            </div>
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-warning" />
                <p className="font-medium">Automated Alerts</p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We'll send reminders when data gets stale for more than 48 hours
                so families always see that your information is fresh and
                trustworthy.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Home-Level Availability */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Home Availability</CardTitle>
          <CardDescription>
            Manage availability across each of your homes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={homes}
            emptyMessage="Add your homes to start managing availability"
          />
        </CardContent>
      </Card>
    </div>
  );

  return (
    <FeatureGate
      feature={availabilityGateConfig.feature}
      requiredPlan={availabilityGateConfig.requiredPlan}
      bannerDescription={availabilityGateConfig.description}
    >
      {content}
    </FeatureGate>
  );
}

function ProviderAvailabilityPageWrapper() {
  const availabilityGate = PROVIDER_FEATURE_GATES.availability;

  return (
    <ProviderSubscriptionGuard
      requiredPlan={SubscriptionTier.PRO}
      feature={availabilityGate.feature}
      featureDescription={availabilityGate.description}
    >
      <ProviderAvailabilityPageContent />
    </ProviderSubscriptionGuard>
  );
}

export default function ProviderAvailabilityPage() {
  return (
    <RequirePermission
      permission={PROVIDER_CAPABILITIES.HOMES_MANAGE}
      title="Access Restricted"
      description="You don't have permission to manage organization availability. Please contact your administrator if you need access."
    >
      <ProviderAvailabilityPageWrapper />
    </RequirePermission>
  );
}
