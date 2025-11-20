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
import type { VRSEmployer } from "@/lib/api";

export function useEmployersColumns() {
  const router = useRouter();

  const columns: ColumnDef<VRSEmployer>[] = useMemo(
    () => [
      {
        accessorKey: "companyName",
        header: "Company",
        cell: ({ row }) => {
          const employer = row.original;
          return (
            <div>
              <div className="font-medium">{employer.companyName}</div>
              <div className="text-sm text-muted-foreground">
                {employer.industry}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "location",
        header: "Location",
        cell: ({ row }) => {
          const employer = row.original;
          return (
            <div className="text-sm">
              {employer.city}, {employer.state}
            </div>
          );
        },
      },
      {
        accessorKey: "contact",
        header: "Contact",
        cell: ({ row }) => {
          const employer = row.original;
          return (
            <div>
              <div className="text-sm">{employer.contactName}</div>
              <div className="text-sm text-muted-foreground">
                {employer.contactEmail}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "features",
        header: "Features",
        cell: ({ row }) => {
          const employer = row.original;
          return (
            <div className="flex flex-wrap gap-1">
              {employer.isInclusive && (
                <Badge variant="outline" className="text-xs">
                  Inclusive
                </Badge>
              )}
              {employer.hasAccessibility && (
                <Badge variant="outline" className="text-xs">
                  Accessible
                </Badge>
              )}
              {employer.isSponsoredListing && (
                <Badge variant="healthcarePrimary" className="text-xs">
                  Sponsored
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "jobs",
        header: "Active Jobs",
        cell: ({ row }) => {
          const jobCount = row.original.jobs?.length || 0;
          return <div className="text-sm">{jobCount}</div>;
        },
      },
      {
        accessorKey: "createdAt",
        header: "Added",
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
          const employer = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => router.push(`/vrs/employers/${employer.id}`)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`/vrs/employers/${employer.id}/edit`)
                  }
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Employer
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

