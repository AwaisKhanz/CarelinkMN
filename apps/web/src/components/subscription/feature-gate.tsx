"use client";

import { ReactNode } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import { SubscriptionTier } from "@/types/subscription";
import { PLAN_HIERARCHY } from "@/lib/constants/subscription";
import { UpgradeBanner } from "./upgrade-banner";
import { Loader2 } from "lucide-react";

export interface FeatureGateProps {
  feature: string;
  requiredPlan: SubscriptionTier;
  children: ReactNode;
  fallback?: ReactNode;
  showBanner?: boolean;
  bannerDescription?: string;
  compact?: boolean;
}

/**
 * Component that gates features based on subscription tier
 */
export function FeatureGate({
  feature,
  requiredPlan,
  children,
  fallback,
  showBanner = true,
  bannerDescription,
  compact = false,
}: FeatureGateProps) {
  const { tier, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const hasAccess = PLAN_HIERARCHY[tier] >= PLAN_HIERARCHY[requiredPlan];

  if (hasAccess) {
    return <>{children}</>;
  }

  if (showBanner) {
    return (
      <UpgradeBanner
        feature={feature}
        currentPlan={tier}
        requiredPlan={requiredPlan as "PRO" | "PREMIUM" | "ENTERPRISE"}
        description={bannerDescription}
        compact={compact}
      />
    );
  }

  return <>{fallback || null}</>;
}
