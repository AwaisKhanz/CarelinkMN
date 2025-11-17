"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export function UrgentCasesEmptyState() {
  const router = useRouter();

  return (
    <Card variant="healthcare">
      <CardContent className="pt-12 pb-12">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No Urgent Cases</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Great news! There are no urgent referrals requiring immediate attention at this time.
          </p>
          <Button
            variant="healthcare"
            onClick={() => router.push("/case-manager/referrals")}
          >
            View All Referrals
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

