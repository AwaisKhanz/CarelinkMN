"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Calendar, MapPin, Clock, ArrowRight } from "lucide-react";
import { Referral, Urgency } from "@carelink/types";
import { getUrgencyBadgeConfig, getReferralStatusBadgeConfig } from "@/lib/utils/case-manager";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface UrgentCaseCardProps {
  referral: Referral;
  onClick: () => void;
}

export function UrgentCaseCard({ referral, onClick }: UrgentCaseCardProps) {
  const isOverdue =
    referral.targetMoveDate &&
    new Date(referral.targetMoveDate) < new Date();
  const isUrgent = referral.urgency === Urgency.URGENT;
  const urgencyConfig = getUrgencyBadgeConfig(referral.urgency);
  const statusConfig = getReferralStatusBadgeConfig(referral.status);

  const daysUntilMoveDate = referral.targetMoveDate
    ? Math.ceil(
        (new Date(referral.targetMoveDate).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <Card
      variant="healthcare"
      className={cn(
        "cursor-pointer hover:shadow-md transition-all",
        isUrgent && "border-warning bg-warning/5",
        isOverdue && "border-destructive bg-destructive/5"
      )}
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              <div
                className={cn(
                  "p-2 rounded-lg shrink-0",
                  isUrgent && "bg-warning/20",
                  isOverdue && "bg-destructive/20",
                  !isUrgent && !isOverdue && "bg-primary/20"
                )}
              >
                <AlertTriangle
                  className={cn(
                    "h-5 w-5",
                    isUrgent && "text-warning",
                    isOverdue && "text-destructive",
                    !isUrgent && !isOverdue && "text-primary"
                  )}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">
                    {referral.clientInitials} • Age {referral.clientAge}
                  </h3>
                  <Badge
                    variant={urgencyConfig.variant}
                    className="shrink-0"
                  >
                    {urgencyConfig.label}
                  </Badge>
                  {isOverdue && (
                    <Badge variant="healthcareError" className="shrink-0">
                      Overdue
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Referral #{referral.referralNumber}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2 mb-4">
              {referral.targetMoveDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Target Move Date:</span>
                  <span className="font-medium">
                    {format(new Date(referral.targetMoveDate), "MMM d, yyyy")}
                  </span>
                  {daysUntilMoveDate !== null && (
                    <span
                      className={cn(
                        "font-medium",
                        isOverdue
                          ? "text-destructive"
                          : daysUntilMoveDate <= 2
                          ? "text-warning"
                          : "text-muted-foreground"
                      )}
                    >
                      ({daysUntilMoveDate > 0
                        ? `${daysUntilMoveDate} days`
                        : `${Math.abs(daysUntilMoveDate)} days ago`})
                    </span>
                  )}
                </div>
              )}

              {referral.preferredCounties.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium">
                    {referral.preferredCounties.join(", ")}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Created:</span>
                <span className="font-medium">
                  {formatDistanceToNow(new Date(referral.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>

            {/* Status and Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <Badge variant={statusConfig.variant}>
                {statusConfig.label}
              </Badge>
              <Button variant="ghost" size="sm">
                View Details
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

