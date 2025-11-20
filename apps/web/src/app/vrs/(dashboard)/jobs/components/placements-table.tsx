"use client";

import { DataTable } from "@/components/ui/data-table";
import { Loader2 } from "lucide-react";
import type { VRSPlacement } from "@/lib/api";
import { VRSEmptyState } from "@/components/vrs";
import { Users } from "lucide-react";
import { usePlacementsColumns } from "../hooks/use-placements-columns";

interface PlacementsTableProps {
  placements: VRSPlacement[];
  isLoading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  onPageChange: (page: number) => void;
}

export function PlacementsTable({
  placements,
  isLoading,
  pagination,
  onPageChange,
}: PlacementsTableProps) {
  const columns = usePlacementsColumns();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (placements.length === 0) {
    return (
      <VRSEmptyState
        icon={Users}
        title="No placements found"
        description="Placements will appear here once clients are matched with jobs"
      />
    );
  }

  return (
    <DataTable
      columns={columns}
      data={placements}
      currentPage={pagination.page}
      totalPages={pagination.pages}
      totalItems={pagination.total}
      pageSize={pagination.limit}
      onPageChange={onPageChange}
    />
  );
}

