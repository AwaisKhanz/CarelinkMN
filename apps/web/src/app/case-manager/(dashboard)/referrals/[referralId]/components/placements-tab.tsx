"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Package } from "lucide-react";
import { PlacementItem } from "./placement-item";
import { CreatePlacementDialog } from "./create-placement-dialog";
import type { Placement, ReferralShortlist } from "@/lib/api";

interface PlacementsTabProps {
  referralId: string;
  placements: Placement[];
  isLoading: boolean;
  shortlist?: ReferralShortlist[];
  onRefresh?: () => void;
}

export function PlacementsTab({
  referralId,
  placements,
  isLoading,
  shortlist = [],
  onRefresh,
}: PlacementsTabProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Check if there are any providers who have responded
  const hasRespondedProviders = shortlist.some((s) => s.status === "RESPONDED");

  const handlePlacementCreated = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

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
    <>
      <Card variant="healthcare">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Placements</CardTitle>
              <CardDescription>
                Placements created from this referral
              </CardDescription>
            </div>
            {hasRespondedProviders && (
              <Button
                variant="healthcare"
                size="sm"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
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
              <p className="text-muted-foreground mb-4">
                {hasRespondedProviders
                  ? "Create a placement from one of the providers who responded to this referral."
                  : "Wait for providers to respond before creating a placement."}
              </p>
              {hasRespondedProviders && (
                <Button
                  variant="healthcare"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Placement
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {placements.map((placement) => (
                <PlacementItem 
                  key={placement.id} 
                  placement={placement}
                  onView={(placementId) => {
                    // Navigate to placement detail page
                    window.location.href = `/case-manager/placements/${placementId}`;
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreatePlacementDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        referralId={referralId}
        shortlist={shortlist}
        onSuccess={handlePlacementCreated}
      />
    </>
  );
}
