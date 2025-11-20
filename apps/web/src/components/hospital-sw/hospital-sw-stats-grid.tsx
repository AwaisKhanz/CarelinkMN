"use client";

import { ReactNode } from "react";
import { StatsCard } from "@/components/ui/stats-card";
import { cn } from "@/lib/utils";

interface HospitalSWStatsGridProps {
  stats: Array<{
    label: string;
    value: string | number;
    icon?: ReactNode;
    description?: string;
  }>;
  columns?: 2 | 3 | 4;
  className?: string;
}

/**
 * Reusable stats grid component for Hospital SW pages
 * Displays statistics in a responsive grid layout
 */
export function HospitalSWStatsGrid({
  stats,
  columns = 4,
  className,
}: HospitalSWStatsGridProps) {
  const gridCols = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {stats.map((stat, index) => (
        <StatsCard
          key={index}
          title={stat.label}
          value={stat.value}
          description={stat.description}
        />
      ))}
    </div>
  );
}

