"use client";

import { StatsCard } from "@/components/ui/stats-card";

interface ClientsStatsProps {
  stats: {
    total: number;
    jobSearching: number;
    placed: number;
    intake: number;
  };
}

export function ClientsStats({ stats }: ClientsStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard title="Total Clients" value={stats.total} />
      <StatsCard
        title="Job Searching"
        value={stats.jobSearching}
        valueClassName="text-info"
      />
      <StatsCard
        title="Placed"
        value={stats.placed}
        valueClassName="text-success"
      />
      <StatsCard
        title="In Intake"
        value={stats.intake}
        valueClassName="text-muted-foreground"
      />
    </div>
  );
}

