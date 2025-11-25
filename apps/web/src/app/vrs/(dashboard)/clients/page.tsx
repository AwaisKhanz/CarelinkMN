"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageMetadata } from "../use-page-metadata";
import { useSocket } from "@/contexts/socket-context";
import { vrsService, type VRSClient } from "@/lib/api";
import { toast } from "sonner";
import { VRSClientStatus, NotificationType } from "@carelink/types";
import { useDebounce } from "@/hooks/use-debounce";
import { RequirePermission } from "@/components/auth/require-permission";
import { VRS_CAPABILITIES } from "@/lib/permissions/capabilities";
import { LoadingState, ErrorState } from "@/components/shared";
import {
  ClientsHeader,
  ClientsStats,
  ClientsFilters,
  ClientsTable,
} from "./components";
import { useClientsStats } from "./hooks";

function VRSClientsPageContent() {
  const router = useRouter();
  const { setTitle, setDescription } = usePageMetadata();

  const [clients, setClients] = useState<VRSClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState<string>("");
  const debouncedSearch = useDebounce(searchInput, 500);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    setTitle("VRS Clients");
    setDescription("Manage your VRS clients and their job placements");
  }, [setTitle, setDescription]);

  const fetchClients = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await vrsService.getClients({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        status:
          statusFilter !== "all"
            ? (statusFilter as VRSClientStatus)
            : undefined,
      });

      if (response.success && response.data) {
        setClients(response.data.clients);
        setPagination((prev) => ({
          ...prev,
          total: response.data!.pagination.total,
          pages: response.data!.pagination.pages,
        }));
      } else {
        setError(response.message || "Failed to load clients");
        toast.error(response.message || "Failed to load clients");
      }
    } catch (err) {
      console.error("Error fetching clients:", err);
      setError(err instanceof Error ? err.message : "Failed to load clients");
      toast.error("Failed to load clients");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Listen for real-time updates
  const { socket } = useSocket();
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notification: any) => {
      // Refresh list on relevant notifications
      if (
        notification.type === NotificationType.CLIENT_UPDATE ||
        notification.type === NotificationType.JOB_MATCH ||
        notification.type === NotificationType.RETENTION_ALERT ||
        notification.type === NotificationType.PLACEMENT_SUCCESS
      ) {
        fetchClients(true);
      }
    };

    socket.on("notification:new", handleNotification);

    return () => {
      socket.off("notification:new", handleNotification);
    };
  }, [socket, fetchClients]);

  // Reset page when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [debouncedSearch, statusFilter]);

  const handleRefresh = useCallback(() => {
    fetchClients(true);
  }, [fetchClients]);

  const handlePageChange = useCallback((newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  }, []);

  // Calculate stats using hook
  const stats = useClientsStats({
    clients,
    totalCount: pagination.total,
  });

  // Remove the full page loading check that hides filters
  // if (isLoading && clients.length === 0) {
  //   return <LoadingState message="Loading clients..." />;
  // }

  if (error && clients.length === 0) {
    return (
      <ErrorState
        title="Error Loading Clients"
        message={error}
        action={{
          label: "Retry",
          onClick: handleRefresh,
          variant: "healthcare",
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <ClientsHeader
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        canCreate={true}
      />

      <ClientsStats stats={stats} />

      <ClientsFilters
        searchQuery={searchInput}
        onSearchChange={setSearchInput}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <ClientsTable
        clients={clients}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={handlePageChange}
        searchQuery={debouncedSearch}
      />
    </div>
  );
}

export default function VRSClientsPage() {
  return (
    <RequirePermission
      permission={VRS_CAPABILITIES.CLIENTS_VIEW}
      title="Access Restricted"
      description="You don't have permission to view VRS clients."
    >
      <VRSClientsPageContent />
    </RequirePermission>
  );
}
