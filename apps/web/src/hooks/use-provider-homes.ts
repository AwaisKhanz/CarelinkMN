/**
 * Provider homes hook
 * Manages homes data fetching with caching
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useProviderId } from "@/hooks/use-provider-data";
import { homeService, Home, ProviderHomesResponse } from "@/lib/api";
import { MAX_OPENINGS_FETCH_LIMIT } from "@carelink/utils";

interface UseProviderHomesResult {
  homes: Home[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastFetched: Date | null;
}

// Simple in-memory cache
const homesCache = new Map<
  string,
  {
    data: Home[];
    timestamp: Date;
  }
>();

const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Hook to fetch and cache provider homes data
 */
export function useProviderHomes(
  options?: {
    refresh?: boolean; // Force refresh even if cached
  }
): UseProviderHomesResult {
  const providerId = useProviderId();
  const [homes, setHomes] = useState<Home[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchHomes = useCallback(async () => {
    if (!providerId) {
      setHomes([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    // Check cache unless forced refresh
    if (!options?.refresh) {
      const cached = homesCache.get(providerId);
      if (cached) {
        const age = Date.now() - cached.timestamp.getTime();
        if (age < CACHE_TTL_MS) {
          setHomes(cached.data);
          setLastFetched(cached.timestamp);
          setError(null);
          setIsLoading(false);
          return;
        }
      }
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await homeService.getProviderHomes(providerId, {
        page: 1,
        limit: MAX_OPENINGS_FETCH_LIMIT,
      });

      if (response.success && response.data) {
        const homesData = (response.data as ProviderHomesResponse).homes ?? [];
        setHomes(homesData);
        const now = new Date();
        setLastFetched(now);

        // Update cache
        homesCache.set(providerId, {
          data: homesData,
          timestamp: now,
        });
      } else {
        throw new Error(response.message || "Failed to fetch homes");
      }
    } catch (err) {
      console.error("Error fetching homes:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch homes";
      setError(errorMessage);
      setHomes([]);
    } finally {
      setIsLoading(false);
    }
  }, [providerId, options?.refresh]);

  useEffect(() => {
    fetchHomes();
  }, [fetchHomes]);

  return {
    homes,
    isLoading,
    error,
    refetch: fetchHomes,
    lastFetched,
  };
}
