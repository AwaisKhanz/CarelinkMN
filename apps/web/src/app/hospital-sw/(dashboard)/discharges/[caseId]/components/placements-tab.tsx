"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Package } from "lucide-react";
import type { Placement } from "@/lib/api";
import { PlacementItem } from "./placement-item";
import { Button } from "@/components/ui/button";

interface PlacementsTabProps {
  dischargeCaseId: string;
  placements: Placement[];
  isLoading: boolean;
  onCreatePlacement?: () => void;
}

export function PlacementsTab({
  dischargeCaseId,
  placements,
  isLoading,
  onCreatePlacement,
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Placements</CardTitle>
            <CardDescription>
              Placements created from this discharge case
            </CardDescription>
          </div>
          {onCreatePlacement && (
            <Button onClick={onCreatePlacement} variant="healthcare" size="sm">
              <Package className="h-4 w-4 mr-2" />
              Create Placement
            </Button>
          )}
        </div>
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
