"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, MapPin, Users } from "lucide-react";
import { format } from "date-fns";
import { Referral, ReferralShortlist } from "@/lib/api";
import { PAYER_LABELS, GENDER_LABELS } from "@/lib/constants";
import { getUrgencyBadgeConfig, getReferralStatusBadgeConfig } from "@/lib/utils/case-manager";

interface ReferralHeaderProps {
  referral: Referral;
  shortlistCount: number;
}

export function ReferralHeader({ referral, shortlistCount }: ReferralHeaderProps) {
  const urgencyConfig = getUrgencyBadgeConfig(referral.urgency);
  const statusConfig = getReferralStatusBadgeConfig(referral.status);

  return (
    <Card variant="healthcare">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <CardTitle className="text-xl sm:text-2xl break-words">
                Referral {referral.referralNumber}
              </CardTitle>
              <Badge variant={statusConfig.variant} className="shrink-0">
                {statusConfig.label}
              </Badge>
              <Badge variant={urgencyConfig.variant} className="shrink-0">
                {urgencyConfig.icon && (
                  <urgencyConfig.icon className="h-3 w-3 mr-1" />
                )}
                {urgencyConfig.label}
              </Badge>
            </div>
            <CardDescription className="text-sm sm:text-base mt-2 break-words">
              Client: {referral.clientInitials} • Age {referral.clientAge} • {GENDER_LABELS[referral.clientGender] || referral.clientGender}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">Target Move Date</p>
              <p className="font-medium break-words">
                {referral.targetMoveDate
                  ? format(new Date(referral.targetMoveDate), "MMM d, yyyy")
                  : "Not set"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">Primary Payer</p>
              <p className="font-medium break-words">
                {PAYER_LABELS[referral.primaryPayer] || referral.primaryPayer}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">Preferred Location</p>
              <p className="font-medium break-words">
                {referral.preferredCounties.length > 0
                  ? referral.preferredCounties.join(", ")
                  : "Any"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">Shortlisted Providers</p>
              <p className="font-medium">{shortlistCount}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
