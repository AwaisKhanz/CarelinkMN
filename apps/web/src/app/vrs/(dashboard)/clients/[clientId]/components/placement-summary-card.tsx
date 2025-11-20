"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format as formatDate } from "date-fns";
import { Briefcase } from "lucide-react";
import type { VRSClient } from "@/lib/api";

interface PlacementSummaryCardProps {
  client: VRSClient;
  onViewAll?: () => void;
  onMatchJob?: () => void;
}

export function PlacementSummaryCard({
  client,
  onViewAll,
  onMatchJob,
}: PlacementSummaryCardProps) {
  const placements = client.placements || [];

  return (
    <Card variant="healthcare">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Placement Summary</CardTitle>
          {onMatchJob && (
            <Button
              variant="healthcare"
              size="sm"
              onClick={onMatchJob}
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Match Job
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {placements.length > 0 ? (
          <div className="space-y-2">
            {placements.slice(0, 3).map((placement) => (
              <div
                key={placement.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <div className="font-medium">
                    {placement.job?.title || "Unknown Job"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {placement.job?.employer?.companyName || "Unknown Employer"}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDate(
                    new Date(placement.placementDate),
                    "MMM d, yyyy"
                  )}
                </div>
              </div>
            ))}
            {placements.length > 3 && onViewAll && (
              <Button variant="outline" className="w-full" onClick={onViewAll}>
                View All Placements ({placements.length})
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">No placements yet</p>
            {onMatchJob && (
              <Button
                variant="healthcare"
                className="w-full"
                onClick={onMatchJob}
              >
                <Briefcase className="h-4 w-4 mr-2" />
                Match Client with Job
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

