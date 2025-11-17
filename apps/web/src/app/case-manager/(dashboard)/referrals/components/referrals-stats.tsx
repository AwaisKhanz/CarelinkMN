"use client";

import { StatsCard } from "@/components/ui/stats-card";

interface ReferralsStatsProps {
  stats: {
    total: number;
    active: number;
    urgent: number;
    placed: number;
    closed: number;
  };
}

export function ReferralsStats({ stats }: ReferralsStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <StatsCard title="Total Referrals" value={stats.total} />
      <StatsCard
        title="Active"
        value={stats.active}
        valueClassName="text-info"
      />
      <StatsCard
        title="Urgent"
        value={stats.urgent}
        valueClassName="text-destructive"
      />
      <StatsCard
        title="Placed"
        value={stats.placed}
        valueClassName="text-success"
      />
      <StatsCard
        title="Closed"
        value={stats.closed}
        valueClassName="text-muted-foreground"
      />
    </div>
  );
}


