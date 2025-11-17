"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { useAuth } from "@/contexts/auth-context";
import { billingService } from "@/lib/services/billing.service";
import { Subscription, SubscriptionStatus } from "@/types/subscription";
import { useSubscription as useSubscriptionTier } from "@/hooks/use-subscription";
import { SubscriptionTier } from "@carelink/types";
import { getSubscriptionStatusInfo, isSubscriptionInWarningState } from "@/lib/utils/subscription";

interface SubscriptionContextType {
  // Core data
  subscription: Subscription | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  
  // Computed properties
  tier: SubscriptionTier;
  status: SubscriptionStatus | null;
  isActive: boolean;
  isCancelled: boolean;
  isTrial: boolean;
  isPastDue: boolean;
  isExpiringSoon: boolean;
  hasScheduledCancellation: boolean;
  expiryDate: Date | null;
  cancelDate: Date | null;
  
  // Status info
  statusInfo: ReturnType<typeof getSubscriptionStatusInfo>;
  
  // Helper methods
  hasMinimumTier: (requiredTier: SubscriptionTier) => boolean;
  canAccessFeature: (feature: string) => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

export function useSubscriptionContext() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      "useSubscriptionContext must be used within a SubscriptionProvider"
    );
  }
  return context;
}

interface SubscriptionProviderProps {
  children: ReactNode;
}

/**
 * Provider that manages subscription data for the entire app
 * Fetches subscription data once and provides it to all child components
 * Enhanced with computed properties and helper methods
 */
export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const { tier } = useSubscriptionTier(); // Get tier for optimization
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!user?.id || !isAuthenticated) {
      setIsLoading(false);
      setSubscription(null);
      setError(null);
      return;
    }

    // Only fetch subscription for providers (subscription is provider-specific)
    // For other roles, subscription data is not needed
    if (!["PROVIDER_OWNER", "PROVIDER_STAFF"].includes(user.role)) {
      setIsLoading(false);
      setSubscription(null);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      // Billing service gets organizationId from the authenticated user on the backend
      // So we don't need to pass organizationId from frontend
      const subscriptionData = await billingService.getSubscription();
      setSubscription(subscriptionData);
    } catch (err) {
      console.error("Error fetching subscription:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load subscription"
      );
      setSubscription(null);
      // Don't block the app if subscription fetch fails - subscription is optional
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.role, isAuthenticated]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Computed properties
  const status = useMemo(() => {
    return subscription?.status || null;
  }, [subscription?.status]);

  const isActive = useMemo(() => {
    return status === "ACTIVE";
  }, [status]);

  const isCancelled = useMemo(() => {
    return status === "CANCELLED";
  }, [status]);

  const isTrial = useMemo(() => {
    return status === "TRIALING";
  }, [status]);

  const isPastDue = useMemo(() => {
    return status === "PAST_DUE";
  }, [status]);

  const expiryDate = useMemo(() => {
    return subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;
  }, [subscription?.currentPeriodEnd]);

  const cancelDate = useMemo(() => {
    return subscription?.canceledAt ? new Date(subscription.canceledAt) : null;
  }, [subscription?.canceledAt]);

  const statusInfo = useMemo(() => {
    return getSubscriptionStatusInfo(subscription);
  }, [subscription]);

  const isExpiringSoon = useMemo(() => {
    return statusInfo.isExpiringSoon;
  }, [statusInfo.isExpiringSoon]);

  const hasScheduledCancellation = useMemo(() => {
    return statusInfo.hasScheduledCancellation;
  }, [statusInfo.hasScheduledCancellation]);

  // Helper methods
  const hasMinimumTier = useCallback((requiredTier: SubscriptionTier): boolean => {
    // Use tier from hook which is more reliable
    const tierHierarchy: Record<string, number> = {
      FREE: 0,
      PRO: 1,
      PREMIUM: 2,
      ENTERPRISE: 3,
    };
    return (tierHierarchy[tier] || 0) >= (tierHierarchy[requiredTier] || 0);
  }, [tier]);

  const canAccessFeature = useCallback((feature: string): boolean => {
    // Feature-based access control can be extended here
    // For now, return true if subscription is active
    return isActive;
  }, [isActive]);

  const value: SubscriptionContextType = useMemo(
    () => ({
      // Core data
    subscription,
    isLoading,
    error,
    refetch: fetchSubscription,
      
      // Computed properties
      tier: tier as SubscriptionTier,
      status,
      isActive,
      isCancelled,
      isTrial,
      isPastDue,
      isExpiringSoon,
      hasScheduledCancellation,
      expiryDate,
      cancelDate,
      
      // Status info
      statusInfo,
      
      // Helper methods
      hasMinimumTier,
      canAccessFeature,
    }),
    [
      subscription,
      isLoading,
      error,
      fetchSubscription,
      tier,
      status,
      isActive,
      isCancelled,
      isTrial,
      isPastDue,
      isExpiringSoon,
      hasScheduledCancellation,
      expiryDate,
      cancelDate,
      statusInfo,
      hasMinimumTier,
      canAccessFeature,
    ]
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

