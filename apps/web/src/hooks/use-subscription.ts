import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { providerService } from "@/lib/api";
import { SubscriptionTier, SubscriptionLimits } from "@/types/subscription";
import { PLAN_LIMITS } from "@/lib/constants/subscription";

// Re-export types for backward compatibility
export type { SubscriptionTier, SubscriptionLimits };

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
      // Only fetch for provider roles
      if (
        !user?.id ||
        !["PROVIDER_OWNER", "PROVIDER_STAFF"].includes(user.role)
      ) {
        setIsLoading(false);
        setTier("FREE");
        return;
      }

      try {
        const provider = await providerService.getProviderByUserId(user.id);
        setTier((provider.subscriptionTier as SubscriptionTier) || "FREE");
      } catch (error) {
        console.error("Error fetching subscription tier:", error);
        setTier("FREE"); // Default to FREE on error
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
