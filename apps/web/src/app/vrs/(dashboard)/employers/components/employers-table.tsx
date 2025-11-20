"use client";

import { DataTable } from "@/components/ui/data-table";
import { Loader2 } from "lucide-react";
import type { VRSEmployer } from "@/lib/api";
import { VRSEmptyState } from "@/components/vrs";
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (employers.length === 0) {
    return (
      <VRSEmptyState
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
      currentPage={pagination.page}
      totalPages={pagination.pages}
      totalItems={pagination.total}
      pageSize={pagination.limit}
      onPageChange={onPageChange}
    />
  );
}

