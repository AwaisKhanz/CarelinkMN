"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Clock, Building, CheckCircle2, Plus } from "lucide-react";
import { ProviderWithAvailability } from "@carelink/types";
import { referralService } from "@/lib/api";
import { toast } from "sonner";

interface ProviderSearchResultCardProps {
  provider: ProviderWithAvailability;
  isSelected: boolean;
  onSelect: () => void;
  onView: () => void;
  referralId?: string;
}

export function ProviderSearchResultCard({
  provider,
  isSelected,
  onSelect,
  onView,
  referralId,
}: ProviderSearchResultCardProps) {
  const handleAddToShortlist = async () => {
    if (!referralId) {
      toast.error("No referral selected");
      return;
    }

    try {
      const response = await referralService.addToShortlist(referralId, {
        providerIds: [provider.id],
      });

      if (response.success) {
        toast.success("Provider added to shortlist");
      } else {
        toast.error(
          response.message || "Failed to add provider to shortlist"
        );
      }
    } catch (err) {
      console.error("Error adding to shortlist:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to add to shortlist"
      );
    }
  };

  return (
    <Card
      variant="healthcare"
      className={isSelected ? "border-primary bg-primary/5" : ""}
    >
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          {/* Selection Checkbox */}
          {referralId && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              className="mt-1"
            />
          )}

          {/* Provider Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg mb-1">
                  {provider.organization?.name || "Unknown Provider"}
                </h3>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {provider.organization?.city || "N/A"},{" "}
                    {provider.organization?.county || "N/A"} County
                  </div>
                  {provider.responseTimeHours && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Avg. {provider.responseTimeHours}h response
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {provider.totalOpenings && provider.totalOpenings > 0 ? (
                  <Badge variant="healthcareSuccess">
                    {provider.totalOpenings} Opening
                    {provider.totalOpenings !== 1 ? "s" : ""}
                  </Badge>
                ) : (
                  <Badge variant="outline">Waitlist</Badge>
                )}
                {provider.verified && (
                  <Badge variant="healthcareInfo">Verified</Badge>
                )}
              </div>
            </div>

            {provider.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {provider.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 mb-3">
              {provider.openHomesCount !== undefined && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Building className="h-4 w-4" />
                  {provider.openHomesCount} Active Home
                  {provider.openHomesCount !== 1 ? "s" : ""}
                </div>
              )}
              {provider.licenses && provider.licenses.length > 0 && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                  {provider.licenses.length} License
                  {provider.licenses.length !== 1 ? "s" : ""}
                </div>
              )}
            </div>

            {/* License Types */}
            {provider.licenses && provider.licenses.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {provider.licenses.slice(0, 3).map((license) => (
                  <Badge key={license.id} variant="outline" className="text-xs">
                    {license.licenseType}
                  </Badge>
                ))}
                {provider.licenses.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{provider.licenses.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-border">
              <Button variant="outline" size="sm" onClick={onView}>
                View Details
              </Button>
              {referralId && (
                <Button variant="healthcare" size="sm" onClick={handleAddToShortlist}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Shortlist
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

