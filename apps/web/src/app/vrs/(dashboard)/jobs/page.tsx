"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageMetadata } from "../use-page-metadata";
import { vrsService, type VRSJob, type VRSPlacement } from "@/lib/api";
import { toast } from "sonner";
import { JobStatus, RetentionStatus } from "@carelink/types";
import { useDebounce } from "@/hooks/use-debounce";
import { RequirePermission } from "@/components/auth/require-permission";
import { VRS_CAPABILITIES } from "@/lib/permissions/capabilities";
import {
  VRSLoadingState,
  VRSErrorState,
} from "@/components/vrs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  JobsHeader,
  JobsStats,
  PlacementsStats,
  JobsFilters,
  PlacementsFilters,
  JobsTable,
  PlacementsTable,
} from "./components";
import {
  useJobsStats,
  usePlacementsStats,
} from "./hooks";

function VRSJobsPageContent() {
  const router = useRouter();
  const { setTitle, setDescription } = usePageMetadata();

  const [jobs, setJobs] = useState<VRSJob[]>([]);
  const [placements, setPlacements] = useState<VRSPlacement[]>([]);
  const [activeTab, setActiveTab] = useState<"jobs" | "placements">("jobs");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState<string>("");
  const debouncedSearch = useDebounce(searchInput, 500);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [jobsPagination, setJobsPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [placementsPagination, setPlacementsPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    setTitle("Jobs & Placements");
    setDescription("Manage job postings and track client placements");
  }, [setTitle, setDescription]);

  const fetchJobs = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await vrsService.getJobs({
        page: jobsPagination.page,
        limit: jobsPagination.limit,
        search: debouncedSearch || undefined,
        status:
          statusFilter !== "all" ? (statusFilter as JobStatus) : undefined,
      });

      if (response.success && response.data) {
        setJobs(response.data.jobs);
        setJobsPagination((prev) => ({
          ...prev,
          total: response.data!.pagination.total,
          pages: response.data!.pagination.pages,
        }));
      } else {
        setError(response.message || "Failed to load jobs");
        toast.error(response.message || "Failed to load jobs");
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError(err instanceof Error ? err.message : "Failed to load jobs");
      toast.error("Failed to load jobs");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [jobsPagination.page, jobsPagination.limit, debouncedSearch, statusFilter]);

  const fetchPlacements = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await vrsService.getPlacements({
        page: placementsPagination.page,
        limit: placementsPagination.limit,
        status:
          statusFilter !== "all"
            ? (statusFilter as RetentionStatus)
            : undefined,
      });

      if (response.success && response.data) {
        setPlacements(response.data.placements);
        setPlacementsPagination((prev) => ({
          ...prev,
          total: response.data!.pagination.total,
          pages: response.data!.pagination.pages,
        }));
      } else {
        setError(response.message || "Failed to load placements");
        toast.error(response.message || "Failed to load placements");
      }
    } catch (err) {
      console.error("Error fetching placements:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load placements"
      );
      toast.error("Failed to load placements");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [
    placementsPagination.page,
    placementsPagination.limit,
    statusFilter,
  ]);

  useEffect(() => {
    if (activeTab === "jobs") {
      fetchJobs();
    } else {
      fetchPlacements();
    }
  }, [activeTab, fetchJobs, fetchPlacements]);

  // Reset page when filters change
  useEffect(() => {
    if (activeTab === "jobs") {
      setJobsPagination((prev) => ({ ...prev, page: 1 }));
    } else {
      setPlacementsPagination((prev) => ({ ...prev, page: 1 }));
    }
  }, [debouncedSearch, statusFilter, activeTab]);

  const handleRefresh = useCallback(() => {
    if (activeTab === "jobs") {
      fetchJobs(true);
    } else {
      fetchPlacements(true);
    }
  }, [activeTab, fetchJobs, fetchPlacements]);

  const handleJobsPageChange = useCallback((newPage: number) => {
    setJobsPagination((prev) => ({ ...prev, page: newPage }));
  }, []);

  const handlePlacementsPageChange = useCallback((newPage: number) => {
    setPlacementsPagination((prev) => ({ ...prev, page: newPage }));
  }, []);

  // Calculate stats using hooks
  const jobsStats = useJobsStats({
    jobs,
    totalCount: jobsPagination.total,
  });

  const placementsStats = usePlacementsStats({
    placements,
    totalCount: placementsPagination.total,
  });

  if (
    isLoading &&
    (activeTab === "jobs" ? jobs.length === 0 : placements.length === 0)
  ) {
    return <VRSLoadingState message={`Loading ${activeTab}...`} />;
  }

  if (
    error &&
    (activeTab === "jobs" ? jobs.length === 0 : placements.length === 0)
  ) {
    return (
      <VRSErrorState
        message={error}
        action={{
          label: "Retry",
          onClick: handleRefresh,
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <JobsHeader
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        canCreate={true}
      />

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "jobs" | "placements")}
      >
        <TabsList>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="placements">Placements</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-6 mt-6">
          <JobsStats stats={jobsStats} />
          <JobsFilters
            searchQuery={searchInput}
            onSearchChange={setSearchInput}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
          <JobsTable
            jobs={jobs}
            isLoading={isLoading}
            pagination={jobsPagination}
            onPageChange={handleJobsPageChange}
            searchQuery={debouncedSearch}
            statusFilter={statusFilter}
          />
        </TabsContent>

        <TabsContent value="placements" className="space-y-6 mt-6">
          <PlacementsStats stats={placementsStats} />
          <PlacementsFilters
            searchQuery={searchInput}
            onSearchChange={setSearchInput}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
          <PlacementsTable
            placements={placements}
            isLoading={isLoading}
            pagination={placementsPagination}
            onPageChange={handlePlacementsPageChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function VRSJobsPage() {
  return (
    <RequirePermission
      permission={VRS_CAPABILITIES.PLACEMENTS_VIEW}
      title="Access Restricted"
      description="You don't have permission to view jobs and placements."
    >
      <VRSJobsPageContent />
    </RequirePermission>
  );
}
