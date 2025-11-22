"use client";

import { useMemo } from "react";
import { RetentionStatus } from "@carelink/types";
import type { VRSAnalytics } from "@/lib/api";
import { getVRSRetentionStatusBadgeConfig } from "@/lib/utils/vrs";

export function useAnalyticsStats(analytics: VRSAnalytics | null) {
  const stats = useMemo(() => {
    if (!analytics) {
      return {
        totalClients: 0,
        activeJobs: 0,
        placementsThisQuarter: 0,
        retentionRate: "0",
      };
    }

    // Calculate retention rate
    const retentionData = analytics.retention || [];
    const retainedCount =
      retentionData.find((r) => r.day90Status === RetentionStatus.RETAINED)
        ?._count.day90Status || 0;
    const totalWithStatus = retentionData.reduce(
      (sum, r) => sum + (r._count.day90Status || 0),
      0
    );
    const retentionRate =
      totalWithStatus > 0
        ? ((retainedCount / totalWithStatus) * 100).toFixed(1)
        : "0";

    return {
      totalClients: analytics.totalClients,
      activeJobs: analytics.totalActiveJobs,
      placementsThisQuarter: analytics.placementsThisQuarter,
      retentionRate,
    };
  }, [analytics]);

  const retentionBreakdown = useMemo(() => {
    if (!analytics || !analytics.retention) {
      return [];
    }

    return analytics.retention.map((item) => {
      const statusConfig = item.day90Status
        ? getVRSRetentionStatusBadgeConfig(item.day90Status)
        : { label: "Pending", variant: "outline" as const };

      return {
        status: item.day90Status || RetentionStatus.PENDING,
        label: statusConfig.label,
        variant: statusConfig.variant,
        count: item._count.day90Status || 0,
      };
    });
  }, [analytics]);

  return { stats, retentionBreakdown };
}
