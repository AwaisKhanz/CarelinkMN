"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { UserRole } from "@carelink/types";
import { useAuth } from "@/contexts/auth-context";
import { caseManagerService, CaseManager } from "@/lib/api";
import { isValidCaseManager } from "@/lib/utils/case-manager";

interface CaseManagerContextType {
  // Core data
  caseManager: CaseManager | null;
  caseManagerId: string | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  
  // Computed properties
  organizationId: string | null;
  organizationName: string | null;
  hasCaseManagerProfile: boolean;
  isActive: boolean;
  hasLicense: boolean;
  licenseExpired: boolean;
  
  // Helper methods
  getDisplayName: () => string;
}

const CaseManagerContext = createContext<CaseManagerContextType | undefined>(
  undefined
);

export function useCaseManager() {
  const context = useContext(CaseManagerContext);
  if (context === undefined) {
    throw new Error("useCaseManager must be used within a CaseManagerProvider");
  }
  return context;
}

export function CaseManagerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated } = useAuth();
  const [caseManager, setCaseManager] = useState<CaseManager | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize caseManagerId to avoid recalculating on every render
  const caseManagerId = useMemo(() => {
    if (!caseManager || !isValidCaseManager(caseManager)) {
      return null;
    }
    return caseManager.id;
  }, [caseManager]);

  // Computed properties
  const organizationId = useMemo(() => {
    return caseManager?.organizationId || null;
  }, [caseManager?.organizationId]);

  const organizationName = useMemo(() => {
    return caseManager?.organization?.name || null;
  }, [caseManager?.organization?.name]);

  const hasCaseManagerProfile = useMemo(() => {
    return caseManager !== null && isValidCaseManager(caseManager);
  }, [caseManager]);

  const isActive = useMemo(() => {
    return caseManager?.isActive === true;
  }, [caseManager?.isActive]);

  const hasLicense = useMemo(() => {
    return !!(caseManager?.licenseNumber && caseManager?.licenseExpiry);
  }, [caseManager?.licenseNumber, caseManager?.licenseExpiry]);

  const licenseExpired = useMemo(() => {
    if (!caseManager?.licenseExpiry) return false;
    return new Date(caseManager.licenseExpiry) < new Date();
  }, [caseManager?.licenseExpiry]);

  // Helper methods
  const getDisplayName = useCallback((): string => {
    if (!caseManager) return "Case Manager";
    return `${caseManager.firstName} ${caseManager.lastName}`;
  }, [caseManager]);

  const fetchCaseManager = useCallback(async () => {
    // Only fetch for case manager users
    if (!isAuthenticated || !user || user.role !== UserRole.CASE_MANAGER) {
      setCaseManager(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await caseManagerService.getCaseManagerByUserId(user.id);
      if (response.success && response.data) {
        setCaseManager(response.data);
      } else {
        setError(response.message || "Failed to fetch case manager");
        setCaseManager(null);
      }
    } catch (err) {
      console.error("Error fetching case manager:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch case manager";
      setError(errorMessage);
      setCaseManager(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.role, isAuthenticated]);

  useEffect(() => {
    fetchCaseManager();
  }, [fetchCaseManager]);

  const value: CaseManagerContextType = useMemo(
    () => ({
      // Core data
      caseManager,
      caseManagerId,
      isLoading,
      error,
      refetch: fetchCaseManager,
      
      // Computed properties
      organizationId,
      organizationName,
      hasCaseManagerProfile,
      isActive,
      hasLicense,
      licenseExpired,
      
      // Helper methods
      getDisplayName,
    }),
    [
      caseManager,
      caseManagerId,
      isLoading,
      error,
      fetchCaseManager,
      organizationId,
      organizationName,
      hasCaseManagerProfile,
      isActive,
      hasLicense,
      licenseExpired,
      getDisplayName,
    ]
  );

  return (
    <CaseManagerContext.Provider value={value}>
      {children}
    </CaseManagerContext.Provider>
  );
}

