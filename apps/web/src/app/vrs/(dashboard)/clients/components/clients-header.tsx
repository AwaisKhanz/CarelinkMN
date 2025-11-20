"use client";

import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface ClientsHeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  canCreate?: boolean;
}

export function ClientsHeader({
  onRefresh,
  isRefreshing,
  canCreate = true,
}: ClientsHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">VRS Clients</h1>
        <p className="text-muted-foreground mt-1">
          Manage your VRS clients and their job placements
        </p>
      </div>
      <div className="flex items-center gap-2">
        {canCreate && (
          <Button
            variant="healthcare"
            onClick={() => router.push("/vrs/clients/create")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        )}
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

