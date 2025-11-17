/**
 * Case Manager data hooks
 * Hooks for accessing case manager data from context
 */

import { useMemo } from "react";
import { useCaseManager } from "@/contexts/case-manager-context";
import { CaseManager } from "@/lib/api";
import { isValidCaseManager } from "@/lib/utils/case-manager";

/**
 * Hook to get case manager data from context
 * Throws error if used outside CaseManagerProvider
 */
export function useCaseManagerData() {
  const { caseManager, isLoading, error, refetch } = useCaseManager();
  return { caseManager, isLoading, error, refetch };
}

/**
 * Hook to get case manager ID from context
 * Returns null if case manager is not loaded or invalid
 */
export function useCaseManagerId(): string | null {
  const { caseManager, isLoading } = useCaseManager();
  
  return useMemo(() => {
    if (isLoading || !caseManager) {
      return null;
    }
    
    if (!isValidCaseManager(caseManager)) {
      return null;
    }
    
    return caseManager.id;
  }, [caseManager, isLoading]);
}

/**
 * Hook to get case manager data with guard
 * Ensures case manager exists before returning data
 * Useful for pages that require case manager to be loaded
 */
export function useCaseManagerWithGuard(): {
  caseManager: CaseManager;
  caseManagerId: string;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const { caseManager, isLoading, error, refetch } = useCaseManager();
  
  const caseManagerId = useCaseManagerId();
  
  if (isLoading) {
    return {
      caseManager: caseManager as CaseManager,
      caseManagerId: caseManagerId || "",
      isLoading: true,
      error: null,
      refetch,
    };
  }
  
  if (error || !caseManager || !caseManagerId) {
    return {
      caseManager: caseManager as CaseManager,
      caseManagerId: caseManagerId || "",
      isLoading: false,
      error: error || "Case Manager not found",
      refetch,
    };
  }
  
  return {
    caseManager,
    caseManagerId,
    isLoading: false,
    error: null,
    refetch,
  };
}

