"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import type { VRSPlacement } from "@/lib/api";
import { getVRSRetentionStatusBadgeConfig } from "@/lib/utils/vrs";

export function usePlacementsColumns() {
  const router = useRouter();

  const columns: ColumnDef<VRSPlacement>[] = useMemo(
    () => [
      {
        accessorKey: "client",
        header: "Client",
        cell: ({ row }) => {
          const placement = row.original;
          return (
            <div>
              <div className="font-medium">
                {placement.client
                  ? `${placement.client.firstName} ${placement.client.lastName}`
                  : "Unknown Client"}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "job",
        header: "Job",
        cell: ({ row }) => {
          const placement = row.original;
          return (
            <div>
              <div className="font-medium">
                {placement.job?.title || "Unknown Job"}
              </div>
              <div className="text-sm text-muted-foreground">
                {placement.job?.employer?.companyName || "Unknown Employer"}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "placementDate",
        header: "Placement Date",
        cell: ({ row }) => {
          const placement = row.original;
          return (
            <div className="text-sm">
              <div>{format(new Date(placement.placementDate), "MMM d, yyyy")}</div>
              {placement.startDate && (
                <div className="text-xs text-muted-foreground">
                  Started: {format(new Date(placement.startDate), "MMM d, yyyy")}
                </div>
              )}
              {placement.endDate && (
                <div className="text-xs text-muted-foreground">
                  Ended: {format(new Date(placement.endDate), "MMM d, yyyy")}
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "retention",
        header: "90-Day Status",
        cell: ({ row }) => {
          const placement = row.original;
          if (!placement.day90Status) {
            return <Badge variant="outline">Pending</Badge>;
          }
          const statusConfig = getVRSRetentionStatusBadgeConfig(
            placement.day90Status
          );
          return (
            <Badge variant={statusConfig.variant} className="whitespace-nowrap">
              {statusConfig.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "endReason",
        header: "End Reason",
        cell: ({ row }) => {
          const placement = row.original;
          return placement.endReason ? (
            <div className="text-sm">{placement.endReason}</div>
          ) : (
            <div className="text-sm text-muted-foreground">—</div>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const placement = row.original;
          return (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push(`/vrs/placements/${placement.id}/retention`)
              }
            >
              Update Retention
            </Button>
          );
        },
      },
    ],
    [router]
  );

  return columns;
}

