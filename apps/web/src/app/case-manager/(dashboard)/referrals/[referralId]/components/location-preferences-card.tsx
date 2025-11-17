"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { Referral } from "@/lib/api";

interface LocationPreferencesCardProps {
  referral: Referral;
}

export function LocationPreferencesCard({ referral }: LocationPreferencesCardProps) {
  return (
    <Card variant="healthcare">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">Preferred Counties</p>
          <div className="flex flex-wrap gap-2">
            {referral.preferredCounties.length > 0 ? (
              referral.preferredCounties.map((county) => (
                <Badge key={county} variant="outline">
                  {county}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">No preference</span>
            )}
          </div>
        </div>
        {referral.preferredCities.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Preferred Cities</p>
            <div className="flex flex-wrap gap-2">
              {referral.preferredCities.map((city) => (
                <Badge key={city} variant="outline">
                  {city}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {referral.maxDistance && (
          <div>
            <p className="text-sm text-muted-foreground">Max Distance</p>
            <p className="font-medium">{referral.maxDistance} miles</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


