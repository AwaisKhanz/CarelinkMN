"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { format } from "date-fns";
import type { Placement } from "@carelink/types";

interface PlacementItemProps {
  placement: Placement;
  onView: (placementId: string) => void;
}

export function PlacementItem({ placement, onView }: PlacementItemProps) {
  return (
    <Card
      variant="healthcare"
      className="border-border cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => onView(placement.id)}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="font-semibold">
                {placement.opening?.home?.name || "Unknown Home"}
              </h4>
              <Badge variant="outline">{placement.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {placement.opening?.home?.city}, {placement.opening?.home?.state}
            </p>
            {placement.placementDate && (
              <p className="text-xs text-muted-foreground mt-2">
                Placed: {format(new Date(placement.placementDate), "MMM d, yyyy")}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onView(placement.id);
            }}
          >
            <Eye className="h-4 w-4 mr-2" />
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


