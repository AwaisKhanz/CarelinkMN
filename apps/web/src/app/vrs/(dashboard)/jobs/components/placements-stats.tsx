"use client";

import { StatsCard } from "@/components/ui/stats-card";

interface PlacementsStatsProps {
  stats: {
    total: number;
    retained: number;
    notRetained: number;
    pending: number;
  };
}

export function PlacementsStats({ stats }: PlacementsStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard title="Total Placements" value={stats.total} />
      <StatsCard
        title="Retained"
        value={stats.retained}
        valueClassName="text-success"
      />
      <StatsCard
        title="Not Retained"
        value={stats.notRetained}
        valueClassName="text-destructive"
      />
      <StatsCard
        title="Pending"
        value={stats.pending}
        valueClassName="text-muted-foreground"
      />
    </div>
  );
}

