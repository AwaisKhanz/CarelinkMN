/**
 * Provider feature access hook
 * Checks if provider has access to specific features
 */

import { useMemo } from "react";
import { useProvider } from "@/contexts/provider-context";
import { useSubscription } from "@/hooks/use-subscription";
import { SubscriptionTier } from "@carelink/types";
import { SubscriptionLimits } from "@/types/subscription";
import { PLAN_HIERARCHY } from "@/lib/constants/subscription";

interface ProviderFeatureResult {
  hasAccess: boolean;
  isLoading: boolean;
  reason?: string; // Reason for denial (e.g., "PRO subscription required")
}

interface ProviderFeatureOptions {
  requiredTier?: SubscriptionTier;
  feature?: keyof Omit<SubscriptionLimits, "maxPhotos" | "maxServices">;
  requireVerification?: boolean;
}

/**
 * Hook to check if provider has access to a specific feature
 * Can check by subscription tier or feature flag
 */
export function useProviderFeature(
  options: ProviderFeatureOptions
): ProviderFeatureResult {
  const { isVerified, isLoading: providerLoading } = useProvider();
  const { tier, isLoading: subscriptionLoading, hasFeature } = useSubscription();

  const isLoading = providerLoading || subscriptionLoading;

  const hasAccess = useMemo(() => {
    if (isLoading) return false;

    // Check verification requirement
    if (options.requireVerification !== false && !isVerified) {
      return false;
    }

    // Check feature flag
    if (options.feature) {
      return hasFeature(options.feature);
    }

    // Check subscription tier
    if (options.requiredTier) {
      return PLAN_HIERARCHY[tier] >= PLAN_HIERARCHY[options.requiredTier];
    }

    // No restrictions, allow access
    return true;
  }, [
    isLoading,
    isVerified,
    tier,
    options.requireVerification,
    options.feature,
    options.requiredTier,
    hasFeature,
  ]);

  const reason = useMemo(() => {
    if (isLoading) return undefined;
    
    if (options.requireVerification !== false && !isVerified) {
      return "Provider verification required";
    }

    if (options.feature && !hasFeature(options.feature)) {
      return `Feature requires ${options.requiredTier || "PRO"} subscription`;
    }

    if (options.requiredTier && PLAN_HIERARCHY[tier] < PLAN_HIERARCHY[options.requiredTier]) {
      return `${options.requiredTier} subscription required`;
    }

    return undefined;
  }, [
    isLoading,
    isVerified,
    tier,
    options.requireVerification,
    options.feature,
    options.requiredTier,
    hasFeature,
  ]);

  return {
    hasAccess,
    isLoading,
    reason,
  };
}
