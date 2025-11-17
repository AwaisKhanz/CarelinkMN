"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Referral } from "@/lib/api";

interface InternalNotesCardProps {
  referral: Referral;
}

export function InternalNotesCard({ referral }: InternalNotesCardProps) {
  if (!referral.internalNotes) {
    return null;
  }

  return (
    <Card variant="healthcare">
      <CardHeader>
        <CardTitle>Internal Notes</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm whitespace-pre-wrap">
          {referral.internalNotes}
        </p>
      </CardContent>
    </Card>
  );
}


