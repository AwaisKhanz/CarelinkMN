"use client";

import { Badge } from "@/components/ui/badge";
import { Calendar, Users } from "lucide-react";
import { format } from "date-fns";
import { Referral } from "@/lib/api";
import { PAYER_LABELS } from "@/lib/constants";
import { getUrgencyBadgeConfig } from "@/lib/utils/case-manager";

interface ReferralKanbanCardProps {
  referral: Referral;
  onClick: () => void;
}

export function ReferralKanbanCard({ referral, onClick }: ReferralKanbanCardProps) {
  return (
    <div
      className="p-3 bg-background border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">
            {referral.referralNumber}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {referral.clientInitials} • Age {referral.clientAge}
          </p>
        </div>
        <Badge
          variant={getUrgencyBadgeConfig(referral.urgency).variant}
          className="shrink-0 ml-1"
        >
          {getUrgencyBadgeConfig(referral.urgency).label}
        </Badge>
      </div>
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <Badge variant="outline" className="text-xs">
          {PAYER_LABELS[referral.primaryPayer] || referral.primaryPayer}
        </Badge>
        {referral.shortlist && referral.shortlist.length > 0 && (
          <Badge variant="outline" className="text-xs">
            <Users className="h-3 w-3 mr-1 inline" />
            {referral.shortlist.length}
          </Badge>
        )}
      </div>
      {referral.targetMoveDate && (
        <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {format(new Date(referral.targetMoveDate), "MMM d, yyyy")}
        </div>
      )}
    </div>
  );
}


