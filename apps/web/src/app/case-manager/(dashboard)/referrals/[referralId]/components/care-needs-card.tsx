"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { Referral } from "@/lib/api";

interface CareNeedsCardProps {
  referral: Referral;
}

export function CareNeedsCard({ referral }: CareNeedsCardProps) {
  return (
    <Card variant="healthcare">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Care Needs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {referral.careLevels.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Care Levels</p>
            <div className="flex flex-wrap gap-2">
              {referral.careLevels.map((level) => (
                <Badge key={level} variant="healthcareInfo">
                  {level}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {referral.servicesNeeded.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Services Needed</p>
            <div className="flex flex-wrap gap-2">
              {referral.servicesNeeded.map((service) => (
                <Badge key={service} variant="healthcareSecondary">
                  {service}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {referral.mobilityLevel && (
          <div>
            <p className="text-sm text-muted-foreground">Mobility Level</p>
            <p className="font-medium">{referral.mobilityLevel}</p>
          </div>
        )}
        {referral.behavioralNeeds.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Behavioral Needs</p>
            <div className="flex flex-wrap gap-2">
              {referral.behavioralNeeds.map((need) => (
                <Badge key={need} variant="outline">
                  {need}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {referral.medicalNeeds.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Medical Needs</p>
            <div className="flex flex-wrap gap-2">
              {referral.medicalNeeds.map((need) => (
                <Badge key={need} variant="outline">
                  {need}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


