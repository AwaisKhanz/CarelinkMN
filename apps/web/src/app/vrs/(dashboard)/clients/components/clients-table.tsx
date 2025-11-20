"use client";

import { DataTable } from "@/components/ui/data-table";
import { Loader2 } from "lucide-react";
import type { VRSClient } from "@/lib/api";
import { VRSEmptyState } from "@/components/vrs";
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <VRSEmptyState
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
      currentPage={pagination.page}
      totalPages={pagination.pages}
      totalItems={pagination.total}
      pageSize={pagination.limit}
      onPageChange={onPageChange}
    />
  );
}

