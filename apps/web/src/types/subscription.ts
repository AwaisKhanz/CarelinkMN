/**
 * Shared subscription types
 */

export type SubscriptionTier = "FREE" | "PRO" | "PREMIUM" | "ENTERPRISE";

export type SubscriptionStatus =
  | "TRIALING"
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELLED"
  | "UNPAID";

export interface Subscription {
  id: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  organizationId: string;
  productType: string;
  tier: string;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAt?: string | null;
  canceledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionLimits {
  maxPhotos: number;
  maxServices: number;
  hasAnalytics: boolean;
  hasPriorityPlacement: boolean;
  hasAdvancedProfile: boolean;
  hasMaxBoost: boolean;
  hasPrioritySupport: boolean;
  hasApiAccess: boolean;
  hasDedicatedManager: boolean;
}

export interface SubscriptionStatusInfo {
  isActive: boolean;
  isCancelled: boolean;
  isTrial: boolean;
  isPastDue: boolean;
  isUnpaid: boolean;
  isExpiringSoon: boolean;
  hasScheduledCancellation: boolean;
  daysUntilExpiry: number | null;
  expiryDate: Date | null;
  cancelDate: Date | null;
}

