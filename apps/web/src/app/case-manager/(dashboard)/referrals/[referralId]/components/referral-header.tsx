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
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <CardTitle className="text-2xl">
                Referral {referral.referralNumber}
              </CardTitle>
              <Badge variant={statusConfig.variant}>
                {statusConfig.label}
              </Badge>
              <Badge variant={urgencyConfig.variant}>
                {urgencyConfig.icon && (
                  <urgencyConfig.icon className="h-3 w-3 mr-1" />
                )}
                {urgencyConfig.label}
              </Badge>
            </div>
            <CardDescription className="text-base mt-2">
              Client: {referral.clientInitials} • Age {referral.clientAge} • {GENDER_LABELS[referral.clientGender] || referral.clientGender}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Target Move Date</p>
              <p className="font-medium">
                {referral.targetMoveDate
                  ? format(new Date(referral.targetMoveDate), "MMM d, yyyy")
                  : "Not set"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Primary Payer</p>
              <p className="font-medium">
                {PAYER_LABELS[referral.primaryPayer] || referral.primaryPayer}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Preferred Location</p>
              <p className="font-medium">
                {referral.preferredCounties.length > 0
                  ? referral.preferredCounties.join(", ")
                  : "Any"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Shortlisted Providers</p>
              <p className="font-medium">{shortlistCount}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


