"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, BarChart3, Clock } from "lucide-react";
import { RetentionStatus } from "@carelink/types";

import { Skeleton } from "@/components/ui/skeleton";

interface RetentionBreakdownItem {
  status: string;
  count: number;
}

interface KeyMetricsCardProps {
  retentionBreakdown: RetentionBreakdownItem[];
  totalClients: number;
  placementsThisQuarter: number;
  totalActiveJobs: number;
  isLoading?: boolean;
}

export function KeyMetricsCard({
  retentionBreakdown,
  totalClients,
  placementsThisQuarter,
  totalActiveJobs,
  isLoading = false,
}: KeyMetricsCardProps) {
  const retentionRate =
    retentionBreakdown.length > 0
      ? (() => {
          const total = retentionBreakdown.reduce(
            (sum, i) => sum + i.count,
            0
          );
          const retained =
            retentionBreakdown.find(
              (i) => i.status === RetentionStatus.RETAINED
            )?.count || 0;
          return total > 0 ? ((retained / total) * 100).toFixed(1) : "0";
        })()
      : "0";

  const placementRate =
    totalClients > 0
      ? ((placementsThisQuarter / totalClients) * 100).toFixed(1)
      : "0";

  return (
    <Card variant="healthcare">
      <CardHeader>
        <CardTitle>Key Metrics</CardTitle>
        <CardDescription>
          Important metrics for tracking VRS program success
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="text-sm font-medium">Retention Rate</span>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{retentionRate}%</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              90-day client retention
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Placement Rate</span>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{placementRate}%</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Clients placed this quarter
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Job Availability</span>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{totalActiveJobs}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Open positions
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

