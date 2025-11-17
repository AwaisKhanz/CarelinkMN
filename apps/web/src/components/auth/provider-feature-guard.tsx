"use client";

import { ReactNode, useState, useEffect } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import { SubscriptionTier } from "@carelink/types";
import { SubscriptionLimits } from "@/types/subscription";
import { Loader2 } from "lucide-react";
import { UpgradeBanner } from "@/components/subscription/upgrade-banner";
import { PLAN_HIERARCHY } from "@/lib/constants/subscription";

interface ProviderFeatureGuardProps {
  children: ReactNode;
  feature?: keyof Omit<SubscriptionLimits, "maxPhotos" | "maxServices">; // Feature key (boolean flags only)
  requiredPlan?: SubscriptionTier; // Required subscription tier
  fallback?: ReactNode; // Fallback UI when access is denied
  showBanner?: boolean; // Show upgrade banner (default: true)
  bannerDescription?: string; // Custom banner description
  compact?: boolean; // Compact banner style
  showLoading?: boolean; // Show loading state
}

/**
 * Provider feature guard component
 * Gates features based on subscription tier or specific feature flags
 * More flexible than SubscriptionGuard - can check specific features
 */
export function ProviderFeatureGuard({
  children,
  feature,
  requiredPlan,
  fallback,
  showBanner = true,
  bannerDescription,
  compact = false,
  showLoading = true,
}: ProviderFeatureGuardProps) {
  const { tier, isLoading, hasFeature } = useSubscription();
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    let access = false;

    if (feature) {
      // Check specific feature flag
      access = hasFeature(feature);
    } else if (requiredPlan) {
      // Check subscription tier
      access = PLAN_HIERARCHY[tier] >= PLAN_HIERARCHY[requiredPlan];
    } else {
      // No restrictions specified, allow access
      access = true;
    }

    setHasAccess(access);
  }, [tier, feature, requiredPlan, isLoading, hasFeature]);

  // Show loading state
  if (isLoading && showLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // If has access, render children
  if (hasAccess) {
    return <>{children}</>;
  }

  // If fallback is provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Show upgrade banner if enabled
  if (showBanner && requiredPlan) {
    return (
      <UpgradeBanner
        feature={feature || "This feature"}
        currentPlan={tier as "FREE" | "PRO" | "PREMIUM" | "ENTERPRISE"}
        requiredPlan={requiredPlan as "PRO" | "PREMIUM" | "ENTERPRISE"}
        description={bannerDescription}
        compact={compact}
      />
    );
  }

  // Default: show nothing
  return null;
}

