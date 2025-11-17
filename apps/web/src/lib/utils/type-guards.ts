/**
 * Type guard utilities
 * Provides runtime type checking for API responses and data
 */

import { Provider } from "@/lib/api";
import {
  License,
  Opening,
  Referral,
  Service,
  SubscriptionTier,
  LicenseStatus,
  OpeningStatus,
  ReferralStatus,
} from "@carelink/types";

/**
 * Type guard for Provider
 */
export function isProvider(value: unknown): value is Provider {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.id === "string" &&
    typeof obj.organizationId === "string" &&
    typeof obj.acceptsReferrals === "boolean"
  );
}

/**
 * Type guard for License
 */
export function isLicense(value: unknown): value is License {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.id === "string" &&
    typeof obj.providerId === "string" &&
    typeof obj.licenseType === "string" &&
    typeof obj.licenseNumber === "string" &&
    typeof obj.issueDate === "string" &&
    typeof obj.expirationDate === "string" &&
    typeof obj.status === "string"
  );
}

/**
 * Type guard for SubscriptionTier
 */
export function isSubscriptionTier(value: unknown): value is SubscriptionTier {
  return (
    typeof value === "string" &&
    ["FREE", "PRO", "PREMIUM", "ENTERPRISE"].includes(value)
  );
}

/**
 * Type guard for LicenseStatus
 */
export function isLicenseStatus(value: unknown): value is LicenseStatus {
  return (
    typeof value === "string" &&
    ["ACTIVE", "PENDING", "EXPIRED", "REVOKED", "SUSPENDED"].includes(value)
  );
}

/**
 * Type guard for OpeningStatus
 */
export function isOpeningStatus(value: unknown): value is OpeningStatus {
  return (
    typeof value === "string" &&
    ["OPEN", "PENDING", "FILLED", "EXPIRED", "CANCELLED"].includes(value)
  );
}

/**
 * Type guard for ReferralStatus
 */
export function isReferralStatus(value: unknown): value is ReferralStatus {
  return (
    typeof value === "string" &&
    ["NEW", "VIEWED", "SHORTLISTED", "ACCEPTED", "REJECTED", "PLACED", "CLOSED"].includes(value)
  );
}

/**
 * Type guard for array of Providers
 */
export function isProviderArray(value: unknown): value is Provider[] {
  return Array.isArray(value) && value.every((item) => isProvider(item));
}

/**
 * Type guard for array of Licenses
 */
export function isLicenseArray(value: unknown): value is License[] {
  return Array.isArray(value) && value.every((item) => isLicense(item));
}

/**
 * Safe accessor that validates and returns typed value
 */
export function safeGet<T>(
  value: unknown,
  typeGuard: (value: unknown) => value is T,
  fallback: T
): T {
  return typeGuard(value) ? value : fallback;
}
