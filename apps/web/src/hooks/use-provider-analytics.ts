/**
 * Provider analytics hook
 * Manages analytics data fetching with caching
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useProviderId } from "@/hooks/use-provider-data";
import { analyticsService, ProviderAnalytics } from "@/lib/api";
import { useSubscription } from "@/hooks/use-subscription";
import { useSubscriptionContext } from "@/contexts/subscription-context";
import { PLAN_HIERARCHY } from "@/lib/constants/subscription";

interface UseProviderAnalyticsResult {
  analytics: ProviderAnalytics | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastFetched: Date | null;
}

// Simple in-memory cache (can be replaced with React Query later)
const analyticsCache = new Map<
  string,
  {
    data: ProviderAnalytics;
    timestamp: Date;
  }
>();

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Hook to fetch and cache provider analytics data
 * Only fetches if provider has PRO or higher plan
 */
export function useProviderAnalytics(): UseProviderAnalyticsResult {
  const providerId = useProviderId();
  const { tier } = useSubscription();
  const { hasMinimumTier } = useSubscriptionContext();
  const [analytics, setAnalytics] = useState<ProviderAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const hasAccess = useMemo(() => {
    if (!providerId) return false;
    // Analytics requires PRO or higher
    return PLAN_HIERARCHY[tier] >= PLAN_HIERARCHY.PRO;
  }, [providerId, tier]);

  const fetchAnalytics = useCallback(async () => {
    if (!providerId || !hasAccess) {
      setAnalytics(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    // Check cache
    const cached = analyticsCache.get(providerId);
    if (cached) {
      const age = Date.now() - cached.timestamp.getTime();
      if (age < CACHE_TTL_MS) {
        setAnalytics(cached.data);
        setLastFetched(cached.timestamp);
        setError(null);
        setIsLoading(false);
        return;
      }
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await analyticsService.getProviderAnalytics({ providerId });
      
      if (response.success && response.data) {
        const data = response.data;
        setAnalytics(data);
        const now = new Date();
        setLastFetched(now);
        
        // Update cache
        analyticsCache.set(providerId, {
          data,
          timestamp: now,
        });
      } else {
        throw new Error(response.message || "Failed to fetch analytics");
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch analytics";
      setError(errorMessage);
      setAnalytics(null);
    } finally {
      setIsLoading(false);
    }
  }, [providerId, hasAccess]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    isLoading,
    error,
    refetch: fetchAnalytics,
    lastFetched,
  };
}
