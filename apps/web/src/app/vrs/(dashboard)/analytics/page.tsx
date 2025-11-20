"use client";

import { useState, useEffect, useCallback } from "react";
import { usePageMetadata } from "../use-page-metadata";
import { vrsService, type VRSAnalytics } from "@/lib/api";
import { toast } from "sonner";
import { RequirePermission } from "@/components/auth/require-permission";
import { VRS_CAPABILITIES } from "@/lib/permissions/capabilities";
import {
  VRSLoadingState,
  VRSErrorState,
} from "@/components/vrs";
import {
  AnalyticsStats,
  RetentionBreakdownCard,
  PlacementSummaryCard,
  KeyMetricsCard,
} from "./components";
import { useAnalyticsStats } from "./hooks";

function VRSAnalyticsPageContent() {
  const { setTitle, setDescription } = usePageMetadata();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<VRSAnalytics | null>(null);

  useEffect(() => {
    setTitle("Retention Analytics");
    setDescription("Track client placement retention and job success metrics");
  }, [setTitle, setDescription]);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await vrsService.getAnalytics();

      if (response.success && response.data) {
        setAnalytics(response.data);
      } else {
        setError(response.message || "Failed to load analytics");
        toast.error(response.message || "Failed to load analytics");
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError(err instanceof Error ? err.message : "Failed to load analytics");
      toast.error("Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Calculate stats using hook
  const { stats, retentionBreakdown } = useAnalyticsStats(analytics);

  if (isLoading) {
    return <VRSLoadingState message="Loading analytics..." />;
  }

  if (error) {
    return (
      <VRSErrorState
        message={error}
        action={{
          label: "Retry",
          onClick: fetchAnalytics,
        }}
      />
    );
  }

  if (!analytics) {
    return (
      <VRSErrorState
        message="No analytics data available"
        action={{
          label: "Refresh",
          onClick: fetchAnalytics,
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <AnalyticsStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RetentionBreakdownCard breakdown={retentionBreakdown} />
        <PlacementSummaryCard
          totalClients={analytics.totalClients}
          activeJobs={analytics.totalActiveJobs}
          placementsThisQuarter={analytics.placementsThisQuarter}
        />
      </div>

      <KeyMetricsCard
        retentionBreakdown={retentionBreakdown}
        totalClients={analytics.totalClients}
        placementsThisQuarter={analytics.placementsThisQuarter}
        totalActiveJobs={analytics.totalActiveJobs}
      />
    </div>
  );
}

export default function VRSAnalyticsPage() {
  return (
    <RequirePermission
      permission={VRS_CAPABILITIES.RETENTION_ANALYTICS_VIEW}
      title="Access Restricted"
      description="You don't have permission to view retention analytics."
    >
      <VRSAnalyticsPageContent />
    </RequirePermission>
  );
}
