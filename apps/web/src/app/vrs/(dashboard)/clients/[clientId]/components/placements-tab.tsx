"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format as formatDate } from "date-fns";
import type { VRSClient } from "@/lib/api";

interface PlacementsTabProps {
  client: VRSClient;
}

export function PlacementsTab({ client }: PlacementsTabProps) {
  const placements = client.placements || [];

  return (
    <Card variant="healthcare">
      <CardHeader>
        <CardTitle>Placement History</CardTitle>
        <CardDescription>All job placements for this client</CardDescription>
      </CardHeader>
      <CardContent>
        {placements.length > 0 ? (
          <div className="space-y-4">
            {placements.map((placement) => (
              <div
                key={placement.id}
                className="p-4 border rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {placement.job?.title || "Unknown Job"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {placement.job?.employer?.companyName ||
                        "Unknown Employer"}
                    </div>
                  </div>
                  <Badge variant="outline">
                    {formatDate(
                      new Date(placement.placementDate),
                      "MMM d, yyyy"
                    )}
                  </Badge>
                </div>
                {placement.startDate && (
                  <div className="text-sm text-muted-foreground">
                    Start Date:{" "}
                    {formatDate(new Date(placement.startDate), "MMM d, yyyy")}
                  </div>
                )}
                {placement.endDate && (
                  <div className="text-sm text-muted-foreground">
                    End Date:{" "}
                    {formatDate(new Date(placement.endDate), "MMM d, yyyy")}
                  </div>
                )}
                {placement.endReason && (
                  <div className="text-sm text-muted-foreground">
                    End Reason: {placement.endReason}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No placements recorded
          </p>
        )}
      </CardContent>
    </Card>
  );
}

