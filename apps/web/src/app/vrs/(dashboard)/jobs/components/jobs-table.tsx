"use client";

import { DataTable } from "@/components/ui/data-table";
import { LoadingState, EmptyState } from "@/components/shared";
import type { VRSJob } from "@/lib/api";
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

  // Remove blocking loading state
  // if (isLoading) {
  //   return <LoadingState message="Loading jobs..." />;
  // }

  if (jobs.length === 0 && !isLoading) {
    return (
      <EmptyState
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
                icon: Briefcase,
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
      isLoading={isLoading}
      currentPage={pagination.page}
      totalPages={pagination.pages}
      totalItems={pagination.total}
      pageSize={pagination.limit}
      onPageChange={onPageChange}
    />
  );
}

