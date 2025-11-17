"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";
import { Referral } from "@/lib/api";
import { GENDER_LABELS } from "@/lib/constants";

interface ClientInfoCardProps {
  referral: Referral;
}

export function ClientInfoCard({ referral }: ClientInfoCardProps) {
  return (
    <Card variant="healthcare">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Client Information
        </CardTitle>
        <CardDescription>
          De-identified client profile
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Initials</p>
            <p className="font-medium">{referral.clientInitials}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Age</p>
            <p className="font-medium">{referral.clientAge} years</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Gender</p>
            <p className="font-medium">
              {GENDER_LABELS[referral.clientGender] || referral.clientGender}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


