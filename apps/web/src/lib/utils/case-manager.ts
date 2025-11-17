/**
 * Case Manager utility functions
 * Shared utilities for case manager-related operations
 */

import { Urgency, ReferralStatus } from "@carelink/types";
import { URGENCY_CONFIG, REFERRAL_STATUS_CONFIG } from "@/lib/constants";
import type { BadgeProps } from "@/components/ui/badge";
import type { LucideIcon } from "lucide-react";
import { CaseManager } from "@/lib/api";

/**
 * Validate case manager data
 * @param caseManager - Case Manager object to validate
 * @returns true if case manager is valid
 */
export function isValidCaseManager(caseManager: {
  id?: string;
  organizationId?: string;
}): boolean {
  return !!(caseManager?.id && caseManager?.organizationId);
}

/**
 * Get case manager display name
 * @param caseManager - Case Manager object
 * @returns Display name (first + last name or fallback)
 */
export function getCaseManagerDisplayName(caseManager: {
  firstName?: string;
  lastName?: string;
  id?: string;
}): string {
  if (caseManager?.firstName && caseManager?.lastName) {
    return `${caseManager.firstName} ${caseManager.lastName}`;
  }
  return caseManager?.id ? `Case Manager ${caseManager.id.slice(0, 8)}` : "Unknown Case Manager";
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
  return {
    label: config.label,
    variant: config.color,
  };
}

/**
 * Check if case manager license is expired
 * @param licenseExpiry - License expiry date (ISO string)
 * @returns true if license is expired
 */
export function isLicenseExpired(licenseExpiry?: string): boolean {
  if (!licenseExpiry) return false;
  return new Date(licenseExpiry) < new Date();
}

/**
 * Check if case manager license is expiring soon (within 30 days)
 * @param licenseExpiry - License expiry date (ISO string)
 * @returns true if license expires within 30 days
 */
export function isLicenseExpiringSoon(licenseExpiry?: string): boolean {
  if (!licenseExpiry) return false;
  const expiryDate = new Date(licenseExpiry);
  const now = new Date();
  const daysUntilExpiry = Math.floor(
    (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
}

/**
 * Get license expiration status
 * @param licenseExpiry - License expiry date (ISO string)
 * @returns 'valid' | 'expiring_soon' | 'expired' | 'none'
 */
export function getLicenseExpirationStatus(
  licenseExpiry?: string
): "valid" | "expiring_soon" | "expired" | "none" {
  if (!licenseExpiry) return "none";
  if (isLicenseExpired(licenseExpiry)) return "expired";
  if (isLicenseExpiringSoon(licenseExpiry)) return "expiring_soon";
  return "valid";
}

/**
 * Format referral number for display
 * @param referralNumber - Referral number
 * @returns Formatted referral number
 */
export function formatReferralNumber(referralNumber: string): string {
  // Add formatting if needed (e.g., REF-12345)
  return referralNumber.toUpperCase();
}

/**
 * Get days until target move date
 * @param targetMoveDate - Target move date (ISO string)
 * @returns Number of days until target move date (negative if past)
 */
export function getDaysUntilTargetMoveDate(targetMoveDate?: string): number | null {
  if (!targetMoveDate) return null;
  const targetDate = new Date(targetMoveDate);
  const now = new Date();
  const diffTime = targetDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if referral is urgent based on target move date
 * @param targetMoveDate - Target move date (ISO string)
 * @param urgency - Urgency level
 * @returns true if referral should be considered urgent
 */
export function isReferralUrgent(targetMoveDate?: string, urgency?: Urgency): boolean {
  if (urgency === "URGENT" || urgency === "HIGH") return true;
  if (!targetMoveDate) return false;
  const daysUntil = getDaysUntilTargetMoveDate(targetMoveDate);
  return daysUntil !== null && daysUntil <= 7;
}

