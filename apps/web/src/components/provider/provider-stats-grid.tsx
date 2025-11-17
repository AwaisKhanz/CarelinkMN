"use client";

import { ReactNode } from "react";
import { StatsCard } from "@/components/ui/stats-card";
import { cn } from "@/lib/utils";

interface StatItem {
  title: string;
  value: string | number;
  description?: string | ReactNode;
  valueClassName?: string;
  className?: string;
}

interface ProviderStatsGridProps {
  stats: StatItem[];
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

/**
 * Reusable stats grid component for provider dashboards
 * Displays multiple stats in a responsive grid layout
 */
export function ProviderStatsGrid({
  stats,
  columns = 4,
  className,
}: ProviderStatsGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {stats.map((stat, index) => (
        <StatsCard
          key={index}
          title={stat.title}
          value={stat.value}
          description={stat.description}
          valueClassName={stat.valueClassName}
          className={stat.className}
        />
      ))}
    </div>
  );
}
