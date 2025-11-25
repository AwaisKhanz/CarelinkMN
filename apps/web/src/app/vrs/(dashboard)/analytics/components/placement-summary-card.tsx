"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Briefcase, TrendingUp } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

interface PlacementSummaryCardProps {
  totalClients: number;
  activeJobs: number;
  placementsThisQuarter: number;
  isLoading?: boolean;
}

export function PlacementSummaryCard({
  totalClients,
  activeJobs,
  placementsThisQuarter,
  isLoading = false,
}: PlacementSummaryCardProps) {
  return (
    <Card variant="healthcare">
      <CardHeader>
        <CardTitle>Placement Summary</CardTitle>
        <CardDescription>
          Overview of placements and job matching
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="font-medium">Total Clients</div>
              <div className="text-sm text-muted-foreground">In the system</div>
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-12" />
          ) : (
            <div className="text-2xl font-bold">{totalClients}</div>
          )}
        </div>

        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="font-medium">Active Jobs</div>
              <div className="text-sm text-muted-foreground">
                Currently available
              </div>
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-12" />
          ) : (
            <div className="text-2xl font-bold">{activeJobs}</div>
          )}
        </div>

        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="font-medium">Placements This Quarter</div>
              <div className="text-sm text-muted-foreground">Last 90 days</div>
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-12" />
          ) : (
            <div className="text-2xl font-bold">{placementsThisQuarter}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

