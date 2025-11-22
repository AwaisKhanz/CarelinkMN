"use client";

import { DataTable } from "@/components/ui/data-table";
import { LoadingState, EmptyState } from "@/components/shared";
import type { VRSPlacement } from "@/lib/api";
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
    return <LoadingState message="Loading placements..." />;
  }

  if (placements.length === 0) {
    return (
      <EmptyState
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

