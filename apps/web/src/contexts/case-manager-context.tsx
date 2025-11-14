"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { UserRole } from "@carelink/types";
import { useAuth } from "@/contexts/auth-context";
import { caseManagerService, CaseManager } from "@/lib/api";

interface CaseManagerContextType {
  caseManager: CaseManager | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
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

  const fetchCaseManager = async () => {
    // Only fetch for case manager users
    if (!isAuthenticated || !user || user.role !== UserRole.CASE_MANAGER) {
      setCaseManager(null);
      setIsLoading(false);
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
      setError(err instanceof Error ? err.message : "Failed to fetch case manager");
      setCaseManager(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseManager();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role, isAuthenticated]);

  const value: CaseManagerContextType = {
    caseManager,
    isLoading,
    error,
    refetch: fetchCaseManager,
  };

  return (
    <CaseManagerContext.Provider value={value}>
      {children}
    </CaseManagerContext.Provider>
  );
}

