/**
 * Provider guard hook
 * Combines all provider checks into a single hook
 */

import { useMemo } from "react";
import { useProvider } from "@/contexts/provider-context";
import { useProviderStatus } from "@/hooks/use-provider-status";
import { useSubscription } from "@/hooks/use-subscription";
import { SubscriptionTier } from "@carelink/types";

interface ProviderGuardResult {
  // Status checks
  isReady: boolean;
  hasProviderProfile: boolean;
  isVerified: boolean;
  needsOnboarding: boolean;
  isPendingVerification: boolean;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Subscription checks
  hasProPlan: boolean;
  hasPremiumPlan: boolean;
  hasEnterprisePlan: boolean;
  subscriptionTier: SubscriptionTier;
  
  // Helper methods
  hasMinimumTier: (requiredTier: SubscriptionTier) => boolean;
  canAccessFeature: (feature: string) => boolean;
}

/**
 * Hook that combines all provider checks
 * Provides a unified interface for checking provider status
 */
export function useProviderGuard(): ProviderGuardResult {
  const {
    provider,
    providerId,
    isLoading: providerLoading,
    error: providerError,
    isVerified,
    hasProPlan,
    hasPremiumPlan,
    hasEnterprisePlan,
    subscriptionTier,
    hasProviderProfile,
    isPendingVerification,
    hasMinimumTier,
    canAccessFeature,
  } = useProvider();

  const {
    needsOnboarding,
    isLoading: statusLoading,
    error: statusError,
  } = useProviderStatus();

  const { isLoading: subscriptionLoading } = useSubscription();

  const isLoading = providerLoading || statusLoading || subscriptionLoading;
  const error = providerError || statusError;

  const isReady = useMemo(() => {
    return (
      !isLoading &&
      hasProviderProfile &&
      !needsOnboarding &&
      (isVerified || isPendingVerification)
    );
  }, [isLoading, hasProviderProfile, needsOnboarding, isVerified, isPendingVerification]);

  return {
    isReady,
    hasProviderProfile,
    isVerified,
    needsOnboarding,
    isPendingVerification,
    isLoading,
    error,
    hasProPlan,
    hasPremiumPlan,
    hasEnterprisePlan,
    subscriptionTier,
    hasMinimumTier,
    canAccessFeature,
  };
}
