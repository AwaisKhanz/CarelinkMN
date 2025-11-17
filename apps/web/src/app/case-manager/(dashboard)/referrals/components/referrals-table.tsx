"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Referral } from "@/lib/api";

interface ReferralsTableProps {
  columns: ColumnDef<Referral>[];
  referrals: Referral[];
  isLoading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  onPageChange: (page: number) => void;
  onRowClick: (referral: Referral) => void;
}

export function ReferralsTable({
  columns,
  referrals,
  isLoading,
  pagination,
  onPageChange,
  onRowClick,
}: ReferralsTableProps) {
  return (
    <DataTable
      columns={columns}
      data={referrals}
      isLoading={isLoading}
      variant="healthcare"
      enablePagination={true}
      pageSize={pagination.limit}
      currentPage={pagination.page}
      totalPages={pagination.pages}
      totalItems={pagination.total}
      onPageChange={onPageChange}
      onRowClick={onRowClick}
      emptyMessage="No referrals found. Create a new referral to get started."
    />
  );
}
