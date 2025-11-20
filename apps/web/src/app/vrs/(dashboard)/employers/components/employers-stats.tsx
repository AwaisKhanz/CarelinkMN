"use client";

import { StatsCard } from "@/components/ui/stats-card";

interface EmployersStatsProps {
  stats: {
    total: number;
    inclusive: number;
    accessible: number;
    sponsored: number;
  };
}

export function EmployersStats({ stats }: EmployersStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard title="Total Employers" value={stats.total} />
      <StatsCard
        title="Inclusive"
        value={stats.inclusive}
        valueClassName="text-info"
      />
      <StatsCard
        title="Accessible"
        value={stats.accessible}
        valueClassName="text-success"
      />
      <StatsCard
        title="Sponsored"
        value={stats.sponsored}
        valueClassName="text-muted-foreground"
      />
    </div>
  );
}

