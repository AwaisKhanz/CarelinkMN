"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import type { VRSClient } from "@/lib/api";
import { getVRSClientStatusBadgeConfig } from "@/lib/utils/vrs";

export function useClientsColumns() {
  const router = useRouter();

  const columns: ColumnDef<VRSClient>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Client",
        cell: ({ row }) => {
          const client = row.original;
          return (
            <div>
              <div className="font-medium">
                {client.firstName} {client.lastName}
              </div>
              <div className="text-sm text-muted-foreground">
                {format(new Date(client.dateOfBirth), "MMM d, yyyy")}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "eligibilityType",
        header: "Eligibility",
        cell: ({ row }) => {
          return <div className="text-sm">{row.original.eligibilityType}</div>;
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const statusConfig = getVRSClientStatusBadgeConfig(
            row.original.status
          );
          return (
            <Badge variant={statusConfig.variant} className="whitespace-nowrap">
              {statusConfig.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "placements",
        header: "Placements",
        cell: ({ row }) => {
          const placementCount = row.original.placements?.length || 0;
          return <div className="text-sm">{placementCount}</div>;
        },
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => {
          return (
            <div className="text-sm text-muted-foreground">
              {format(new Date(row.original.createdAt), "MMM d, yyyy")}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const client = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => router.push(`/vrs/clients/${client.id}`)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push(`/vrs/clients/${client.id}/edit`)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Client
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [router]
  );

  return columns;
}
