"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useCaseManagerId } from "@/hooks/use-case-manager-data";
import { usePageMetadata } from "../use-page-metadata";
import { referralService, Referral, Urgency, ReferralStatus } from "@/lib/api";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  UrgentCasesHeader,
  UrgentCasesStats,
  UrgentCasesFilters,
  UrgentCaseCard,
  UrgentCasesEmptyState,
} from "./components";
import { CaseManagerLoadingState, CaseManagerErrorState } from "@/components/case-manager";
import { RequirePermission } from "@/components/auth/require-permission";
import { CASE_MANAGER_CAPABILITIES } from "@/lib/permissions/capabilities";

function UrgentCasesPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const caseManagerId = useCaseManagerId();
  const { setTitle, setDescription } = usePageMetadata();

  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    setTitle("Urgent Cases");
    setDescription("Review and manage urgent referrals requiring immediate attention");
  }, [setTitle, setDescription]);

  const fetchUrgentReferrals = useCallback(async () => {
    if (!caseManagerId && !user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await referralService.getReferrals({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        urgency: urgencyFilter !== "all" ? (urgencyFilter as Urgency) : undefined,
        status: statusFilter !== "all" ? (statusFilter as ReferralStatus) : undefined,
      });

      if (response.success && response.data) {
        // Filter for urgent and high priority only
        const urgentReferrals = response.data.referrals.filter(
          (r) => r.urgency === Urgency.URGENT || r.urgency === Urgency.HIGH
        );

        setReferrals(urgentReferrals);

        if (response.data.pagination) {
          setPagination((prev) => ({
            ...prev,
            total: urgentReferrals.length,
            pages: Math.ceil(urgentReferrals.length / pagination.limit),
          }));
        }
      } else {
        setError(response.message || "Failed to load urgent referrals");
      }
    } catch (err) {
      console.error("Error fetching urgent referrals:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch urgent referrals"
      );
      toast.error("Failed to load urgent referrals");
    } finally {
      setIsLoading(false);
    }
  }, [caseManagerId, user?.id, debouncedSearch, urgencyFilter, statusFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchUrgentReferrals();
  }, [fetchUrgentReferrals]);

  // Calculate statistics
  const stats = useMemo(() => {
    const urgent = referrals.filter((r) => r.urgency === Urgency.URGENT).length;
    const high = referrals.filter((r) => r.urgency === Urgency.HIGH).length;
    
    const overdue = referrals.filter((r) => {
      if (!r.targetMoveDate) return false;
      return new Date(r.targetMoveDate) < new Date();
    }).length;

    return {
      urgent,
      high,
      overdue,
      total: referrals.length,
    };
  }, [referrals]);

  // Filter referrals (client-side for urgency/high priority)
  const filteredReferrals = useMemo(() => {
    return referrals.filter((referral) => {
      // Search filter
      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase();
        const matchesSearch =
          referral.referralNumber.toLowerCase().includes(searchLower) ||
          referral.clientInitials.toLowerCase().includes(searchLower) ||
          referral.preferredCounties.some((c) =>
            c.toLowerCase().includes(searchLower)
          );
        if (!matchesSearch) return false;
      }

      // Urgency filter
      if (urgencyFilter !== "all" && referral.urgency !== urgencyFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all" && referral.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [referrals, debouncedSearch, urgencyFilter, statusFilter]);

  const handleViewReferral = (referralId: string) => {
    router.push(`/case-manager/referrals/${referralId}`);
  };

  if (isLoading) {
    return <CaseManagerLoadingState message="Loading urgent cases..." fullHeight />;
  }

  if (error && referrals.length === 0) {
    return (
      <div className="space-y-6">
        <UrgentCasesHeader totalCount={0} />
        <CaseManagerErrorState
          title="Error Loading Urgent Cases"
          message={error}
          action={{
            label: "Retry",
            onClick: () => fetchUrgentReferrals(),
            variant: "healthcare",
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <UrgentCasesHeader totalCount={stats.total} />

      {/* Stats */}
      <UrgentCasesStats
        urgent={stats.urgent}
        high={stats.high}
        overdue={stats.overdue}
        total={stats.total}
      />

      {/* Filters */}
      <UrgentCasesFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        urgencyFilter={urgencyFilter}
        onUrgencyFilterChange={setUrgencyFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {/* Results */}
      {filteredReferrals.length === 0 ? (
        <UrgentCasesEmptyState />
      ) : (
        <div className="space-y-4">
          {filteredReferrals.map((referral) => (
            <UrgentCaseCard
              key={referral.id}
              referral={referral}
              onClick={() => handleViewReferral(referral.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
            }
            disabled={pagination.page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
            }
            disabled={pagination.page >= pagination.pages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

export default function UrgentCasesPage() {
  return (
    <RequirePermission
      permission={CASE_MANAGER_CAPABILITIES.REFERRALS_VIEW}
      title="Access Restricted"
      description="You don't have permission to view urgent cases."
    >
      <UrgentCasesPageContent />
    </RequirePermission>
  );
}

