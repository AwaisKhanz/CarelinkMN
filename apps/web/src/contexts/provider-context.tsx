"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { UserRole } from "@carelink/types";
import { useAuth } from "@/contexts/auth-context";
import { providerService, Provider } from "@/lib/api";

interface ProviderContextType {
  provider: Provider | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const ProviderContext = createContext<ProviderContextType | undefined>(
  undefined
);

export function useProvider() {
  const context = useContext(ProviderContext);
  if (context === undefined) {
    throw new Error("useProvider must be used within a ProviderProvider");
  }
  return context;
}

export function ProviderProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated } = useAuth();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProvider = async () => {
    // Only fetch for provider users
    if (
      !isAuthenticated ||
      !user?.organizationId ||
      (user.role !== UserRole.PROVIDER_OWNER &&
        user.role !== UserRole.PROVIDER_STAFF)
    ) {
      setProvider(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const providerData = await providerService.getProviderByOrganizationId(
        user.organizationId
      );
      setProvider(providerData);
    } catch (err) {
      console.error("Error fetching provider:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch provider");
      setProvider(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProvider();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.organizationId, user?.role, isAuthenticated]);

  const value: ProviderContextType = {
    provider,
    isLoading,
    error,
    refetch: fetchProvider,
  };

  return (
    <ProviderContext.Provider value={value}>
      {children}
    </ProviderContext.Provider>
  );
}

