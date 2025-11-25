"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageMetadata } from "../use-page-metadata";
import { vrsService, type VRSEmployer } from "@/lib/api";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";
import { RequirePermission } from "@/components/auth/require-permission";
import { VRS_CAPABILITIES } from "@/lib/permissions/capabilities";
import { LoadingState, ErrorState } from "@/components/shared";
import {
  EmployersHeader,
  EmployersStats,
  EmployersFilters,
  EmployersTable,
} from "./components";
import { useEmployersStats } from "./hooks";

function VRSEmployersPageContent() {
  const router = useRouter();
  const { setTitle, setDescription } = usePageMetadata();

  const [employers, setEmployers] = useState<VRSEmployer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState<string>("");
  const debouncedSearch = useDebounce(searchInput, 500);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    setTitle("VRS Employers");
    setDescription("Manage employer relationships and job opportunities");
  }, [setTitle, setDescription]);

  const fetchEmployers = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await vrsService.getEmployers({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
      });

      if (response.success && response.data) {
        setEmployers(response.data.employers);
        setPagination((prev) => ({
          ...prev,
          total: response.data!.pagination.total,
          pages: response.data!.pagination.pages,
        }));
      } else {
        setError(response.message || "Failed to load employers");
        toast.error(response.message || "Failed to load employers");
      }
    } catch (err) {
      console.error("Error fetching employers:", err);
      setError(err instanceof Error ? err.message : "Failed to load employers");
      toast.error("Failed to load employers");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearch]);

  useEffect(() => {
    fetchEmployers();
  }, [fetchEmployers]);

  // Reset page when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [debouncedSearch]);

  const handleRefresh = useCallback(() => {
    fetchEmployers(true);
  }, [fetchEmployers]);

  const handlePageChange = useCallback((newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  }, []);

  // Calculate stats using hook
  const stats = useEmployersStats({
    employers,
    totalCount: pagination.total,
  });

  // Remove the full page loading check that hides filters
  // if (isLoading && employers.length === 0) {
  //   return <LoadingState message="Loading employers..." />;
  // }

  if (error && employers.length === 0) {
    return (
      <ErrorState
        title="Error Loading Employers"
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
      <EmployersHeader
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        canCreate={true}
      />

      <EmployersStats stats={stats} />

      <EmployersFilters
        searchQuery={searchInput}
        onSearchChange={setSearchInput}
      />

      <EmployersTable
        employers={employers}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={handlePageChange}
        searchQuery={debouncedSearch}
      />
    </div>
  );
}

export default function VRSEmployersPage() {
  return (
    <RequirePermission
      permission={VRS_CAPABILITIES.EMPLOYERS_VIEW}
      title="Access Restricted"
      description="You don't have permission to view VRS employers."
    >
      <VRSEmployersPageContent />
    </RequirePermission>
  );
}
