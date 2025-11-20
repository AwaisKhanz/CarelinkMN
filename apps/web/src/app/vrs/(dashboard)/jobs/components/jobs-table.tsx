"use client";

import { DataTable } from "@/components/ui/data-table";
import { Loader2 } from "lucide-react";
import type { VRSJob } from "@/lib/api";
import { VRSEmptyState } from "@/components/vrs";
import { Briefcase } from "lucide-react";
import { useRouter } from "next/navigation";
import { useJobsColumns } from "../hooks/use-jobs-columns";

interface JobsTableProps {
  jobs: VRSJob[];
  isLoading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  onPageChange: (page: number) => void;
  searchQuery?: string;
  statusFilter?: string;
}

export function JobsTable({
  jobs,
  isLoading,
  pagination,
  onPageChange,
  searchQuery,
  statusFilter,
}: JobsTableProps) {
  const router = useRouter();
  const columns = useJobsColumns();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <VRSEmptyState
        icon={Briefcase}
        title="No jobs found"
        description={
          searchQuery || statusFilter !== "all"
            ? "Try adjusting your search or filters"
            : "Get started by adding your first job posting"
        }
        action={
          !searchQuery && statusFilter === "all"
            ? {
                label: "Add Job",
                onClick: () => router.push("/vrs/jobs/create"),
              }
            : undefined
        }
      />
    );
  }

  return (
    <DataTable
      columns={columns}
      data={jobs}
      currentPage={pagination.page}
      totalPages={pagination.pages}
      totalItems={pagination.total}
      pageSize={pagination.limit}
      onPageChange={onPageChange}
    />
  );
}

