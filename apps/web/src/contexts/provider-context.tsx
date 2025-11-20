"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { UserRole, SubscriptionTier } from "@carelink/types";
import { useAuth } from "@/contexts/auth-context";
import { providerService, Provider } from "@/lib/api";
import { isValidProvider } from "@/lib/utils/provider";
import { PLAN_HIERARCHY } from "@/lib/constants/subscription";

interface ProviderContextType {
  // Core data
  provider: Provider | null;
  providerId: string | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;

  // Computed properties
  isVerified: boolean;
  hasProPlan: boolean;
  hasPremiumPlan: boolean;
  hasEnterprisePlan: boolean;
  subscriptionTier: SubscriptionTier;
  organizationId: string | null;
  organizationName: string | null;
  hasProviderProfile: boolean;
  isPendingVerification: boolean;

  // Helper methods
  hasMinimumTier: (requiredTier: SubscriptionTier) => boolean;
  canAccessFeature: (feature: string) => boolean;
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

/**
 * Safe version of useProvider that returns null if context is not available
 * Use this when the provider context may not be available (e.g., for non-provider users)
 */
export function useProviderSafe() {
  const context = useContext(ProviderContext);
  return context ?? null;
}

export function ProviderProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize providerId to avoid recalculating on every render
  const providerId = useMemo(() => {
    if (!provider || !isValidProvider(provider)) {
      return null;
    }
    return provider.id;
  }, [provider]);

  // Computed properties
  const isVerified = useMemo(() => {
    return provider?.verified === true;
  }, [provider?.verified]);

  const subscriptionTier = useMemo(() => {
    return (provider?.subscriptionTier as SubscriptionTier) || "FREE";
  }, [provider?.subscriptionTier]);

  const hasProPlan = useMemo(() => {
    return PLAN_HIERARCHY[subscriptionTier] >= PLAN_HIERARCHY.PRO;
  }, [subscriptionTier]);

  const hasPremiumPlan = useMemo(() => {
    return PLAN_HIERARCHY[subscriptionTier] >= PLAN_HIERARCHY.PREMIUM;
  }, [subscriptionTier]);

  const hasEnterprisePlan = useMemo(() => {
    return PLAN_HIERARCHY[subscriptionTier] >= PLAN_HIERARCHY.ENTERPRISE;
  }, [subscriptionTier]);

  const organizationId = useMemo(() => {
    return provider?.organizationId || null;
  }, [provider?.organizationId]);

  const organizationName = useMemo(() => {
    return provider?.organization?.name || null;
  }, [provider?.organization?.name]);

  const hasProviderProfile = useMemo(() => {
    return provider !== null && isValidProvider(provider);
  }, [provider]);

  const isPendingVerification = useMemo(() => {
    return hasProviderProfile && !isVerified;
  }, [hasProviderProfile, isVerified]);

  // Helper methods
  const hasMinimumTier = useCallback(
    (requiredTier: SubscriptionTier): boolean => {
      return PLAN_HIERARCHY[subscriptionTier] >= PLAN_HIERARCHY[requiredTier];
    },
    [subscriptionTier]
  );

  const canAccessFeature = useCallback(
    (feature: string): boolean => {
      // Feature-based access control can be extended here
      // For now, return true if verified
      return isVerified;
    },
    [isVerified]
  );

  const fetchProvider = useCallback(async () => {
    // Only fetch for provider users
    if (
      !isAuthenticated ||
      !user?.id ||
      (user.role !== UserRole.PROVIDER_OWNER &&
        user.role !== UserRole.PROVIDER_STAFF)
    ) {
      setProvider(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      // Use user ID instead of organization ID (organization ID may not be on user object)
      const providerData = await providerService.getProviderByUserId(user.id);
      setProvider(providerData);
    } catch (err) {
      console.error("Error fetching provider:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch provider";
      setError(errorMessage);
      setProvider(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.role, isAuthenticated]);

  useEffect(() => {
    fetchProvider();
  }, [fetchProvider]);

  const value: ProviderContextType = useMemo(
    () => ({
      // Core data
      provider,
      providerId,
      isLoading,
      error,
      refetch: fetchProvider,

      // Computed properties
      isVerified,
      hasProPlan,
      hasPremiumPlan,
      hasEnterprisePlan,
      subscriptionTier,
      organizationId,
      organizationName,
      hasProviderProfile,
      isPendingVerification,

      // Helper methods
      hasMinimumTier,
      canAccessFeature,
    }),
    [
      provider,
      providerId,
      isLoading,
      error,
      fetchProvider,
      isVerified,
      hasProPlan,
      hasPremiumPlan,
      hasEnterprisePlan,
      subscriptionTier,
      organizationId,
      organizationName,
      hasProviderProfile,
      isPendingVerification,
      hasMinimumTier,
      canAccessFeature,
    ]
  );

  return (
    <ProviderContext.Provider value={value}>
      {children}
    </ProviderContext.Provider>
  );
}
