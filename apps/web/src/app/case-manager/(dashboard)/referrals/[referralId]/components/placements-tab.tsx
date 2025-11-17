"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Placement } from "@carelink/types";
import { PlacementItem } from "./placement-item";

interface PlacementsTabProps {
  referralId: string;
  placements: Placement[];
  isLoading: boolean;
}

export function PlacementsTab({ referralId, placements, isLoading }: PlacementsTabProps) {
  const router = useRouter();

  const handleViewPlacement = (placementId: string) => {
    router.push(`/case-manager/placements/${placementId}`);
  };

  return (
    <Card variant="healthcare">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Placements</CardTitle>
            <CardDescription>
              {placements.length} placement{placements.length !== 1 ? "s" : ""} from this referral
            </CardDescription>
          </div>
          <Button
            variant="healthcare"
            onClick={() =>
              router.push(`/case-manager/placements/create?referralId=${referralId}`)
            }
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Placement
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={`skeleton-${index}`} className="h-20 w-full" />
            ))}
          </div>
        ) : placements.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">
              No placements yet for this referral
            </p>
            <Button
              variant="healthcare"
              onClick={() =>
                router.push(`/case-manager/placements/create?referralId=${referralId}`)
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Placement
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {placements.map((placement) => (
              <PlacementItem
                key={placement.id}
                placement={placement}
                onView={handleViewPlacement}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


