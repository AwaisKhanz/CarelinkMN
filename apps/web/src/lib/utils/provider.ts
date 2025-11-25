/**
 * Provider utility functions
 * Shared utilities for provider-related operations
 */

import {
  OPENING_EXPIRY_HOURS,
  OPENING_EXPIRY_WARNING_HOURS,
} from "@carelink/utils";
import { Urgency, ReferralStatus } from "@carelink/types";
import { URGENCY_CONFIG, REFERRAL_STATUS_CONFIG } from "@/lib/constants";
import type { BadgeProps } from "@/components/ui/badge";
import type { LucideIcon } from "lucide-react";

/**
 * Calculate hours until opening expiry based on freshness timestamp
 * @param freshnessTimestamp - ISO string timestamp of when opening was last updated
 * @returns Number of hours until expiry (can be negative if already expired)
 */
export function calculateHoursUntilExpiry(freshnessTimestamp: string): number {
  const timestamp = new Date(freshnessTimestamp);
  const expiryTime =
    timestamp.getTime() + OPENING_EXPIRY_HOURS * 60 * 60 * 1000;
  const now = Date.now();
  return Math.floor((expiryTime - now) / (60 * 60 * 1000));
}

/**
 * Check if an opening is expiring soon (within warning threshold)
 * @param freshnessTimestamp - ISO string timestamp of when opening was last updated
 * @returns true if opening expires within warning hours
 */
export function isOpeningExpiringSoon(freshnessTimestamp: string): boolean {
  const hoursUntilExpiry = calculateHoursUntilExpiry(freshnessTimestamp);
  return (
    hoursUntilExpiry >= 0 && hoursUntilExpiry <= OPENING_EXPIRY_WARNING_HOURS
  );
}

/**
 * Check if an opening is expired (past the freshness threshold)
 * @param freshnessTimestamp - ISO string timestamp of when opening was last updated
 * @returns true if opening has expired
 */
export function isOpeningExpired(freshnessTimestamp: string): boolean {
  const hoursUntilExpiry = calculateHoursUntilExpiry(freshnessTimestamp);
  return hoursUntilExpiry < 0;
}

/**
 * Get opening freshness status
 * @param freshnessTimestamp - ISO string timestamp of when opening was last updated
 * @returns 'fresh' | 'expiring_soon' | 'expired'
 */
export function getOpeningFreshnessStatus(
  freshnessTimestamp: string
): "fresh" | "expiring_soon" | "expired" {
  if (isOpeningExpired(freshnessTimestamp)) {
    return "expired";
  }
  if (isOpeningExpiringSoon(freshnessTimestamp)) {
    return "expiring_soon";
  }
  return "fresh";
}

/**
 * Validate provider data
 * @param provider - Provider object to validate
 * @returns true if provider is valid
 */
export function isValidProvider(provider: {
  id?: string;
  organizationId?: string;
}): boolean {
  return !!(provider?.id && provider?.organizationId);
}

/**
 * Get provider display name
 * @param provider - Provider object
 * @returns Display name (organization name or fallback)
 */
export function getProviderDisplayName(provider: {
  organization?: { name?: string };
  id?: string;
}): string {
  return (
    provider?.organization?.name ||
    `Provider ${provider?.id?.slice(0, 8)}` ||
    "Unknown Provider"
  );
}

/**
 * Get occupancy color class based on percentage
 * @param current - Current occupancy
 * @param capacity - Total capacity
 * @returns Tailwind color class
 */
export function getOccupancyColor(current: number, capacity: number): string {
  if (capacity === 0) return "text-muted-foreground";
  const percentage = (current / capacity) * 100;
  if (percentage >= 90) return "text-destructive";
  if (percentage >= 75) return "text-warning";
  return "text-success";
}

/**
 * Calculate occupancy percentage
 * @param current - Current occupancy
 * @param capacity - Total capacity
 * @returns Percentage (0-100)
 */
export function getOccupancyPercentage(
  current: number,
  capacity: number
): number {
  if (capacity === 0) return 0;
  return Math.round((current / capacity) * 100);
}

/**
 * Get urgency badge configuration
 * @param urgency - Urgency level
 * @returns Badge configuration with label, variant, and icon
 */
export function getUrgencyBadgeConfig(urgency: Urgency): {
  label: string;
  variant: BadgeProps["variant"];
  icon: LucideIcon;
} {
  const config = URGENCY_CONFIG[urgency];
  if (!config) {
    // Fallback for unknown urgency
    const { AlertCircle } = require("lucide-react");
    return {
      label: urgency || "Unknown",
      variant: "outline",
      icon: AlertCircle,
    };
  }
  return {
    label: config.label,
    variant: config.color,
    icon: config.icon,
  };
}

/**
 * Get referral status badge configuration
 * @param status - Referral status
 * @returns Badge configuration with label and variant
 */
export function getReferralStatusBadgeConfig(status: ReferralStatus): {
  label: string;
  variant: BadgeProps["variant"];
} {
  const config = REFERRAL_STATUS_CONFIG[status];
  if (!config) {
    return {
      label: status || "Unknown",
      variant: "outline",
    };
  }
  return {
    label: config.label,
    variant: config.color,
  };
}
