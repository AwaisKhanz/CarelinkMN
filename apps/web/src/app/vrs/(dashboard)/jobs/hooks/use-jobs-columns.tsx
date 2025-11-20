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
import type { VRSJob } from "@/lib/api";
import { getVRSJobStatusBadgeConfig } from "@/lib/utils/vrs";

export function useJobsColumns() {
  const router = useRouter();

  const columns: ColumnDef<VRSJob>[] = useMemo(
    () => [
      {
        accessorKey: "title",
        header: "Job Title",
        cell: ({ row }) => {
          const job = row.original;
          return (
            <div>
              <div className="font-medium">{job.title}</div>
              <div className="text-sm text-muted-foreground">
                {job.employer?.companyName || "Unknown Employer"}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "employmentType",
        header: "Type",
        cell: ({ row }) => {
          return (
            <div className="text-sm">{row.original.employmentType}</div>
          );
        },
      },
      {
        accessorKey: "wage",
        header: "Wage",
        cell: ({ row }) => {
          const job = row.original;
          const wage =
            typeof job.wage === "string" ? parseFloat(job.wage) : job.wage;
          return (
            <div className="text-sm">
              ${wage.toFixed(2)}/{job.wageType.toLowerCase()}
            </div>
          );
        },
      },
      {
        accessorKey: "location",
        header: "Location",
        cell: ({ row }) => {
          const job = row.original;
          return (
            <div className="text-sm">
              {job.isRemote ? (
                <Badge variant="outline">Remote</Badge>
              ) : (
                job.location || "Not specified"
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const statusConfig = getVRSJobStatusBadgeConfig(row.original.status);
          return (
            <Badge variant={statusConfig.variant} className="whitespace-nowrap">
              {statusConfig.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "postedAt",
        header: "Posted",
        cell: ({ row }) => {
          return (
            <div className="text-sm text-muted-foreground">
              {format(new Date(row.original.postedAt), "MMM d, yyyy")}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const job = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => router.push(`/vrs/jobs/${job.id}`)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push(`/vrs/jobs/${job.id}/edit`)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Job
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

