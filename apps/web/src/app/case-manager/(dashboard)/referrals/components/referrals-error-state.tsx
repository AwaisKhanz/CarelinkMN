"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ReferralsErrorStateProps {
  error: string;
  onRetry: () => void;
}

export function ReferralsErrorState({ error, onRetry }: ReferralsErrorStateProps) {
  return (
    <Card variant="healthcare" className="border-destructive/50 bg-destructive/5">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-foreground mb-1">Error Loading Referrals</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <Button size="sm" onClick={onRetry}>
            Retry
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


