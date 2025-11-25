"use client";

import { DataTable } from "@/components/ui/data-table";
import { LoadingState, EmptyState } from "@/components/shared";
import type { VRSEmployer } from "@/lib/api";
import { Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEmployersColumns } from "../hooks/use-employers-columns";

interface EmployersTableProps {
  employers: VRSEmployer[];
  isLoading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  onPageChange: (page: number) => void;
  searchQuery?: string;
}

export function EmployersTable({
  employers,
  isLoading,
  pagination,
  onPageChange,
  searchQuery,
}: EmployersTableProps) {
  const router = useRouter();
  const columns = useEmployersColumns();

  // Remove blocking loading state
  // if (isLoading) {
  //   return <LoadingState message="Loading employers..." />;
  // }

  if (employers.length === 0 && !isLoading) {
    return (
      <EmptyState
        icon={Building2}
        title="No employers found"
        description={
          searchQuery
            ? "Try adjusting your search"
            : "Get started by adding your first employer"
        }
        action={
          !searchQuery
            ? {
                label: "Add Employer",
                onClick: () => router.push("/vrs/employers/create"),
                icon: Building2,
              }
            : undefined
        }
      />
    );
  }

  return (
    <DataTable
      columns={columns}
      data={employers}
      isLoading={isLoading}
      currentPage={pagination.page}
      totalPages={pagination.pages}
      totalItems={pagination.total}
      pageSize={pagination.limit}
      onPageChange={onPageChange}
    />
  );
}

