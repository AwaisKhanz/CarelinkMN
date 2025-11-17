"use client";

import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface ReferralsHeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function ReferralsHeader({ onRefresh, isRefreshing }: ReferralsHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">My Cases</h1>
        <p className="text-muted-foreground mt-1">
          Manage your referrals and placements
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="healthcare"
          onClick={() => router.push("/case-manager/referrals/create")}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Referral
        </Button>
        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </>
          )}
        </Button>
      </div>
    </div>
  );
}


