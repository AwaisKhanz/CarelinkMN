"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Package } from "lucide-react";
import type { Placement } from "@/lib/api";
import { PlacementItem } from "./placement-item";

interface PlacementsTabProps {
  dischargeCaseId: string;
  placements: Placement[];
  isLoading: boolean;
}

export function PlacementsTab({
  dischargeCaseId,
  placements,
  isLoading,
}: PlacementsTabProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading placements...</p>
        </div>
      </div>
    );
  }

  return (
    <Card variant="healthcare">
      <CardHeader>
        <CardTitle>Placements</CardTitle>
        <CardDescription>
          Placements created from this discharge case
        </CardDescription>
      </CardHeader>
      <CardContent>
        {placements.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Placements Yet</h3>
            <p className="text-muted-foreground">
              Placements will appear here once providers accept invitations and placements are created.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {placements.map((placement) => (
              <PlacementItem 
                key={placement.id} 
                placement={placement}
                onView={(placementId: string) => {
                  // Navigate to placement detail page
                  window.location.href = `/hospital-sw/placements/${placementId}`;
                }}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
