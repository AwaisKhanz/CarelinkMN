import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { providerService } from "@/lib/api";

export type SubscriptionTier = "FREE" | "PRO" | "PREMIUM" | "ENTERPRISE";

export interface SubscriptionLimits {
  maxPhotos: number; // FREE: 1, PRO: 5, PREMIUM/ENTERPRISE: unlimited (999)
  maxServices: number; // FREE: 10, others: unlimited (999)
  hasAnalytics: boolean; // PRO and above
  hasPriorityPlacement: boolean; // PRO and above
  hasAdvancedProfile: boolean; // PRO and above
  hasMaxBoost: boolean; // PREMIUM and above
  hasPrioritySupport: boolean; // PREMIUM and above
  hasApiAccess: boolean; // PREMIUM and above
  hasDedicatedManager: boolean; // ENTERPRISE only
}

const PLAN_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  FREE: {
    maxPhotos: 1,
    maxServices: 10,
    hasAnalytics: false,
    hasPriorityPlacement: false,
    hasAdvancedProfile: false,
    hasMaxBoost: false,
    hasPrioritySupport: false,
    hasApiAccess: false,
    hasDedicatedManager: false,
  },
  PRO: {
    maxPhotos: 5,
    maxServices: 999, // unlimited
    hasAnalytics: true,
    hasPriorityPlacement: true,
    hasAdvancedProfile: true,
    hasMaxBoost: false,
    hasPrioritySupport: false,
    hasApiAccess: false,
    hasDedicatedManager: false,
  },
  PREMIUM: {
    maxPhotos: 999, // unlimited
    maxServices: 999, // unlimited
    hasAnalytics: true,
    hasPriorityPlacement: true,
    hasAdvancedProfile: true,
    hasMaxBoost: true,
    hasPrioritySupport: true,
    hasApiAccess: true,
    hasDedicatedManager: false,
  },
  ENTERPRISE: {
    maxPhotos: 999, // unlimited
    maxServices: 999, // unlimited
    hasAnalytics: true,
    hasPriorityPlacement: true,
    hasAdvancedProfile: true,
    hasMaxBoost: true,
    hasPrioritySupport: true,
    hasApiAccess: true,
    hasDedicatedManager: true,
  },
};

export interface UseSubscriptionReturn {
  tier: SubscriptionTier;
  limits: SubscriptionLimits;
  isLoading: boolean;
  canAddPhotos: (currentCount: number) => boolean;
  canAddServices: (currentCount: number) => boolean;
  hasFeature: (
    feature: keyof Omit<SubscriptionLimits, "maxPhotos" | "maxServices">
  ) => boolean;
  getRemainingPhotos: (currentCount: number) => number | "unlimited";
  getRemainingServices: (currentCount: number) => number | "unlimited";
}

/**
 * Hook to check subscription limits and features
 */
export function useSubscription(): UseSubscriptionReturn {
  const { user } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>("FREE");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptionTier = async () => {
      if (!user?.organizationId) {
        setIsLoading(false);
        return;
      }

      try {
        const provider = await providerService.getProviderByOrganizationId(
          user.organizationId
        );
        setTier((provider.subscriptionTier as SubscriptionTier) || "FREE");
      } catch (error) {
        console.error("Error fetching subscription tier:", error);
        setTier("FREE"); // Default to FREE on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionTier();
  }, [user?.organizationId]);

  const limits = PLAN_LIMITS[tier];

  const canAddPhotos = (currentCount: number): boolean => {
    return currentCount < limits.maxPhotos;
  };

  const canAddServices = (currentCount: number): boolean => {
    return currentCount < limits.maxServices;
  };

  const hasFeature = (
    feature: keyof Omit<SubscriptionLimits, "maxPhotos" | "maxServices">
  ): boolean => {
    return limits[feature] as boolean;
  };

  const getRemainingPhotos = (currentCount: number): number | "unlimited" => {
    if (limits.maxPhotos >= 999) return "unlimited";
    return Math.max(0, limits.maxPhotos - currentCount);
  };

  const getRemainingServices = (currentCount: number): number | "unlimited" => {
    if (limits.maxServices >= 999) return "unlimited";
    return Math.max(0, limits.maxServices - currentCount);
  };

  return {
    tier,
    limits,
    isLoading,
    canAddPhotos,
    canAddServices,
    hasFeature,
    getRemainingPhotos,
    getRemainingServices,
  };
}
