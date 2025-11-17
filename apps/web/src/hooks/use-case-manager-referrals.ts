"use client";

/**
 * Shared hook for fetching case manager referrals
 * Centralizes referral list fetching with filters and pagination.
 */

import { useState, useEffect, useCallback } from "react";
import { referralService, type Referral, ReferralStatus, Urgency, Payer } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useCaseManagerId } from "@/hooks/use-case-manager-data";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "sonner";

export interface UseCaseManagerReferralsParams {
  initialPage?: number;
  initialLimit?: number;
}

export interface UseCaseManagerReferralsResult {
  referrals: Referral[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  // filters
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  urgencyFilter: string;
  setUrgencyFilter: (value: string) => void;
  payerFilter: string;
  setPayerFilter: (value: string) => void;
  searchInput: string;
  setSearchInput: (value: string) => void;
  // pagination
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  setPagination: React.Dispatch<
    React.SetStateAction<{
      page: number;
      limit: number;
      total: number;
      pages: number;
    }>
  >;
  // actions
  refetch: () => Promise<void>;
}

export function useCaseManagerReferrals(
  params: UseCaseManagerReferralsParams = {}
): UseCaseManagerReferralsResult {
  const { initialPage = 1, initialLimit = 20 } = params;
  const { user } = useAuth();
  const caseManagerId = useCaseManagerId();

  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [payerFilter, setPayerFilter] = useState<string>("all");
  const [searchInput, setSearchInput] = useState<string>("");
  const debouncedSearch = useDebounce(searchInput, 500);

  const [pagination, setPagination] = useState({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    pages: 0,
  });

  const fetchReferrals = useCallback(async () => {
    if (!caseManagerId && !user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const query = {
        page: pagination.page,
        limit: pagination.limit,
        status:
          statusFilter !== "all" ? (statusFilter as ReferralStatus) : undefined,
        urgency:
          urgencyFilter !== "all" ? (urgencyFilter as Urgency) : undefined,
        primaryPayer:
          payerFilter !== "all" ? (payerFilter as Payer) : undefined,
        search: debouncedSearch || undefined,
      };

      const response = await referralService.getReferrals(query);

      if (response.success && response.data) {
        setReferrals(response.data.referrals || []);
        if (response.data?.pagination) {
          setPagination((prev) => ({
            ...prev,
            page: response.data?.pagination?.page || prev.page,
            limit: response.data?.pagination?.limit || prev.limit,
            total: response.data?.pagination?.total || 0,
            pages: response.data?.pagination?.pages || 0,
          }));
        }
      } else {
        setError(response.message || "Failed to load referrals");
      }
    } catch (err) {
      console.error("Error fetching referrals:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch referrals"
      );
      toast.error("Failed to load referrals");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [
    caseManagerId,
    user?.id,
    statusFilter,
    urgencyFilter,
    payerFilter,
    debouncedSearch,
    pagination.page,
    pagination.limit,
  ]);

  useEffect(() => {
    if (caseManagerId || user?.id) {
      fetchReferrals();
    }
  }, [caseManagerId, user?.id, fetchReferrals]);

  const refetch = useCallback(async () => {
    setIsRefreshing(true);
    await fetchReferrals();
  }, [fetchReferrals]);

  return {
    referrals,
    isLoading,
    isRefreshing,
    error,
    statusFilter,
    setStatusFilter,
    urgencyFilter,
    setUrgencyFilter,
    payerFilter,
    setPayerFilter,
    searchInput,
    setSearchInput,
    pagination,
    setPagination,
    refetch,
  };
}


