"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import type { Placement } from "@/lib/api";
import { PLACEMENT_STATUS_CONFIG } from "@/lib/constants";

interface PlacementItemProps {
  placement: Placement;
  onView: (placementId: string) => void;
}

export function PlacementItem({ placement, onView }: PlacementItemProps) {
  const statusConfig = PLACEMENT_STATUS_CONFIG[placement.status] || PLACEMENT_STATUS_CONFIG.PENDING;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            {/* Status and Provider */}
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant={statusConfig.variant as any}>
                {statusConfig.label}
              </Badge>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="font-medium">
                  {placement.opening?.home?.name || "Unknown Home"}
                </span>
              </div>
            </div>

            {/* Dates */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  Placement: {placement.placementDate ? format(new Date(placement.placementDate), "MMM dd, yyyy") : "Not set"}
                </span>
              </div>
              {placement.moveInDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Move-in: {format(new Date(placement.moveInDate), "MMM dd, yyyy")}
                  </span>
                </div>
              )}
            </div>

            {/* Location */}
            {placement.opening?.home && (
              <div className="text-sm text-muted-foreground">
                {placement.opening.home.city}, {placement.opening.home.state}
              </div>
            )}
          </div>

          {/* View Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(placement.id)}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
