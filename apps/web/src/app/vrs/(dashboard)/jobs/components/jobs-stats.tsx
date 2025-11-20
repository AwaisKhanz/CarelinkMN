"use client";

import { StatsCard } from "@/components/ui/stats-card";

interface JobsStatsProps {
  stats: {
    total: number;
    open: number;
    filled: number;
    draft: number;
  };
}

export function JobsStats({ stats }: JobsStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard title="Total Jobs" value={stats.total} />
      <StatsCard
        title="Open"
        value={stats.open}
        valueClassName="text-info"
      />
      <StatsCard
        title="Filled"
        value={stats.filled}
        valueClassName="text-success"
      />
      <StatsCard
        title="Draft"
        value={stats.draft}
        valueClassName="text-muted-foreground"
      />
    </div>
  );
}

