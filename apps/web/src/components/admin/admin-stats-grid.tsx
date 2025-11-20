"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Stat {
  label: string;
  value: string | number;
  icon?: ReactNode;
  description?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

interface AdminStatsGridProps {
  stats: Stat[];
  columns?: 2 | 3 | 4;
}

export function AdminStatsGrid({ stats, columns = 4 }: AdminStatsGridProps) {
  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid grid-cols-1 gap-6", gridCols[columns])}>
      {stats.map((stat, index) => (
        <Card key={index} variant="healthcare">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
            {stat.icon && <div className="text-muted-foreground">{stat.icon}</div>}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            {stat.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            )}
            {stat.trend && (
              <p
                className={cn(
                  "text-xs mt-1",
                  stat.trend.isPositive
                    ? "text-success"
                    : "text-destructive"
                )}
              >
                {stat.trend.isPositive ? "+" : ""}
                {stat.trend.value}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

