import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { dischargeCaseService } from '@/lib/api';
import {
  DischargeCase,
  DischargeCaseFilters,
  PaginatedDischargeCases,
  DischargeInvitation,
  DischargeChecklist,
  HospitalSWAnalytics,
} from '@carelink/types';

/**
 * Hook to get hospital SW user ID
 * This would fetch the hospital staff profile associated with the user
 */
export function useHospitalSWId(): string | null {
  const { user } = useAuth();
  // TODO: Implement hospital staff profile lookup
  // For now, return user ID if user is HOSPITAL_SW
  if (user?.role === 'HOSPITAL_SW') {
    return user.id;
  }
  return null;
}

/**
 * Hook to fetch discharge cases with filters
 */
export function useDischargeCases(filters?: DischargeCaseFilters) {
  const [cases, setCases] = useState<DischargeCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState<{
    total: number;
    pages: number;
    page: number;
    limit: number;
  } | null>(null);

  const fetchCases = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await dischargeCaseService.getDischargeCases(filters);
      if (response.success && response.data) {
        setCases(response.data.cases);
        setPagination(response.data.pagination);
      } else {
        setError(new Error(response.message || 'Failed to fetch discharge cases'));
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  return { cases, isLoading, error, pagination, refetch: fetchCases };
}

/**
 * Hook to fetch a single discharge case by ID
 */
export function useDischargeCase(caseId: string | null) {
  const [case_, setCase] = useState<DischargeCase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!caseId) {
      setCase(null);
      setIsLoading(false);
      return;
    }

    const fetchCase = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await dischargeCaseService.getDischargeCaseById(caseId);
        if (response.success && response.data) {
          setCase(response.data);
        } else {
          setError(new Error(response.message || 'Failed to fetch discharge case'));
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchCase();
  }, [caseId]);

  const refetch = useCallback(async () => {
    if (!caseId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await dischargeCaseService.getDischargeCaseById(caseId);
      if (response.success && response.data) {
        setCase(response.data);
      } else {
        setError(new Error(response.message || 'Failed to fetch discharge case'));
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [caseId]);

  return { case: case_, isLoading, error, refetch };
}

/**
 * Hook to fetch discharge case invitations
 */
export function useDischargeCaseInvitations(caseId: string | null) {
  const [invitations, setInvitations] = useState<DischargeInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!caseId) {
      setInvitations([]);
      setIsLoading(false);
      return;
    }

    const fetchInvitations = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await dischargeCaseService.getDischargeCaseInvitations(caseId);
        if (response.success && response.data) {
          setInvitations(response.data);
        } else {
          setError(new Error(response.message || 'Failed to fetch invitations'));
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvitations();
  }, [caseId]);

  const refetch = useCallback(async () => {
    if (!caseId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await dischargeCaseService.getDischargeCaseInvitations(caseId);
      if (response.success && response.data) {
        setInvitations(response.data);
      } else {
        setError(new Error(response.message || 'Failed to fetch invitations'));
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [caseId]);

  return { invitations, isLoading, error, refetch };
}

/**
 * Hook to fetch discharge checklist
 */
export function useDischargeChecklist(caseId: string | null) {
  const [checklist, setChecklist] = useState<DischargeChecklist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!caseId) {
      setChecklist(null);
      setIsLoading(false);
      return;
    }

    const fetchChecklist = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await dischargeCaseService.getDischargeChecklist(caseId);
        if (response.success && response.data) {
          setChecklist(response.data);
        } else {
          setError(new Error(response.message || 'Failed to fetch checklist'));
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchChecklist();
  }, [caseId]);

  const refetch = useCallback(async () => {
    if (!caseId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await dischargeCaseService.getDischargeChecklist(caseId);
      if (response.success && response.data) {
        setChecklist(response.data);
      } else {
        setError(new Error(response.message || 'Failed to fetch checklist'));
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [caseId]);

  return { checklist, isLoading, error, refetch };
}

/**
 * Hook to fetch Hospital SW analytics with caching
 */
interface UseHospitalSWAnalyticsResult {
  analytics: HospitalSWAnalytics | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastFetched: Date | null;
}

// Simple in-memory cache
const analyticsCache = new Map<
  string,
  {
    data: HospitalSWAnalytics;
    timestamp: Date;
  }
>();

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function useHospitalSWAnalytics(
  options?: {
    startDate?: Date | string;
    endDate?: Date | string;
    refresh?: boolean;
  }
): UseHospitalSWAnalyticsResult {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<HospitalSWAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const cacheKey = useMemo(() => {
    return `${user?.id || 'unknown'}-${options?.startDate || 'default'}-${options?.endDate || 'default'}`;
  }, [user?.id, options?.startDate, options?.endDate]);

  const fetchAnalytics = useCallback(async () => {
    if (!user?.id) {
      setAnalytics(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    // Check cache unless forced refresh
    if (!options?.refresh) {
      const cached = analyticsCache.get(cacheKey);
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
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await dischargeCaseService.getHospitalSWAnalytics(
        options?.startDate,
        options?.endDate
      );

      if (response.success && response.data) {
        const data = response.data;
        setAnalytics(data);
        const now = new Date();
        setLastFetched(now);

        // Update cache
        analyticsCache.set(cacheKey, {
          data,
          timestamp: now,
        });
      } else {
        throw new Error(response.message || 'Failed to fetch analytics');
      }
    } catch (err) {
      console.error('Error fetching Hospital SW analytics:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(errorMessage);
      setAnalytics(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, cacheKey, options?.refresh, options?.startDate, options?.endDate]);

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

