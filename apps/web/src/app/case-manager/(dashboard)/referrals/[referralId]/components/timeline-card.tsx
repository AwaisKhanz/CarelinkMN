"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format, formatDistanceToNow } from "date-fns";
import { Referral } from "@/lib/api";

interface TimelineCardProps {
  referral: Referral;
}

export function TimelineCard({ referral }: TimelineCardProps) {
  return (
    <Card variant="healthcare">
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground">Created</p>
          <p className="text-sm font-medium">
            {format(new Date(referral.createdAt), "MMM d, yyyy 'at' h:mm a")}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(referral.createdAt), {
              addSuffix: true,
            })}
          </p>
        </div>
        <Separator />
        <div>
          <p className="text-sm text-muted-foreground">Last Updated</p>
          <p className="text-sm font-medium">
            {format(new Date(referral.updatedAt), "MMM d, yyyy 'at' h:mm a")}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(referral.updatedAt), {
              addSuffix: true,
            })}
          </p>
        </div>
        {referral.placedAt && (
          <>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Placed</p>
              <p className="text-sm font-medium">
                {format(new Date(referral.placedAt), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </>
        )}
        {referral.closedAt && (
          <>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Closed</p>
              <p className="text-sm font-medium">
                {format(new Date(referral.closedAt), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}


