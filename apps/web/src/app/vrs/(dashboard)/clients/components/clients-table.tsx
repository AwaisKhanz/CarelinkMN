"use client";

import { DataTable } from "@/components/ui/data-table";
import { LoadingState, EmptyState } from "@/components/shared";
import type { VRSClient } from "@/lib/api";
import { Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useClientsColumns } from "../hooks/use-clients-columns";

interface ClientsTableProps {
  clients: VRSClient[];
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

export function ClientsTable({
  clients,
  isLoading,
  pagination,
  onPageChange,
  searchQuery,
}: ClientsTableProps) {
  const router = useRouter();
  const columns = useClientsColumns();

  // Remove blocking loading state
  // if (isLoading) {
  //   return <LoadingState message="Loading clients..." />;
  // }

  if (clients.length === 0 && !isLoading) {
    return (
      <EmptyState
        icon={Users}
        title="No clients found"
        description={
          searchQuery
            ? "Try adjusting your search or filters"
            : "Get started by adding your first client"
        }
        action={
          !searchQuery
            ? {
                label: "Add Client",
                onClick: () => router.push("/vrs/clients/create"),
                icon: Users,
              }
            : undefined
        }
      />
    );
  }

  return (
    <DataTable
      columns={columns}
      data={clients}
      isLoading={isLoading}
      currentPage={pagination.page}
      totalPages={pagination.pages}
      totalItems={pagination.total}
      pageSize={pagination.limit}
      onPageChange={onPageChange}
    />
  );
}

