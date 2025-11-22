/**
 * Shared subscription constants
 */

import { SubscriptionTier } from "@carelink/types";
import type { SubscriptionLimits } from "@/types/subscription";

export const PLAN_HIERARCHY: Record<SubscriptionTier, number> = {
  FREE: 0,
  PRO: 1,
  PREMIUM: 2,
  ENTERPRISE: 3,
};

export const PLAN_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
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

export const SUBSCRIPTION_EXPIRY_WARNING_DAYS = 7;

