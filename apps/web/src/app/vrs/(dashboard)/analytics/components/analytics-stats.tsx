"use client";

import { StatsCard } from "@/components/ui/stats-card";

interface AnalyticsStatsProps {
  stats: {
    totalClients: number;
    activeJobs: number;
    placementsThisQuarter: number;
    retentionRate: string;
  };
  isLoading?: boolean;
}

export function AnalyticsStats({ stats, isLoading = false }: AnalyticsStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Clients"
        value={stats.totalClients.toLocaleString()}
        description="All clients"
        isLoading={isLoading}
      />
      <StatsCard
        title="Active Jobs"
        value={stats.activeJobs.toLocaleString()}
        description="Currently open"
        isLoading={isLoading}
      />
      <StatsCard
        title="Placements (Q3)"
        value={stats.placementsThisQuarter.toLocaleString()}
        description="This quarter"
        isLoading={isLoading}
      />
      <StatsCard
        title="Retention Rate"
        value={`${stats.retentionRate}%`}
        description="90-day retention"
        isLoading={isLoading}
      />
    </div>
  );
}

