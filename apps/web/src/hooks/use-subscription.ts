import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { providerService } from "@/lib/api";
import { SubscriptionTier, UserRole } from "@carelink/types";
import { PLAN_LIMITS } from "@/lib/constants/subscription";
import type { SubscriptionLimits } from "@/types/subscription";

// Re-export types for backward compatibility
export type { SubscriptionLimits };

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
  const [tier, setTier] = useState<SubscriptionTier>(SubscriptionTier.FREE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptionTier = async () => {
      // Only fetch for provider roles
      if (
        !user?.id ||
        !(
          user.role === UserRole.PROVIDER_OWNER ||
          user.role === UserRole.PROVIDER_STAFF
        )
      ) {
        setIsLoading(false);
        setTier(SubscriptionTier.FREE);
        return;
      }

      try {
        const provider = await providerService.getProviderByUserId(user.id);
        setTier(
          (provider.subscriptionTier as SubscriptionTier) ||
            SubscriptionTier.FREE
        );
      } catch (error) {
        console.error("Error fetching subscription tier:", error);
        setTier(SubscriptionTier.FREE); // Default to FREE on error
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchSubscriptionTier();
    } else {
      setIsLoading(false);
    }
  }, [user?.id, user?.role]);

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
