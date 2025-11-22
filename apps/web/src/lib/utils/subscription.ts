/**
 * Subscription utility functions
 */

import { SubscriptionTier } from "@carelink/types";
import { Subscription, SubscriptionStatusInfo } from "@/types/subscription";
import { PLAN_HIERARCHY } from "@/lib/constants/subscription";
import { SUBSCRIPTION_EXPIRY_WARNING_DAYS } from "@/lib/constants/subscription";

/**
 * Check if a tier has access to a required tier level
 */
export function hasTierAccess(
  currentTier: SubscriptionTier,
  requiredTier: SubscriptionTier
): boolean {
  return PLAN_HIERARCHY[currentTier] >= PLAN_HIERARCHY[requiredTier];
}

/**
 * Get subscription status information
 */
export function getSubscriptionStatusInfo(
  subscription: Subscription | null
): SubscriptionStatusInfo {
  if (!subscription) {
    return {
      isActive: false,
      isCancelled: false,
      isTrial: false,
      isPastDue: false,
      isUnpaid: false,
      isExpiringSoon: false,
      hasScheduledCancellation: false,
      daysUntilExpiry: null,
      expiryDate: null,
      cancelDate: null,
    };
  }

  const now = Date.now();
  const expiryDate = subscription.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd)
    : null;
  const daysUntilExpiry = expiryDate
    ? Math.ceil((expiryDate.getTime() - now) / (1000 * 60 * 60 * 24))
    : null;

  const isExpiringSoon =
    subscription.status === "ACTIVE" &&
    expiryDate !== null &&
    daysUntilExpiry !== null &&
    daysUntilExpiry > 0 &&
    daysUntilExpiry <= SUBSCRIPTION_EXPIRY_WARNING_DAYS;

  const hasScheduledCancellation =
    subscription.status === "ACTIVE" && subscription.cancelAt !== null;

  const cancelDate = subscription.cancelAt ? new Date(subscription.cancelAt) : null;

  return {
    isActive: subscription.status === "ACTIVE",
    isCancelled: subscription.status === "CANCELLED",
    isTrial: subscription.status === "TRIALING",
    isPastDue: subscription.status === "PAST_DUE",
    isUnpaid: subscription.status === "UNPAID",
    isExpiringSoon,
    hasScheduledCancellation,
    daysUntilExpiry,
    expiryDate,
    cancelDate,
  };
}

/**
 * Check if subscription is in a warning state (expiring soon, cancelled, etc.)
 */
export function isSubscriptionInWarningState(
  subscription: Subscription | null
): boolean {
  const statusInfo = getSubscriptionStatusInfo(subscription);
  return (
    statusInfo.isExpiringSoon ||
    statusInfo.hasScheduledCancellation ||
    statusInfo.isPastDue ||
    statusInfo.isUnpaid
  );
}

