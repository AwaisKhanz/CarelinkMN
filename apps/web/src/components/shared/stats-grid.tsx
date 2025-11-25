"use client";

import { ReactNode } from "react";
import { StatsCard } from "@/components/ui/stats-card";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface Stat {
  label: string;
  value: string | number;
  description?: string | ReactNode;
  icon?: ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  valueClassName?: string;
  variant?: "default" | "healthcare";
}

import { Skeleton } from "@/components/ui/skeleton";

interface StatsGridProps {
  stats: Stat[];
  columns?: 2 | 3 | 4 | 5;
  variant?: "default" | "healthcare" | "card";
  className?: string;
  isLoading?: boolean;
}

/**
 * Reusable stats grid component
 * Consolidates stats display across all dashboards with consistent styling
 */
export function StatsGrid({
  stats,
  columns = 4,
  variant = "healthcare",
  className,
  isLoading = false,
}: StatsGridProps) {
  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-2 lg:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
    5: "md:grid-cols-2 lg:grid-cols-5",
  };

  if (variant === "card") {
    // Card variant - matches AdminStatsGrid style
    return (
      <div
        className={cn(
          "grid grid-cols-1 gap-6",
          gridCols[columns],
          className
        )}
      >
        {stats.map((stat, index) => (
          <Card key={index} variant="healthcare">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              {stat.icon && (
                <div className="text-muted-foreground">{stat.icon}</div>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <>
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-3 w-24 mt-1" />
                </>
              ) : (
                <>
                  <div
                    className={cn(
                      "text-2xl font-bold",
                      stat.valueClassName
                    )}
                  >
                    {stat.value}
                  </div>
                  {stat.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {typeof stat.description === "string"
                        ? stat.description
                        : stat.description}
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
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Default variant - uses StatsCard
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4",
        gridCols[columns],
        className
      )}
    >
      {stats.map((stat, index) => (
        <StatsCard
          key={index}
          title={stat.label}
          value={stat.value}
          isLoading={isLoading}
          description={
            stat.description || stat.trend
              ? (() => {
                  if (stat.trend) {
                    return (
                      <>
                        {stat.description && (
                          <span>
                            {typeof stat.description === "string"
                              ? stat.description
                              : stat.description}
                            {" • "}
                          </span>
                        )}
                        <span
                          className={
                            stat.trend.isPositive
                              ? "text-success"
                              : "text-destructive"
                          }
                        >
                          {stat.trend.isPositive ? "+" : ""}
                          {stat.trend.value}
                        </span>
                      </>
                    );
                  }
                  return stat.description;
                })()
              : undefined
          }
          variant={stat.variant || variant}
          valueClassName={stat.valueClassName}
        />
      ))}
    </div>
  );
}

