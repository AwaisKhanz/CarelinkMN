"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { Referral } from "@/lib/api";
import { PAYER_LABELS } from "@/lib/constants";

interface PayerInfoCardProps {
  referral: Referral;
}

export function PayerInfoCard({ referral }: PayerInfoCardProps) {
  return (
    <Card variant="healthcare">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Payer Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <p className="text-sm text-muted-foreground">Primary Payer</p>
            <p className="font-medium">
              {PAYER_LABELS[referral.primaryPayer] || referral.primaryPayer}
            </p>
          </div>
          {referral.secondaryPayer && (
            <div>
              <p className="text-sm text-muted-foreground">Secondary Payer</p>
              <p className="font-medium">
                {PAYER_LABELS[referral.secondaryPayer] || referral.secondaryPayer}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


